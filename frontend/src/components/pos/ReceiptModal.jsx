import { useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { PAYMENT_METHODS } from './PaymentModal';

const methodLabel = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.label || id;

/** CSS resolves 1mm against 96dpi regardless of the printer's real density. */
const PX_PER_MM = 96 / 25.4;

/**
 * Blank paper added after the last line, in mm.
 *
 * The print head sits behind the tear-off edge, so without this the footer
 * never leaves the printer — it waits inside until the next sale pushes it
 * out and the customer gets a bill that stops at the total. The feed carries
 * the last line past the blade.
 *
 * The distance is physical and differs between printers, so it is a setting:
 * raise it if the footer is still trapped, lower it to save paper. This is
 * only the fallback for a till that has never set one.
 */
const DEFAULT_TAIL_MM = 35;

const PRINT_ROOT_ID = 'receipt-print-root';
const PAGE_STYLE_ID = 'receipt-page-size';

/**
 * How much of the roll the print head actually covers, in mm. A till roll is
 * wider than its printable strip: a 58mm printer lays down 48mm, an 80mm one
 * 72mm, the rest being margin the paper path needs.
 */
const PRINTABLE_MM = { 58: 48, 80: 72 };

/** Held back from the printable strip so nothing rides the right-hand edge. */
const SAFETY_MM = 2;

/**
 * The page is declared at the full roll width even though the receipt is
 * narrower. Chrome stretches an undersized page out to fill the sheet — a
 * 48mm page on 58mm paper comes out 1.2x too wide and the price column falls
 * off the print head. Matching the paper leaves it nothing to scale, and the
 * receipt is inset with margins instead.
 */
const contentWidth = (rollMm) => (PRINTABLE_MM[rollMm] ?? rollMm - 10) - SAFETY_MM;

/**
 * Lift a copy of the receipt out of the app for printing.
 *
 * Hiding the rest of the page is not enough: hidden elements still take up
 * room, so the browser pages through the whole app and spits out blank paper
 * before reaching the receipt. Only a copy parked directly on <body>, with
 * every sibling removed from the layout, prints on its own.
 *
 * It also carries the page size. Thermal drivers advertise an enormous page
 * (58 x 3276mm on a POS-58) and the browser will happily feed all of it, but
 * Chrome rejects `size: <length> auto` — so the height is measured off the
 * receipt and written out as a number.
 */
function openPrintRoot(rollMm, tailMm) {
  const receipt = document.getElementById('receipt-print');
  if (!receipt || document.getElementById(PRINT_ROOT_ID)) return;

  const heightMm = Math.ceil(receipt.getBoundingClientRect().height / PX_PER_MM) + tailMm;

  let style = document.getElementById(PAGE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = PAGE_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${rollMm}mm ${heightMm}mm; margin: 0; }`;

  // A copy, not the node itself — React still owns the original and would
  // lose track of it if we moved it.
  const root = document.createElement('div');
  root.id = PRINT_ROOT_ID;
  const copy = receipt.cloneNode(true);
  copy.removeAttribute('id');
  root.appendChild(copy);
  document.body.appendChild(root);
}

function closePrintRoot() {
  document.getElementById(PRINT_ROOT_ID)?.remove();
  document.getElementById(PAGE_STYLE_ID)?.remove();
}

/** Printable till receipt, also used to reprint from the Orders page. */
export default function ReceiptModal({ order, onClose }) {
  const { settings, formatMoney } = useSettings();
  const rollMm = Number(settings.receipt_width) || 58;
  const widthMm = contentWidth(rollMm);
  const tailMm = Number(settings.receipt_feed_mm) || DEFAULT_TAIL_MM;

  // Hooked to the browser's own print events so Ctrl+P behaves like the button.
  useEffect(() => {
    if (!order) return undefined;

    const before = () => openPrintRoot(rollMm, tailMm);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', closePrintRoot);

    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', closePrintRoot);
      closePrintRoot();
    };
  }, [order, rollMm, tailMm]);

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
