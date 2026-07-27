import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { loadCatalog, queuedOrders, saveCatalog } from '../offline/storage';
import { pingApi, syncQueuedOrders } from '../offline/sync';
import { useAuth } from './AuthContext';

const OfflineContext = createContext(null);

const PING_INTERVAL_MS = 20000;
const CATALOG_REFRESH_MS = 5 * 60 * 1000;

export function OfflineProvider({ children }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [catalog, setCatalog] = useState(() => loadCatalog());
  const [pending, setPending] = useState(() => queuedOrders().length);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(() => setPending(queuedOrders().length), []);

  /** Pull a fresh copy of the menu, customers and settings for offline use. */
  const refreshCatalog = useCallback(async () => {
    try {
      const { data } = await client.get('/bootstrap');
      saveCatalog(data.data);
      setCatalog(loadCatalog());
      return true;
    } catch {
      return false;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || queuedOrders().length === 0) return null;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncQueuedOrders();
      setLastSync(new Date());
      return result;
    } catch {
      return null;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refreshPending();
    }
  }, [refreshPending]);

  // Watch real reachability rather than trusting navigator.onLine alone.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;

    const check = async () => {
      const reachable = navigator.onLine ? await pingApi() : false;
      if (!cancelled) setOnline(reachable);
      return reachable;
    };

    check();
    const timer = setInterval(check, PING_INTERVAL_MS);
    const onBrowserOnline = () => check();
    const onBrowserOffline = () => setOnline(false);

    window.addEventListener('online', onBrowserOnline);
    window.addEventListener('offline', onBrowserOffline);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('online', onBrowserOnline);
      window.removeEventListener('offline', onBrowserOffline);
    };
  }, [user]);

  // Keep the offline copy of the catalog warm while there is a connection,
  // and flush any orders taken during the outage the moment we are back.
  useEffect(() => {
    if (!user || !online) return undefined;

    refreshCatalog();
    syncNow();
    const timer = setInterval(refreshCatalog, CATALOG_REFRESH_MS);
    return () => clearInterval(timer);
  }, [user, online, refreshCatalog, syncNow]);

  return (
    <OfflineContext.Provider
      value={{ online, catalog, pending, syncing, lastSync, refreshCatalog, refreshPending, syncNow }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
