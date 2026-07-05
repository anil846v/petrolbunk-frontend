import { createContext, useContext, useState, useCallback, memo } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle  size={18} className="text-success flex-shrink-0" />,
  error:   <AlertCircle  size={18} className="text-danger  flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-warning flex-shrink-0" />,
};

// Wrap your app with this to enable toasts anywhere
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-white border border-neutral-border rounded-lg shadow-lg px-4 py-3 pointer-events-auto animate-slide-in"
          >
            {icons[t.type]}
            <span className="text-sm text-neutral-text flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-neutral-muted hover:text-neutral-text flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Use in any component: const { toast } = useToast();
// toast('Saved!', 'success') | toast('Failed', 'error') | toast('Check this', 'warning')
export const useToast = () => useContext(ToastContext);
