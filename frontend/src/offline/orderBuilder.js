/**
 * Turns the POS cart into (a) the payload the server will accept once we are
 * back online and (b) a receipt we can print right now, at the counter.
 */

function newUuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers: RFC-4122 v4 shape.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildOfflineOrder({ cart, totals, payments, settings, cashier, customer }) {
  const clientUuid = newUuid();
  const placedAt = new Date();

  const payload = {
    client_uuid: clientUuid,
    placed_at: placedAt.toISOString(),
    customer_id: cart.customerId || null,
    order_type: cart.orderType,
    notes: cart.notes || null,
    discount_type: cart.discountType,
    discount_value: Number(cart.discountValue) || 0,
    coupon_code: cart.coupon?.code || null,
    items: cart.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      qty: item.qty,
      notes: item.notes,
      addon_ids: item.addons.map((addon) => addon.id),
    })),
    payments: payments.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      ...(payment.tendered !== undefined ? { tendered: payment.tendered } : {}),
    })),
  };

  // Shaped like the API's order resource so the same receipt component works.
  const receipt = {
    id: clientUuid,
    order_number: `OFFLINE-${placedAt.getHours().toString().padStart(2, '0')}${placedAt
      .getMinutes()
      .toString()
      .padStart(2, '0')}-${clientUuid.slice(0, 4).toUpperCase()}`,
    kot_number: null,
    placed_offline: true,
    pending_sync: true,
    order_type: cart.orderType,
    status: 'pending',
    payment_status: 'paid',
    subtotal: totals.subtotal,
    discount: totals.discount,
    coupon_code: cart.coupon?.code || null,
    tax_rate: settings.tax_rate,
    tax: totals.tax,
    total: totals.total,
    notes: cart.notes || null,
    loyalty_points_earned: 0,
    created_at: placedAt.toISOString(),
    cashier: cashier ? { id: cashier.id, name: cashier.name } : null,
    customer: customer ? { id: customer.id, name: customer.name } : null,
    items: cart.items.map((item, index) => ({
      id: `${clientUuid}-${index}`,
      product_name: item.name,
      variant_name: item.variant_name,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.unit_price * item.qty,
      notes: item.notes,
      addons: item.addons.map((addon, addonIndex) => ({
        id: `${clientUuid}-${index}-${addonIndex}`,
        addon_name: addon.name,
        price: addon.price,
      })),
    })),
    payments: payments.map((payment, index) => ({
      id: `${clientUuid}-p${index}`,
      method: payment.method,
      amount: payment.amount,
      tendered: payment.tendered ?? null,
      change_given:
        payment.tendered !== undefined ? Math.max(0, payment.tendered - payment.amount) : null,
    })),
  };

  return { payload: { ...payload, receipt }, receipt };
}

/** Validate a coupon against the cached list when there is no connection. */
export function validateCouponOffline(coupons, code, subtotal) {
  const coupon = (coupons || []).find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase()
  );

  if (!coupon || !coupon.is_active) {
    throw new Error('This coupon is invalid or expired.');
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error('This coupon has expired.');
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw new Error('This coupon has been fully used.');
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    throw new Error(`Order must be at least ${Number(coupon.min_order_amount)} to use this coupon.`);
  }

  const discount =
    coupon.type === 'percent'
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount: Math.min(discount, subtotal),
  };
}
