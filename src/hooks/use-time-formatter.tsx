import { useMemo } from 'react';
import { useSettingsStore, type DateFormatPreset } from '@/store/settingsStore';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

export function useTimeFormatter() {
  const { preferences } = useSettingsStore();
  
  const locale = preferences.language === 'zh' ? zhCN : enUS;
  const timeZone = preferences.timezone || 'UTC';

  const formatDateTime = (date: Date | string | number) => {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    // Date part
    let datePattern = 'yyyy-MM-dd';
    switch (preferences.dateFormat) {
      case 'YYYY/MM/DD': datePattern = 'yyyy/MM/dd'; break;
      case 'MM/DD/YYYY': datePattern = 'MM/dd/yyyy'; break;
      case 'DD/MM/YYYY': datePattern = 'dd/MM/yyyy'; break;
      case 'MMM D, YYYY': datePattern = 'MMM d, yyyy'; break;
    }

    // Time part
    let timePattern = preferences.timeFormat === '12h' ? 'hh:mm' : 'HH:mm';
    if (preferences.showSeconds) {
      timePattern += ':ss';
    }
    if (preferences.timeFormat === '12h') {
      timePattern += ' a';
    }

    return formatInTimeZone(d, timeZone, `${datePattern} ${timePattern}`, { locale });
  };

  const formatRelative = (date: Date | string | number) => {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistanceToNow(d, { addSuffix: true, locale });
  };

  return {
    formatDateTime,
    formatRelative,
    timeZone,
    locale,
    preferences
  };
}
