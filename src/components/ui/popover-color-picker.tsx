import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ColorPicker, 
  ColorPickerSelection, 
  ColorPickerHue, 
  ColorPickerAlpha, 
  ColorPickerOutput, 
  ColorPickerFormat, 
  ColorPickerEyeDropper 
} from './color-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PopoverColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start gap-2 px-3 text-left font-normal', className)}
        >
          <div
            className="h-4 w-4 shrink-0 rounded border shadow-sm"
            style={{ backgroundColor: value || '#000000' }}
          />
          <span className="truncate text-xs font-mono">{value || 'Select color'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <ColorPicker value={value} onChange={onChange}>
          <ColorPickerSelection />
          <div className="flex items-center gap-3">
            <ColorPickerEyeDropper />
            <div className="grid flex-1 gap-1.5">
              <ColorPickerHue />
              <ColorPickerAlpha />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerOutput />
            <ColorPickerFormat className="flex-1" />
          </div>
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}
