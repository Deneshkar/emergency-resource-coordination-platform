import { createContext, useContext, useState } from "react";

const NotificationContext = createContext(null);

let _idCounter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function addToast(message, type = "info", duration = 5000) {
    const id = ++_idCounter;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    return id;
  }

  const notify = {
    success: (msg, dur) => addToast(msg, "success", dur),
    error:   (msg, dur) => addToast(msg, "error",   dur ?? 7000),
    warning: (msg, dur) => addToast(msg, "warning", dur ?? 6000),
    info:    (msg, dur) => addToast(msg, "info",    dur),
  };

  return (
    <NotificationContext.Provider value={{ toasts, notify, removeToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
}
