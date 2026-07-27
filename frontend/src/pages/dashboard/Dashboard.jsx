import { dashboardApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useSettings } from '../../context/SettingsContext';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import OfflineNotice from '../../components/ui/OfflineNotice';
import { StatusBadge } from '../../components/ui/Badge';

export default function Dashboard() {
  const { data, loading, error } = useApi(() => dashboardApi.stats());
  const { formatMoney } = useSettings();

  if (loading) return <Spinner />;
  if (error && !data) return <OfflineNotice what="The dashboard" />;
  const stats = data?.data || {};

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={formatMoney(stats.today_sales)}
          sub={`${stats.today_orders ?? 0} orders today`}
          icon="💰"
          accent="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Monthly Sales"
          value={formatMoney(stats.month_sales)}
          sub={`${stats.month_orders ?? 0} orders this month`}
          icon="📅"
          accent="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Active Orders"
          value={stats.active_orders ?? 0}
          sub="Pending / preparing / ready"
          icon="🔥"
          accent="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatMoney(stats.month_revenue)}
          sub={`Net of ${formatMoney(stats.month_expenses)} expenses`}
          icon="📈"
          accent="bg-orange-100 text-orange-600"
        />
      </div>

      <Card title="Recent Orders" bodyClassName="p-0 sm:p-0">
        <Table
          columns={[
            { key: 'order_number', label: 'Order #', render: (o) => <span className="font-semibold">{o.order_number}</span> },
            { key: 'customer', label: 'Customer', render: (o) => o.customer?.name || 'Walk-in' },
            { key: 'items_count', label: 'Items' },
            { key: 'total', label: 'Total', render: (o) => formatMoney(o.total) },
            { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
            { key: 'payment_status', label: 'Payment', render: (o) => <StatusBadge status={o.payment_status} /> },
            {
              key: 'created_at',
              label: 'Time',
              render: (o) => new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]}
          rows={stats.recent_orders || []}
          empty="No orders yet today."
        />
      </Card>
    </div>
  );
}
