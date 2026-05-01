import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Fjalëkalimi duhet të ketë 6+ karaktere.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Llogaria u krijua me sukses!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gabim gjatë regjistrimit.');
    } finally { setLoading(false); }
  };

  const googleLogin = () => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`; };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">⚡ TaskFlow</Link>
        <h1 className="auth-title">Krijoni llogarinë</h1>
        <p className="auth-sub">Falas përgjithmonë. Nuk kërkohet kartë.</p>

        <button className="btn-google" onClick={googleLogin}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Regjistrohu me Google
        </button>

        <div className="auth-divider"><span>ose</span></div>

        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Emri i plotë</label>
            <input className="input" name="name" placeholder="Arben Krasniqi"
              value={form.name} onChange={handle} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Email</label>
            <input className="input" name="email" type="email" placeholder="ju@shembull.com"
              value={form.email} onChange={handle} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Fjalëkalimi</label>
            <input className="input" name="password" type="password" placeholder="Min. 6 karaktere"
              value={form.password} onChange={handle} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 22 }} disabled={loading}>
            {loading ? 'Duke krijuar...' : 'Krijoni llogarinë falas'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 14, textAlign: 'center' }}>
          Duke u regjistruar pranoni <Link to="/terms" style={{ color: 'var(--indigo)' }}>Kushtet e Shërbimit</Link>
        </p>
        <p className="auth-switch">
          Keni llogari? <Link to="/login">Hyni këtu</Link>
        </p>
      </div>
    </div>
  );
}
