import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore, useWorkspaceStore } from '../../store';
import { workspacesAPI } from '../../services/api';
import AppShell from '../../components/AppShell/AppShell';
import './DashboardPage.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#10b981', '#0ea5e9', '#f59e0b'];

function CreateWorkspaceModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Emri kërkohet.');
    setLoading(true);
    try {
      const res = await workspacesAPI.create(form);
      toast.success('Workspace u krijua!');
      onCreate(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gabim.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Krijo Workspace të ri</h2>
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Emri i Workspace-it</label>
            <input className="input" placeholder="p.sh. Projekti Alpha" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Përshkrim (opsional)</label>
            <input className="input" placeholder="Çfarë bën ky workspace?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Ngjyra</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button key={c} type="button" className={`color-dot ${form.color === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Duke krijuar...' : 'Krijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { workspaces, setWorkspaces, addWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    workspacesAPI.list()
      .then(res => setWorkspaces(res.data))
      .catch(() => toast.error('Gabim gjatë ngarkimit.'))
      .finally(() => setLoading(false));
  }, [setWorkspaces]);

  const plan = user?.subscription?.plan || 'free';

  return (
    <AppShell>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">
              Mirë se vjen, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="dashboard__sub">Menaxhoni workspaces dhe boardet tuaja</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Workspace i ri
          </button>
        </div>

        {/* Plan Banner (only for free) */}
        {plan === 'free' && (
          <div className="plan-banner">
            <div className="plan-banner__info">
              <span className="badge badge-indigo">Free Plan</span>
              <span>Merrni planin <strong>Pro</strong> për workspace të pakufiztë, 15 anëtarë dhe shumë më tepër.</span>
            </div>
            <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade → Pro</Link>
          </div>
        )}

        {/* Workspaces Grid */}
        {loading ? (
          <div className="workspaces-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="workspace-card skeleton" style={{ height: 160 }} />)}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>🏢</div>
            <h3>Nuk keni workspace ende</h3>
            <p>Krijoni workspace-in e parë dhe filloni të organizoni projektet tuaja.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Krijo Workspace</button>
          </div>
        ) : (
          <>
            <h2 className="dashboard__section-title">Workspaces tuaja</h2>
            <div className="workspaces-grid">
              {workspaces.map(ws => (
                <div key={ws._id} className="workspace-card" onClick={() => navigate(`/workspace/${ws._id}`)}>
                  <div className="workspace-card__accent" style={{ background: ws.color || '#6366f1' }} />
                  <div className="workspace-card__body">
                    <div className="workspace-card__icon" style={{ background: ws.color + '22', color: ws.color }}>
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div className="workspace-card__info">
                      <h3 className="workspace-card__name">{ws.name}</h3>
                      {ws.description && <p className="workspace-card__desc">{ws.description}</p>}
                    </div>
                  </div>
                  <div className="workspace-card__footer">
                    <span className="workspace-card__stat">{ws.boardCount || 0} board</span>
                    <span className="workspace-card__stat">{ws.members?.length || 1} anëtarë</span>
                    <span className={`badge badge-${plan === 'free' ? 'indigo' : plan === 'pro' ? 'indigo' : 'gold'} plan-${plan}`}>
                      {plan}
                    </span>
                  </div>
                </div>
              ))}

              {/* Create new card */}
              <button className="workspace-card workspace-card--new" onClick={() => setShowCreate(true)}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>+</div>
                <span>Workspace i ri</span>
              </button>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreate={addWorkspace} />
      )}
    </AppShell>
  );
}
