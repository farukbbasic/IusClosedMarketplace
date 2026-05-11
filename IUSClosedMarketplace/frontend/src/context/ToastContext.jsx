import { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success'
            ? <Icon name="checkCircle" size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
            : <Icon name="alertTriangle" size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
          }
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
