/**
 * Central API configuration for Yathrava.
 *
 * Priority resolution:
 *   1. VITE_API_URL environment variable (set in Vercel dashboard or .env)
 *   2. Local development auto-detect → localhost:5000/api
 *   3. Production hardcoded fallback → https://yathrava.onrender.com/api
 */

const ENV_API_URL = import.meta.env.VITE_API_URL;

// Detect if we are running locally in development
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Production backend URL — always current deployed Render service
const PRODUCTION_API_URL = 'https://yathrava.onrender.com/api';

// Resolve the base API URL
function resolveApiUrl() {
  // 1. Explicit env var (Vercel dashboard / .env file) — ignore placeholder values
  if (ENV_API_URL && !ENV_API_URL.includes('example.com') && !ENV_API_URL.includes('your-backend')) {
    return ENV_API_URL.replace(/\/$/, ''); // strip trailing slash
  }
  // 2. Local development fallback
  if (IS_LOCALHOST) {
    return 'http://localhost:5000/api';
  }
  // 3. Production hardcoded fallback — always works on Vercel even without env var
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = resolveApiUrl();

/**
 * Returns true when a real backend URL is configured.
 * Use this to show degraded-mode UI when the backend is unavailable.
 */
export const IS_BACKEND_CONFIGURED = API_BASE_URL !== null;

/**
 * Convenience endpoint builders
 */
export const API_ENDPOINTS = {
  health:     () => `${API_BASE_URL}/health`,
  chatIntent: () => `${API_BASE_URL}/chat/intent`,
  pnrStatus:  (pnr) => `${API_BASE_URL}/tickets/pnr/${pnr}`,
  visionScan: () => `${API_BASE_URL}/vision/scan`,
  register:   () => `${API_BASE_URL}/auth/register`,
  login:      () => `${API_BASE_URL}/auth/login`,
};
