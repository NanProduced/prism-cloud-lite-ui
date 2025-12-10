import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Search, FolderPlus, Upload, Send, ArrowUpRight, FileText, Layers } from "lucide-react";
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

interface CommandItemData {
  id: string;
  title: string;
  category: string;
  icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
}

const defaultItems: CommandItemData[] = [
  // Quick start items
  {
    id: "create-program",
    title: "Create Program",
    category: "Quick start",
    icon: FolderPlus,
    shortcut: "⌘P",
    onSelect: () => window.location.href = "/dashboard/programs",
  },
  {
    id: "upload-media",
    title: "Upload Media",
    category: "Quick start",
    icon: Upload,
    shortcut: "⌘U",
    onSelect: () => window.location.href = "/dashboard/media",
  },
  {
    id: "send-command",
    title: "Send Command",
    category: "Quick start",
    icon: Send,
    shortcut: "⌘⇧S",
    onSelect: () => console.log("Send command"),
  },
  // Navigation items
  {
    id: "dashboard",
    title: "Dashboard",
    category: "Navigation",
    icon: ArrowUpRight,
    shortcut: "⌘D",
    onSelect: () => window.location.href = "/dashboard/overview",
  },
  {
    id: "devices",
    title: "Devices",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/devices",
  },
  {
    id: "media",
    title: "Media Library",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/media",
  },
  {
    id: "programs",
    title: "Programs",
    category: "Navigation",
    icon: Layers,
    onSelect: () => window.location.href = "/dashboard/programs",
  },
  {
    id: "schedule",
    title: "Schedule",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/schedule",
  },
  {
    id: "map",
    title: "Map",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/map",
  },
  {
    id: "monitoring",
    title: "Monitoring",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/monitoring",
  },
  {
    id: "analytics",
    title: "Analytics",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/analytics",
  },
  {
    id: "messages",
    title: "Messages",
    category: "Navigation",
    icon: FileText,
    onSelect: () => window.location.href = "/dashboard/messages",
  },
  {
    id: "logs",
    title: "Logs",
    category: "Navigation",
    icon: FileText,
    onSelect: () => window.location.href = "/dashboard/logs",
  },
  {
    id: "settings",
    title: "Settings",
    category: "Navigation",
    icon: ArrowUpRight,
    onSelect: () => window.location.href = "/dashboard/settings",
  },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = defaultItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filtered.reduce((acc, item) => {
    const existing = acc.find((g) => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ category: item.category, items: [item] });
    }
    return acc;
  }, [] as Array<{ category: string; items: CommandItemData[] }>)
  .sort((a, b) => {
    // Sort "Quick start" first, then "Navigation"
    const order = { "Quick start": 0, "Navigation": 1 };
    return (order[a.category as keyof typeof order] ?? 2) - (order[b.category as keyof typeof order] ?? 2);
  });

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
          <span className="font-normal text-muted-foreground/70">Search...</span>
        </span>
        <kbd className="ms-auto inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groupedItems.map((group, index) => (
            <div key={group.category}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={group.category}>
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
