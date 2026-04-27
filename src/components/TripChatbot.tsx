"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  trip?: { destination: string; budget: number; currency: string; num_people: number } | null;
}

const SUGGESTIONS = [
  "What should we eat in this destination?",
  "How can we save money on this trip?",
  "What's the best time to visit local attractions?",
  "Create a packing list for our trip",
];

export default function TripChatbot({ trip }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: trip
        ? `Hello — I'm TripBot, your travel assistant for ${trip.destination}. Ask about restaurants, activities, or budget tips.`
        : "Hello — I'm TripBot. Ask me anything about travel planning.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          tripContext: trip
            ? {
                destination: trip.destination,
                budget: trip.budget,
                currency: trip.currency,
                numPeople: trip.num_people,
              }
            : null,
        }),
      });

      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.data || "Sorry, I couldn't process that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && isMobile && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 modal-backdrop z-[60]"
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fab fixed z-[55] bottom-6 right-6 sm:bottom-6 sm:right-6"
        style={{
          bottom: isMobile
            ? "calc(1.5rem + env(safe-area-inset-bottom, 0px))"
            : "1.5rem",
        }}
        aria-label="Toggle AI chat"
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" strokeWidth={1.75} />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-highlight rounded-full border-2 border-[color:var(--surface-canvas)]" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed z-[65] flex flex-col modal-panel overflow-hidden ${
            isMobile
              ? "inset-x-0 bottom-0 h-[85vh] rounded-t-xl rounded-b-none"
              : "bottom-24 right-6 w-[380px] max-h-[600px]"
          }`}
        >
          {isMobile && (
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-default rounded-full" />
            </div>
          )}

          {/* Header */}
          <header className="flex items-center gap-3 px-5 py-4 border-b border-subtle">
            <div className="w-9 h-9 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="font-display text-base text-ink flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                TripBot
                <Sparkles className="w-3.5 h-3.5 text-highlight" strokeWidth={1.75} />
              </div>
              <div className="text-[11px] text-ink-muted">AI travel assistant</div>
            </div>
            <button onClick={() => setOpen(false)} className="btn-icon" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-md bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-accent text-[color:var(--accent-on)] rounded-br-sm"
                      : "bg-tint text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-md bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
                </div>
                <div className="bg-tint px-3.5 py-3 rounded-lg rounded-bl-sm flex items-center gap-1">
                  <span className="w-1 h-1 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-subtle text-ink-secondary bg-elevated hover:border-default hover:text-ink transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={`p-3 border-t border-subtle ${isMobile ? "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]" : ""}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask TripBot anything…"
                disabled={loading}
                className="input-field pr-11"
                id="tripbot-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1 top-1 bottom-1 w-9 rounded-md bg-accent text-[color:var(--accent-on)] flex items-center justify-center disabled:opacity-40"
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={1.75} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
