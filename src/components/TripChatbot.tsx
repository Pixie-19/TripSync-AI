"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, Sparkles, MessageCircle } from "lucide-react";

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
        ? `Hey! 👋 I'm TripBot, your AI travel assistant for ${trip.destination}! Ask me anything about the destination, restaurants, activities, or budget tips.`
        : "Hey! 👋 I'm TripBot. Select a trip or ask me anything about travel planning!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
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
          tripContext: trip ? {
            destination: trip.destination,
            budget: trip.budget,
            currency: trip.currency,
            numPeople: trip.num_people,
          } : null,
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
        { role: "assistant", content: "⚠️ Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
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

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed z-[55] flex items-center justify-center transition-all shadow-glow-blue
          ${isMobile 
            ? "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-4 w-12 h-12 rounded-2xl" 
            : "bottom-6 right-6 w-14 h-14 rounded-full"} 
          bg-gradient-to-br from-brand-500 to-violet-600`}
        aria-label="Toggle AI Chat"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-dark-900 animate-pulse" />}
      </motion.button>

      {/* Chat Window */}
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
                : "bottom-24 right-6 w-[380px] max-h-[600px] rounded-2xl"}`}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-brand-600/10 to-violet-600/10 ${!isMobile && "pt-5"}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-lg flex items-center gap-1.5">
                  TripBot
                  <Sparkles className="w-4 h-4 text-brand-400" />
                </div>
                <div className="text-xs text-brand-300/70 font-medium">AI Travel Assistant</div>
              </div>
              {!isMobile && (
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors" aria-label="Close chat">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 relative">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-violet-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-brand-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-brand-500 to-violet-600 text-white rounded-br-sm"
                        : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-violet-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 h-[44px]">
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-brand-500/30 text-brand-300 bg-brand-500/5 hover:bg-brand-500/15 hover:border-brand-500/50 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className={`p-4 border-t border-white/10 bg-dark-900/50 ${isMobile && "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"}`}>
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2 relative"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask TripBot anything..."
                  disabled={loading}
                  className="flex-1 bg-dark-800 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 focus:bg-dark-700 transition-all shadow-inner"
                  id="tripbot-input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-10 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white flex items-center justify-center disabled:opacity-40 transition-all disabled:hover:bg-brand-500/10 disabled:hover:text-brand-400"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
