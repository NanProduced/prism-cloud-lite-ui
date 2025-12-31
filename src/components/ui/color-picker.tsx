import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Range, Root, Thumb, Track } from '@radix-ui/react-slider';
import Color from 'color';
import { PipetteIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  type ChangeEventHandler,
  type ComponentProps,
  type HTMLAttributes,
} from 'react';

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  mode: string;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setMode: (mode: string) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(undefined);

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error('useColorPicker must be used within a ColorPickerProvider');
  }
  return context;
};

export type ColorPickerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export const ColorPicker = ({
  value,
  defaultValue = '#000000',
  onChange,
  className,
  ...props
}: ColorPickerProps) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [alpha, setAlpha] = useState(100);
  const [mode, setMode] = useState('hex');

  const lastSentRef = useRef<string | null>(null);

  // Initialize from value or defaultValue
  useEffect(() => {
    const colorStr = value || defaultValue;
    if (colorStr === lastSentRef.current) return;
    try {
      const c = Color(colorStr);
      setHue(c.hue());
      setSaturation(c.saturationl());
      setLightness(c.lightness());
      setAlpha(c.alpha() * 100);
      lastSentRef.current = colorStr;
    } catch (e) {
      // Ignore invalid colors
    }
  }, [defaultValue, value]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      try {
        const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
        let output = '';
        if (mode === 'hex') output = color.hex();
        else if (mode === 'rgb') output = color.rgb().string();
        else if (mode === 'hsl') output = color.hsl().string();
        else output = color.rgb().string();
        
        if (output !== lastSentRef.current && output !== value) {
          lastSentRef.current = output;
          onChange(output);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [hue, saturation, lightness, alpha, mode, onChange, value]);

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        setMode,
      }}
    >
      <div className={cn('grid w-full gap-4', className)} {...props} />
    </ColorPickerContext.Provider>
  );
};

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = ({ className, ...props }: ColorPickerSelectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { hue, saturation, lightness, setSaturation, setLightness } = useColorPicker();

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

      setSaturation(x * 100);
      setLightness((1 - y) * 100);
    },
    [isDragging, setSaturation, setLightness]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      const handleUp = () => setIsDragging(false);
      window.addEventListener('pointerup', handleUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handleUp);
      };
    }
  }, [isDragging, handlePointerMove]);

  return (
    <div
      ref={containerRef}
      className={cn('relative aspect-video w-full cursor-crosshair rounded border', className)}
      style={{
        background: `
          linear-gradient(to top, #000, transparent),
          linear-gradient(to right, #fff, transparent),
          hsl(${hue}, 100%, 50%)
        `,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setSaturation(x * 100);
        setLightness((1 - y) * 100);
      }}
      {...props}
    >
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{
          left: `${saturation}%`,
          top: `${100 - lightness}%`,
        }}
      />
    </div>
  );
};

export const ColorPickerHue = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { hue, setHue } = useColorPicker();
  
  return (
    <div className={cn('relative flex h-4 w-full items-center group', className)} {...props}>
      <div className="relative h-2 w-full grow rounded-full bg-[linear-gradient(to_right,#f00_0%,#ff0_17%,#0f0_33%,#0ff_50%,#00f_67%,#f0f_83%,#f00_100%)] shadow-inner" />
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={hue}
        onChange={(e) => setHue(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div 
        className="absolute h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md pointer-events-none transition-transform group-active:scale-110"
        style={{ left: `calc(${(hue / 360) * 100}% - 8px)` }}
      />
    </div>
  );
};

export const ColorPickerAlpha = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { alpha, setAlpha, hue, saturation, lightness } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness).hex();
  
  return (
    <div className={cn('relative flex h-4 w-full items-center group', className)} {...props}>
      <div
        className="relative h-2 w-full grow rounded-full shadow-inner"
        style={{
          background: `
            linear-gradient(to right, transparent, ${color}),
            url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==")
          `,
        }}
      />
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={alpha}
        onChange={(e) => setAlpha(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div 
        className="absolute h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md pointer-events-none transition-transform group-active:scale-110"
        style={{ left: `calc(${(alpha / 100) * 100}% - 8px)` }}
      />
    </div>
  );
};

export const ColorPickerEyeDropper = ({ className, ...props }: ComponentProps<typeof Button>) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();
  
  const handleEyeDropper = async () => {
    try {
      // @ts-ignore - EyeDropper API is experimental
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      setHue(color.hue());
      setSaturation(color.saturationl());
      setLightness(color.lightness());
      setAlpha(color.alpha() * 100);
    } catch (error) {
      console.error('EyeDropper failed:', error);
    }
  };

  const isSupported = typeof window !== 'undefined' && 'EyeDropper' in window;

  if (!isSupported) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleEyeDropper}
      className={cn('h-8 w-8 shrink-0 text-muted-foreground', className)}
      {...props}
    >
      <PipetteIcon size={14} />
    </Button>
  );
};

export const ColorPickerOutput = ({ className, ...props }: ComponentProps<typeof SelectTrigger>) => {
  const { mode, setMode } = useColorPicker();
  const formats = ['hex', 'rgb', 'hsl'];
  
  return (
    <Select value={mode} onValueChange={setMode}>
      <SelectTrigger className={cn('h-8 w-[4.5rem] shrink-0 text-[10px] font-bold', className)} {...props}>
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem key={format} value={format} className="text-[10px] font-bold">
            {format}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const PercentageInput = ({ className, ...props }: ComponentProps<typeof Input>) => {
  return (
    <div className="relative">
      <Input
        type="text"
        className={cn('h-8 w-12 rounded-l-none bg-muted/50 px-2 text-[10px] font-bold shadow-none', className)}
        {...props}
      />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
        %
      </span>
    </div>
  );
};

export const ColorPickerFormat = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { hue, saturation, lightness, alpha, mode, setHue, setSaturation, setLightness, setAlpha } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);

  const handleHexChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    try {
      const c = Color(e.target.value);
      setHue(c.hue());
      setSaturation(c.saturationl());
      setLightness(c.lightness());
    } catch (err) {
      // Ignore
    }
  };

  if (mode === 'hex') {
    return (
      <div className={cn('relative flex items-center shadow-sm', className)} {...props}>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">#</span>
        <Input
          type="text"
          value={color.hex().replace('#', '')}
          onChange={handleHexChange}
          className="h-8 rounded-r-none bg-muted/50 pl-5 pr-2 text-[10px] font-bold shadow-none"
        />
        <PercentageInput value={alpha} onChange={(e) => setAlpha(parseInt(e.target.value) || 0)} />
      </div>
    );
  }

  const values = mode === 'rgb' ? color.rgb().array() : color.hsl().array();

  return (
    <div className={cn('flex items-center shadow-sm', className)} {...props}>
      {values.slice(0, 3).map((v, i) => (
        <Input
          key={i}
          type="text"
          value={Math.round(v)}
          readOnly
          className={cn(
            'h-8 w-10 bg-muted/50 px-1 text-center text-[10px] font-bold shadow-none',
            i === 0 ? 'rounded-r-none' : 'rounded-none border-l-0'
          )}
        />
      ))}
      <PercentageInput value={alpha} readOnly className="border-l-0" />
    </div>
  );
};
