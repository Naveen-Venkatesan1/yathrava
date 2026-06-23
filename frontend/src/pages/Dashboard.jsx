import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Bell, Shield, ArrowRight, Train, Clock, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Fallback gradient hero background
const HERO_BG_URL = '/chennai_central.png';
const FALLBACK_HERO_STYLE = {
  background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [heroBgError, setHeroBgError] = useState(false);

  const features = [
    {
      title: t('feature1_title', 'Smart Ticket Assistant'),
      description: t('feature1_desc', 'Auto-fetch PNR, track live train status, and find your exact coach position.'),
      icon: Ticket,
      bg: '#3b82f6',
      link: '/smart-ticket',
    },
    {
      title: t('feature2_title', 'Station Navigation'),
      description: t('feature2_desc', 'Camera-based station recognition and platform guidance. Never get lost again.'),
      icon: Camera,
      bg: '#10b981',
      link: '/scanner',
    },
    {
      title: t('feature3_title', 'Missed Station Alert'),
      description: t('feature3_desc', 'Set destination alarms. We will wake you up before your station arrives.'),
      icon: Bell,
      bg: '#f97316',
      link: '/station-alert',
    },
    {
      title: t('feature4_title', 'Family Locator & SOS'),
      description: t('feature4_desc', 'Share live location with family and get instant help with one-touch SOS.'),
      icon: Shield,
      bg: '#f43f5e',
      link: '/family-locator',
    },
  ];

  const recentJourneys = [
    {
      pnr: '4532187690',
      train: '12163 – Chennai Egmore Exp',
      from: 'Chennai Central',
      to: 'Coimbatore Jn',
      date: 'Jun 14, 2026',
      status: 'Completed',
      statusType: 'success',
      coach: 'S4 · Seat 32',
    },
    {
      pnr: '8821045673',
      train: '22625 – Double Decker Exp',
      from: 'Chennai Central',
      to: 'Bangalore City',
      date: 'Jun 10, 2026',
      status: 'Confirmed',
      statusType: 'confirmed',
      coach: 'CC · Seat 14',
    },
  ];

  const stats = [
    { label: t('stat_journeys', 'Journeys Completed'), value: '12', icon: CheckCircle, color: '#10b981' },
    { label: t('stat_pnrs', 'Active PNRs'), value: '2', icon: Ticket, color: '#3b82f6' },
    { label: t('stat_alerts', 'Alerts Set'), value: '1', icon: Bell, color: '#f97316' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Hero Banner ── */}
      <div
        style={{
          position: 'relative',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,.35)',
          minHeight: '260px',
          ...(heroBgError ? FALLBACK_HERO_STYLE : {}),
        }}
      >
        {!heroBgError && (
          <img
            src={HERO_BG_URL}
            alt="Railway Station"
            onError={() => setHeroBgError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(12,74,110,0.92) 0%, rgba(3,105,161,0.80) 60%, rgba(2,132,199,0.60) 100%)',
          }}
        />

        <div style={{ position: 'relative', padding: '3rem 3.5rem' }}>
          <div style={{ maxWidth: '600px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '999px',
                padding: '0.35rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                letterSpacing: '0.05em',
              }}
            >
              <Train style={{ width: 14, height: 14 }} />
              {t('hero_subtitle', 'YATHRAVA · AI RAILWAY COMPANION')}
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                margin: '0 0 1rem',
                letterSpacing: '-0.02em',
              }}
            >
              {t('hero_title_1', 'Your Smart Journey')}<br />
              <span style={{ color: '#7dd3fc' }}>{t('hero_title_2', 'Starts Here')}</span>
            </h1>

            <p
              style={{
                fontSize: '1rem',
                opacity: 0.88,
                marginBottom: '1.75rem',
                lineHeight: 1.7,
                maxWidth: '480px',
              }}
            >
              {t('hero_desc', 'Yathrava assists elderly, children, and first-time travelers to safely navigate Indian Railways.')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to="/smart-ticket"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fff',
                  color: '#0c4a6e',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {t('hero_btn_ticket', 'Check My Ticket')} <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>
              <Link
                to="/scanner"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff',
                  padding: '0.7rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Camera style={{ width: 18, height: 18 }} /> {t('hero_btn_scan', 'Scan Station')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: '#fff',
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '0.75rem',
                  background: stat.color + '1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: 22, height: 22, color: stat.color }} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Features Grid ── */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
          {t('explore_features', 'Explore Features')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Link
                key={idx}
                to={feature.link}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: '1px solid #f1f5f9',
                    height: '100%',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '0.75rem',
                      background: feature.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      boxShadow: `0 4px 12px ${feature.bg}55`,
                    }}
                  >
                    <Icon style={{ width: 22, height: 22, color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent Journeys + SOS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', alignItems: 'start' }}>

        {/* Recent Journeys */}
        <div
          style={{
            background: '#fff',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{t('recent_journeys', 'Recent Journeys')}</h2>
            <Link
              to="/smart-ticket"
              style={{
                fontSize: '0.8rem',
                color: '#0369a1',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {t('add_pnr', 'Add PNR')} <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentJourneys.length > 0 ? recentJourneys.map((journey) => (
              <div
                key={journey.pnr}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.9rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '0.5rem',
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Train style={{ width: 20, height: 20, color: '#0369a1' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {journey.train}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                    {journey.from} → {journey.to}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock style={{ width: 11, height: 11 }} /> {journey.date}
                    </span>
                    <span>· {journey.coach}</span>
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      background: journey.statusType === 'success' ? '#dcfce7' : '#dbeafe',
                      color: journey.statusType === 'success' ? '#15803d' : '#1d4ed8',
                    }}
                  >
                    {journey.statusType === 'success'
                      ? <CheckCircle style={{ width: 11, height: 11 }} />
                      : <AlertCircle style={{ width: 11, height: 11 }} />
                    }
                    {journey.status}
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                {t('no_journeys', 'No recent journeys found. Add a PNR to track.')}
              </div>
            )}
          </div>
        </div>

        {/* Emergency SOS */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            borderRadius: '1rem',
            padding: '1.75rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #fecdd3',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <Shield style={{ width: 32, height: 32, color: '#dc2626' }} />
          </div>
          <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '1rem' }}>
            {t('sos_title', 'Emergency Help')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            {t('sos_desc', 'Need immediate assistance? Alert Railway Protection Force and share your location instantly.')}
          </p>
          <button
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '0.85rem',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220,38,38,0.4)',
              letterSpacing: '0.03em',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => alert(t('sos_alert', '🚨 SOS Alert sent! Railway helpline: 139'))}
          >
            {t('sos_btn', '🚨 Tap for SOS')}
          </button>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            {t('sos_helpline', 'Railway Helpline · 139')}
          </p>
        </div>

      </div>
    </div>
  );
}
