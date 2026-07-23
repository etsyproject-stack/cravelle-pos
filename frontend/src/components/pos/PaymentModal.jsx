import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { useSettings } from '../../context/SettingsContext';

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'mobile', label: 'Mobile Pay', icon: '📱' },
  { id: 'gift_card', label: 'Gift Card', icon: '🎁' },
];

/**
 * Take payment for the order total. Supports a single payment method or a
 * split bill: multiple payment lines that must sum to the total.
 */
export default function PaymentModal({ open, onClose, total, onConfirm, submitting }) {
  const { formatMoney } = useSettings();
  const [split, setSplit] = useState(false);
  const [method, setMethod] = useState('cash');
  const [tendered, setTendered] = useState('');
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (open) {
      setSplit(false);
      setMethod('cash');
      setTendered('');
      setLines([{ method: 'cash', amount: (total / 2).toFixed(2) }, { method: 'card', amount: (total / 2).toFixed(2) }]);
    }
  }, [open, total]);

  const change = useMemo(() => {
    const t = Number(tendered);
    return t > total ? t - total : 0;
  }, [tendered, total]);

  const splitTotal = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [lines]
  );
  const splitBalanced = Math.abs(splitTotal - total) < 0.005;

  const updateLine = (idx, patch) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const confirm = () => {
    if (split) {
      onConfirm(lines.map((l) => ({ method: l.method, amount: Number(l.amount) })));
    } else {
      onConfirm([{ method, amount: total, tendered: method === 'cash' ? Number(tendered) || total : undefined }]);
    }
  };

  const quickCash = [Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20]
    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
    .slice(0, 4);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payment — ${formatMoney(total)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant="success"
            size="lg"
            onClick={confirm}
            disabled={submitting || (split && !splitBalanced)}
          >
            {submitting ? 'Processing…' : `Complete Payment ${formatMoney(total)}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setSplit(false)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${!split ? 'bg-white shadow' : 'text-slate-500'}`}
          >
            Single Payment
          </button>
          <button
            onClick={() => setSplit(true)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${split ? 'bg-white shadow' : 'text-slate-500'}`}
          >
            Split Bill
          </button>
        </div>

        {!split ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-colors ${
                    method === m.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
            {method === 'cash' && (
              <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                <Input
                  label="Cash tendered"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={total.toFixed(2)}
                />
                <div className="flex flex-wrap gap-2">
                  {quickCash.map((v) => (
                    <Button key={v} variant="outline" size="sm" onClick={() => setTendered(String(v))}>
                      {formatMoney(v)}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setTendered(total.toFixed(2))}>
                    Exact
                  </Button>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Change due</span>
                  <span className="text-emerald-600">{formatMoney(change)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Method</span>
                  <select
                    value={line.method}
                    onChange={(e) => updateLine(idx, { method: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    label="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) => updateLine(idx, { amount: e.target.value })}
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                  disabled={lines.length <= 2}
                  className="text-red-500"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLines((ls) => [...ls, { method: 'cash', amount: '0.00' }])}
            >
              + Add payment
            </Button>
            <div
              className={`flex justify-between rounded-lg px-3 py-2 text-sm font-bold ${
                splitBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              <span>Payments total</span>
              <span>
                {formatMoney(splitTotal)} / {formatMoney(total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
