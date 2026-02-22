"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  link?: { url: string; text: string };
}

interface ToastContextType {
  showToast: (type: Toast["type"], message: string, link?: Toast["link"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast["type"], message: string, link?: Toast["link"]) => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, type, message, link }]);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              p-4 rounded-lg shadow-lg border backdrop-blur-sm
              ${
                toast.type === "success"
                  ? "bg-green-900/90 border-green-500/50 text-green-100"
                  : toast.type === "error"
                  ? "bg-red-900/90 border-red-500/50 text-red-100"
                  : "bg-blue-900/90 border-blue-500/50 text-blue-100"
              }
              animate-in slide-in-from-right duration-300
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium whitespace-pre-wrap">{toast.message}</p>
                {toast.link && (
                  <a
                    href={toast.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline mt-2 inline-block hover:opacity-80"
                  >
                    {toast.link.text}
                  </a>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-white/60 hover:text-white transition"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="4" x2="4" y2="12" />
                  <line x1="4" y1="4" x2="12" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
