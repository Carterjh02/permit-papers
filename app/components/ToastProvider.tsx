"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { X } from "lucide-react";

interface ToastOptions {
  duration?: number;
}

interface Toast {
  id: string;
  content: ReactNode;
  duration?: number;
}

interface ToastContextValue {
  showToast: (content: ReactNode, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (content: ReactNode, options?: ToastOptions) => {
      const id = crypto.randomUUID();
      const duration = options?.duration;

      setToasts((prev) => [...prev, { id, content, duration }]);

      if (duration && duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] space-y-4 w-full flex flex-col items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white shadow-xl rounded-lg border border-gray-200 w-[600px] animate-fadeIn relative"
          >
            <button
              onClick={() => dismissToast(toast.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <div className="p-4">{toast.content}</div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
