import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsApi } from '../api';
import { useAuth } from './AuthContext';

const DEFAULTS = {
  restaurant_name: 'Cravelle Fast Food',
  restaurant_address: '',
  restaurant_phone: '',
  currency_symbol: '$',
  currency_code: 'USD',
  tax_rate: '10',
  tax_name: 'VAT',
  timezone: 'UTC',
  receipt_footer: 'Thank you for your order!',
  receipt_printer: 'Default Printer',
  loyalty_earn_rate: '1',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const { data } = await settingsApi.get();
      setSettings({ ...DEFAULTS, ...data.data });
    } catch {
      // keep defaults if settings are unavailable
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const formatMoney = useCallback(
    (amount) =>
      `${settings.currency_symbol}${Number(amount ?? 0).toFixed(2)}`,
    [settings.currency_symbol]
  );

  return (
    <SettingsContext.Provider value={{ settings, refresh, formatMoney }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
