import { useEffect } from 'react';
import { kitchenApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import OfflineNotice from '../../components/ui/OfflineNotice';

const COLUMN_STYLES = {
  pending: { title: 'New Orders', accent: 'border-amber-400', chip: 'bg-amber-100 text-amber-700' },
  preparing: { title: 'Preparing', accent: 'border-blue-400', chip: 'bg-blue-100 text-blue-700' },
  ready: { title: 'Ready for Pickup', accent: 'border-emerald-400', chip: 'bg-emerald-100 text-emerald-700' },
};

const ADVANCE_LABEL = { pending: 'Start Cooking', preparing: 'Mark Ready', ready: 'Complete' };

function elapsedMinutes(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function TicketCard({ order, onAdvance }) {
  const mins = elapsedMinutes(order.created_at);
  const style = COLUMN_STYLES[order.status];

  return (
    <div className={`rounded-xl border-t-4 bg-white p-4 shadow-sm ${style.accent}`}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800">{order.kot_number || order.order_number}</p>
          <p className="text-xs capitalize text-slate-500">{order.order_type?.replace('_', ' ')}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            mins >= 15 ? 'bg-red-100 text-red-700' : style.chip
          }`}
        >
          {mins}m
        </span>
      </div>
      <ul className="mb-3 space-y-1.5">
        {order.items?.map((item) => (
          <li key={item.id} className="text-sm">
            <span className="font-bold">{item.qty}×</span> {item.product_name}
            {item.variant_name && <span className="text-slate-500"> ({item.variant_name})</span>}
            {item.addons?.length > 0 && (
              <span className="block pl-5 text-xs text-slate-500">
                + {item.addons.map((a) => a.addon_name).join(', ')}
              </span>
            )}
            {item.notes && <span className="block pl-5 text-xs font-semibold italic text-amber-600">{item.notes}</span>}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mb-3 rounded bg-slate-50 p-2 text-xs italic">Note: {order.notes}</p>}
      <Button variant="success" className="w-full" onClick={() => onAdvance(order)}>
        {ADVANCE_LABEL[order.status]}
      </Button>
    </div>
  );
}

export default function Kitchen() {
  const { data, loading, error, reload } = useApi(() => kitchenApi.orders());
  const { toast } = useToast();

  // KDS auto-refreshes so new tickets appear without interaction.
  useEffect(() => {
    const timer = setInterval(reload, 10000);
    return () => clearInterval(timer);
  }, [reload]);

  const orders = data?.data || [];

  const advance = async (order) => {
    try {
      await kitchenApi.advance(order.id);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to advance order', 'error');
    }
  };

  if (loading && !data) return <Spinner />;
  if (error && !data) return <OfflineNotice what="The kitchen display" />;

  return (
    <div className="grid min-h-full grid-cols-1 gap-4 bg-slate-200 p-4 md:grid-cols-3">
      {Object.entries(COLUMN_STYLES).map(([status, style]) => {
        const columnOrders = orders.filter((o) => o.status === status);
        return (
          <div key={status} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-700">{style.title}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.chip}`}>
                {columnOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnOrders.length === 0 && (
                <p className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                  No orders
                </p>
              )}
              {columnOrders.map((o) => (
                <TicketCard key={o.id} order={o} onAdvance={advance} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
