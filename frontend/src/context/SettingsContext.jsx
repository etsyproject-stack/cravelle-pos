import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsApi } from '../api';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';

const DEFAULTS = {
  restaurant_name: 'Cravelle 2.0',
  restaurant_address: '',
  restaurant_phone: '',
  currency_symbol: 'Rs ',
  currency_code: 'PKR',
  currency_decimals: '0',
  tax_rate: '0',
  tax_name: 'GST',
  timezone: 'Asia/Karachi',
  receipt_footer: 'Thank you for your order!',
  receipt_printer: 'Default Printer',
  loyalty_earn_rate: '0.01',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const { catalog } = useOffline();
  const [settings, setSettings] = useState(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const { data } = await settingsApi.get();
      setSettings({ ...DEFAULTS, ...data.data });
    } catch {
      // No connection: fall back to the settings cached for offline use.
      const cached = catalog?.settings;
      if (cached) setSettings({ ...DEFAULTS, ...cached });
    }
  }, [catalog]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const formatMoney = useCallback(
    (amount) => {
      const decimals = Number(settings.currency_decimals ?? 0);
      const value = Number(amount ?? 0).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${settings.currency_symbol}${value}`;
    },
    [settings.currency_symbol, settings.currency_decimals]
  );

  return (
    <SettingsContext.Provider value={{ settings, refresh, formatMoney }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
