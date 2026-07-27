import { useMemo, useState } from 'react';
import { categoryApi, productApi, customerApi, holdOrderApi, orderApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from './useCart';
import { buildOfflineOrder } from '../../offline/orderBuilder';
import {
  addLocalHeldOrder,
  localHeldOrders,
  queueOrder,
  removeLocalHeldOrder,
} from '../../offline/storage';
import CategorySidebar from '../../components/pos/CategorySidebar';
import ProductGrid from '../../components/pos/ProductGrid';
import CartPanel from '../../components/pos/CartPanel';
import VariantModal from '../../components/pos/VariantModal';
import DiscountModal from '../../components/pos/DiscountModal';
import PaymentModal from '../../components/pos/PaymentModal';
import HeldOrdersModal from '../../components/pos/HeldOrdersModal';
import ReceiptModal from '../../components/pos/ReceiptModal';
import Spinner from '../../components/ui/Spinner';

const ORDER_TYPES = [
  { id: 'dine_in', label: 'Dine In' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'delivery', label: 'Delivery' },
];

/** Local filtering used when the menu comes from the offline cache. */
function filterCached(products, categoryId, search) {
  const term = search.trim().toLowerCase();
  return products.filter((p) => {
    if (p.is_active === false) return false;
    if (categoryId && p.category_id !== categoryId) return false;
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term)
    );
  });
}

export default function POS() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const { online, catalog, refreshPending } = useOffline();
  const taxRate = Number(settings.tax_rate || 0);

  const cartApi = useCart(taxRate);
  const { cart, totals } = cartApi;

  const [categoryId, setCategoryId] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [pickerProduct, setPickerProduct] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [localHeld, setLocalHeld] = useState(() => localHeldOrders());

  const { data: catData } = useApi(() => categoryApi.list(), [online]);
  const { data: prodData, loading: prodLoading } = useApi(
    () =>
      productApi.list({
        category_id: categoryId ?? undefined,
        search: debouncedSearch || undefined,
        active: 1,
      }),
    [categoryId, debouncedSearch, online]
  );
  const { data: custData } = useApi(() => customerApi.list(), [online]);
  const { data: heldData, reload: reloadHeld } = useApi(() => holdOrderApi.list(), [online]);

  // Live data when we have it, the cached menu when we don't.
  const usingCache = !prodData;
  const categories = catData?.data || catalog?.categories || [];
  const products = prodData?.data || filterCached(catalog?.products || [], categoryId, debouncedSearch);
  const customers = custData?.data || catalog?.customers || [];
  const heldOrders = online ? heldData?.data || [] : localHeld;
  const catalogMissing = usingCache && !catalog;

  const pickProduct = (product) => {
    if (product.variants?.length > 0 || product.addons?.length > 0) {
      setPickerProduct(product);
    } else {
      cartApi.addItem(product);
    }
  };

  const holdOrder = async () => {
    if (online) {
      try {
        await holdOrderApi.create({ cart });
        cartApi.clear();
        reloadHeld();
        toast('Order held');
        return;
      } catch {
        // fall through to holding it on this device
      }
    }
    const held = {
      id: `local-${Date.now()}`,
      reference: `HOLD-${new Date().toTimeString().slice(0, 5).replace(':', '')}`,
      cart,
      created_at: new Date().toISOString(),
      local: true,
    };
    addLocalHeldOrder(held);
    setLocalHeld(localHeldOrders());
    cartApi.clear();
    toast('Order held on this device');
  };

  const resumeOrder = async (held) => {
    cartApi.restore(held.cart);
    if (held.local) {
      removeLocalHeldOrder(held.id);
      setLocalHeld(localHeldOrders());
    } else {
      await holdOrderApi.remove(held.id);
      reloadHeld();
    }
    setShowHeld(false);
    toast(`Resumed ${held.reference}`);
  };

  const discardHeld = async (held) => {
    if (held.local) {
      removeLocalHeldOrder(held.id);
      setLocalHeld(localHeldOrders());
    } else {
      await holdOrderApi.remove(held.id);
      reloadHeld();
    }
  };

  /** Save the sale on this device so trade continues without a connection. */
  const storeOfflineOrder = (payments) => {
    const { payload, receipt } = buildOfflineOrder({
      cart,
      totals,
      payments,
      settings,
      cashier: user,
      customer: customers.find((c) => c.id === cart.customerId),
    });

    if (!queueOrder(payload)) {
      toast('This device is out of storage — write the order down and free up space.', 'error');
      return false;
    }

    refreshPending();
    setShowPayment(false);
    setReceiptOrder(receipt);
    cartApi.clear();
    toast('Saved offline — it will upload automatically when the internet is back', 'info');
    return true;
  };

  const submitOrder = async (payments) => {
    setSubmitting(true);
    try {
      if (!online) {
        storeOfflineOrder(payments);
        return;
      }

      const { data } = await orderApi.create({
        customer_id: cart.customerId || null,
        order_type: cart.orderType,
        notes: cart.notes,
        discount_type: cart.discountType,
        discount_value: Number(cart.discountValue) || 0,
        coupon_code: cart.coupon?.code || null,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          qty: i.qty,
          notes: i.notes,
          addon_ids: i.addons.map((a) => a.id),
        })),
        payments,
      });
      setShowPayment(false);
      setReceiptOrder(data.data);
      cartApi.clear();
      toast(`Order ${data.data.order_number} placed — sent to kitchen`);
    } catch (err) {
      // A connection that dropped mid-sale must never lose the order.
      if (!err.response) {
        storeOfflineOrder(payments);
      } else {
        toast(err.response?.data?.message || 'Failed to place order', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const customerOptions = useMemo(() => customers.filter((c) => !c.is_walk_in), [customers]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Catalog side */}
      <div className="flex min-h-0 flex-1 flex-col">
        {!online && (
          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
            <span>📴</span>
            {catalogMissing
              ? 'Offline and no saved menu on this device — connect once to download it.'
              : 'Offline mode — orders are saved here and upload automatically when you reconnect.'}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-3">
          <div className="relative min-w-[180px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => cartApi.setField('orderType', t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  cart.orderType === t.id ? 'bg-white text-orange-600 shadow' : 'text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <select
            value={cart.customerId || ''}
            onChange={(e) => cartApi.setField('customerId', e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Walk-in customer</option>
            {customerOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.loyalty_points} pts)
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <CategorySidebar categories={categories} activeId={categoryId} onSelect={setCategoryId} />
          {prodLoading && online && !usingCache ? (
            <Spinner className="flex-1" />
          ) : (
            <ProductGrid products={products} onPick={pickProduct} />
          )}
        </div>
      </div>

      {/* Cart side — drawer on mobile, fixed panel on desktop */}
      <div
        className={`fixed inset-0 z-40 lg:static lg:z-auto lg:block lg:w-[360px] lg:border-l lg:border-slate-200 ${
          showCartMobile ? 'block' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/50 lg:hidden" onClick={() => setShowCartMobile(false)} />
        <div className="absolute inset-y-0 right-0 w-full max-w-sm lg:static lg:h-full lg:max-w-none">
          <CartPanel
            cart={cart}
            totals={totals}
            setQty={cartApi.setQty}
            removeItem={cartApi.removeItem}
            taxName={`${settings.tax_name} (${taxRate}%)`}
            showTax={taxRate > 0}
            onDiscount={() => setShowDiscount(true)}
            onHold={holdOrder}
            onShowHeld={() => setShowHeld(true)}
            heldCount={heldOrders.length}
            onCharge={() => { setShowCartMobile(false); setShowPayment(true); }}
            onClear={cartApi.clear}
          />
        </div>
      </div>

      {/* Mobile cart toggle */}
      <button
        onClick={() => setShowCartMobile(true)}
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 font-bold text-white shadow-lg lg:hidden"
      >
        🛒 {totals.itemCount} · {settings.currency_symbol}
        {totals.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </button>

      <VariantModal
        product={pickerProduct}
        onClose={() => setPickerProduct(null)}
        onConfirm={(opts) => {
          cartApi.addItem(pickerProduct, opts);
          setPickerProduct(null);
        }}
      />
      {showDiscount && (
        <DiscountModal
          open
          onClose={() => setShowDiscount(false)}
          cart={cart}
          subtotal={totals.subtotal}
          setDiscount={cartApi.setDiscount}
          setCoupon={cartApi.setCoupon}
        />
      )}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={totals.total}
        onConfirm={submitOrder}
        submitting={submitting}
        offline={!online}
      />
      <HeldOrdersModal
        open={showHeld}
        onClose={() => setShowHeld(false)}
        heldOrders={heldOrders}
        onResume={resumeOrder}
        onDiscard={discardHeld}
      />
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </div>
  );
}
