import { useSettings } from '../../context/SettingsContext';
import Button from '../ui/Button';

function CartItemRow({ item, formatMoney, setQty, removeItem }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {item.name}
            {item.variant_name && <span className="text-slate-500"> · {item.variant_name}</span>}
          </p>
          {item.addons.length > 0 && (
            <p className="text-xs text-slate-500">
              + {item.addons.map((a) => a.name).join(', ')}
            </p>
          )}
          {item.notes && <p className="text-xs italic text-amber-600">“{item.notes}”</p>}
        </div>
        <button
          onClick={() => removeItem(item.key)}
          className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove ${item.name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQty(item.key, item.qty - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
          <button
            onClick={() => setQty(item.key, item.qty + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
          >
            +
          </button>
        </div>
        <span className="text-sm font-bold text-slate-800">{formatMoney(item.unit_price * item.qty)}</span>
      </div>
    </div>
  );
}

export default function CartPanel({
  cart,
  totals,
  setQty,
  removeItem,
  taxName,
  showTax = true,
  serviceName,
  showService = false,
  onDiscount,
  onHold,
  onShowHeld,
  heldCount,
  onCharge,
  onClear,
}) {
  const { formatMoney } = useSettings();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-800">
          Current Order
          {totals.itemCount > 0 && (
            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
              {totals.itemCount} items
            </span>
          )}
        </h2>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={onShowHeld}>
            Held{heldCount > 0 ? ` (${heldCount})` : ''}
          </Button>
          {cart.items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500">
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto">
        {cart.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
            <span className="text-4xl">🛒</span>
            <p className="text-sm">Tap products to start an order</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <CartItemRow
              key={item.key}
              item={item}
              formatMoney={formatMoney}
              setQty={setQty}
              removeItem={removeItem}
            />
          ))
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatMoney(totals.subtotal)}</span>
          </div>
          <button
            onClick={onDiscount}
            className="flex w-full justify-between text-slate-600 hover:text-orange-600"
          >
            <span className="underline decoration-dotted">
              Discount{cart.coupon ? ` (${cart.coupon.code})` : ''}
            </span>
            <span className={totals.discount > 0 ? 'font-semibold text-emerald-600' : ''}>
              −{formatMoney(totals.discount)}
            </span>
          </button>
          {showService && (
            <div className="flex justify-between text-slate-600">
              <span>{serviceName}</span>
              <span>{formatMoney(totals.serviceCharge)}</span>
            </div>
          )}
          {showTax && (
            <div className="flex justify-between text-slate-600">
              <span>{taxName}</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(totals.total)}</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={onHold} disabled={cart.items.length === 0}>
            Hold
          </Button>
          <Button
            variant="success"
            className="col-span-2"
            size="lg"
            onClick={onCharge}
            disabled={cart.items.length === 0}
          >
            Charge {formatMoney(totals.total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
