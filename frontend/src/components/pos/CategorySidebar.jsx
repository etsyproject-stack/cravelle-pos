export default function CategorySidebar({ categories, activeId, onSelect }) {
  const items = [{ id: null, name: 'All', icon: '🍽️' }, ...categories];

  return (
    <div className="thin-scroll flex shrink-0 gap-2 overflow-x-auto p-2 lg:w-36 lg:flex-col lg:overflow-y-auto lg:p-3">
      {items.map((cat) => (
        <button
          key={cat.id ?? 'all'}
          onClick={() => onSelect(cat.id)}
          className={`flex min-w-[5.5rem] shrink-0 flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-colors lg:min-w-0 ${
            activeId === cat.id
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-transparent bg-white text-slate-600 shadow-sm hover:border-slate-200'
          }`}
        >
          <span className="text-2xl">{cat.icon || '🍴'}</span>
          <span className="text-xs font-semibold leading-tight">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
