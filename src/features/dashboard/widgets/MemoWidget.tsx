import { useState, useEffect, useRef } from 'react';
import { StickyNote, Check, Palette, Trash2, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateUserSettings } from '@/services/userApi';
import { useTranslation } from 'react-i18next';

const COLORS = [
  { name: 'Amber', bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-700', primary: 'bg-amber-500' },
  { name: 'Indigo', bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-700', primary: 'bg-indigo-500' },
  { name: 'Emerald', bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-700', primary: 'bg-emerald-500' },
  { name: 'Rose', bg: 'bg-rose-50/50', border: 'border-rose-100', text: 'text-rose-700', primary: 'bg-rose-500' },
];

export const MemoWidget = ({ settings, onUpdateSettings }: { settings?: any, onUpdateSettings?: (s: any) => void }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(settings?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const colorIdx = settings?.colorIdx || 0;
  const color = COLORS[colorIdx];
  
  const timerRef = useRef<any>(null);

  const saveToBackend = async (newContent: string, newColorIdx: number) => {
    setIsSaving(true);
    try {
      await updateUserSettings({
        ui: {
          dashboard: {
            memo: { content: newContent, colorIdx: newColorIdx }
          }
        }
      });
      onUpdateSettings?.({ ...settings, content: newContent, colorIdx: newColorIdx });
    } catch (e) {
      console.error('Failed to save memo to backend', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveToBackend(value, colorIdx);
    }, 1500);
  };

  const cycleColor = () => {
    const nextIdx = (colorIdx + 1) % COLORS.length;
    saveToBackend(content, nextIdx);
  };

  const clearNote = () => {
    if (window.confirm(t('dashboard.widgets.memo.clearConfirm'))) {
      setContent('');
      saveToBackend('', colorIdx);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl border transition-all group p-3 relative shadow-sm",
      color.bg, color.border
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg text-white shadow-sm", color.primary)}>
            <StickyNote className="h-3 w-3" />
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", color.text)}>{t('dashboard.widgets.memo.scratchpad')}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isSaving ? (
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce mr-2" />
          ) : (
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2 opacity-30" />
          )}
          <button onClick={cycleColor} className="p-1 hover:bg-black/5 rounded transition-colors" title={t('dashboard.widgets.memo.changeColor')}>
            <Palette className="h-3 w-3 text-muted-foreground/60" />
          </button>
          <button onClick={clearNote} className="p-1 hover:bg-black/5 rounded transition-colors" title={t('dashboard.widgets.memo.clear')}>
            <Trash2 className="h-3 w-3 text-muted-foreground/60" />
          </button>
        </div>
      </div>

      <textarea
        className={cn(
          "flex-1 w-full bg-transparent resize-none border-none focus:ring-0 text-[11px] leading-relaxed p-1 font-medium placeholder:opacity-30",
          color.text
        )}
        placeholder={t('dashboard.widgets.memo.placeholder')}
        value={content}
        onChange={handleChange}
      />
      
      <div className="absolute bottom-2 right-2 opacity-10">
        <Pin className="h-10 w-10 rotate-45" />
      </div>
    </div>
  );
};