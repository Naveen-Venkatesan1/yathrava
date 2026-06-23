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
    <nav style={{ padding: '1rem', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left: Brand/Logo */}
        <div>
          <Link to="/" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#333' }}>
            <Train size={20} />
            <span>Yathrava</span>
          </Link>
        </div>
        {/* Right: Auth area & Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#4f46e5', padding: '0.5rem 1rem' }}>
                {t('nav_login', 'Login')}
              </Link>
              <Link to="/register" style={{ textDecoration: 'none', background: '#4f46e5', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                {t('nav_signup', 'Sign Up')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
