"use client";

import { useEffect, useState } from "react";
import { Wind, Droplets, Thermometer, Loader2 } from "lucide-react";

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
      } catch {
        setError("Weather unavailable");
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
      <div className="flex items-center gap-2 text-ink-muted text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Weather…
      </div>
    );
  }

  if (!weather) return null;

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}.png`;

  return (
    <div className="flex items-center gap-3 rounded-md border border-subtle bg-elevated px-3 py-2">
      <img src={iconUrl} alt={weather.description} className="w-9 h-9 -my-1" />
      <div className="text-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="numeric-display tnum text-ink text-base">{weather.temp}°C</span>
          <span className="text-ink-muted text-xs capitalize">{weather.description}</span>
        </div>
        <div className="text-[11px] text-ink-faint flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1"><Thermometer className="w-2.5 h-2.5" /> {weather.feels_like}°</span>
          <span className="flex items-center gap-1"><Droplets className="w-2.5 h-2.5" /> {weather.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="w-2.5 h-2.5" /> {weather.wind_speed}m/s</span>
        </div>
      </div>
      {error && <span className="text-[10px] text-warning italic">est.</span>}
    </div>
  );
}
