import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workspacesAPI, boardsAPI } from '../../services/api';
import AppShell from '../../components/AppShell/AppShell';
import { useAuthStore } from '../../store';
import './WorkspacePage.css';

const BG_OPTIONS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#10b981', '#0ea5e9', '#1e293b'];

function CreateBoardModal({ workspaceId, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', background: '#6366f1', workspaceId });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await boardsAPI.create({ ...form, workspaceId });
      toast.success('Board u krijua!');
      onCreate(res.data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Board i ri</h2>
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Emri i Board-it</label>
            <input className="input" placeholder="p.sh. Sprint 1" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Ngjyra e sfondit</label>
            <div className="color-picker">
              {BG_OPTIONS.map(c => (
                <button key={c} type="button"
                  className={`color-dot ${form.background === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, background: c })} />
              ))}
            </div>
          </div>
          <div style={{ height: 60, borderRadius: 8, background: form.background, marginTop: 14 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Duke krijuar...' : 'Krijo Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ workspaceId, onClose }) {
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await workspacesAPI.invite(workspaceId, form);
      toast.success('Ftesa u dërgua!');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Fto Anëtar</h2>
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Email i anëtarit</label>
            <input className="input" type="email" placeholder="koleg@shembull.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group" style={{ marginTop: 14 }}>
            <label className="input-label">Roli</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="viewer">Shikues (Viewer)</option>
              <option value="member">Anëtar (Member)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Anulo</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Duke dërguar...' : 'Dërgo Ftesë'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    workspacesAPI.getOne(id)
      .then(res => setWorkspace(res.data))
      .catch(() => { toast.error('Workspace nuk u gjet.'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // const isOwner = workspace?.owner?._id === user?._id;
  // const userRole = workspace?.members?.find(m => m.user._id === user?._id)?.role;
  // const canManage = isOwner || userRole === 'admin';

  if (loading) return <AppShell><div className="loading-page" style={{ margin: 'auto' }}><div className="spinner" /></div></AppShell>;
  if (!workspace) return null;

  return (
    <AppShell>
      <div className="workspace-page">
        {/* Header */}
        <div className="workspace-header">
          <div className="workspace-header__left">
            <div className="workspace-header__icon" style={{ background: workspace.color + '22', color: workspace.color }}>
              {workspace.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="workspace-header__name">{workspace.name}</h1>
              {workspace.description && <p className="workspace-header__desc">{workspace.description}</p>}
            </div>
          </div>
          <div className="workspace-header__actions">
            <button className="btn btn-outline btn-sm" onClick={() => setShowInvite(true)}>+ Fto anëtar</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Board i ri</button>
          </div>
        </div>

        {/* Members */}
        <div className="workspace-members">
          <span className="workspace-members__label">Anëtarët:</span>
          {workspace.members?.map(m => (
            <div key={m.user._id} className="workspace-member" title={`${m.user.name} (${m.role})`}>
              {m.user.avatar
                ? <img src={m.user.avatar} className="avatar avatar-sm" alt={m.user.name} />
                : <div className="avatar avatar-sm">{m.user.name?.[0]}</div>
              }
            </div>
          ))}
        </div>

        {/* Boards */}
        {workspace.boards?.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>📋</div>
            <h3>Nuk keni board ende</h3>
            <p>Krijoni board-in e parë për të organizuar detyrat tuaja.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Krijo Board</button>
          </div>
        ) : (
          <>
            <h2 className="workspace-section-title">Boardet</h2>
            <div className="boards-grid">
              {workspace.boards.map(board => (
                <Link key={board._id} to={`/board/${board._id}`} className="board-card"
                  style={{ background: board.background }}>
                  <div className="board-card__overlay" />
                  <div className="board-card__content">
                    <h3 className="board-card__title">{board.title}</h3>
                    {board.isStarred && <span>⭐</span>}
                  </div>
                </Link>
              ))}
              <button className="board-card board-card--new" onClick={() => setShowCreate(true)}>
                <span style={{ fontSize: 24, opacity: 0.4 }}>+</span>
                <span>Board i ri</span>
              </button>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateBoardModal workspaceId={id} onClose={() => setShowCreate(false)}
          onCreate={(board) => setWorkspace(ws => ({ ...ws, boards: [...(ws.boards || []), board] }))} />
      )}
      {showInvite && <InviteModal workspaceId={id} onClose={() => setShowInvite(false)} />}
    </AppShell>
  );
}
