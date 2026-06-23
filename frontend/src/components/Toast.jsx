import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ── Toast UI Component Overlay ──────────────────────────────────────────
export function ToastContainer({ toasts, close }) {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map((t) => (
        <div 
          key={t.id} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
            background: t.type === 'success' ? '#def7ec' : '#fde8e8', 
            color: t.type === 'success' ? '#03543f' : '#9b1c1c',
            minWidth: '250px',
            animation: 'slideIn 0.2s ease-out'
          }}
        >
          {t.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: '500' }}>{t.message}</span>
          <button 
            onClick={() => close(t.id)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Custom Hook Logic ───────────────────────────────────────────────────
let _counter = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const close = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'success') => {
    const id = ++_counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatic timeout close trigger (4 seconds)
    setTimeout(() => {
      close(id);
    }, 4000);
  }, [close]);

  const toast = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
  };

  return { toasts, close, toast };
}
