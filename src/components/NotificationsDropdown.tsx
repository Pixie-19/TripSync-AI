"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Check, Receipt, Handshake, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    let isUnmounted = false;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (isUnmounted) return;
          setNotifications(prev => [payload.new, ...prev]);
        },
      )
      .subscribe();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isUnmounted = true;
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user?.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-dark-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-800/90">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-brand-400 hover:text-brand-300">
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-dark-900/95">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">No notifications yet.</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer transition-colors ${!n.is_read ? 'bg-brand-500/10 hover:bg-brand-500/20' : 'hover:bg-white/5'}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'expense' ? 'bg-rose-500/20 text-rose-400' : n.type === 'payment' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}>
                      {n.type === 'expense' ? <Receipt className="w-4 h-4" /> : n.type === 'payment' ? <Handshake className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!n.is_read ? 'text-white' : 'text-white/70'}`}>{n.message}</p>
                      <span className="text-[10px] text-white/40 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-brand-400 self-center flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
