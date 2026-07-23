import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@cravelle.test' },
  { label: 'Manager', email: 'manager@cravelle.test' },
  { label: 'Cashier', email: 'cashier@cravelle.test' },
  { label: 'Kitchen', email: 'kitchen@cravelle.test' },
];

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@cravelle.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  if (user) return <Navigate to={user.role === 'kitchen' ? '/kitchen' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const logged = await login(email, password);
      navigate(logged.role === 'kitchen' ? '/kitchen' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-5xl">🍟</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Cravelle POS</h1>
          <p className="text-sm text-slate-400">Fast Food Restaurant Point of Sale</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Demo accounts · password: <code>password</code>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setEmail(acc.email)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    email === acc.email
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
