import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { PAYMENT_METHODS } from './PaymentModal';

const methodLabel = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.label || id;

/** CSS resolves 1mm against 96dpi regardless of the printer's real density. */
const PX_PER_MM = 96 / 25.4;

/** A little slack so the last line is never clipped by rounding. */
const TAIL_MM = 6;

/**
 * Tell the printer how long this particular receipt is.
 *
 * Thermal drivers advertise an enormous page (58 x 3276mm on a POS-58). Left
 * alone the browser lays the receipt out on that page and scales it down, so
 * the text prints tiny and metres of blank paper follow. Chrome rejects
 * `size: <length> auto`, so there is no way to say "stop at the last line" —
 * the height has to be measured and written out as a number.
 */
function sizePageToReceipt(widthMm) {
  const receipt = document.getElementById('receipt-print');
  if (!receipt) return;

  const heightMm = Math.ceil(receipt.getBoundingClientRect().height / PX_PER_MM) + TAIL_MM;

  let style = document.getElementById('receipt-page-size');
  if (!style) {
    style = document.createElement('style');
    style.id = 'receipt-page-size';
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`;
}

/** Printable till receipt, also used to reprint from the Orders page. */
export default function ReceiptModal({ order, onClose }) {
  const { settings, formatMoney } = useSettings();
  if (!order) return null;

  const widthMm = Number(settings.receipt_width) || 58;

  const print = () => {
    sizePageToReceipt(widthMm);
    window.print();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Receipt — ${order.order_number}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={print}>🖨️ Print Receipt</Button>
        </>
      }
    >
      <div
        id="receipt-print"
        className="receipt-paper mx-auto"
        style={{ width: `${widthMm}mm` }}
      >
        <div className="text-center">
          <p className="receipt-title font-bold">{settings.restaurant_name}</p>
          {settings.restaurant_address && <p>{settings.restaurant_address}</p>}
          {settings.restaurant_phone && <p>Tel: {settings.restaurant_phone}</p>}
        </div>
        {order.pending_sync && (
          <p className="mt-2 text-center font-bold">*** OFFLINE SALE — AWAITING UPLOAD ***</p>
        )}
        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between">
          <span>Order: {order.order_number}</span>
          <span className="capitalize">{(order.order_type || '').replace('_', ' ')}</span>
        </div>
        <p>Date: {new Date(order.created_at).toLocaleString()}</p>
        <p>Cashier: {order.cashier?.name || '—'}</p>
        <p>Customer: {order.customer?.name || 'Walk-in'}</p>
        <div className="my-2 border-t border-dashed border-black" />
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
              <div key={a.id} className="flex justify-between pl-4">
                <span>+ {a.addon_name}</span>
                <span>{formatMoney(a.price)}</span>
              </div>
            ))}
            {item.notes && <p className="pl-4 italic">* {item.notes}</p>}
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-black" />
        <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
            <span>-{formatMoney(order.discount)}</span>
          </div>
        )}
        {Number(order.tax_rate) > 0 && (
          <div className="flex justify-between">
            <span>{settings.tax_name} ({order.tax_rate}%)</span>
            <span>{formatMoney(order.tax)}</span>
          </div>
        )}
        <div className="receipt-total flex justify-between font-bold">
          <span>TOTAL</span><span>{formatMoney(order.total)}</span>
        </div>
        <div className="my-2 border-t border-dashed border-black" />
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
        <div className="my-2 border-t border-dashed border-black" />
        <p className="whitespace-pre-line text-center">{settings.receipt_footer}</p>
      </div>
    </Modal>
  );
}
