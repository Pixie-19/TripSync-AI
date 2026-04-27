"use client";

import { useEffect, useState, useRef } from "react";
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

export default function GroupChat({ tripId, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;

    supabase
      .from("group_messages")
      .select("*, users(full_name, avatar_url)")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              content: m.content,
              created_at: m.created_at,
              sender_name: m.users?.full_name ?? "Member",
              sender_avatar: m.users?.avatar_url,
            }))
          );
          setUnread(0);
        }
      });

    // Realtime channel name preserved
    const channel = supabase
      .channel(`chat-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload: any) => {
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Position above the chatbot FAB (which sits at bottom-6 / 56px tall)
  // 56 + 12 (gap) + 24 (offset) = 92 → bottom-[5.75rem]
  return (
    <>
      {/* FAB (above chatbot) */}
      <button
        onClick={() => {
          setOpen(true);
          setUnread(0);
        }}
        className="fab fab--ghost fixed z-[55] right-6"
        style={{
          bottom: isMobile
            ? "calc(5.75rem + env(safe-area-inset-bottom, 0px))"
            : "5.75rem",
        }}
        aria-label="Open group chat"
        id="group-chat-fab"
      >
        <MessageCircle className="w-5 h-5 text-ink" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-highlight text-[color:var(--surface-canvas)] rounded-full flex items-center justify-center text-[10px] font-bold px-1">
            {unread}
          </span>
        )}
      </button>

      {/* Mobile overlay */}
      {open && isMobile && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 modal-backdrop z-[60]"
        />
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed z-[65] flex flex-col modal-panel overflow-hidden ${
            isMobile
              ? "inset-x-0 bottom-0 h-[85vh] rounded-t-xl rounded-b-none"
              : "bottom-44 right-6 w-[360px] max-h-[480px]"
          }`}
        >
          {isMobile && (
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-default rounded-full" />
            </div>
          )}

          <header className="flex items-center gap-3 px-5 py-4 border-b border-subtle">
            <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-accent" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="font-display text-base text-ink" style={{ fontWeight: 500 }}>
                Group chat
              </div>
              <div className="text-[11px] text-ink-muted">Real-time · everyone in the trip</div>
            </div>
            <button onClick={() => setOpen(false)} className="btn-icon" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ minHeight: "200px" }}
          >
            {messages.length === 0 && (
              <div className="text-center py-8 text-ink-faint text-xs">
                No messages yet. Say hello.
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <>
                      {msg.sender_avatar ? (
                        <img
                          src={msg.sender_avatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="avatar w-7 h-7 text-[11px] flex-shrink-0 mt-0.5">
                          {msg.sender_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </>
                  )}
                  <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[10px] text-ink-muted px-1">{msg.sender_name}</span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        isMe
                          ? "bg-accent text-[color:var(--accent-on)] rounded-br-sm"
                          : "bg-tint text-ink rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-ink-faint px-1 tnum">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className={`p-3 border-t border-subtle ${isMobile ? "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]" : ""}`}>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message the group…"
                className="input-field"
                id="group-chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                aria-label="Send chat message"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={1.75} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
