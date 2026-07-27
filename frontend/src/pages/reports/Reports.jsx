import { useState } from 'react';
import { reportApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useSettings } from '../../context/SettingsContext';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import OfflineNotice from '../../components/ui/OfflineNotice';

const TABS = [
  { id: 'daily', label: 'Daily Sales' },
  { id: 'monthly', label: 'Monthly Sales' },
  { id: 'products', label: 'Product Sales' },
  { id: 'profit', label: 'Profit Report' },
];

function BarRow({ label, value, max, display }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate text-slate-600 sm:w-32">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
        <div className="h-full rounded bg-orange-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 shrink-0 text-right font-semibold">{display}</span>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);

  const { formatMoney } = useSettings();
  const { data, loading, error } = useApi(() => {
    if (tab === 'daily') return reportApi.daily({ date });
    if (tab === 'monthly') return reportApi.monthly({ month });
    if (tab === 'products') return reportApi.products({ month });
    return reportApi.profit({ month });
  }, [tab, date, month]);

  const report = data?.data || {};

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="thin-scroll flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
                tab === t.id ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'daily' ? (
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        ) : (
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : error && !data ? (
        <OfflineNotice what="Reports" />
      ) : tab === 'daily' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Gross Sales" value={formatMoney(report.gross_sales)} icon="💰" accent="bg-emerald-100 text-emerald-600" />
            <StatCard label="Orders" value={report.orders_count ?? 0} icon="🧾" accent="bg-blue-100 text-blue-600" />
            <StatCard label="Average Order" value={formatMoney(report.average_order)} icon="📊" accent="bg-orange-100 text-orange-600" />
          </div>
          <Card title="Sales by hour">
            <div className="space-y-2">
              {(report.by_hour || []).map((h) => (
                <BarRow
                  key={h.hour}
                  label={`${String(h.hour).padStart(2, '0')}:00`}
                  value={Number(h.total)}
                  max={Math.max(...(report.by_hour || []).map((x) => Number(x.total)), 1)}
                  display={formatMoney(h.total)}
                />
              ))}
              {(report.by_hour || []).length === 0 && <p className="text-sm text-slate-400">No sales on this date.</p>}
            </div>
          </Card>
          <Card title="Payment methods" bodyClassName="p-0 sm:p-0">
            <Table
              columns={[
                { key: 'method', label: 'Method', render: (r) => <span className="capitalize">{r.method?.replace('_', ' ')}</span> },
                { key: 'count', label: 'Payments' },
                { key: 'total', label: 'Total', render: (r) => formatMoney(r.total) },
              ]}
              rows={report.by_payment_method || []}
              keyField="method"
              empty="No payments on this date."
            />
          </Card>
        </>
      ) : tab === 'monthly' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Gross Sales" value={formatMoney(report.gross_sales)} icon="💰" accent="bg-emerald-100 text-emerald-600" />
            <StatCard label="Orders" value={report.orders_count ?? 0} icon="🧾" accent="bg-blue-100 text-blue-600" />
            <StatCard label="Average Order" value={formatMoney(report.average_order)} icon="📊" accent="bg-orange-100 text-orange-600" />
          </div>
          <Card title="Sales by day">
            <div className="space-y-2">
              {(report.by_day || []).map((d) => (
                <BarRow
                  key={d.date}
                  label={new Date(d.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  value={Number(d.total)}
                  max={Math.max(...(report.by_day || []).map((x) => Number(x.total)), 1)}
                  display={formatMoney(d.total)}
                />
              ))}
              {(report.by_day || []).length === 0 && <p className="text-sm text-slate-400">No sales this month.</p>}
            </div>
          </Card>
        </>
      ) : tab === 'products' ? (
        <Card title="Product sales this month" bodyClassName="p-0 sm:p-0">
          <Table
            columns={[
              { key: 'product_name', label: 'Product', render: (r) => <span className="font-semibold">{r.product_name}</span> },
              { key: 'category_name', label: 'Category' },
              { key: 'qty_sold', label: 'Qty sold' },
              { key: 'gross', label: 'Gross sales', render: (r) => formatMoney(r.gross) },
            ]}
            rows={report.products || []}
            keyField="product_id"
            empty="No product sales this month."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatMoney(report.revenue)} icon="💰" accent="bg-emerald-100 text-emerald-600" />
            <StatCard label="Cost of Goods" value={formatMoney(report.cogs)} icon="📦" accent="bg-amber-100 text-amber-600" />
            <StatCard label="Expenses" value={formatMoney(report.expenses)} icon="💸" accent="bg-red-100 text-red-600" />
            <StatCard
              label="Net Profit"
              value={formatMoney(report.net_profit)}
              icon="📈"
              accent={Number(report.net_profit) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}
            />
          </div>
          <Card title="Breakdown">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Gross revenue (completed orders)</span><span className="font-semibold">{formatMoney(report.revenue)}</span></div>
              <div className="flex justify-between text-slate-600"><span>− Cost of goods sold</span><span>{formatMoney(report.cogs)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2"><span>Gross profit</span><span className="font-semibold">{formatMoney(report.gross_profit)}</span></div>
              <div className="flex justify-between text-slate-600"><span>− Operating expenses</span><span>{formatMoney(report.expenses)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span>Net profit</span>
                <span className={Number(report.net_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatMoney(report.net_profit)}
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
