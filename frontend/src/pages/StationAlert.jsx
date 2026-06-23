// src/pages/StationAlert.jsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Volume2, ShieldAlert, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast';
import { AlertContext } from '../context/AlertContext';

export default function StationAlert() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    isActive,
    timeRemaining,
    currentAlert,
    isAlarmRinging,
    journey,
    toggleAlertSystem,
    acknowledgeAlarm,
    setTimeRemaining,
  } = useContext(AlertContext);
  const { toast } = useToast();

  // Ensure the alert page is displayed when an alarm is ringing
  useEffect(() => {
    if (isAlarmRinging) {
      // No additional action needed – UI reflects state via context
    }
  }, [isAlarmRinging]);

  const handleAcknowledge = () => {
    acknowledgeAlarm();
    // Return to previous page/dashboard without refresh
    navigate(-1);
  };

  const mins = Math.max(0, timeRemaining);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Bar */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={28} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.02em' }}>Missed Station Alert</h1>
      </div>

      <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        {/* Status Header */}
        <div style={{ background: isActive ? '#dcfce7' : '#f1f5f9', border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`, padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ background: isActive ? '#16a34a' : '#94a3b8', padding: '1.25rem', borderRadius: '50%', color: '#fff', display: 'flex', boxShadow: isActive ? '0 4px 12px rgba(22,163,74,0.4)' : 'none' }}>
            {isActive ? <Bell size={36} /> : <BellOff size={36} />}
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>
              {isActive ? "Protection Active" : "Alert System Off"}
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#475569', fontSize: '1.05rem', lineHeight: 1.4 }}>
              {isActive ? "We'll wake you up before your station." : "Turn on to protect against missing your stop."}
            </p>
          </div>
        </div>

        {/* Journey Details */}
        <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination</p>
              <h3 style={{ margin: '0.25rem 0', color: '#0f172a', fontSize: '2rem', fontWeight: 900, lineHeight: 1.1 }}>{journey.destinationStation}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ETA</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', color: '#ea580c' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{mins}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>mins</span>
              </div>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '2px dashed #e2e8f0', margin: '1.5rem 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Current Station</p>
              <p style={{ margin: '0.25rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>{journey.currentStation}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>Stations Left</p>
              <p style={{ margin: '0.25rem 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 700 }}>{journey.stationsLeft}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={toggleAlertSystem}
          style={{
            width: '100%',
            padding: '1.5rem',
            borderRadius: '1.25rem',
            background: isActive ? '#ef4444' : '#0284c7',
            color: '#fff',
            fontSize: '1.4rem',
            fontWeight: 800,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: isActive ? '0 10px 25px -5px rgba(239,68,68,0.4)' : '0 10px 25px -5px rgba(2,132,199,0.4)',
            transition: 'all 0.2s',
            marginTop: '1rem'
          }}>
          {isActive ? <>Stop Alert System</> : <><Moon size={28} /> Sleep Safely - Turn On</>}
        </button>

        {/* Demo Fast Forward Button */}
        {isActive && !isAlarmRinging && (
          <button
            onClick={() => setTimeRemaining(prev => {
              if (prev > 30) return 30;
              if (prev > 15) return 15;
              if (prev > 5) return 5;
              return 0;
            })}
            style={{
              padding: '1.25rem',
              background: '#f1f5f9',
              border: '2px dashed #cbd5e1',
              borderRadius: '1rem',
              color: '#475569',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '1rem'
            }}>
            [Demo] Skip to next alert ({timeRemaining > 30 ? '30m' : timeRemaining > 15 ? '15m' : timeRemaining > 5 ? '5m' : 'Arrived'})
          </button>
        )}
      </div>

      {/* Full Screen Alarm Overlay */}
      {isAlarmRinging && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: currentAlert === 'missed' ? '#ef4444' : '#f59e0b',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#fff',
          animation: 'pulseBg 1s infinite alternate'
        }}>
          <Volume2 size={100} style={{ marginBottom: '2rem', animation: 'shake 0.5s infinite' }} />
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{currentAlert === 'missed' ? "ARRIVED!" : "WAKE UP!"}</h1>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 3rem', opacity: 0.95 }}>
            {currentAlert === 'missed' ? "You have reached your destination." : `${currentAlert} minutes to ${journey.destinationStation}`}
          </p>
          <button
            onClick={handleAcknowledge}
            style={{
              background: '#fff',
              color: currentAlert === 'missed' ? '#ef4444' : '#f59e0b',
              border: 'none',
              padding: '1.75rem 3.5rem',
              borderRadius: '999px',
              fontSize: '1.75rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            I'm Awake
          </button>
          {currentAlert === 'missed' && (
            <button
              onClick={() => alert(t('sos_alert', '🚨 SOS Alert sent to family and RPF. Help is on the way.'))}
              style={{
                marginTop: '2.5rem',
                background: 'rgba(0,0,0,0.2)',
                border: '2px solid rgba(255,255,255,0.6)',
                color: '#fff',
                padding: '1.25rem 2.5rem',
                borderRadius: '999px',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <ShieldAlert size={28} /> Emergency SOS
            </button>
          )}
          <style>{`
            @keyframes pulseBg {from {background-color: ${currentAlert === 'missed' ? '#dc2626' : '#d97706'};} to {background-color: ${currentAlert === 'missed' ? '#ef4444' : '#f59e0b'};}}
            @keyframes shake {0% {transform: translateX(0) rotate(0deg);} 25% {transform: translateX(-15px) rotate(-5deg);} 50% {transform: translateX(15px) rotate(5deg);} 75% {transform: translateX(-15px) rotate(-5deg);} 100% {transform: translateX(0) rotate(0deg);}}
          `}</style>
        </div>
      )}
    </div>
  );
}
