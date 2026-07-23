import { useState } from 'react';
import { categoryApi, productApi, addonApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import ProductFormModal from './ProductFormModal';

const TABS = ['products', 'categories', 'addons'];

function CategoryModal({ category, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    category || { name: '', icon: '🍴', sort_order: 0, is_active: true }
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (category?.id) await categoryApi.update(category.id, form);
      else await categoryApi.create(form);
      toast('Category saved');
      onSaved();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={category?.id ? 'Edit Category' : 'New Category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Icon (emoji)" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Input
            label="Sort order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>
    </Modal>
  );
}

function AddonModal({ addon, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(addon || { name: '', price: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (addon?.id) await addonApi.update(addon.id, form);
      else await addonApi.create(form);
      toast('Add-on saved');
      onSaved();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save add-on', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={addon?.id ? 'Edit Add-on' : 'New Add-on'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input
          label="Price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>
    </Modal>
  );
}

function StockModal({ product, onClose, onSaved }) {
  const { toast } = useToast();
  const [qty, setQty] = useState('');
  const [type, setType] = useState('add');

  const save = async () => {
    try {
      await productApi.adjustStock(product.id, { type, qty: Number(qty) });
      toast('Stock updated');
      onSaved();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update stock', 'error');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Stock — ${product.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!qty}>Update</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Current stock: <span className="font-bold">{product.stock_qty}</span>
        </p>
        <Select label="Adjustment" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="add">Add stock (restock)</option>
          <option value="remove">Remove stock (waste/loss)</option>
          <option value="set">Set exact quantity</option>
        </Select>
        <Input label="Quantity" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
    </Modal>
  );
}

export default function Products() {
  const [tab, setTab] = useState('products');
  const { formatMoney } = useSettings();
  const { toast } = useToast();

  const { data: catData, loading: catLoading, reload: reloadCats } = useApi(() => categoryApi.list());
  const { data: prodData, loading: prodLoading, reload: reloadProds } = useApi(() => productApi.list());
  const { data: addonData, loading: addonLoading, reload: reloadAddons } = useApi(() => addonApi.list());

  const [editCategory, setEditCategory] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editAddon, setEditAddon] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);

  const categories = catData?.data || [];
  const products = prodData?.data || [];
  const addons = addonData?.data || [];

  const destroy = async (api, id, reload) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.remove(id);
      toast('Deleted');
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const loading = tab === 'products' ? prodLoading : tab === 'categories' ? catLoading : addonLoading;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'addons' ? 'Add-ons' : t}
            </button>
          ))}
        </div>
        <Button
          onClick={() => {
            if (tab === 'products') setEditProduct({});
            if (tab === 'categories') setEditCategory({});
            if (tab === 'addons') setEditAddon({});
          }}
        >
          + New {tab === 'addons' ? 'Add-on' : tab.slice(0, -1)}
        </Button>
      </div>

      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : tab === 'products' ? (
          <Table
            columns={[
              { key: 'name', label: 'Product', render: (p) => (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.image || '🍴'}</span>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.sku}</p>
                    </div>
                  </div>
                ) },
              { key: 'category', label: 'Category', render: (p) => p.category?.name },
              { key: 'price', label: 'Price', render: (p) => formatMoney(p.price) },
              { key: 'cost', label: 'Cost', render: (p) => formatMoney(p.cost) },
              { key: 'variants', label: 'Variants', render: (p) => p.variants?.length || '—' },
              { key: 'stock', label: 'Stock', render: (p) =>
                  p.track_stock ? (
                    <Badge color={p.stock_qty <= 0 ? 'red' : p.stock_qty <= p.low_stock_threshold ? 'amber' : 'emerald'}>
                      {p.stock_qty}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">n/a</span>
                  ) },
              { key: 'is_active', label: 'Status', render: (p) => (
                  <Badge color={p.is_active ? 'emerald' : 'slate'}>{p.is_active ? 'active' : 'inactive'}</Badge>
                ) },
            ]}
            rows={products}
            renderActions={(p) => (
              <>
                {p.track_stock && (
                  <Button size="sm" variant="ghost" onClick={() => setStockProduct(p)}>Stock</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditProduct(p)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(productApi, p.id, reloadProds)}>
                  Delete
                </Button>
              </>
            )}
          />
        ) : tab === 'categories' ? (
          <Table
            columns={[
              { key: 'name', label: 'Category', render: (c) => (
                  <span className="font-semibold">{c.icon} {c.name}</span>
                ) },
              { key: 'products_count', label: 'Products' },
              { key: 'sort_order', label: 'Sort' },
              { key: 'is_active', label: 'Status', render: (c) => (
                  <Badge color={c.is_active ? 'emerald' : 'slate'}>{c.is_active ? 'active' : 'inactive'}</Badge>
                ) },
            ]}
            rows={categories}
            renderActions={(c) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditCategory(c)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(categoryApi, c.id, reloadCats)}>
                  Delete
                </Button>
              </>
            )}
          />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Add-on', render: (a) => <span className="font-semibold">{a.name}</span> },
              { key: 'price', label: 'Price', render: (a) => formatMoney(a.price) },
              { key: 'is_active', label: 'Status', render: (a) => (
                  <Badge color={a.is_active ? 'emerald' : 'slate'}>{a.is_active ? 'active' : 'inactive'}</Badge>
                ) },
            ]}
            rows={addons}
            renderActions={(a) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditAddon(a)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(addonApi, a.id, reloadAddons)}>
                  Delete
                </Button>
              </>
            )}
          />
        )}
      </Card>

      {editCategory && (
        <CategoryModal
          category={editCategory.id ? editCategory : null}
          onClose={() => setEditCategory(null)}
          onSaved={() => { setEditCategory(null); reloadCats(); }}
        />
      )}
      {editProduct && (
        <ProductFormModal
          product={editProduct.id ? editProduct : null}
          categories={categories}
          addons={addons}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); reloadProds(); }}
        />
      )}
      {editAddon && (
        <AddonModal
          addon={editAddon.id ? editAddon : null}
          onClose={() => setEditAddon(null)}
          onSaved={() => { setEditAddon(null); reloadAddons(); }}
        />
      )}
      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSaved={() => { setStockProduct(null); reloadProds(); }}
        />
      )}
    </div>
  );
}
