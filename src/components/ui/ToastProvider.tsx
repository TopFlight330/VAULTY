"use client";

import {
  createContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { ToastItem, type ToastVariant, type ToastData } from "./Toast";

export interface ToastContextValue {
  showToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    setMounted(true);
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = crypto.randomUUID();
      const toast: ToastData = { id, message, variant, duration };

      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > 5 ? next.slice(-5) : next;
      });

      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            style={{
              position: "fixed",
              bottom: "1.5rem",
              right: "1.5rem",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {toasts.map((toast) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onDismiss={dismissToast}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
