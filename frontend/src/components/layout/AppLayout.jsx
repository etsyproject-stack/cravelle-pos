import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const current = NAV_ITEMS.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuToggle={() => setSidebarOpen((o) => !o)} title={current?.label || 'Cravelle POS'} />
        <main className="thin-scroll flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
