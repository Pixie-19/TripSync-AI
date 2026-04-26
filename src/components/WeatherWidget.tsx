"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Wind, Droplets, Thermometer, Loader2 } from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  city: string;
}

interface Props {
  destination: string;
}

export default function WeatherWidget({ destination }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

        if (!apiKey) {
          // Demo mode without API key
          setWeather({
            temp: 28,
            feels_like: 30,
            humidity: 72,
            wind_speed: 3.5,
            description: "partly cloudy",
            icon: "02d",
            city: destination.split(",")[0],
          });
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&units=metric&appid=${apiKey}`
        );

        if (!res.ok) throw new Error("Weather data not found");
        const data = await res.json();

        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          description: data.weather[0]?.description ?? "",
          icon: data.weather[0]?.icon ?? "01d",
          city: data.name,
        });
      } catch (e: any) {
        setError("Weather unavailable");
        // Fallback to placeholder data
        setWeather({
          temp: 27,
          feels_like: 30,
          humidity: 68,
          wind_speed: 4.2,
          description: "clear sky",
          icon: "01d",
          city: destination.split(",")[0],
        });
      } finally {
        setLoading(false);
      }
    };

    if (destination) fetchWeather();
  }, [destination]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-white/40 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading weather...
      </div>
    );
  }

  if (!weather) return null;

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  const getBgGradient = () => {
    const icon = weather.icon;
    if (icon.startsWith("01")) return "from-amber-500/15 to-orange-500/10";
    if (icon.startsWith("02") || icon.startsWith("03")) return "from-sky-500/15 to-blue-500/10";
    if (icon.startsWith("09") || icon.startsWith("10")) return "from-slate-500/15 to-blue-600/10";
    return "from-indigo-500/15 to-violet-500/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card p-4 bg-gradient-to-br ${getBgGradient()} border border-white/10`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Current Weather</div>
          <div className="font-semibold text-sm">{weather.city}</div>
        </div>
        {error && (
          <span className="text-xs text-amber-400/60 italic">estimated</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <img
          src={iconUrl}
          alt={weather.description}
          className="w-14 h-14 object-contain"
        />
        <div>
          <div className="font-display font-bold text-3xl">{weather.temp}°C</div>
          <div className="text-white/50 text-sm capitalize">{weather.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-0.5">
            <Thermometer className="w-3 h-3" /> Feels
          </div>
          <div className="text-sm font-medium">{weather.feels_like}°</div>
        </div>
        <div className="text-center border-x border-white/10">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-0.5">
            <Droplets className="w-3 h-3" /> Humidity
          </div>
          <div className="text-sm font-medium">{weather.humidity}%</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-white/40 text-xs mb-0.5">
            <Wind className="w-3 h-3" /> Wind
          </div>
          <div className="text-sm font-medium">{weather.wind_speed} m/s</div>
        </div>
      </div>
    </motion.div>
  );
}
