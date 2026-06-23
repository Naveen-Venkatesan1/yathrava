import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, Mail, Lock } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/* ── Google logo SVG ───────────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1,0,0,1,27.009001,-39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
    </g>
  </svg>
);

/* ── Save/update Firestore user doc ────────────────────────────────── */
async function saveUserToFirestore(firebaseUser) {
  try {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
    }
  } catch (error) {
    console.warn("Firestore save failed, proceeding with auth", error);
  }
}

/* ── Toast (inline lightweight) ────────────────────────────────────── */
function InlineToast({ msg, type, onClose }) {
  if (!msg) return null;
  const ok = type === 'success';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.7rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem',
      background: ok ? '#f0fdf4' : '#fff1f2',
      border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      color: ok ? '#166534' : '#991b1b',
      fontSize: '0.88rem', fontWeight: 600,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const navigate = useNavigate();

  const showToast = (msg, type = 'error') => setToast({ msg, type });
  const clearToast = () => setToast({ msg: '', type: '' });

  /* ── Google Sign-In ─────────────────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearToast();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
      showToast(`Welcome, ${result.user.displayName || 'User'}! 🎉`, 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        showToast('Popup was blocked by browser. Please allow popups for this site.');
      } else {
        showToast(`Google sign-in failed: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Email / Password Sign-In ───────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearToast();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
      showToast('Signed in successfully! 🎉', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showToast('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        showToast('Too many attempts. Please wait a moment and try again.');
      } else {
        showToast(`Sign-in failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 4rem)',
      background: 'url(/auth_bg.png) center/cover no-repeat',
    }}>
      {/* Dark overlay to ensure form stands out */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-10 w-full max-w-[28rem] mx-4 z-10">

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ background: '#1da1f2', width: 56, height: 56, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Train style={{ width: 28, height: 28, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Welcome Back</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>Log in to your Yathrava account</p>
        </div>

        {/* Toast */}
        <InlineToast msg={toast.msg} type={toast.type} onClose={clearToast} />

        {/* Email/Password Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="email" required placeholder="Enter your email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.85rem', paddingBottom: '0.85rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#1da1f2'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="password" required placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.85rem', paddingBottom: '0.85rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: '#fff', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#1da1f2'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1',
              background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: '#334155',
              transition: 'all 0.15s',
              opacity: googleLoading ? 0.7 : 1, marginTop: '0.5rem'
            }}
          >
            <GoogleLogo />
            {googleLoading ? 'Opening Google...' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              width: '100%', padding: '0.95rem', borderRadius: '0.75rem', border: 'none',
              background: '#1da1f2',
              color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              opacity: loading ? 0.75 : 1, transition: 'opacity 0.15s, transform 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
