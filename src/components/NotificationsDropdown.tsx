"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Receipt, Handshake, Info } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user?.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-highlight rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 modal-panel z-50 overflow-hidden">
          <header className="px-4 py-3 border-b border-subtle flex items-center justify-between">
            <span className="font-display text-base text-ink" style={{ fontWeight: 500 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-accent hover:text-accent-hover"
              >
                Mark all read
              </button>
            )}
          </header>

          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-ink-muted text-sm">
                No notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--border-subtle)]">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => markAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors ${!n.is_read ? "bg-accent-soft hover:bg-accent-soft-strong" : "hover:bg-tint-soft"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                          n.type === "expense"
                            ? "bg-danger-soft text-danger"
                            : n.type === "payment"
                            ? "bg-success-soft text-success"
                            : "bg-tint text-ink-muted"
                        }`}
                      >
                        {n.type === "expense" ? (
                          <Receipt className="w-3.5 h-3.5" strokeWidth={1.75} />
                        ) : n.type === "payment" ? (
                          <Handshake className="w-3.5 h-3.5" strokeWidth={1.75} />
                        ) : (
                          <Info className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${!n.is_read ? "text-ink" : "text-ink-secondary"}`}
                        >
                          {n.message}
                        </p>
                        <span className="text-[10px] text-ink-faint mt-1 block">
                          {new Date(n.created_at).toLocaleDateString()} ·{" "}
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent self-center flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
