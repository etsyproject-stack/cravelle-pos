const COLORS = {
  slate: 'bg-slate-100 text-slate-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export const STATUS_COLORS = {
  pending: 'amber',
  preparing: 'blue',
  ready: 'purple',
  completed: 'emerald',
  cancelled: 'red',
  paid: 'emerald',
  unpaid: 'red',
  partial: 'amber',
};

export default function Badge({ color = 'slate', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${COLORS[color] || COLORS.slate} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge color={STATUS_COLORS[status] || 'slate'}>{status}</Badge>;
}
