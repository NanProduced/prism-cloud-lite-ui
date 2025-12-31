import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer } from 'lucide-react';

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using Open-Meteo (Free, no key required)
    // Default to a central location or let user configure
    fetch('https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current_weather=true')
      .then(res => res.json())
      .then(data => {
        setWeather(data.current_weather);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-8 w-8 text-amber-500" />;
    if (code < 3) return <Cloud className="h-8 w-8 text-slate-400" />;
    if (code < 70) return <CloudRain className="h-8 w-8 text-blue-400" />;
    return <Wind className="h-8 w-8 text-slate-500" />;
  };

  if (loading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="mb-2">
        {weather ? getWeatherIcon(weather.weathercode) : <Sun className="h-8 w-8 text-amber-500" />}
      </div>
      <div className="text-2xl font-bold">{weather?.temperature || '--'}掳C</div>
      <div className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
        Shanghai, China
      </div>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Thermometer className="h-3 w-3" />
          <span>Real-feel</span>
        </div>
      </div>
    </div>
  );
};
