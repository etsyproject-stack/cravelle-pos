import { useState } from 'react';
import { orderApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import OfflineNotice from '../../components/ui/OfflineNotice';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import ReceiptModal from '../../components/pos/ReceiptModal';

const STATUS_TABS = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' };

function KotModal({ order, onClose }) {
  if (!order) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={`KOT — ${order.kot_number || order.order_number}`}
      footer={<Button onClick={() => window.print()}>🖨️ Print KOT</Button>}
    >
      <div id="receipt-print" className="mx-auto max-w-[300px] font-mono text-xs">
        <p className="text-center text-base font-bold">*** KITCHEN ORDER ***</p>
        <p className="text-center">{order.kot_number}</p>
        <div className="my-2 border-t border-dashed border-slate-400" />
        <div className="flex justify-between">
          <span>{order.order_number}</span>
          <span className="capitalize">{(order.order_type || '').replace('_', ' ')}</span>
        </div>
        <p>{new Date(order.created_at).toLocaleTimeString()}</p>
        <div className="my-2 border-t border-dashed border-slate-400" />
        {order.items?.map((item) => (
          <div key={item.id} className="mb-2">
            <p className="text-sm font-bold">
              {item.qty}× {item.product_name}
              {item.variant_name ? ` (${item.variant_name})` : ''}
            </p>
            {item.addons?.map((a) => (
              <p key={a.id} className="pl-4">+ {a.addon_name}</p>
            ))}
            {item.notes && <p className="pl-4 font-bold italic">** {item.notes} **</p>}
          </div>
        ))}
        {order.notes && (
          <>
            <div className="my-2 border-t border-dashed border-slate-400" />
            <p className="font-bold">Order note: {order.notes}</p>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function Orders() {
  const [status, setStatus] = useState('all');
  const { data, loading, error, reload } = useApi(
    () => orderApi.list(status === 'all' ? {} : { status }),
    [status]
  );
  const { formatMoney } = useSettings();
  const { toast } = useToast();
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [kotOrder, setKotOrder] = useState(null);

  const orders = data?.data || [];

  const changeStatus = async (order, next) => {
    try {
      await orderApi.updateStatus(order.id, next);
      toast(`Order ${order.order_number} → ${next}`);
      reload();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="thin-scroll flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              status === s ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card bodyClassName="p-0 sm:p-0">
        {loading ? (
          <Spinner />
        ) : error && !data ? (
          <OfflineNotice what="Order history" />
        ) : (
          <Table
            columns={[
              { key: 'order_number', label: 'Order #', render: (o) => <span className="font-semibold">{o.order_number}</span> },
              { key: 'order_type', label: 'Type', render: (o) => <span className="capitalize">{o.order_type?.replace('_', ' ')}</span> },
              { key: 'customer', label: 'Customer', render: (o) => o.customer?.name || 'Walk-in' },
              { key: 'items_count', label: 'Items' },
              { key: 'total', label: 'Total', render: (o) => formatMoney(o.total) },
              { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
              { key: 'payment_status', label: 'Payment', render: (o) => <StatusBadge status={o.payment_status} /> },
              { key: 'created_at', label: 'Time', render: (o) => new Date(o.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) },
            ]}
            rows={orders}
            empty="No orders found."
            renderActions={(o) => (
              <>
                {NEXT_STATUS[o.status] && (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(o, NEXT_STATUS[o.status])}>
                    → {NEXT_STATUS[o.status]}
                  </Button>
                )}
                {['pending', 'preparing'].includes(o.status) && (
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => changeStatus(o, 'cancelled')}>
                    Cancel
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setKotOrder(o)}>KOT</Button>
                <Button size="sm" variant="ghost" onClick={() => setReceiptOrder(o)}>Receipt</Button>
              </>
            )}
          />
        )}
      </Card>

      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      <KotModal order={kotOrder} onClose={() => setKotOrder(null)} />
    </div>
  );
}
