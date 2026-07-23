import { useEffect, useState } from 'react';
import { settingsApi } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Karachi',
  'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Singapore', 'Australia/Sydney',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' },
  { code: 'AED', symbol: 'د.إ' }, { code: 'PKR', symbol: '₨' }, { code: 'INR', symbol: '₹' },
  { code: 'BDT', symbol: '৳' }, { code: 'SAR', symbol: '﷼' },
];

export default function Settings() {
  const { settings, refresh } = useSettings();
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const setCurrency = (code) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    setForm((f) => ({ ...f, currency_code: code, currency_symbol: cur?.symbol || f.currency_symbol }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.update(form);
      await refresh();
      toast('Settings saved');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <Card title="Restaurant Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Restaurant name" value={form.restaurant_name || ''} onChange={(e) => set('restaurant_name', e.target.value)} />
          <Input label="Phone" value={form.restaurant_phone || ''} onChange={(e) => set('restaurant_phone', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Address" value={form.restaurant_address || ''} onChange={(e) => set('restaurant_address', e.target.value)} />
          </div>
        </div>
      </Card>

      <Card title="Taxes">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tax name" value={form.tax_name || ''} onChange={(e) => set('tax_name', e.target.value)} placeholder="VAT / GST / Sales Tax" />
          <Input label="Tax rate (%)" type="number" min="0" step="0.01" value={form.tax_rate || ''} onChange={(e) => set('tax_rate', e.target.value)} />
        </div>
      </Card>

      <Card title="Currency & Timezone">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Currency" value={form.currency_code || 'USD'} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </Select>
          <Input label="Currency symbol" value={form.currency_symbol || ''} onChange={(e) => set('currency_symbol', e.target.value)} />
          <Select label="Timezone" value={form.timezone || 'UTC'} onChange={(e) => set('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title="Receipt & Printer">
        <div className="space-y-4">
          <Input label="Receipt printer name" value={form.receipt_printer || ''} onChange={(e) => set('receipt_printer', e.target.value)} placeholder="e.g. EPSON TM-T20III" />
          <Textarea label="Receipt footer message" value={form.receipt_footer || ''} onChange={(e) => set('receipt_footer', e.target.value)} rows={2} />
        </div>
      </Card>

      <Card title="Loyalty">
        <Input
          label="Points earned per currency unit spent"
          type="number"
          min="0"
          step="0.1"
          value={form.loyalty_earn_rate || ''}
          onChange={(e) => set('loyalty_earn_rate', e.target.value)}
        />
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
