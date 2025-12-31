import { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, Sun, CloudRain, Wind, Thermometer, 
  CloudLightning, CloudSnow, MapPin, AlertCircle, 
  RefreshCw, Navigation
} from 'lucide-react';
import { geolocation } from '@/lib/maptiler';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateUserSettings } from '@/services/userApi';

export const WeatherWidget = ({ settings, onUpdateSettings }: { settings?: any, onUpdateSettings?: (s: any) => void }) => {
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocation] = useState<string>(settings?.locationName || 'Shanghai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const unit = settings?.unit || 'C'; // C or F

  const fetchWeather = useCallback(async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(false);
    
    let weatherData = null;
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
      if (!res.ok) throw new Error('Weather API error');
      weatherData = await res.json();
      
      setWeather({
        current: weatherData.current_weather,
        daily: weatherData.daily
      });
      setLocation(name);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(false);

    // Persist settings separately so weather still shows if this fails
    try {
      const newSettings = { ...settings, locationName: name, lat, lng };
      onUpdateSettings?.(newSettings);
      await updateUserSettings({
        ui: {
          dashboard: { weather: newSettings }
        }
      });
    } catch (e) {
      console.warn('Failed to persist weather settings:', e);
    }
  }, [settings, onUpdateSettings]);

  useEffect(() => {
    const init = async () => {
      // 1. Try settings from props (which come from layout)
      if (settings?.lat && settings?.lng) {
        fetchWeather(settings.lat, settings.lng, settings.locationName);
      } else {
        // 2. Try geolocation
        try {
          const info = await geolocation.info();
          if (info.latitude && info.longitude) {
            fetchWeather(info.latitude, info.longitude, info.city || info.country || 'Shanghai');
          } else {
            fetchWeather(31.23, 121.47, 'Shanghai');
          }
        } catch {
          fetchWeather(31.23, 121.47, 'Shanghai');
        }
      }
    };
    init();
  }, []);

  const toggleUnit = async () => {
    const nextUnit = unit === 'C' ? 'F' : 'C';
    const newSettings = { ...settings, unit: nextUnit };
    onUpdateSettings?.(newSettings);
    
    try {
      await updateUserSettings({
        ui: {
          dashboard: { weather: newSettings }
        }
      });
    } catch (e) {
      console.error('Failed to save weather unit', e);
    }
  };

  const convertTemp = (temp: number) => {
    if (unit === 'F') return Math.round((temp * 9/5) + 32);
    return Math.round(temp);
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-10 w-10 text-amber-500 animate-pulse" />;
    if (code <= 3) return <Cloud className="h-10 w-10 text-slate-400" />;
    if (code <= 48) return <Wind className="h-10 w-10 text-slate-300" />;
    if (code <= 67) return <CloudRain className="h-10 w-10 text-blue-400" />;
    if (code <= 77) return <CloudSnow className="h-10 w-10 text-slate-200" />;
    if (code <= 82) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (code <= 99) return <CloudLightning className="h-10 w-10 text-indigo-500" />;
    return <Sun className="h-10 w-10 text-amber-500" />;
  };

  if (loading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;
  
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
      <AlertCircle className="h-8 w-8 mb-2" />
      <span className="text-[10px] font-medium text-center">Weather Unavailable<br/>Check Connection</span>
    </div>
  );

  const current = weather.current;

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden group p-1">
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
        <Navigation className="h-20 w-20" />
      </div>

      <button 
        onClick={toggleUnit}
        className="absolute top-0 right-0 h-6 w-6 flex items-center justify-center bg-muted/50 rounded-bl-lg text-[10px] font-black hover:bg-primary hover:text-white transition-colors z-20"
      >
        &deg;{unit}
      </button>
      
      <div className="z-10 flex flex-col items-center">
        <div className="mb-2">
          {getWeatherIcon(current.weathercode)}
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-4xl font-black tracking-tighter">{convertTemp(current.temperature)}</span>
          <span className="text-xl font-bold text-muted-foreground/60">&deg;</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase mt-1 max-w-[120px] truncate">
          <MapPin className="h-2.5 w-2.5" />
          {location}
        </div>
        
        <div className="flex items-center gap-3 mt-4 text-[10px] font-medium px-3 py-1 bg-muted/50 rounded-full border border-border/50">
          <div className="flex items-center gap-1 text-red-500/80">
            <span>{convertTemp(weather.daily.temperature_2m_max[0])}&deg;</span>
          </div>
          <div className="h-2 w-[1px] bg-border" />
          <div className="flex items-center gap-1 text-blue-500/80">
            <span>{convertTemp(weather.daily.temperature_2m_min[0])}&deg;</span>
          </div>
        </div>
      </div>
    </div>
  );
};
