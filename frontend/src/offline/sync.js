import client from '../api/client';
import { markQueuedFailures, queuedOrders, removeQueuedOrders } from './storage';

/** Orders that failed this many times are held back for manual review. */
const MAX_ATTEMPTS = 5;

/**
 * Is the server actually reachable? `navigator.onLine` only knows whether a
 * network cable/wifi exists, so we ask the API itself.
 */
export async function pingApi(timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('/api/v1/ping', { cache: 'no-store', signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function syncableOrders() {
  return queuedOrders().filter((order) => (order.attempts || 0) < MAX_ATTEMPTS);
}

export function blockedOrders() {
  return queuedOrders().filter((order) => (order.attempts || 0) >= MAX_ATTEMPTS);
}

/**
 * Push queued orders to the server. Each carries a client_uuid, so a retry
 * after a half-finished upload can never charge a customer twice.
 */
export async function syncQueuedOrders() {
  const pending = syncableOrders();
  if (pending.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  const payload = pending.map(({ receipt, attempts, sync_error, ...order }) => order);
  const { data } = await client.post('/orders/sync', { orders: payload });

  const synced = data.data.synced || [];
  const failed = data.data.failed || [];

  if (synced.length) removeQueuedOrders(synced.map((s) => s.client_uuid));
  if (failed.length) markQueuedFailures(failed);

  return { synced: synced.length, failed: failed.length, skipped: blockedOrders().length };
}
