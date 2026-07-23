import { useState } from 'react';
import { productApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';

const EMPTY = {
  name: '',
  sku: '',
  category_id: '',
  description: '',
  image: '',
  price: '',
  cost: '',
  track_stock: false,
  stock_qty: 0,
  low_stock_threshold: 10,
  is_active: true,
  variants: [],
  addon_ids: [],
};

export default function ProductFormModal({ product, categories, addons, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    product
      ? {
          ...EMPTY,
          ...product,
          category_id: product.category_id ?? product.category?.id ?? '',
          variants: (product.variants || []).map((v) => ({ id: v.id, name: v.name, price: v.price })),
          addon_ids: (product.addons || []).map((a) => a.id),
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const setVariant = (idx, patch) =>
    set('variants', form.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const toggleAddon = (id) =>
    set(
      'addon_ids',
      form.addon_ids.includes(id) ? form.addon_ids.filter((a) => a !== id) : [...form.addon_ids, id]
    );

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, category_id: Number(form.category_id) || null };
      if (product?.id) await productApi.update(product.id, payload);
      else await productApi.create(payload);
      toast('Product saved');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product?.id ? `Edit — ${product.name}` : 'New Product'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name?.[0]} />
          <Input label="SKU" value={form.sku || ''} onChange={(e) => set('sku', e.target.value)} placeholder="Auto-generated if blank" />
          <Select label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)} error={errors.category_id?.[0]}>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="Image (emoji)" value={form.image || ''} onChange={(e) => set('image', e.target.value)} placeholder="🍔" />
          <Input label="Selling price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} error={errors.price?.[0]} />
          <Input label="Cost price" type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
        </div>
        <Textarea label="Description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} />

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variants / Sizes</p>
            <Button size="sm" variant="outline" onClick={() => set('variants', [...form.variants, { name: '', price: form.price || '' }])}>
              + Add variant
            </Button>
          </div>
          {form.variants.length === 0 && (
            <p className="text-xs text-slate-400">No variants — product sells at its base price.</p>
          )}
          <div className="space-y-2">
            {form.variants.map((v, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={v.name}
                  onChange={(e) => setVariant(idx, { name: e.target.value })}
                  placeholder="e.g. Large"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.price}
                  onChange={(e) => setVariant(idx, { price: e.target.value })}
                  placeholder="Price"
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => set('variants', form.variants.filter((_, i) => i !== idx))}
                  className="rounded p-2 text-red-400 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Available add-ons</p>
          <div className="flex flex-wrap gap-2">
            {addons.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleAddon(a.id)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold ${
                  form.addon_ids.includes(a.id)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {a.name}
              </button>
            ))}
            {addons.length === 0 && <p className="text-xs text-slate-400">No add-ons created yet.</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.track_stock} onChange={(e) => set('track_stock', e.target.checked)} />
            Track stock
          </label>
          {form.track_stock && (
            <>
              <Input label="Stock qty" type="number" min="0" value={form.stock_qty} onChange={(e) => set('stock_qty', Number(e.target.value))} className="w-28" />
              <Input label="Low stock alert" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', Number(e.target.value))} className="w-28" />
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            Active (visible on POS)
          </label>
        </div>
      </div>
    </Modal>
  );
}
