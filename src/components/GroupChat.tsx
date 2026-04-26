"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface Props {
  tripId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function GroupChat({ tripId, currentUserId, currentUserName }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;

    // Load recent messages
    supabase
      .from("group_messages")
      .select("*, users(full_name, avatar_url)")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setMessages(data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            content: m.content,
            created_at: m.created_at,
            sender_name: m.users?.full_name ?? "Member",
            sender_avatar: m.users?.avatar_url,
          })));
          setUnread(0);
        }
      });

    // Real-time subscription
    const channel = supabase
      .channel(`chat-${tripId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `trip_id=eq.${tripId}`,
      }, async (payload: any) => {
        const { data: userData } = await supabase
          .from("users")
          .select("full_name, avatar_url")
          .eq("id", payload.new.user_id)
          .single();

        const newMsg: Message = {
          id: payload.new.id,
          user_id: payload.new.user_id,
          content: payload.new.content,
          created_at: payload.new.created_at,
          sender_name: userData?.full_name ?? "Member",
          sender_avatar: userData?.avatar_url,
        };

        setMessages((prev) => [...prev, newMsg]);
        if (!open) setUnread((n) => n + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    await supabase.from("group_messages").insert({
      trip_id: tripId,
      user_id: currentUserId,
      content: text,
    });

    setSending(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => { setOpen(true); setUnread(0); }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed z-[55] flex items-center justify-center transition-all shadow-glow-emerald
          ${isMobile 
            ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 w-12 h-12 rounded-2xl" 
            : "bottom-24 right-6 w-12 h-12 rounded-full"} 
          bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg`}
        aria-label="Open group chat"
        id="group-chat-fab"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-[65] flex flex-col glass-card border border-white/10 shadow-2xl overflow-hidden bg-dark-800/95 backdrop-blur-2xl
              ${isMobile 
                ? "bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl rounded-b-none border-b-0 border-x-0" 
                : "bottom-40 right-6 w-[360px] max-h-[480px] rounded-2xl"}`}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-emerald-500/10 ${!isMobile && "pt-5"}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Group Chat</div>
                <div className="text-xs text-white/40">Real-time · Supabase</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: "200px", maxHeight: "280px" }}>
              {messages.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.user_id === currentUserId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {msg.sender_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!isMe && (
                        <span className="text-xs text-white/40 px-1">{msg.sender_name}</span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm"
                            : "bg-white/8 text-white/90 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-xs text-white/25 px-1">{formatTime(msg.created_at)}</span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message the group..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                  id="group-chat-input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                  aria-label="Send chat message"
                >
                  {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
