// src/components/AdvancedSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X, User, Mic, Bell, Train, Shield, Sun, Info,
  Upload, Download, ChevronDown, Phone, Globe,
  Moon, Smartphone, BarChart3, CloudUpload, LogOut,
  AlertTriangle
} from 'lucide-react';

/* ─── Reusable Toggle ───────────────────────────────────────────────── */
const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-checked:bg-indigo-500 rounded-full transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5" />
    </label>
  </div>
);

/* ─── Accordion Section ──────────────────────────────────────────────── */
const Section = ({ id, title, icon: Icon, children, isOpen, onToggle, accent = 'text-indigo-500' }) => {
  const contentRef = useRef(null);

  return (
    <div
      id={`section-${id}`}
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-3"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 active:bg-gray-200 dark:active:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className={`p-1.5 rounded-lg bg-white dark:bg-gray-700 ${accent}`}>
            <Icon size={18} />
          </span>
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm md:text-base">{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Animated expand */}
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 1000}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="p-4 bg-white dark:bg-gray-800 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── Styled input ───────────────────────────────────────────────────── */
const Input = (props) => (
  <input
    {...props}
    className={`mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${props.className ?? ''}`}
  />
);

/* ─── Styled select ──────────────────────────────────────────────────── */
const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>}
    <select
      {...props}
      className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
    >
      {children}
    </select>
  </div>
);

/* ─── Primary button ─────────────────────────────────────────────────── */
const Btn = ({ children, className = '', variant = 'primary', ...props }) => {
  const base = 'w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1';
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-400',
    secondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400',
  };
  return (
    <button type="button" {...props} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function AdvancedSettings({ open, initialSection, onClose }) {
  const [openSection, setOpenSection] = useState(initialSection);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);

  const [account, setAccount] = useState({ name: '', email: '' });
  const [voice, setVoice] = useState({ language: 'English', speed: 1, volume: 1, autoSpeak: false, wakeWord: false });
  const [notifications, setNotifications] = useState({ push: false, stationArrival: false, delay: false, platformChange: false, emergency: false });
  const [travelPrefs, setTravelPrefs] = useState({ favoriteStations: '', language: 'English', defaultBoarding: '', accessibility: false, reminder: false });
  const [security, setSecurity] = useState({ emergencyContacts: '', sosTest: false });
  const [appPrefs, setAppPrefs] = useState({ theme: 'system', fontSize: 'md', animations: true });
  const [insights] = useState({ trips: 0, tickets: 0, alerts: 0 });

  // When modal opens or initialSection changes → expand that section & scroll to it
  useEffect(() => {
    if (open && initialSection) {
      setOpenSection(initialSection);
      // Scroll after render
      setTimeout(() => {
        const el = document.getElementById(`section-${initialSection}`);
        if (el && scrollRef.current) {
          scrollRef.current.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
        }
      }, 50);
    }
    if (!open) setOpenSection(null);
  }, [open, initialSection]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate save
    setSaving(false);
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Advanced Settings"
    >
      {/* Panel — bottom sheet on mobile, centered modal on desktop */}
      <div
        className="
          relative bg-white dark:bg-gray-900
          w-full md:max-w-2xl
          rounded-t-3xl md:rounded-2xl
          shadow-2xl
          max-h-[92dvh] md:max-h-[90dvh]
          flex flex-col
          animate-slide-up md:animate-fade-scale
          overflow-hidden
        "
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Advanced Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="Close"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">

          {/* ── Account Settings ── */}
          <Section id="account" title="Account Settings" icon={User} accent="text-indigo-500" isOpen={openSection === 'account'} onToggle={() => toggle('account')}>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
              <Input type="text" placeholder="Your name" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <Input type="email" placeholder="you@example.com" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="secondary">Change Password</Btn>
              <Btn variant="secondary">Upload Picture</Btn>
            </div>
            <Btn variant="danger">Delete Account</Btn>
          </Section>

          {/* ── Voice Assistant ── */}
          <Section id="voice" title="Voice Assistant" icon={Mic} accent="text-purple-500" isOpen={openSection === 'voice'} onToggle={() => toggle('voice')}>
            <Select label="Voice Language" value={voice.language} onChange={(e) => setVoice({ ...voice, language: e.target.value })}>
              <option>English</option>
              <option>Tamil</option>
              <option>Tanglish</option>
            </Select>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Speed: {voice.speed}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={voice.speed} onChange={(e) => setVoice({ ...voice, speed: parseFloat(e.target.value) })} className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Volume: {Math.round(voice.volume * 100)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={voice.volume} onChange={(e) => setVoice({ ...voice, volume: parseFloat(e.target.value) })} className="w-full accent-indigo-500" />
            </div>
            <Toggle label="Auto Speak Responses" checked={voice.autoSpeak} onChange={(val) => setVoice({ ...voice, autoSpeak: val })} />
            <Toggle label="Wake Word" checked={voice.wakeWord} onChange={(val) => setVoice({ ...voice, wakeWord: val })} />
          </Section>

          {/* ── Notifications ── */}
          <Section id="notifications" title="Notifications" icon={Bell} accent="text-yellow-500" isOpen={openSection === 'notifications'} onToggle={() => toggle('notifications')}>
            <Toggle label="Push Notifications" checked={notifications.push} onChange={(val) => setNotifications({ ...notifications, push: val })} />
            <Toggle label="Station Arrival Alerts" checked={notifications.stationArrival} onChange={(val) => setNotifications({ ...notifications, stationArrival: val })} />
            <Toggle label="Delay Alerts" checked={notifications.delay} onChange={(val) => setNotifications({ ...notifications, delay: val })} />
            <Toggle label="Platform Change Alerts" checked={notifications.platformChange} onChange={(val) => setNotifications({ ...notifications, platformChange: val })} />
            <Toggle label="Emergency Alerts" checked={notifications.emergency} onChange={(val) => setNotifications({ ...notifications, emergency: val })} />
          </Section>

          {/* ── Travel Preferences ── */}
          <Section id="travel" title="Travel Preferences" icon={Train} accent="text-green-500" isOpen={openSection === 'travel'} onToggle={() => toggle('travel')}>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Favorite Stations (comma separated)</label>
              <Input type="text" placeholder="CSTM, LTT, Dadar" value={travelPrefs.favoriteStations} onChange={(e) => setTravelPrefs({ ...travelPrefs, favoriteStations: e.target.value })} />
            </div>
            <Select label="Preferred Language" value={travelPrefs.language} onChange={(e) => setTravelPrefs({ ...travelPrefs, language: e.target.value })}>
              <option>English</option>
              <option>Tamil</option>
              <option>Tanglish</option>
            </Select>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Default Boarding Station</label>
              <Input type="text" placeholder="Station name" value={travelPrefs.defaultBoarding} onChange={(e) => setTravelPrefs({ ...travelPrefs, defaultBoarding: e.target.value })} />
            </div>
            <Toggle label="Accessibility Options" checked={travelPrefs.accessibility} onChange={(val) => setTravelPrefs({ ...travelPrefs, accessibility: val })} />
            <Toggle label="Journey Reminder" checked={travelPrefs.reminder} onChange={(val) => setTravelPrefs({ ...travelPrefs, reminder: val })} />
          </Section>

          {/* ── Safety & Security ── */}
          <Section id="security" title="Safety & Security" icon={Shield} accent="text-red-500" isOpen={openSection === 'security'} onToggle={() => toggle('security')}>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Emergency Contacts (name:phone, one per line)</label>
              <textarea
                rows={3}
                placeholder="John Doe:9876543210"
                value={security.emergencyContacts}
                onChange={(e) => setSecurity({ ...security, emergencyContacts: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
              />
            </div>
            <Toggle label="SOS Test Mode" checked={security.sosTest} onChange={(val) => setSecurity({ ...security, sosTest: val })} />
            <div className="grid grid-cols-1 gap-2">
              <Btn variant="secondary">View Login Activity</Btn>
              <Btn variant="secondary">Device Management</Btn>
              <Btn variant="secondary">Privacy Settings</Btn>
            </div>
          </Section>

          {/* ── App Preferences ── */}
          <Section id="appPrefs" title="App Preferences" icon={Sun} accent="text-orange-500" isOpen={openSection === 'appPrefs'} onToggle={() => toggle('appPrefs')}>
            <Select label="Theme" value={appPrefs.theme} onChange={(e) => setAppPrefs({ ...appPrefs, theme: e.target.value })}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
            <Select label="Font Size" value={appPrefs.fontSize} onChange={(e) => setAppPrefs({ ...appPrefs, fontSize: e.target.value })}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
            <Toggle label="Enable Animations" checked={appPrefs.animations} onChange={(val) => setAppPrefs({ ...appPrefs, animations: val })} />
          </Section>

          {/* ── Travel Insights ── */}
          <Section id="insights" title="Travel Insights" icon={BarChart3} accent="text-cyan-500" isOpen={openSection === 'insights'} onToggle={() => toggle('insights')}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Trips', value: insights.trips },
                { label: 'Saved Tickets', value: insights.tickets },
                { label: 'Alerts Received', value: insights.alerts },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-500">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Backup & Sync ── */}
          <Section id="backup" title="Backup & Sync" icon={CloudUpload} accent="text-teal-500" isOpen={openSection === 'backup'} onToggle={() => toggle('backup')}>
            <Btn variant="primary">Export Profile Data</Btn>
            <Btn variant="secondary">Import Settings</Btn>
            <Btn variant="secondary">Sync Now</Btn>
            <p className="text-xs text-gray-400 text-center">Cloud Backup: Up to date</p>
          </Section>

          {/* ── About ── */}
          <Section id="about" title="About" icon={Info} accent="text-gray-400" isOpen={openSection === 'about'} onToggle={() => toggle('about')}>
            <ul className="text-sm text-gray-700 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700">
              {['App Version: 1.0.0', 'Terms & Conditions', 'Privacy Policy', 'Contact Support', 'Rate App'].map((item) => (
                <li key={item} className="py-2.5 cursor-pointer hover:text-indigo-500 transition-colors">{item}</li>
              ))}
            </ul>
          </Section>

        </div>

        {/* Footer save button */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 768px) {
          @keyframes slideUp {
            from { transform: scale(0.95); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
