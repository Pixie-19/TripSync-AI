"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Utensils,
  Car,
  Building2,
  Ticket,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, getDaysCount } from "@/lib/utils";
import type { GeneratedItinerary, ItineraryDay } from "@/lib/ai";
import { AppUser } from "@/lib/types";

interface Props {
  trip: any;
  user: AppUser | null;
}

export default function ItineraryTab({ trip, user }: Props) {
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(
    trip.itinerary as GeneratedItinerary | null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(0);

  const generateItinerary = async () => {
    setLoading(true);
    setError(null);

    try {
      const duration = getDaysCount(trip.start_date, trip.end_date);
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: trip.destination,
          budget: trip.budget,
          duration,
          preferences: trip.preferences ?? [],
          numPeople: trip.num_people,
          currency: trip.currency ?? "INR",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to generate itinerary");
      }

      const json = await response.json();
      const data: GeneratedItinerary = json.data;
      
      if (!data) {
        throw new Error(json.error || "No data returned from AI");
      }

      setItinerary(data);

      // Save to DB
      await supabase
        .from("trips")
        .update({ itinerary: data as any })
        .eq("id", trip.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  if (!itinerary) {
    return (
      <div className="glass-card p-12 text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl mb-6"
        >
          🤖
        </motion.div>
        <h3 className="font-display font-bold text-2xl mb-3">AI Itinerary Generator</h3>
        <p className="text-white/50 mb-2 max-w-md mx-auto">
          Let AI create a personalized day-wise itinerary for your trip to{" "}
          <span className="text-brand-400">{trip.destination}</span>.
        </p>
        <p className="text-white/30 text-sm mb-8">
          Based on your budget of {formatCurrency(trip.budget, trip.currency)} for {trip.num_people} people
          {trip.preferences?.length > 0 && ` • ${trip.preferences.join(", ")}`}
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={generateItinerary}
          disabled={loading}
          className="btn-primary text-lg px-8 py-4"
          id="generate-itinerary-btn"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating magic...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate AI Itinerary</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Itinerary Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-brand-400" />
              <span className="text-brand-400 text-sm font-medium">AI Generated</span>
            </div>
            <h3 className="font-display font-bold text-xl mb-1">{trip.destination} Itinerary</h3>
            <p className="text-white/50 text-sm">{itinerary.summary}</p>
          </div>
          <button
            onClick={generateItinerary}
            disabled={loading}
            className="btn-ghost text-sm"
            id="regenerate-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </button>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2 mb-4">
          {itinerary.highlights?.map((h, i) => (
            <span key={i} className="badge bg-brand-500/15 text-brand-300 border border-brand-500/20">
              ⭐ {h}
            </span>
          ))}
        </div>

        {/* Budget Breakdown */}
        {itinerary.budgetBreakdown && (
          <div className="grid grid-cols-5 gap-3 mt-4">
            {Object.entries(itinerary.budgetBreakdown).map(([key, val]) => {
              const icons: Record<string, any> = {
                accommodation: Building2,
                food: Utensils,
                transport: Car,
                activities: Ticket,
                miscellaneous: Briefcase,
              };
              return (
                <div key={key} className="glass-card-hover p-3 text-center">
                  <div className="flex justify-center mb-2 mt-1">
                    {(() => {
                      const Icon = icons[key] ?? Briefcase;
                      return <Icon className="w-5 h-5 text-white/70" />;
                    })()}
                  </div>
                  <div className="text-brand-400 font-semibold text-sm">
                    {formatCurrency(val as number, trip.currency)}
                  </div>
                  <div className="text-white/40 text-xs capitalize">{key.replace("miscellaneous", "misc")}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Days */}
      <div className="space-y-3">
        {itinerary.days?.map((day, i) => (
          <DayCard
            key={i}
            day={day}
            currency={trip.currency}
            isExpanded={expandedDay === i}
            onToggle={() => setExpandedDay(expandedDay === i ? -1 : i)}
          />
        ))}
      </div>

      {/* General Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Travel Tips
          </h4>
          <ul className="space-y-2">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-amber-400 mt-0.5">💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DayCard({
  day,
  currency,
  isExpanded,
  onToggle,
}: {
  day: ItineraryDay;
  currency: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const timeSlots = [
    { label: "Morning", data: day.morning, icon: <Sun className="w-4 h-4 text-amber-400" />, color: "border-amber-500/20 bg-amber-500/5" },
    { label: "Afternoon", data: day.afternoon, icon: <Sunset className="w-4 h-4 text-orange-400" />, color: "border-orange-500/20 bg-orange-500/5" },
    { label: "Evening", data: day.evening, icon: <Moon className="w-4 h-4 text-violet-400" />, color: "border-violet-500/20 bg-violet-500/5" },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
        id={`day-${day.day}-toggle`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center font-display font-bold text-brand-400">
            {day.day}
          </div>
          <div>
            <div className="font-semibold">{day.theme}</div>
            <div className="text-white/40 text-sm">{day.date}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-brand-400 font-semibold text-sm">
              {formatCurrency(day.estimatedCost, currency)}
            </div>
            <div className="text-white/40 text-xs">est. cost</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/8 p-5 space-y-3"
        >
          {timeSlots.map((slot) => (
            <div key={slot.label} className={`rounded-xl border p-4 ${slot.color}`}>
              <div className="flex items-center gap-2 mb-3">
                {slot.icon}
                <span className="font-medium text-sm">{slot.label}</span>
              </div>
              {slot.data && (
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white">{slot.data.title}</h4>
                      <p className="text-white/50 text-sm mt-1">{slot.data.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-emerald-400 font-semibold text-sm">
                        {formatCurrency(slot.data.cost, currency)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {slot.data.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {slot.data.duration}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {day.tips && day.tips.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/8">
              <div className="text-xs text-white/40 font-medium mb-2">Day Tips</div>
              {day.tips.map((tip, i) => (
                <div key={i} className="text-xs text-white/50 flex gap-2">
                  <span>💡</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
