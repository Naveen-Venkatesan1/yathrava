// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate fetching additional profile data (e.g., preferences) from Firestore
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      // Not logged in – show login prompt after a short delay
      setLoading(false);
      return;
    }
    async function fetchProfile() {
      try {
        // In a real app replace this with Firestore call
        // For now we just use the user object as placeholder
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
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
          className="mt-4 w-full py-2 bg-primary text-white rounded"
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
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Login
        </button>
      </div>
    );
  }

  const pd = profileData || {};

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-2 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Profile</h1>
      </div>

      {/* Avatar and basic info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center space-x-4 mb-6">
        <img
          src={user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User')}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{user.displayName || 'Unnamed User'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Detail cards */}
      <div className="space-y-4">
        {/* Phone */}
        {pd.phone && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Phone</h2>
            <p className="text-gray-600 dark:text-gray-400">{pd.phone}</p>
          </div>
        )}
        {/* Preferred Language */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Preferred Language</h2>
          <p className="text-gray-600 dark:text-gray-400">{pd.language}</p>
        </div>
        {/* Voice Assistant */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Voice Assistant</h2>
          <p className="text-gray-600 dark:text-gray-400">{pd.voiceAssistant ? 'Enabled' : 'Disabled'}</p>
        </div>
        {/* Missed Station Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Missed Station Alerts</h2>
          <p className="text-gray-600 dark:text-gray-400">{pd.missedStationAlert ? 'Enabled' : 'Disabled'}</p>
        </div>
        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">{pd.notifications ? 'Enabled' : 'Disabled'}</p>
        </div>
        {/* Emergency Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Emergency Contacts</h2>
          {pd.emergencyContacts && pd.emergencyContacts.length > 0 ? (
            <ul className="list-disc list-inside">
              {pd.emergencyContacts.map((c, i) => (
                <li key={i}>{c.name} - {c.phone}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No contacts added.</p>
          )}
        </div>
        {/* Railway Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h2 className="font-medium text-gray-800 dark:text-gray-200">Railway Preferences</h2>
          <p className="text-gray-600 dark:text-gray-400">Seat Class: {pd.railwayPrefs?.seatClass || 'N/A'}</p>
          <p className="text-gray-600 dark:text-gray-400">Window Seat: {pd.railwayPrefs?.prefersWindow ? 'Yes' : 'No'}</p>
        </div>
        {/* App Version */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center justify-between">
          <span className="text-gray-800 dark:text-gray-200">App Version</span>
          <span className="font-medium text-gray-600 dark:text-gray-400">{pd.appVersion}</span>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          <LogOut className="mr-2" size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
