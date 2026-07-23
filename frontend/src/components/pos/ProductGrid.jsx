import { useSettings } from '../../context/SettingsContext';

function ProductCard({ product, onPick, formatMoney }) {
  const outOfStock = product.track_stock && product.stock_qty <= 0;
  return (
    <button
      onClick={() => onPick(product)}
      disabled={outOfStock}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex h-20 items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-4xl sm:h-24">
        {product.image || product.category?.icon || '🍴'}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-sm font-semibold text-slate-800">{product.name}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-orange-600">{formatMoney(product.price)}</span>
          {product.variants?.length > 0 && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {product.variants.length} sizes
            </span>
          )}
        </div>
        {product.track_stock && (
          <span
            className={`mt-1 text-[10px] font-semibold ${
              outOfStock ? 'text-red-600' : product.stock_qty <= product.low_stock_threshold ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {outOfStock ? 'Out of stock' : `${product.stock_qty} in stock`}
          </span>
        )}
      </div>
    </button>
  );
}

export default function ProductGrid({ products, onPick }) {
  const { formatMoney } = useSettings();

  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        No products match your search.
      </div>
    );
  }

  return (
    <div className="thin-scroll grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onPick={onPick} formatMoney={formatMoney} />
      ))}
    </div>
  );
}
