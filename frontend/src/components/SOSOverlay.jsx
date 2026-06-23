// src/components/SOSOverlay.jsx
import React, { useState, useEffect } from 'react';
import { useSafety } from '../context/SafetyContext';
import { Phone, ShieldAlert, MessageSquare, Volume2, X, MapPin, AlertCircle, Send } from 'lucide-react';

export default function SOSOverlay() {
  const { isSOSActive, cancelSOS, emergencyContacts, currentLocation, batteryLevel } = useSafety();
  const [countdown, setCountdown] = useState(5);
  const [statusText, setStatusText] = useState('Initializing SOS sequence...');
  const [sentAlerts, setSentAlerts] = useState([]);
  const [isCalling, setIsCalling] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);

  // Filter priority contacts to display
  const priorityContacts = emergencyContacts.filter(c => c.priority);

  // Countdown timer for automatic actions
  useEffect(() => {
    if (!isSOSActive) {
      setCountdown(5);
      setStatusText('Initializing SOS sequence...');
      setSentAlerts([]);
      setIsCalling(false);
      setActiveCallContact(null);
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 5) setStatusText('Broadcasting GPS Coordinates...');
        if (countdown === 3) setStatusText('Sending Emergency SMS messages...');
        if (countdown === 1) setStatusText('Establishing Emergency Call...');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setStatusText('SOS broadcasts active. Live tracking enabled.');
      
      // Simulate sending SMS alerts
      if (sentAlerts.length === 0) {
        const alerts = emergencyContacts.map(c => ({
          ...c,
          status: 'Sent SMS: "HELP! I am in danger. My live location: https://maps.google.com/?q=' + currentLocation.lat + ',' + currentLocation.lng + ' (Battery: ' + batteryLevel + '%)"'
        }));
        setSentAlerts(alerts);

        // Auto call priority contact
        if (priorityContacts.length > 0) {
          setIsCalling(true);
          setActiveCallContact(priorityContacts[0]);
        }
      }
    }
  }, [isSOSActive, countdown, emergencyContacts, currentLocation, batteryLevel]);

  if (!isSOSActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-red-950/95 text-white p-6 overflow-y-auto animate-fade-in backdrop-blur-md">
      
      {/* Background Pulsing Light */}
      <div className="absolute inset-0 bg-red-600/10 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />

      {/* Top Banner */}
      <div className="relative z-10 flex flex-col items-center text-center mt-6">
        <div className="w-20 h-20 bg-red-600 border-4 border-white rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50 mb-4">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-red-100">SOS ACTIVE</h1>
        <p className="text-red-300 font-medium mt-1">{statusText}</p>
      </div>

      {/* Main Content Dashboard */}
      <div className="relative z-10 my-6 max-w-md mx-auto w-full flex flex-col gap-5">
        
        {/* Countdown Action Banner */}
        {countdown > 0 ? (
          <div className="bg-red-900/60 border border-red-500/30 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-red-300 uppercase tracking-widest">Auto-Alert System Starts In</p>
            <div className="text-5xl font-black text-white my-2">{countdown}s</div>
            <p className="text-xs text-red-400">Click cancel below if you triggered this by mistake.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Call Simulator Card */}
            {isCalling && activeCallContact && (
              <div className="bg-red-800/80 border border-red-400/40 rounded-2xl p-4 flex flex-col items-center shadow-lg animate-bounce-subtle">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-pulse mb-2">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-bold text-red-200 uppercase tracking-wide">Calling Priority Contact</div>
                <div className="text-lg font-black mt-1">{activeCallContact.name}</div>
                <div className="text-sm text-green-300 font-semibold">{activeCallContact.phone}</div>
                <div className="mt-3 flex gap-2 w-full">
                  <button 
                    onClick={() => setIsCalling(false)} 
                    className="w-full bg-red-600/50 hover:bg-red-600 border border-red-500/50 text-white text-xs font-bold py-2 rounded-xl transition-all"
                  >
                    End Call Simulation
                  </button>
                  <a 
                    href={`tel:${activeCallContact.phone}`} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl text-center flex items-center justify-center gap-1 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call via Phone
                  </a>
                </div>
              </div>
            )}

            {/* GPS broadcast card */}
            <div className="bg-red-900/40 border border-red-600/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-extrabold text-red-300 uppercase tracking-wider">Broadcasting Location</div>
                <div className="text-sm font-semibold truncate">Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}</div>
                <div className="text-[10px] text-red-400 mt-0.5">Accurate to 5m · Auto-updating every 5s</div>
              </div>
            </div>

            {/* Activity Logs (Messages Sent) */}
            <div className="bg-red-950/80 border border-red-900 rounded-2xl p-4 max-h-[160px] overflow-y-auto">
              <div className="text-xs font-extrabold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Sent Emergency Broadcasts
              </div>
              <div className="flex flex-col gap-2">
                {sentAlerts.length === 0 ? (
                  <div className="text-xs text-red-400 italic">Formatting safety messages...</div>
                ) : (
                  sentAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-red-900/30 p-2 rounded-lg border border-red-800/40">
                      <div className="flex justify-between items-center text-[10px] font-bold text-red-300">
                        <span>To: {alert.name} ({alert.phone})</span>
                        <span className="text-green-400 font-extrabold">DELIVERED</span>
                      </div>
                      <p className="text-[11px] text-red-100 mt-1 leading-snug font-medium">{alert.status}</p>
                    </div>
                  ))
                )}
                {/* RPF Alert log */}
                <div className="bg-red-900/50 p-2 rounded-lg border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-yellow-300">RPF Dispatch System Alert</div>
                    <p className="text-[11px] text-red-100 mt-0.5 leading-snug">Nearest Station Command Room notified. Train coordinates & coach details relayed via Indian Railways safety network.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Cancel SOS Controls */}
      <div className="relative z-10 max-w-md mx-auto w-full mb-6 flex flex-col items-center">
        <button 
          onClick={cancelSOS}
          className="w-full py-4 px-6 bg-white hover:bg-red-100 text-red-900 font-black text-lg rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <X className="w-5 h-5 font-black" />
          DEACTIVATE EMERGENCY SOS
        </button>
        <p className="text-xs text-red-300 mt-3 font-semibold tracking-wider uppercase">Hold button or double-tap to cancel siren</p>
      </div>

      {/* Embedded CSS for animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}} />

    </div>
  );
}
