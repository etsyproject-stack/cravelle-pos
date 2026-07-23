import { useState } from 'react';
import { couponApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';

function CouponModal({ coupon, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    coupon || {
      code: '',
      type: 'percent',
      value: '',
      min_order_amount: 0,
      max_uses: '',
      expires_at: '',
      is_active: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, max_uses: form.max_uses === '' ? null : Number(form.max_uses), expires_at: form.expires_at || null };
      if (coupon?.id) await couponApi.update(coupon.id, payload);
      else await couponApi.create(payload);
      toast('Coupon saved');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast(err.response?.data?.message || 'Failed to save coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={coupon?.id ? `Edit — ${coupon.code}` : 'New Coupon'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="SAVE10"
          error={errors.code?.[0]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input label="Value" type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} error={errors.value?.[0]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Min order amount" type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
          <Input label="Max uses (blank = unlimited)" type="number" min="1" value={form.max_uses ?? ''} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        </div>
        <Input label="Expires at" type="date" value={form.expires_at ? form.expires_at.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
      </div>
    </Modal>
  );
}

export default function Coupons() {
  const { data, loading, reload } = useApi(() => couponApi.list());
  const { hasRole } = useAuth();
  const { formatMoney } = useSettings();
  const { toast } = useToast();
  const [editCoupon, setEditCoupon] = useState(null);

  const coupons = data?.data || [];
  const canManage = hasRole('admin', 'manager');

  const destroy = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await couponApi.remove(c.id);
      toast('Coupon deleted');
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setEditCoupon({})}>+ New Coupon</Button>
        </div>
      )}
      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={[
              { key: 'code', label: 'Code', render: (c) => <span className="font-mono font-bold">{c.code}</span> },
              { key: 'value', label: 'Discount', render: (c) => (c.type === 'percent' ? `${Number(c.value)}%` : formatMoney(c.value)) },
              { key: 'min_order_amount', label: 'Min order', render: (c) => formatMoney(c.min_order_amount) },
              { key: 'used_count', label: 'Used', render: (c) => `${c.used_count}${c.max_uses ? ` / ${c.max_uses}` : ''}` },
              { key: 'expires_at', label: 'Expires', render: (c) => (c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never') },
              { key: 'is_active', label: 'Status', render: (c) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  const exhausted = c.max_uses && c.used_count >= c.max_uses;
                  const label = !c.is_active ? 'inactive' : expired ? 'expired' : exhausted ? 'exhausted' : 'active';
                  return <Badge color={label === 'active' ? 'emerald' : 'red'}>{label}</Badge>;
                } },
            ]}
            rows={coupons}
            empty="No coupons created yet."
            renderActions={canManage ? (c) => (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditCoupon(c)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => destroy(c)}>Delete</Button>
              </>
            ) : undefined}
          />
        )}
      </Card>
      {editCoupon && (
        <CouponModal
          coupon={editCoupon.id ? editCoupon : null}
          onClose={() => setEditCoupon(null)}
          onSaved={() => { setEditCoupon(null); reload(); }}
        />
      )}
    </div>
  );
}
