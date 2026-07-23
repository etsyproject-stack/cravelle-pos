import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

export default function HeldOrdersModal({ open, onClose, heldOrders, onResume, onDiscard }) {
  const { formatMoney } = useSettings();

  return (
    <Modal open={open} onClose={onClose} title="Held Orders" size="lg">
      {heldOrders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No orders on hold.</p>
      ) : (
        <div className="space-y-3">
          {heldOrders.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{h.reference}</p>
                <p className="truncate text-xs text-slate-500">
                  {h.cart.items.length} lines ·{' '}
                  {h.cart.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                </p>
                <p className="text-xs text-slate-400">
                  Held {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-slate-700">
                  {formatMoney(h.cart.items.reduce((s, i) => s + i.unit_price * i.qty, 0))}
                </span>
                <Button size="sm" onClick={() => onResume(h)}>Resume</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDiscard(h)}>
                  Discard
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
