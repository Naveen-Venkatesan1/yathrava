import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, LogOut, ChevronDown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';

export default function Navigation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="p-2 sm:p-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center flex-wrap gap-2">
        {/* Left: Brand/Logo */}
        <div>
          <Link to="/" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
            <Train size={20} />
            <span>Yathrava</span>
          </Link>
        </div>
        {/* Right: Auth area & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <LanguageSelector />
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid #ddd', padding: '0.5rem', borderRadius: '20px', cursor: 'pointer' }}
              >
                <User size={18} />
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '120px' }}>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', width: '100%', padding: '0.5rem', color: '#e11d48', fontWeight: '500' }}
                  >
                    <LogOut size={16} />
                    {loggingOut ? t('logging_out', 'Logging out...') : t('logout', 'Logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5 sm:gap-3 text-sm sm:text-base">
              <Link to="/login" className="text-indigo-600 px-2 py-1 sm:px-4 sm:py-2">
                {t('nav_login', 'Login')}
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md whitespace-nowrap">
                {t('nav_signup', 'Sign Up')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
