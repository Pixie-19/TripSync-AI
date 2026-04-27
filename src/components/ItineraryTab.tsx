"use client";

import { useState } from "react";
import {
  Brain,
  Sparkles,
  Loader2,
  MapPin,
  Clock,
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
  Calendar,
  Star,
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

      await supabase.from("trips").update({ itinerary: data as any }).eq("id", trip.id);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  if (!itinerary) {
    return (
      <div className="empty-state max-w-xl mx-auto py-12">
        <div className="empty-state__icon">
          <Brain className="w-10 h-10" strokeWidth={1.5} />
        </div>
        <div className="empty-state__title">AI itinerary generator</div>
        <p className="empty-state__caption">
          Let AI craft a day-wise plan for{" "}
          <span className="text-ink-secondary">{trip.destination}</span> on a budget of{" "}
          <span className="numeric-display tnum text-ink-secondary">
            {formatCurrency(trip.budget, trip.currency)}
          </span>{" "}
          for {trip.num_people} people
          {trip.preferences?.length > 0 && ` · ${trip.preferences.join(", ")}`}.
        </p>
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg border border-danger bg-danger-soft text-danger text-sm max-w-md mx-auto">
            {error}
          </div>
        )}
        <button
          onClick={generateItinerary}
          disabled={loading}
          className="btn-primary btn-lg"
          id="generate-itinerary-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate AI itinerary
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge">
                <Brain className="w-3 h-3" strokeWidth={2} />
                AI generated
              </span>
            </div>
            <h3
              className="font-display text-3xl text-ink mb-2"
              style={{ fontWeight: 500, letterSpacing: "-0.015em", fontVariationSettings: "'opsz' 144" }}
            >
              {trip.destination}
            </h3>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-3xl">
              {itinerary.summary}
            </p>
          </div>
          <button
            onClick={generateItinerary}
            disabled={loading}
            className="btn-secondary btn-sm flex-shrink-0"
            id="regenerate-btn"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>

        {/* Highlights */}
        {itinerary.highlights && itinerary.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-subtle">
            {itinerary.highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tint-soft text-xs text-ink-secondary"
              >
                <Star className="w-3 h-3 text-highlight" strokeWidth={2} />
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Budget Breakdown */}
        {itinerary.budgetBreakdown && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-default rounded-lg overflow-hidden border border-subtle mt-6">
            {Object.entries(itinerary.budgetBreakdown).map(([key, val]) => {
              const icons: Record<string, any> = {
                accommodation: Building2,
                food: Utensils,
                transport: Car,
                activities: Ticket,
                miscellaneous: Briefcase,
              };
              const Icon = icons[key] ?? Briefcase;
              return (
                <div key={key} className="bg-elevated px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                    <span className="eyebrow capitalize">
                      {key.replace("miscellaneous", "Misc.")}
                    </span>
                  </div>
                  <div className="numeric-display tnum text-base text-ink">
                    {formatCurrency(val as number, trip.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Days */}
      <section>
        <div className="eyebrow-rule mb-4">Day-by-day</div>
        <div className="space-y-2">
          {itinerary.days?.map((day, i) => {
            // Find max-cost slot for saffron rule
            const slots = [day.morning, day.afternoon, day.evening];
            const maxCost = Math.max(...slots.map((s) => s?.cost ?? 0));
            return (
              <DayCard
                key={i}
                day={day}
                index={i}
                currency={trip.currency}
                isExpanded={expandedDay === i}
                onToggle={() => setExpandedDay(expandedDay === i ? -1 : i)}
                maxCost={maxCost}
              />
            );
          })}
        </div>
      </section>

      {/* General Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <section className="surface-card p-6">
          <div className="eyebrow mb-3">Tips</div>
          <ul className="space-y-2.5">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink-secondary leading-relaxed">
                <span className="inline-block w-1 h-1 rounded-full bg-highlight mt-2 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DayCard({
  day,
  index,
  currency,
  isExpanded,
  onToggle,
  maxCost,
}: {
  day: ItineraryDay;
  index: number;
  currency: string;
  isExpanded: boolean;
  onToggle: () => void;
  maxCost: number;
}) {
  const dayLabel = String(day.day).padStart(2, "0");
  const timeSlots = [
    { key: "morning", label: "Morning", data: day.morning, icon: Sun },
    { key: "afternoon", label: "Afternoon", data: day.afternoon, icon: Sunset },
    { key: "evening", label: "Evening", data: day.evening, icon: Moon },
  ];

  return (
    <article className="surface-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-tint-soft transition-colors"
        id={`day-${day.day}-toggle`}
      >
        <div className="flex flex-col items-start flex-shrink-0">
          <span className="eyebrow text-ink-faint">Day</span>
          <span className="serial-numeral text-3xl">{dayLabel}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="font-display text-lg text-ink truncate"
            style={{ fontWeight: 500, letterSpacing: "-0.01em" }}
          >
            {day.theme}
          </h4>
          <p className="text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3" strokeWidth={1.75} />
            {day.date}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="numeric-display tnum text-ink text-base">
            {formatCurrency(day.estimatedCost, currency)}
          </div>
          <div className="text-[10px] text-ink-faint mt-0.5">est. cost</div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-ink-muted flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-muted flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-subtle px-5 py-5 space-y-4">
          {timeSlots.map((slot) => {
            const Icon = slot.icon;
            if (!slot.data) return null;
            const isMax = slot.data.cost === maxCost && maxCost > 0;
            return (
              <div key={slot.key} className="relative pl-4">
                {isMax && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-highlight" aria-label="Highest cost slot" />
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
                  <span className="eyebrow">{slot.label}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-ink">{slot.data.title}</h5>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{slot.data.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-ink-faint">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" strokeWidth={1.75} />
                        {slot.data.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" strokeWidth={1.75} />
                        {slot.data.duration}
                      </span>
                    </div>
                  </div>
                  <div className="numeric-display tnum text-sm text-ink flex-shrink-0">
                    {formatCurrency(slot.data.cost, currency)}
                  </div>
                </div>
              </div>
            );
          })}

          {day.tips && day.tips.length > 0 && (
            <div className="mt-3 pt-3 border-t border-subtle">
              <div className="eyebrow mb-2">Day notes</div>
              <ul className="space-y-1">
                {day.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-ink-muted flex gap-2">
                    <span className="text-ink-faint">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
