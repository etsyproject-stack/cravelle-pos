import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import POS from './pages/pos/POS';
import Orders from './pages/orders/Orders';
import Kitchen from './pages/kitchen/Kitchen';
import Products from './pages/products/Products';
import Customers from './pages/customers/Customers';
import Staff from './pages/staff/Staff';
import Reports from './pages/reports/Reports';
import Expenses from './pages/expenses/Expenses';
import Coupons from './pages/coupons/Coupons';
import Settings from './pages/settings/Settings';

const MANAGEMENT = ['admin', 'manager'];
const FRONT_OF_HOUSE = ['admin', 'manager', 'cashier'];
const KITCHEN = ['admin', 'manager', 'kitchen'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ProtectedRoute roles={FRONT_OF_HOUSE}><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute roles={FRONT_OF_HOUSE}><POS /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={FRONT_OF_HOUSE}><Orders /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute roles={KITCHEN}><Kitchen /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute roles={MANAGEMENT}><Products /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute roles={FRONT_OF_HOUSE}><Customers /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute roles={MANAGEMENT}><Staff /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={MANAGEMENT}><Reports /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute roles={MANAGEMENT}><Expenses /></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute roles={FRONT_OF_HOUSE}><Coupons /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={MANAGEMENT}><Settings /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
