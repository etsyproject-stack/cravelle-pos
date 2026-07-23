import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !hasRole(...roles)) {
    // Kitchen staff land on the KDS; everyone else on the dashboard.
    return <Navigate to={user.role === 'kitchen' ? '/kitchen' : '/'} replace />;
  }

  return children;
}
