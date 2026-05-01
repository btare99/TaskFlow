import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  { icon: '⚡', title: 'Kanban Board', desc: 'Organizo detyrat me drag & drop si Trello. Shto kolona dhe karta me 1 klik.' },
  { icon: '👥', title: 'Multi-user Workspace', desc: 'Fto anëtarët e ekipit dhe bashkëpunoni në kohë reale.' },
  { icon: '🔒', title: 'Role-based Access', desc: 'Kontrolo kush mund të shikojë, editojë ose administrojë.' },
  { icon: '💳', title: 'Stripe Subscriptions', desc: 'Free, Pro dhe Team — zgjidhni planin që i përshtatet ekipit tuaj.' },
  { icon: '🔔', title: 'Real-time Updates', desc: 'Ndryshimet shfaqen menjëherë për të gjithë anëtarët e boardit.' },
  { icon: '📧', title: 'Email Invites', desc: 'Fto kolegë direkt me email me një klik.' },
];

const TESTIMONIALS = [
  { name: 'Arben Krasniqi', role: 'Product Manager', text: 'TaskFlow e ka ndryshuar mënyrën si punon ekipi im. I thjeshtë por i fuqishëm.', avatar: 'AK' },
  { name: 'Mirela Hoxha', role: 'Designer Lead', text: 'Dizajni premium dhe funksionaliteti i shkëlqyer. E rekomandoj për çdo startup.', avatar: 'MH' },
  { name: 'Gentian Basha', role: 'CTO', text: 'API-ja e qëndrueshme dhe role-based access na ka ndihmuar shumë në siguri.', avatar: 'GB' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="landing-nav__logo">
            <span className="logo-icon">⚡</span> TaskFlow
          </Link>
          <div className="landing-nav__links">
            <Link to="/pricing">Çmimet</Link>
          </div>
          <div className="landing-nav__actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Hyr</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Filloni Falas</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-glow hero-glow--1" />
        <div className="hero-glow hero-glow--2" />
        <div className="landing-container">
          <div className="hero-badge">🚀 Versioni 1.0 — Tani disponibël</div>
          <h1 className="hero-title">
            Menaxhoni projektet tuaja <span className="hero-accent">si profesionistë</span>
          </h1>
          <p className="hero-desc">
            TaskFlow kombinon fuqinë e Trello me thjeshtësinë e Notion. Kanban boards, multi-user workspaces, real-time updates dhe Stripe subscriptions — gjithçka në një vend.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Filloni Falas — 0€/muaj</Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">Shikoni Çmimet</Link>
          </div>
          <p className="hero-note">Nuk kërkohet karta e kreditit. Plan falas gjithmonë.</p>
        </div>

        {/* MOCK BOARD PREVIEW */}
        <div className="landing-container">
          <div className="board-preview">
            <div className="board-preview__bar">
              <span /><span /><span />
              <span className="board-preview__title">Projekti Alpha — Sprint 3</span>
            </div>
            <div className="board-preview__cols">
              {[
                { col: 'Të bëra', cards: ['Dizajno UI mockups', 'Shkruaj PRD'], color: '#6366f1' },
                { col: 'Në progres', cards: ['Integro API-n', 'Krijoni endpoint auth'], color: '#f59e0b' },
                { col: 'Rishikim', cards: ['Code review PR #42'], color: '#8b5cf6' },
                { col: 'Gati', cards: ['Deploy frontend', 'Teste integrimi'], color: '#10b981' },
              ].map(({ col, cards, color }) => (
                <div key={col} className="board-preview__col">
                  <div className="board-preview__col-header" style={{ color }}>
                    <span className="board-preview__dot" style={{ background: color }} /> {col}
                  </div>
                  {cards.map(c => (
                    <div key={c} className="board-preview__card">{c}</div>
                  ))}
                  <button className="board-preview__add">+ Shto kartë</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="landing-container">
          <p className="section-label">Funksionalitete</p>
          <h2 className="section-title">Gjithçka që ju nevojitet</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="landing-container">
          <p className="section-label">Vlerësimet</p>
          <h2 className="section-title">Çfarë thonë klientët tanë</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="avatar avatar-sm" style={{ background: 'var(--indigo-light)', color: 'var(--indigo)' }}>{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-box">
            <div className="cta-glow" />
            <h2>Gati për të filluar?</h2>
            <p>Bashkohuni me mijëra ekipe që tashmë e përdorin TaskFlow.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Krijoni llogarinë falas</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container">
          <span className="landing-nav__logo"><span className="logo-icon">⚡</span> TaskFlow</span>
          <p className="landing-footer__copy">© 2025 TaskFlow. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </footer>
    </div>
  );
}
