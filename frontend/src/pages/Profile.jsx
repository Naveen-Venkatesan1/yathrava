// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LogOut, Loader2, AlertCircle,
  Globe, Mic, BellRing, Train, Phone, ChevronRight,
  User, Settings
} from 'lucide-react';
import AdvancedSettings from '../components/AdvancedSettings';

// Clickable settings card
function SettingCard({ icon: Icon, title, value, onClick, accent = 'text-indigo-500' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-150 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <div className="flex items-center gap-3">
        <span className={`p-2 rounded-lg bg-indigo-50 dark:bg-gray-700 ${accent} group-hover:bg-indigo-100 dark:group-hover:bg-gray-600 transition-colors`}>
          <Icon size={18} />
        </span>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</p>
          {value !== undefined && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{value}</p>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
}

export default function ProfilePage() {
  const { user, authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedSection, setAdvancedSection] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }
    if (authLoading) return;

    async function fetchProfile() {
      try {
        setProfileData({
          phone: user?.phoneNumber || '',
          language: 'English',
          voiceAssistant: true,
          missedStationAlert: true,
          notifications: true,
          emergencyContacts: [],
          railwayPrefs: {
            seatClass: 'Second',
            prefersWindow: true,
          },
          appVersion: '1.0.0',
        });
      } catch (e) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [authLoading, user]);

  // Open advanced modal scrolled to a specific section
  const openSection = (sectionId) => {
    setAdvancedSection(sectionId);
    setShowAdvanced(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center text-red-600">
          <AlertCircle className="mr-2" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full py-2 bg-indigo-600 text-white rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="mb-4 text-gray-700 dark:text-gray-200">You are not logged in.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Login
        </button>
      </div>
    );
  }

  const pd = profileData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile</h1>
        </div>

        {/* Avatar card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 flex items-center gap-4 mb-6 text-white">
          <img
            src={
              user.photoURL ||
              'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(user.displayName || 'User') +
                '&background=ffffff&color=6366f1'
            }
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white/40"
          />
          <div>
            <p className="text-xl font-semibold">{user.displayName || 'Unnamed User'}</p>
            <p className="text-sm text-indigo-100">{user.email}</p>
            {pd.phone && <p className="text-sm text-indigo-100 mt-0.5">{pd.phone}</p>}
          </div>
        </div>

        {/* Settings cards */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Preferences</p>

          <SettingCard
            icon={Globe}
            title="Preferred Language"
            value={pd.language || 'Not set'}
            onClick={() => openSection('travel')}
            accent="text-blue-500"
          />

          <SettingCard
            icon={Mic}
            title="Voice Assistant"
            value={pd.voiceAssistant ? 'Enabled' : 'Disabled'}
            onClick={() => openSection('voice')}
            accent="text-purple-500"
          />

          <SettingCard
            icon={BellRing}
            title="Missed Station Alerts"
            value={pd.missedStationAlert ? 'Enabled' : 'Disabled'}
            onClick={() => openSection('notifications')}
            accent="text-yellow-500"
          />

          <SettingCard
            icon={BellRing}
            title="Notifications"
            value={pd.notifications ? 'All enabled' : 'Disabled'}
            onClick={() => openSection('notifications')}
            accent="text-orange-500"
          />

          <SettingCard
            icon={Phone}
            title="Emergency Contacts"
            value={
              pd.emergencyContacts && pd.emergencyContacts.length > 0
                ? `${pd.emergencyContacts.length} contact(s)`
                : 'No contacts added'
            }
            onClick={() => openSection('security')}
            accent="text-red-500"
          />

          <SettingCard
            icon={Train}
            title="Railway Preferences"
            value={`Seat: ${pd.railwayPrefs?.seatClass || 'N/A'} · Window: ${pd.railwayPrefs?.prefersWindow ? 'Yes' : 'No'}`}
            onClick={() => openSection('travel')}
            accent="text-green-500"
          />
        </div>

        {/* App info */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Account</p>

          <SettingCard
            icon={User}
            title="Account Settings"
            value="Edit name, email, password"
            onClick={() => openSection('account')}
            accent="text-indigo-500"
          />

          <SettingCard
            icon={Settings}
            title="Advanced Settings"
            value="App, security, insights & more"
            onClick={() => openSection(null)}
            accent="text-gray-500"
          />

          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">App Version</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{pd.appVersion}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Advanced Settings Modal */}
      <AdvancedSettings
        open={showAdvanced}
        initialSection={advancedSection}
        onClose={() => { setShowAdvanced(false); setAdvancedSection(null); }}
      />
    </div>
  );
}
