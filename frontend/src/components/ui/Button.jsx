const VARIANTS = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300',
  secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:opacity-50',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-4 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
