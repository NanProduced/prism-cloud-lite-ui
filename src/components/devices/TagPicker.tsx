import { useMemo, useState, type ReactNode } from 'react';
import type { Tag } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { TagChip } from './TagChip';
import { TAG_COLOR_PRESETS, TAG_ICON_OPTIONS, isHexColor } from './tagging';
import { ArrowLeft, Check, Palette, Plus, X } from 'lucide-react';
import { PopoverColorPicker } from '@/components/ui/popover-color-picker';

interface CreateTagDraft {
  name: string;
  color: string;
  icon?: string;
}

interface TagPickerProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tag: Tag) => void;
  onCreateTag: (draft: CreateTagDraft) => Tag;
  children: ReactNode;
}

export function TagPicker({
  allTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  children,
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [query, setQuery] = useState('');

  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState<string | undefined>(undefined);
  const [draftColor, setDraftColor] = useState<string>('slate');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredTags = useMemo(() => {
    if (!normalizedQuery) return allTags;
    return allTags.filter((tag) => {
      const name = tag.tagName.toLowerCase();
      const slug = tag.tagSlug.toLowerCase();
      return name.includes(normalizedQuery) || slug.includes(normalizedQuery);
    });
  }, [allTags, normalizedQuery]);

  const hasExactMatch = useMemo(() => {
    if (!normalizedQuery) return false;
    return allTags.some((tag) => tag.tagName.toLowerCase() === normalizedQuery);
  }, [allTags, normalizedQuery]);

  const canCreate = Boolean(normalizedQuery) && !hasExactMatch;

  const reset = () => {
    setMode('select');
    setQuery('');
    setDraftName('');
    setDraftIcon(undefined);
    setDraftColor('slate');
  };

  const startCreate = (name: string) => {
    setMode('create');
    setDraftName(name);
    setDraftIcon(undefined);
    setDraftColor('slate');
  };

  const commitCreate = () => {
    const name = draftName.trim();
    if (!name) return;
    const created = onCreateTag({
      name,
      color: draftColor,
      icon: draftIcon,
    });
    onToggleTag(created);
    setOpen(false);
    reset();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const previewTag: Tag = {
    id: 'draft',
    tagName: draftName.trim() || 'New tag',
    tagSlug: '',
    color: draftColor,
    icon: draftIcon,
  };

  const customColorValue = isHexColor(draftColor) ? draftColor : '#64748b';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="start" sideOffset={8}>
        {mode === 'select' ? (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="text-sm font-medium">Tags</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Command shouldFilter={false} className="rounded-none">
              <CommandInput
                placeholder="Search tags…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList className="max-h-72">
                <CommandGroup heading={filteredTags.length > 0 ? 'Available' : undefined}>
                  {canCreate && (
                    <CommandItem
                      value={`create-${normalizedQuery}`}
                      onSelect={() => startCreate(query.trim())}
                      className="gap-2"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-sm truncate">Create “{query.trim()}”</div>
                        <div className="text-xs text-muted-foreground">
                          Choose icon and color
                        </div>
                      </div>
                    </CommandItem>
                  )}

                      {filteredTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.tagSlug);
                    return (
                      <CommandItem
                        key={tag.tagSlug}
                        value={`${tag.tagName} ${tag.tagSlug}`}
                        onSelect={() => onToggleTag(tag)}
                        className="gap-2"
                      >
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-md border bg-background',
                            selected && 'border-primary',
                          )}
                        >
                          <Check className={cn('h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                        </div>
                        <TagChip tag={tag} className="max-w-[220px]" />
                      </CommandItem>
                    );
                  })}

                  {filteredTags.length === 0 && !canCreate && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No tags found
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMode('select')}
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">Create tag</div>
                <div className="text-xs text-muted-foreground truncate">
                  Use muted presets or a custom color
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3 space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground">Name</div>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Tag name"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Icon</div>
                <div className="grid grid-cols-7 gap-2">
                  <Button
                    type="button"
                    variant={draftIcon ? 'outline' : 'default'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setDraftIcon(undefined)}
                    aria-label="No icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {TAG_ICON_OPTIONS.map(({ key, Icon, label }) => (
                    <Button
                      key={key}
                      type="button"
                      variant={draftIcon === key ? 'default' : 'outline'}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setDraftIcon(key)}
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Color</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {TAG_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      className={cn(
                        'h-8 w-8 rounded-full border transition ring-offset-background',
                        preset.className,
                        draftColor === preset.key && 'ring-2 ring-ring ring-offset-2',
                      )}
                      onClick={() => setDraftColor(preset.key)}
                      aria-label={preset.label}
                      title={preset.label}
                    />
                  ))}

                  <div className="flex items-center gap-2 ms-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      <Palette className="h-3 w-3" />
                      Custom
                    </div>
                    <PopoverColorPicker
                      value={customColorValue}
                      onChange={(v) => setDraftColor(v)}
                      className="h-8 w-24 px-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <TagChip tag={previewTag} className="max-w-[190px]" />
                <Button type="button" onClick={commitCreate} disabled={!draftName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
