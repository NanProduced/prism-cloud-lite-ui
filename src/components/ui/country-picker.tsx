"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CONTINENT_LABELS, CONTINENT_ORDER, COUNTRIES, type ContinentCode, countryName } from "@/lib/countries";
import { CountryFlag } from "@/components/ui/country-flag";

export function CountryPicker({
  value,
  onValueChange,
  disabled,
  placeholder = "—",
  gridViewport,
  className,
  contentClassName,
}: {
  value?: string | null;
  onValueChange: (next: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  gridViewport?: HTMLElement | null;
  className?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const selectedCode = (value ?? "").trim().toUpperCase();
  const selectedName = selectedCode ? countryName(selectedCode) : undefined;

  // LyteNyte ends cell editing when the grid viewport loses focus. Since PopoverContent is portaled,
  // focusing the search input would normally trigger `focusout` on the viewport and end editing.
  // Guard this by stopping the viewport's focusout event when focus moves into this popover.
  useEffect(() => {
    if (!open) return;
    if (!gridViewport) return;
    const handler = (ev: FocusEvent) => {
      const related = ev.relatedTarget as Node | null;
      if (!related) return;
      const content = contentRef.current;
      if (!content) return;
      if (!content.contains(related)) return;
      ev.stopImmediatePropagation();
    };
    gridViewport.addEventListener("focusout", handler, true);
    return () => gridViewport.removeEventListener("focusout", handler, true);
  }, [gridViewport, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const code = c.code.toLowerCase();
      const name = c.name.toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<ContinentCode, typeof filtered>();
    for (const c of filtered) {
      const key = c.continent;
      const prev = map.get(key);
      if (prev) prev.push(c);
      else map.set(key, [c]);
    }
    return map;
  }, [filtered]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("h-8 w-full justify-between px-2 text-sm font-normal", className)}
        >
          <span className="min-w-0 flex items-center gap-2">
            {selectedCode ? (
              <>
                <CountryFlag code={selectedCode} />
                <span className="truncate">{selectedCode}</span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn("w-80 p-0", contentClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
        ref={contentRef}
      >
        <Command shouldFilter={false} className="rounded-none">
          <CommandInput
            placeholder="Search country code or name…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No countries found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
                className="gap-2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Clear</span>
                {!selectedCode && <Check className="h-4 w-4 ml-auto text-emerald-600" />}
              </CommandItem>

            </CommandGroup>

            {CONTINENT_ORDER.map((continent) => {
              const list = grouped.get(continent);
              if (!list || list.length === 0) return null;
              return (
                <CommandGroup key={continent} heading={CONTINENT_LABELS[continent]}>
                  {list.map((c) => {
                    const selected = c.code === selectedCode;
                    return (
                      <CommandItem
                        key={c.code}
                        value={`${c.code} ${c.name}`}
                        onSelect={() => {
                          onValueChange(c.code);
                          setOpen(false);
                        }}
                        className="gap-2"
                      >
                        <CountryFlag code={c.code} />
                        <div className="flex min-w-0 flex-col">
                          <div className="truncate text-sm">{c.code}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.name}</div>
                        </div>
                        {selected && <Check className="h-4 w-4 ml-auto text-emerald-600" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
        {selectedCode && selectedName && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Selected: <span className="text-foreground">{selectedCode}</span> — {selectedName}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
