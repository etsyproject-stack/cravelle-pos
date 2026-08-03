import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { loadCatalog, queuedOrders, saveCatalog } from '../offline/storage';
import { pingApi, syncQueuedOrders } from '../offline/sync';
import { useAuth } from './AuthContext';

const OfflineContext = createContext(null);

const PING_INTERVAL_MS = 20000;
const CATALOG_REFRESH_MS = 5 * 60 * 1000;

/**
 * Windows serves the API through PHP's built-in server, which answers one
 * request at a time. A health check can sit behind a page load for several
 * seconds without the till being down, so allow generously for it and only
 * declare an outage once two checks in a row have failed. Recovery is
 * immediate — one good answer is enough.
 */
const PING_TIMEOUT_MS = 12000;
const FAILURES_BEFORE_OFFLINE = 2;

export function OfflineProvider({ children }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [catalog, setCatalog] = useState(() => loadCatalog());
  const [pending, setPending] = useState(() => queuedOrders().length);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const syncingRef = useRef(false);
  const failuresRef = useRef(0);

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
      if (!navigator.onLine) {
        failuresRef.current = FAILURES_BEFORE_OFFLINE;
        if (!cancelled) setOnline(false);
        return false;
      }

      const reachable = await pingApi(PING_TIMEOUT_MS);
      if (cancelled) return reachable;

      if (reachable) {
        failuresRef.current = 0;
        setOnline(true);
      } else {
        failuresRef.current += 1;
        if (failuresRef.current >= FAILURES_BEFORE_OFFLINE) setOnline(false);
      }
      return reachable;
    };

    check();
    const timer = setInterval(check, PING_INTERVAL_MS);
    const onBrowserOnline = () => check();
    const onBrowserOffline = () => {
      failuresRef.current = FAILURES_BEFORE_OFFLINE;
      setOnline(false);
    };

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
