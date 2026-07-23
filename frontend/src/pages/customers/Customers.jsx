import { useState } from 'react';
import { customerApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

function CustomerModal({ customer, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(customer || { name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (customer?.id) await customerApi.update(customer.id, form);
      else await customerApi.create(form);
      toast('Customer saved');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={customer?.id ? 'Edit Customer' : 'New Customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name?.[0]} />
        <Input label="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone?.[0]} />
        <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email?.[0]} />
        <Input label="Address" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
    </Modal>
  );
}

function LoyaltyModal({ customer, onClose }) {
  const { data, loading } = useApi(() => customerApi.loyalty(customer.id), [customer.id]);
  const { formatMoney } = useSettings();
  const transactions = data?.data || [];

  return (
    <Modal open onClose={onClose} title={`Loyalty — ${customer.name}`} size="lg">
      <div className="mb-4 rounded-xl bg-orange-50 p-4 text-center">
        <p className="text-3xl font-bold text-orange-600">{customer.loyalty_points}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">points available</p>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <Table
          columns={[
            { key: 'created_at', label: 'Date', render: (t) => new Date(t.created_at).toLocaleDateString() },
            { key: 'type', label: 'Type', render: (t) => (
                <Badge color={t.type === 'earn' ? 'emerald' : 'red'}>{t.type}</Badge>
              ) },
            { key: 'points', label: 'Points', render: (t) => (t.type === 'earn' ? '+' : '−') + t.points },
            { key: 'order', label: 'Order', render: (t) => t.order?.order_number || '—' },
            { key: 'order_total', label: 'Order total', render: (t) => (t.order ? formatMoney(t.order.total) : '—') },
          ]}
          rows={transactions}
          empty="No loyalty activity yet."
        />
      )}
    </Modal>
  );
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { data, loading, reload } = useApi(
    () => customerApi.list({ search: debounced || undefined }),
    [debounced]
  );
  const { toast } = useToast();
  const [editCustomer, setEditCustomer] = useState(null);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);

  const customers = data?.data || [];

  const destroy = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await customerApi.remove(c.id);
      toast('Customer deleted');
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or phone…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Button onClick={() => setEditCustomer({})}>+ New Customer</Button>
      </div>
      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Customer', render: (c) => (
                  <span className="font-semibold">
                    {c.name} {c.is_walk_in && <Badge>walk-in</Badge>}
                  </span>
                ) },
              { key: 'phone', label: 'Phone', render: (c) => c.phone || '—' },
              { key: 'email', label: 'Email', render: (c) => c.email || '—' },
              { key: 'orders_count', label: 'Orders' },
              { key: 'loyalty_points', label: 'Points', render: (c) => (
                  <Badge color="orange">{c.loyalty_points}</Badge>
                ) },
            ]}
            rows={customers}
            renderActions={(c) =>
              c.is_walk_in ? null : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setLoyaltyCustomer(c)}>Loyalty</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditCustomer(c)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(c)}>Delete</Button>
                </>
              )
            }
          />
        )}
      </Card>
      {editCustomer && (
        <CustomerModal
          customer={editCustomer.id ? editCustomer : null}
          onClose={() => setEditCustomer(null)}
          onSaved={() => { setEditCustomer(null); reload(); }}
        />
      )}
      {loyaltyCustomer && (
        <LoyaltyModal customer={loyaltyCustomer} onClose={() => setLoyaltyCustomer(null)} />
      )}
    </div>
  );
}
