import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { stripeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import './PricingPage.css';

const PLANS = [
  {
    id: 'free', name: 'Free', price: '0€', period: 'gjithmonë',
    desc: 'Perfekt për individë dhe projekte të vogla.',
    features: ['1 Workspace', '3 Board', '5 Anëtarë', 'Kanban Board', 'Email support'],
    cta: 'Filloni Falas', highlight: false,
  },
  {
    id: 'pro', name: 'Pro', price: '9€', period: 'muaj',
    desc: 'Për ekipe të vogla dhe profesionistë.',
    features: ['3 Workspaces', 'Board pa limit', '15 Anëtarë/workspace', 'Real-time updates', 'Priority support'],
    cta: 'Merrni Pro', highlight: true,
  },
  {
    id: 'team', name: 'Team', price: '29€', period: 'muaj',
    desc: 'Për organizata dhe ekipe të mëdha.',
    features: ['Workspace pa limit', 'Board pa limit', 'Anëtarë pa limit', 'Analytics', 'Custom integrations', 'Dedicated support'],
    cta: 'Merrni Team', highlight: false,
  },
];

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(null);
  const currentPlan = user?.subscription?.plan || 'free';

  const navigate = useNavigate();
  const handleUpgrade = async (planId) => {
    if (!isAuthenticated) { navigate('/register'); return; }
    if (planId === 'free') return;
    setLoading(planId);
    try {
      const res = await stripeAPI.createCheckout(planId);
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = res.data.url;
    } catch (err) { toast.error(err.response?.data?.message || 'Gabim.'); }
    finally { setLoading(null); }
  };

  return (
    <div className="pricing-page">
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <Link to="/" className="landing-nav__logo">⚡ TaskFlow</Link>
          <div style={{ flex: 1 }} />
          {isAuthenticated
            ? <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            : <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/login" className="btn btn-ghost btn-sm">Hyr</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Regjistrohu</Link>
              </div>
          }
        </div>
      </nav>

      <div className="pricing-container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="section-label">Çmimet</p>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, letterSpacing: '-0.5px', margin: '12px 0' }}>
            Zgjidhni planin tuaj
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 17 }}>
            Pa kontrata. Anuloni kur të dëshironi.
          </p>
        </div>

        <div className="pricing-grid">
          {PLANS.map(plan => (
            <div key={plan.id} className={`pricing-card ${plan.highlight ? 'pricing-card--featured' : ''}`}>
              {plan.highlight && <div className="pricing-featured-badge">Më i Popullarizuar</div>}
              <div className="pricing-card__name">{plan.name}</div>
              <div className="pricing-card__price">
                {plan.price} <span>/{plan.period}</span>
              </div>
              <p className="pricing-card__desc">{plan.desc}</p>
              <hr className="divider" />
              <ul className="pricing-features">
                {plan.features.map(f => <li key={f}>✅ {f}</li>)}
              </ul>
              <button
                className={`btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}`}
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id || (isAuthenticated && currentPlan === plan.id)}
              >
                {loading === plan.id ? '...'
                  : isAuthenticated && currentPlan === plan.id ? '✓ Plani aktual'
                  : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-faq">
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>Pyetje të Shpeshta</h2>
          {[
            { q: 'A mund të anuloj kur të dua?', a: 'Po, mund të anuloni abonamin tuaj në çdo kohë pa penalti.' },
            { q: 'A ka periudhë prove?', a: 'Plani Free është falas përgjithmonë. Planet me pagesë ofrojnë 14 ditë prove.' },
            { q: 'Çfarë metodash pagese pranoni?', a: 'Pranojmë të gjitha kartat kreditore/debitore përmes Stripe.' },
          ].map(({ q, a }) => (
            <div key={q} className="pricing-faq-item">
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
