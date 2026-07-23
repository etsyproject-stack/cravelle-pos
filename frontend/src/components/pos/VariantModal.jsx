import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Textarea } from '../ui/Input';
import { useSettings } from '../../context/SettingsContext';

/** Lets the cashier pick a size/variant, add-ons, quantity and item notes. */
export default function VariantModal({ product, onClose, onConfirm }) {
  const { formatMoney } = useSettings();
  const [variant, setVariant] = useState(null);
  const [addons, setAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setVariant(product.variants?.[0] ?? null);
      setAddons([]);
      setQty(1);
      setNotes('');
    }
  }, [product]);

  if (!product) return null;

  const toggleAddon = (addon) =>
    setAddons((cur) =>
      cur.some((a) => a.id === addon.id) ? cur.filter((a) => a.id !== addon.id) : [...cur, addon]
    );

  const unitPrice =
    Number(variant?.price ?? product.price) + addons.reduce((s, a) => s + Number(a.price), 0);

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm({ variant, addons, qty, notes })}>
            Add {qty} · {formatMoney(unitPrice * qty)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {product.variants?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Size</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v)}
                  className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    variant?.id === v.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {v.name}
                  <span className="block text-xs font-normal">{formatMoney(v.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {product.addons?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Add-ons</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.addons.map((a) => {
                const selected = addons.some((x) => x.id === a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAddon(a)}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {a.name}
                    <span className="block text-xs font-normal">+{formatMoney(a.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</Button>
            <span className="w-8 text-center text-lg font-bold">{qty}</span>
            <Button variant="secondary" size="sm" onClick={() => setQty((q) => q + 1)}>+</Button>
          </div>
        </div>

        <Textarea
          label="Item notes (e.g. no onions, extra spicy)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  );
}
