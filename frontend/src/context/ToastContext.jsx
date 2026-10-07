import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-[slideIn_0.3s_ease-out] ${
              type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{message}</p>
            <button onClick={() => removeToast(id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
