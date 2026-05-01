import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Mirë se erdhe!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kredenciale të gabuara.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">⚡ TaskFlow</Link>
        <h1 className="auth-title">Mirë se ktheve</h1>
        <p className="auth-sub">Hyr në llogarinë tënde</p>

        <button className="btn-google" onClick={googleLogin}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Hyr me Google
        </button>

        <div className="auth-divider"><span>ose</span></div>

        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input" name="email" type="email" placeholder="ju@shembull.com"
              value={form.email} onChange={handle} required />
          </div>
          <div className="input-group" style={{ marginTop: 16 }}>
            <label className="input-label">Fjalëkalimi</label>
            <input className="input" name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handle} required />
          </div>
          <div className="auth-forgot">
            <Link to="/forgot-password">Harruat fjalëkalimin?</Link>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
            {loading ? 'Duke hyrë...' : 'Hyr'}
          </button>
        </form>

        <p className="auth-switch">
          Nuk keni llogari? <Link to="/register">Regjistrohuni falas</Link>
        </p>
      </div>
    </div>
  );
}
