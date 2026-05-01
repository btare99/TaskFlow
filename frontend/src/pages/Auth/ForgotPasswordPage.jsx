import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Email u dërgua!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gabim.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">⚡ TaskFlow</Link>
        <h1 className="auth-title">Fjalëkalim i harruar</h1>
        <p className="auth-sub">Shkruani emailin tuaj dhe do t'ju dërgojmë udhëzime.</p>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <p style={{ color: 'var(--text-muted)' }}>Kontrolloni emailin tuaj për linkun e rivendosjes.</p>
            <Link to="/login" className="btn btn-outline" style={{ marginTop: 20 }}>Kthehu te hyrja</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="ju@shembull.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
              {loading ? 'Duke dërguar...' : 'Dërgo linkun'}
            </button>
            <p className="auth-switch"><Link to="/login">← Kthehu te hyrja</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
