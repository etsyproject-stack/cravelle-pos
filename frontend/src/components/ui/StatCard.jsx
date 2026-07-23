export default function StatCard({ label, value, sub, icon, accent = 'bg-orange-100 text-orange-600' }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${accent}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-xl font-bold text-slate-800 sm:text-2xl">{value}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
