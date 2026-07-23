import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { PAYMENT_METHODS } from './PaymentModal';

const methodLabel = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.label || id;

/** Printable 80mm-style receipt, also used to reprint from the Orders page. */
export default function ReceiptModal({ order, onClose }) {
  const { settings, formatMoney } = useSettings();
  if (!order) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Receipt — ${order.order_number}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()}>🖨️ Print Receipt</Button>
        </>
      }
    >
      <div id="receipt-print" className="mx-auto max-w-[300px] bg-white font-mono text-xs text-slate-900">
        <div className="text-center">
          <p className="text-base font-bold">{settings.restaurant_name}</p>
          {settings.restaurant_address && <p>{settings.restaurant_address}</p>}
          {settings.restaurant_phone && <p>Tel: {settings.restaurant_phone}</p>}
        </div>
        <div className="my-2 border-t border-dashed border-slate-400" />
        <div className="flex justify-between">
          <span>Order: {order.order_number}</span>
          <span className="capitalize">{(order.order_type || '').replace('_', ' ')}</span>
        </div>
        <p>Date: {new Date(order.created_at).toLocaleString()}</p>
        <p>Cashier: {order.cashier?.name || '—'}</p>
        <p>Customer: {order.customer?.name || 'Walk-in'}</p>
        <div className="my-2 border-t border-dashed border-slate-400" />
        {order.items?.map((item) => (
          <div key={item.id} className="mb-1">
            <div className="flex justify-between">
              <span>
                {item.qty}× {item.product_name}
                {item.variant_name ? ` (${item.variant_name})` : ''}
              </span>
              <span>{formatMoney(item.line_total)}</span>
            </div>
            {item.addons?.map((a) => (
              <div key={a.id} className="flex justify-between pl-4 text-slate-600">
                <span>+ {a.addon_name}</span>
                <span>{formatMoney(a.price)}</span>
              </div>
            ))}
            {item.notes && <p className="pl-4 italic">* {item.notes}</p>}
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-slate-400" />
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
            <span>-{formatMoney(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{settings.tax_name} ({order.tax_rate}%)</span>
          <span>{formatMoney(order.tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span><span>{formatMoney(order.total)}</span>
        </div>
        <div className="my-2 border-t border-dashed border-slate-400" />
        {order.payments?.map((p) => (
          <div key={p.id} className="flex justify-between">
            <span>{methodLabel(p.method)}</span>
            <span>{formatMoney(p.amount)}</span>
          </div>
        ))}
        {order.payments?.some((p) => Number(p.change_given) > 0) && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>
              {formatMoney(order.payments.reduce((s, p) => s + Number(p.change_given || 0), 0))}
            </span>
          </div>
        )}
        {order.loyalty_points_earned > 0 && (
          <p className="mt-1">Loyalty points earned: {order.loyalty_points_earned}</p>
        )}
        <div className="my-2 border-t border-dashed border-slate-400" />
        <p className="text-center">{settings.receipt_footer}</p>
      </div>
    </Modal>
  );
}
