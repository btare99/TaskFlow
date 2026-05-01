import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import { authAPI, stripeAPI } from '../../services/api';
import AppShell from '../../components/AppShell/AppShell';
import './SettingsPage.css';

function ProfileTab() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profili u përditësua!');
    } catch { toast.error('Gabim.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-title">Profili</h2>
      <div className="settings-avatar-row">
        {user?.avatar
          ? <img src={user.avatar} className="avatar avatar-lg" alt={user.name} />
          : <div className="avatar avatar-lg">{user?.name?.[0]}</div>
        }
        <div>
          <p className="settings-label">{user?.email}</p>
          <span className={`badge badge-indigo plan-${user?.subscription?.plan}`}>{user?.subscription?.plan} plan</span>
        </div>
      </div>
      <form onSubmit={submit} className="settings-form">
        <div className="input-group">
          <label className="input-label">Emri i plotë</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 14 }}>
          <label className="input-label">URL e Avatarit</label>
          <input className="input" placeholder="https://..." value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
        </button>
      </form>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) return toast.error('Min. 6 karaktere.');
    setLoading(true);
    try {
      await authAPI.changePassword(form);
      toast.success('Fjalëkalimi u ndryshua!');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-title">Siguria</h2>
      <form onSubmit={submit} className="settings-form">
        <div className="input-group">
          <label className="input-label">Fjalëkalimi aktual</label>
          <input className="input" type="password" value={form.currentPassword}
            onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 14 }}>
          <label className="input-label">Fjalëkalimi i ri</label>
          <input className="input" type="password" placeholder="Min. 6 karaktere"
            value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={loading}>
          {loading ? 'Duke ndryshuar...' : 'Ndrysho fjalëkalimin'}
        </button>
      </form>
    </div>
  );
}

function BillingTab() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(null);
  const plan = user?.subscription?.plan || 'free';
  const status = user?.subscription?.status || 'active';
  const periodEnd = user?.subscription?.currentPeriodEnd;

  const openPortal = async () => {
    setLoading('portal');
    try {
      const res = await stripeAPI.portal();
      window.open(res.data.url, '_blank');
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(null); }
  };

  const handleUpgrade = async (targetPlan) => {
    setLoading(targetPlan);
    try {
      const res = await stripeAPI.createCheckout(targetPlan);
      window.location.href = res.data.url;
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(null); }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-title">Faturimi & Plani</h2>
      <div className="billing-current">
        <div>
          <div className="billing-plan-name">
            <span className={`badge badge-indigo plan-${plan}`}>{plan.toUpperCase()}</span>
            <span className="billing-status" style={{ color: status === 'active' ? 'var(--green)' : 'var(--red)' }}>● {status}</span>
          </div>
          {periodEnd && <p className="billing-period">Rinovohet më {new Date(periodEnd).toLocaleDateString('sq-AL')}</p>}
        </div>
        {plan !== 'free' && (
          <button className="btn btn-outline btn-sm" onClick={openPortal} disabled={loading === 'portal'}>
            {loading === 'portal' ? '...' : 'Menaxho Abonamin'}
          </button>
        )}
      </div>

      {plan === 'free' && (
        <div className="billing-upgrade-row">
          <div className="billing-upgrade-card">
            <div className="billing-upgrade-name">Pro</div>
            <div className="billing-upgrade-price">9€ <span>/muaj</span></div>
            <ul className="billing-upgrade-features">
              <li>✅ 3 Workspaces</li>
              <li>✅ Board pa limit</li>
              <li>✅ 15 anëtarë/workspace</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => handleUpgrade('pro')} disabled={loading === 'pro'}>
              {loading === 'pro' ? '...' : 'Upgrade te Pro'}
            </button>
          </div>
          <div className="billing-upgrade-card billing-upgrade-card--featured">
            <div className="billing-upgrade-badge">Më i Popullarizuar</div>
            <div className="billing-upgrade-name">Team</div>
            <div className="billing-upgrade-price">29€ <span>/muaj</span></div>
            <ul className="billing-upgrade-features">
              <li>✅ Workspace pa limit</li>
              <li>✅ Board pa limit</li>
              <li>✅ Anëtarë pa limit</li>
              <li>✅ Analytics</li>
              <li>✅ Support prioritar</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => handleUpgrade('team')} disabled={loading === 'team'}>
              {loading === 'team' ? '...' : 'Upgrade te Team'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { path: '/settings', label: 'Profili', exact: true },
  { path: '/settings/security', label: 'Siguria' },
  { path: '/settings/billing', label: 'Faturimi' },
];

export default function SettingsPage() {
  const location = useLocation();

  return (
    <AppShell>
      <div className="settings-page">
        <h1 className="settings-page-title">Cilësimet</h1>
        <div className="settings-tabs">
          {TABS.map(t => (
            <Link key={t.path} to={t.path}
              className={`settings-tab ${location.pathname === t.path ? 'active' : ''}`}>
              {t.label}
            </Link>
          ))}
        </div>
        <div className="settings-body">
          <Routes>
            <Route index element={<ProfileTab />} />
            <Route path="security" element={<SecurityTab />} />
            <Route path="billing" element={<BillingTab />} />
          </Routes>
        </div>
      </div>
    </AppShell>
  );
}
