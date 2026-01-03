import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { 
  Search, 
  FolderPlus, 
  Upload, 
  Send, 
  ArrowUpRight, 
  FileText, 
  Layers, 
  Monitor, 
  Image as ImageIcon, 
  Film, 
  Loader2,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchUnified } from "@/services/searchApi";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface CommandItemData {
  id: string;
  title: string;
  category: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
  metadata?: string;
}

export function CommandSearch() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch unified search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["unified-search", debouncedSearch],
    queryFn: () => searchUnified({ q: debouncedSearch, limit: 5 }),
    enabled: debouncedSearch.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  const defaultItems: CommandItemData[] = [
    // Quick start items
    {
      id: "create-program",
      title: t('shell.search.actions.createProgram'),
      category: "Quick start",
      icon: FolderPlus,
      shortcut: "⌘P",
      onSelect: () => navigate("/dashboard/programs"),
    },
    {
      id: "upload-media",
      title: t('shell.search.actions.uploadMedia'),
      category: "Quick start",
      icon: Upload,
      shortcut: "⌘U",
      onSelect: () => navigate("/dashboard/media"),
    },
    {
      id: "send-command",
      title: t('shell.search.actions.sendCommand'),
      category: "Quick start",
      icon: Send,
      shortcut: "⌘⇧S",
      onSelect: () => console.log("Send command"),
    },
    // Navigation items
    {
      id: "dashboard",
      title: t('nav.dashboard'),
      category: "Navigation",
      icon: ArrowUpRight,
      shortcut: "⌘D",
      onSelect: () => navigate("/dashboard/overview"),
    },
    {
      id: "devices",
      title: t('nav.devices'),
      category: "Navigation",
      icon: ArrowUpRight,
      onSelect: () => navigate("/dashboard/devices"),
    },
    {
      id: "media",
      title: t('nav.mediaLibrary'),
      category: "Navigation",
      icon: ArrowUpRight,
      onSelect: () => navigate("/dashboard/media"),
    },
    {
      id: "programs",
      title: t('nav.programs'),
      category: "Navigation",
      icon: Layers,
      onSelect: () => navigate("/dashboard/programs"),
    },
    {
      id: "schedule",
      title: t('nav.schedule'),
      category: "Navigation",
      icon: ArrowUpRight,
      onSelect: () => navigate("/dashboard/schedule"),
    },
  ];

  const filteredDefaultItems = defaultItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedDefaultItems = filteredDefaultItems.reduce((acc, item) => {
    const existing = acc.find((g) => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ category: item.category, items: [item] });
    }
    return acc;
  }, [] as Array<{ category: string; items: CommandItemData[] }>)
  .sort((a, b) => {
    const order = { "Quick start": 0, "Navigation": 1 };
    return (order[a.category as keyof typeof order] ?? 2) - (order[b.category as keyof typeof order] ?? 2);
  });

  const getCategoryLabel = (cat: string) => {
    if (cat === "Quick start") return t('shell.search.categories.quickStart');
    if (cat === "Navigation") return t('shell.search.categories.navigation');
    return cat;
  };

  return (
    <>
      <button
        className="inline-flex h-9 w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 hover:bg-accent hover:text-accent-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex grow items-center">
          <Search
            className="me-2 h-4 w-4"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="font-normal text-muted-foreground/70">{t('shell.search.hint')}</span>
        </span>
        <kbd className="ms-auto inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t('shell.search.dialogPlaceholder')}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('shell.search.searching')}
            </div>
          )}
          
          <CommandEmpty>{!isLoading && t('shell.search.empty')}</CommandEmpty>

          {/* API Search Results */}
          {searchResults?.success && searchResults.data && (
            <>
              {searchResults.data.devices && searchResults.data.devices.length > 0 && (
                <CommandGroup heading={t('shell.search.categories.devices')}>
                  {searchResults.data.devices.map((device) => (
                    <CommandItem
                      key={`device-${device.id}`}
                      value={`device-${device.id}-${device.name}`}
                      onSelect={() => {
                        navigate(`/dashboard/devices?id=${device.id}`);
                        setOpen(false);
                      }}
                    >
                      <Monitor className="me-2 h-4 w-4 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{device.name}</span>
                        {device.ip && (
                          <span className="text-xs text-muted-foreground">{device.ip} • {device.model}</span>
                        )}
                      </div>
                      <div className="ms-auto flex items-center gap-2">
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="h-5 text-[10px] px-1.5">
                          {device.status}
                        </Badge>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.data.programs && searchResults.data.programs.length > 0 && (
                <CommandGroup heading={t('shell.search.categories.programs')}>
                  {searchResults.data.programs.map((program) => (
                    <CommandItem
                      key={`program-${program.id}`}
                      value={`program-${program.id}-${program.name}`}
                      onSelect={() => {
                        navigate(`/dashboard/programs?id=${program.id}`);
                        setOpen(false);
                      }}
                    >
                      <Layers className="me-2 h-4 w-4 text-purple-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{program.name}</span>
                        <span className="text-xs text-muted-foreground">{program.resolution}</span>
                      </div>
                      <ChevronRight className="ms-auto h-3 w-3 text-muted-foreground/50" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.data.media && searchResults.data.media.length > 0 && (
                <CommandGroup heading={t('shell.search.categories.media')}>
                  {searchResults.data.media.map((item) => (
                    <CommandItem
                      key={`media-${item.id}`}
                      value={`media-${item.id}-${item.title}`}
                      onSelect={() => {
                        navigate(`/dashboard/media?id=${item.id}`);
                        setOpen(false);
                      }}
                    >
                      {item.kind === 'video' ? (
                        <Film className="me-2 h-4 w-4 text-orange-500" />
                      ) : (
                        <ImageIcon className="me-2 h-4 w-4 text-green-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.kind.toUpperCase()} • {(item.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <ChevronRight className="ms-auto h-3 w-3 text-muted-foreground/50" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {/* Default Items (Navigation & Quick Start) */}
          {groupedDefaultItems.map((group, index) => (
            <div key={group.category}>
              {(index > 0 || (searchResults?.data && Object.values(searchResults.data).some(arr => arr?.length > 0))) && <CommandSeparator />}
              <CommandGroup heading={getCategoryLabel(group.category)}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => {
                        item.onSelect();
                        setOpen(false);
                      }}
                    >
                      <Icon className="me-2 h-4 w-4" />
                      <span>{item.title}</span>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
