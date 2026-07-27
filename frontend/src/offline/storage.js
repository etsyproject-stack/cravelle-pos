/**
 * Local storage for the till. Everything the POS needs to keep selling when
 * the server is unreachable lives here: the catalog snapshot and the queue of
 * orders that still have to reach the server.
 */

const CATALOG_KEY = 'pos_catalog_cache';
const QUEUE_KEY = 'pos_offline_orders';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exhausted or private mode — the caller decides how to react.
    return false;
  }
}

/* ---------------------------------------------------------------- catalog */

export function saveCatalog(catalog) {
  return write(CATALOG_KEY, { ...catalog, cached_at: new Date().toISOString() });
}

export function loadCatalog() {
  return read(CATALOG_KEY, null);
}

export function clearCatalog() {
  localStorage.removeItem(CATALOG_KEY);
}

/* ------------------------------------------------------------ order queue */

export function queuedOrders() {
  return read(QUEUE_KEY, []);
}

/**
 * Park an order taken while offline. Returns false when the browser refuses
 * to store it, so the cashier can be warned instead of silently losing a sale.
 */
export function queueOrder(order) {
  const queue = queuedOrders();
  queue.push(order);
  return write(QUEUE_KEY, queue);
}

export function removeQueuedOrders(clientUuids) {
  const gone = new Set(clientUuids);
  return write(
    QUEUE_KEY,
    queuedOrders().filter((order) => !gone.has(order.client_uuid))
  );
}

/** Mark orders the server rejected so they stop being retried forever. */
export function markQueuedFailures(failures) {
  const reasons = new Map(failures.map((f) => [f.client_uuid, f.message]));
  return write(
    QUEUE_KEY,
    queuedOrders().map((order) =>
      reasons.has(order.client_uuid)
        ? { ...order, sync_error: reasons.get(order.client_uuid), attempts: (order.attempts || 0) + 1 }
        : order
    )
  );
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

/* ------------------------------------------------- held orders (offline) */

const HELD_KEY = 'pos_offline_held';

/**
 * Parked carts while offline. These are working state, not sales, so they
 * live only on this device and are never uploaded.
 */
export function localHeldOrders() {
  return read(HELD_KEY, []);
}

export function addLocalHeldOrder(held) {
  return write(HELD_KEY, [held, ...localHeldOrders()]);
}

export function removeLocalHeldOrder(id) {
  return write(HELD_KEY, localHeldOrders().filter((held) => held.id !== id));
}
