import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Monitor } from 'lucide-react';

import type { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function DeviceResolutionPicker({
  devices,
  value,
  onChange,
  placeholder = 'Select device…',
  disabled = false,
}: {
  devices: Device[];
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => (value ? devices.find((d) => String(d.deviceId || d.id) === value) ?? null : null), [devices, value]);
  const label = selected 
    ? `${selected.deviceName} · ${selected.resolution?.width ?? '?' }×${selected.resolution?.height ?? '?'}` 
    : placeholder;

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between gap-2"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder="Search devices…" />
          <CommandList className="max-h-72">
            <CommandGroup heading="Resolution">
              <CommandItem
                value="custom"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="gap-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <Monitor className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">Custom</div>
                  <div className="truncate text-xs text-muted-foreground">Set width/height manually</div>
                </div>
                {!selected && <Check className="h-4 w-4 text-primary" />}
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Devices">
              {devices.map((device) => {
                const id = String(device.deviceId || device.id);
                const isSelected = id === value;
                const w = device.resolution?.width ?? 0;
                const h = device.resolution?.height ?? 0;

                return (
                  <CommandItem
                    key={id}
                    value={`${device.deviceName} ${device.alias ?? ''} ${id} ${w} ${h}`}
                    onSelect={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{device.deviceName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {device.alias ? `${device.alias} · ` : ''}
                        {w > 0 ? `${w}×${h}` : 'Resolution unknown'}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

