import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import './AuthPages.css';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Min. 6 karaktere.');
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      localStorage.setItem('tf_token', res.data.token);
      toast.success('Fjalëkalimi u ndryshua!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token i pavlefshëm.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">⚡ TaskFlow</Link>
        <h1 className="auth-title">Fjalëkalim i ri</h1>
        <p className="auth-sub">Shkruani fjalëkalimin tuaj të ri më poshtë.</p>
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Fjalëkalimi i ri</label>
            <input className="input" type="password" placeholder="Min. 6 karaktere"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
            {loading ? 'Duke ruajtur...' : 'Ruaj fjalëkalimin'}
          </button>
        </form>
      </div>
    </div>
  );
}
