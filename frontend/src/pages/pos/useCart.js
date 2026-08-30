import { useCallback, useMemo, useReducer } from 'react';

/**
 * POS cart state. Each line is keyed by product + variant + addons so the
 * same configuration merges into one line while different configs stay apart.
 */
const initialState = {
  items: [],
  customerId: null,
  orderType: 'dine_in',
  notes: '',
  discountType: 'none', // none | percent | fixed
  discountValue: 0,
  coupon: null, // { id, code, discount }
};

function lineKey(productId, variantId, addonIds) {
  return `${productId}:${variantId ?? 'base'}:${[...addonIds].sort().join(',')}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, variant, addons, qty, notes } = action;
      const key = lineKey(product.id, variant?.id, addons.map((a) => a.id));
      const existing = state.items.find((i) => i.key === key && i.notes === (notes || ''));
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i === existing ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }
      const unitPrice =
        Number(variant?.price ?? product.price) +
        addons.reduce((sum, a) => sum + Number(a.price), 0);
      return {
        ...state,
        items: [
          ...state.items,
          {
            key: `${key}#${Date.now()}`,
            product_id: product.id,
            name: product.name,
            variant_id: variant?.id ?? null,
            variant_name: variant?.name ?? null,
            addons: addons.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
            unit_price: unitPrice,
            qty,
            notes: notes || '',
          },
        ],
      };
    }
    case 'SET_QTY':
      return {
        ...state,
        items: state.items
          .map((i) => (i.key === action.key ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty > 0),
      };
    case 'SET_NOTES':
      return {
        ...state,
        items: state.items.map((i) => (i.key === action.key ? { ...i, notes: action.notes } : i)),
      };
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_DISCOUNT':
      return { ...state, discountType: action.discountType, discountValue: action.discountValue };
    case 'SET_COUPON':
      return { ...state, coupon: action.coupon };
    case 'RESTORE':
      return { ...initialState, ...action.state };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

export function useCart(taxRate, serviceRate) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
    let discount = 0;
    if (state.discountType === 'percent') discount = (subtotal * Number(state.discountValue)) / 100;
    if (state.discountType === 'fixed') discount = Number(state.discountValue);
    const couponDiscount = Number(state.coupon?.discount ?? 0);
    discount = Math.min(subtotal, discount + couponDiscount);
    // Mirrors OrderService: service charge on the discounted subtotal, tax on
    // the two together. The server recomputes all of this — this is what the
    // cashier and the customer see before it does.
    const net = subtotal - discount;
    const serviceCharge = (net * Number(serviceRate || 0)) / 100;
    const tax = ((net + serviceCharge) * Number(taxRate || 0)) / 100;
    return {
      subtotal,
      discount,
      serviceCharge,
      tax,
      total: net + serviceCharge + tax,
      itemCount: state.items.reduce((sum, i) => sum + i.qty, 0),
    };
  }, [state.items, state.discountType, state.discountValue, state.coupon, taxRate, serviceRate]);

  const addItem = useCallback(
    (product, { variant = null, addons = [], qty = 1, notes = '' } = {}) =>
      dispatch({ type: 'ADD', product, variant, addons, qty, notes }),
    []
  );

  return {
    cart: state,
    totals,
    addItem,
    setQty: (key, qty) => dispatch({ type: 'SET_QTY', key, qty }),
    setItemNotes: (key, notes) => dispatch({ type: 'SET_NOTES', key, notes }),
    removeItem: (key) => dispatch({ type: 'REMOVE', key }),
    setField: (field, value) => dispatch({ type: 'SET_FIELD', field, value }),
    setDiscount: (discountType, discountValue) =>
      dispatch({ type: 'SET_DISCOUNT', discountType, discountValue }),
    setCoupon: (coupon) => dispatch({ type: 'SET_COUPON', coupon }),
    restore: (savedState) => dispatch({ type: 'RESTORE', state: savedState }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };
}
