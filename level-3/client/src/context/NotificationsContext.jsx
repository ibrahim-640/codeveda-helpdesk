import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api";
import { socket } from "../socket";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);
const EMPTY = { items: [], unreadCount: 0 };

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  // ownerId stops one user's notifications showing up for the next login
  const [state, setState] = useState({ ownerId: null, ...EMPTY });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;

    // Runs on the first connection and after every reconnection,
    // so anything missed while offline is picked up from the database
    const load = () =>
      api("/notifications")
        .then((data) => setState({ ownerId: userId, ...data }))
        .catch(() => {});

    const onConnect = () => {
      setConnected(true);
      load();
    };
    const onDisconnect = () => setConnected(false);
    const onNew = (n) =>
      setState((s) => {
        const base = s.ownerId === userId ? s : { ownerId: userId, ...EMPTY };
        return {
          ownerId: userId,
          items: [n, ...base.items.filter((x) => x.id !== n.id)].slice(0, 20),
          unreadCount: base.unreadCount + 1,
        };
      });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("notification:new", onNew);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("notification:new", onNew);
      socket.disconnect();
    };
  }, [userId]);

  const mine = state.ownerId === userId ? state : EMPTY;

  const markRead = useCallback(
    (id) => {
      setState((s) => {
        const target = s.items.find((n) => n.id === id);
        if (!target || target.read) return s;
        return {
          ...s,
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, s.unreadCount - 1),
        };
      });
      api(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    },
    []
  );

  const markAllRead = useCallback(() => {
    setState((s) => ({
      ...s,
      items: s.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    api("/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ ...mine, connected: userId ? connected : false, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}