import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import ConnectionStatus from './ConnectionStatus';

export default function Topbar({ onMenuToggle, title }) {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ConnectionStatus />
        <span className="hidden text-sm text-slate-500 lg:block">{settings.restaurant_name}</span>
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
