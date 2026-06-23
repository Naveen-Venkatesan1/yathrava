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

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 w-full max-w-[600px] mx-auto">
        {/* Status Header */}
        <div className={`p-4 md:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm border ${isActive ? 'bg-green-100 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
          <div className={`p-4 rounded-full text-white shadow-md flex-shrink-0 ${isActive ? 'bg-green-600 shadow-green-600/40' : 'bg-slate-400'}`}>
            {isActive ? <Bell size={36} /> : <BellOff size={36} />}
          </div>
          <div>
            <h2 className="m-0 text-slate-900 text-xl md:text-2xl font-extrabold">
              {isActive ? "Protection Active" : "Alert System Off"}
            </h2>
            <p className="m-0 mt-1 text-slate-600 text-sm md:text-base leading-snug">
              {isActive ? "We'll wake you up before your station." : "Turn on to protect against missing your stop."}
            </p>
          </div>
        </div>

        {/* Journey Details */}
        <div className="bg-white rounded-2xl p-5 md:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
            <div>
              <p className="m-0 text-slate-500 text-xs md:text-sm font-bold uppercase tracking-wider">Destination</p>
              <h3 className="m-0 mt-1 text-slate-900 text-2xl md:text-3xl font-black leading-tight">{journey.destinationStation}</h3>
            </div>
            <div className="text-left sm:text-right">
              <p className="m-0 text-slate-500 text-xs md:text-sm font-bold uppercase tracking-wider">ETA</p>
              <div className="flex items-baseline gap-1 text-orange-600">
                <span className="text-4xl md:text-5xl font-extrabold leading-none">{mins}</span>
                <span className="text-lg md:text-xl font-bold">mins</span>
              </div>
            </div>
          </div>
          <hr className="border-none border-t-2 border-dashed border-slate-200 my-5 md:my-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="m-0 text-slate-500 text-sm font-semibold">Current Station</p>
              <p className="m-0 mt-1 text-slate-900 text-lg md:text-xl font-bold">{journey.currentStation}</p>
            </div>
            <div>
              <p className="m-0 text-slate-500 text-sm font-semibold">Stations Left</p>
              <p className="m-0 mt-1 text-slate-900 text-lg md:text-xl font-bold">{journey.stationsLeft}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={toggleAlertSystem}
          className={`w-full p-4 md:p-6 rounded-2xl text-white text-lg md:text-2xl font-extrabold border-none flex items-center justify-center gap-2 md:gap-4 cursor-pointer transition-all mt-2 md:mt-4 shadow-lg ${isActive ? 'bg-red-500 shadow-red-500/40' : 'bg-sky-600 shadow-sky-600/40'}`}
        >
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
          <h1 className="text-4xl md:text-6xl font-black m-0 mb-4 leading-tight drop-shadow-md">{currentAlert === 'missed' ? "ARRIVED!" : "WAKE UP!"}</h1>
          <p className="text-xl md:text-3xl font-bold m-0 mb-10 opacity-95">
            {currentAlert === 'missed' ? "You have reached your destination." : `${currentAlert} minutes to ${journey.destinationStation}`}
          </p>
          <button
            onClick={handleAcknowledge}
            className={`bg-white border-none py-4 px-8 md:py-6 md:px-12 rounded-full text-2xl md:text-3xl font-black cursor-pointer shadow-2xl transition-transform active:scale-95 ${currentAlert === 'missed' ? 'text-red-500' : 'text-amber-500'}`}
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
