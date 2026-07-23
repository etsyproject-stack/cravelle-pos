import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager', 'cashier'] },
  { to: '/pos', label: 'POS', icon: '🛒', roles: ['admin', 'manager', 'cashier'] },
  { to: '/orders', label: 'Orders', icon: '🧾', roles: ['admin', 'manager', 'cashier'] },
  { to: '/kitchen', label: 'Kitchen (KDS)', icon: '👨‍🍳', roles: ['admin', 'manager', 'kitchen'] },
  { to: '/products', label: 'Products', icon: '🍔', roles: ['admin', 'manager'] },
  { to: '/customers', label: 'Customers', icon: '👥', roles: ['admin', 'manager', 'cashier'] },
  { to: '/staff', label: 'Staff', icon: '🪪', roles: ['admin', 'manager'] },
  { to: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager'] },
  { to: '/expenses', label: 'Expenses', icon: '💸', roles: ['admin', 'manager'] },
  { to: '/coupons', label: 'Coupons', icon: '🎟️', roles: ['admin', 'manager', 'cashier'] },
  { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin', 'manager'] },
];

export default function Sidebar({ open, onClose }) {
  const { user, hasRole } = useAuth();
  const items = NAV_ITEMS.filter((item) => hasRole(...item.roles));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <span className="text-2xl">🍟</span>
          <div>
            <p className="text-sm font-bold text-white">Cravelle POS</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Fast Food</p>
          </div>
        </div>
        <nav className="thin-scroll flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}
