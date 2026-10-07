import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
        <p className="text-slate-500 mb-6">Sign in to your Smart City account</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-semibold text-slate-700 bg-white shadow-sm text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.03c2.36-2.17 3.715-5.37 3.715-8.74z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.03-3.12c-1.12.75-2.55 1.19-3.93 1.19-2.7 0-4.99-1.83-5.81-4.29H2.03v3.22C4.01 22.03 7.78 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M6.19 14.87a7.22 7.22 0 0 1-.38-2.87c0-.72.12-1.43.38-2.09V6.69H2.03A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.37l4.94-3.5z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.78 0 4.01 1.97 2.03 5.37l4.94 3.5c.82-2.46 3.11-4.29 5.81-4.29z"
            />
          </svg>
          Continue with Google
        </button>



        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-slate-200 w-full absolute" />
          <span className="relative bg-white px-3 text-xs text-slate-400 font-medium tracking-wider uppercase">
            or use email
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Don't have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
        </p>

        <div className="mt-6 p-4 rounded-lg bg-slate-50 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Demo accounts:</p>
          <p>Citizen: citizen@example.com / password123</p>
          <p>Admin: admin@smartcity.gov / password123</p>
        </div>
      </div>
    </div>
  );
}
