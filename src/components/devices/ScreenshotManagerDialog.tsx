import { useEffect, useMemo, useState } from "react";
import { 
  Trash2, 
  Clock, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Square,
  AlertTriangle,
  HardDrive,
  Download,
  Eye,
  Maximize2,
  RefreshCw,
  X,
  AlertCircle,
  Camera
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { HistoricalScreenshot } from "@/types/device";
import { useTimeFormatter } from "@/hooks/use-time-formatter";

interface ScreenshotManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshots: HistoricalScreenshot[];
  onDelete?: (ids: string[]) => void;
  onClearAll?: () => void;
  onRefresh?: () => void;
}

export function ScreenshotManagerDialog({
  open,
  onOpenChange,
  screenshots: initialScreenshots,
  onDelete,
  onClearAll,
  onRefresh
}: ScreenshotManagerDialogProps) {
  const { formatDateTime } = useTimeFormatter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localScreenshots, setLocalScreenshots] = useState<HistoricalScreenshot[]>(initialScreenshots);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Sync local state with props when refreshed
  useEffect(() => {
    setLocalScreenshots(initialScreenshots);
  }, [initialScreenshots]);

  const totalSize = useMemo(() => {
    return localScreenshots.reduce((acc, curr) => acc + curr.size, 0);
  }, [localScreenshots]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === localScreenshots.length && localScreenshots.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localScreenshots.map(s => s.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    toast.promise(new Promise(r => setTimeout(r, 800)), {
      loading: `Deleting ${selectedIds.length} items...`,
      success: () => {
        const remaining = localScreenshots.filter(s => !selectedIds.includes(s.id));
        setLocalScreenshots(remaining);
        onDelete?.(selectedIds);
        setSelectedIds([]);
        return `Deleted ${selectedIds.length} items`;
      },
      error: "Failed to delete",
    });
  };

  const handleClearAll = () => {
    setShowClearConfirm(false);
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: "Clearing all history...",
      success: () => {
        setLocalScreenshots([]);
        setSelectedIds([]);
        onClearAll?.();
        return "History cleared";
      },
      error: "Failed to clear",
    });
  };

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Snapshot list updated");
      }, 800);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
           className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-xl border"
           onPointerDownOutside={(e) => {
              if (previewImage || showClearConfirm) e.preventDefault();
           }}
        >
          <DialogHeader className="px-6 py-5 flex flex-row items-center justify-start border-b bg-muted/30 space-y-0 w-full">
            <div className="flex items-center gap-4 w-full">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                  <Camera className="h-6 w-6 text-primary" />
               </div>
               <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                     <DialogTitle className="text-2xl font-bold tracking-tight text-left">
                        History Snapshots
                     </DialogTitle>
                     <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-2 h-5 uppercase tracking-wider shrink-0">
                        Archive
                     </Badge>
                  </div>
                  <DialogDescription className="text-sm text-muted-foreground/80 font-medium text-left">
                     Visual monitoring log and storage management for this device
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>

          {/* Toolbar & Stats Bar - Rebalanced Layout */}
          <div className="px-6 py-3 border-b bg-background flex flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-transparent">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-baseline gap-1.5">
                         <span className="text-sm font-semibold">{formatSize(totalSize)}</span>
                         <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">/ 1.2 GB</span>
                      </div>
                   </div>
                   <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden hidden lg:block">
                      <div 
                         className="h-full bg-primary transition-all duration-500" 
                         style={{ width: `${Math.min(100, (totalSize / (1.2 * 1024 * 1024 * 1024)) * 100)}%` }} 
                      />
                   </div>
                </div>

                <div className="h-4 w-px bg-border hidden sm:block" />

                <Button 
                   variant="outline" 
                   size="sm"
                   className="h-8 px-3 gap-2 text-xs font-medium border-dashed hover:border-primary/50 hover:bg-primary/5"
                   onClick={handleSelectAll}
                >
                   {selectedIds.length === localScreenshots.length && localScreenshots.length > 0 ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                   {selectedIds.length === localScreenshots.length && localScreenshots.length > 0 ? "Deselect All" : "Select All"}
                </Button>
             </div>
             
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                   <Button 
                      variant="destructive" 
                      size="sm"
                      className="h-8 px-3 gap-2 text-xs font-medium shadow-sm"
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.length === 0}
                   >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete {selectedIds.length > 0 && `(${selectedIds.length})`}
                   </Button>
                   <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-3 gap-2 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowClearConfirm(true)}
                   >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Clear All
                   </Button>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <div className="flex items-center bg-muted/50 border rounded-lg p-0.5 gap-0.5 ml-2">
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-md" 
                              onClick={handleRefresh}
                              disabled={isRefreshing}
                           >
                              <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isRefreshing && "animate-spin text-primary")} />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="text-xs">Refresh data</p>
                        </TooltipContent>
                      </Tooltip>
                   </TooltipProvider>

                   <Separator orientation="vertical" className="h-3.5 mx-0.5 opacity-50" />

                   <Button 
                      variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-md", viewMode === 'grid' && "bg-background shadow-sm")}
                      onClick={() => setViewMode('grid')}
                   >
                      <LayoutGrid className="h-3.5 w-3.5" />
                   </Button>
                   <Button 
                      variant={viewMode === 'list' ? "secondary" : "ghost"} 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-md", viewMode === 'list' && "bg-background shadow-sm")}
                      onClick={() => setViewMode('list')}
                   >
                      <List className="h-3.5 w-3.5" />
                   </Button>
                </div>
             </div>
          </div>

          <ScrollArea className="flex-1 bg-muted/5">
             <div className="p-6">
                {localScreenshots.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground/50">
                     <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Eye className="h-8 w-8" />
                     </div>
                     <p className="text-sm font-medium">No history snapshots found</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {localScreenshots.map((s) => (
                       <div 
                         key={s.id} 
                         className={cn(
                           "group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all cursor-pointer bg-muted shadow-sm",
                           selectedIds.includes(s.id) ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                         )}
                         onClick={() => setPreviewImage(s.url || s.screenshotUrl)}
                       >
                          <img src={s.url || s.screenshotUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="History" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
                             <Checkbox 
                                checked={selectedIds.includes(s.id)}
                                className="h-4 w-4 rounded-md data-[state=checked]:bg-primary"
                                onCheckedChange={() => handleToggleSelect(s.id)}
                             />
                          </div>

                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                             <div className="text-white text-[10px] font-medium leading-none drop-shadow-md">
                                <p className="mb-1">{formatDateTime(s.timestamp || s.createdAt)}</p>
                             </div>
                             <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                   size="icon" 
                                   variant="secondary" 
                                   className="h-7 w-7 rounded-lg bg-black/50 border border-white/20 text-white hover:bg-primary transition-colors"
                                   onClick={() => setPreviewImage(s.url || s.screenshotUrl)}
                                >
                                   <Maximize2 className="h-3.5 w-3.5" />
                                </Button>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-background overflow-hidden">
                     <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider border-b bg-muted/50">
                        <div className="col-span-1 text-center">Sel</div>
                        <div className="col-span-7">Snapshot Details</div>
                        <div className="col-span-2 text-right">Size</div>
                        <div className="col-span-2 text-right">Actions</div>
                     </div>
                     <div className="divide-y">
                        {localScreenshots.map((s) => (
                          <div 
                            key={s.id} 
                            className={cn(
                              "grid grid-cols-12 px-4 py-3 items-center transition-colors cursor-pointer",
                              selectedIds.includes(s.id) ? "bg-primary/5" : "hover:bg-muted/30"
                            )}
                            onClick={() => handleToggleSelect(s.id)}
                          >
                             <div className="col-span-1 flex justify-center">
                                <Checkbox 
                                   checked={selectedIds.includes(s.id)}
                                   onCheckedChange={() => handleToggleSelect(s.id)}
                                   onClick={(e) => e.stopPropagation()}
                                   className="h-4 w-4 rounded-md"
                                />
                             </div>
                             <div className="col-span-7 flex items-center gap-4">
                                <div 
                                   className="h-10 w-16 rounded-md overflow-hidden border bg-muted relative group/thumb shadow-sm"
                                   onClick={(e) => { e.stopPropagation(); setPreviewImage(s.url || s.screenshotUrl); }}
                                >
                                   <img src={s.url || s.screenshotUrl} className="w-full h-full object-cover" alt="Thumb" />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                      <Maximize2 className="h-4 w-4 text-white" />
                                   </div>
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-sm font-medium tracking-tight">{formatDateTime(s.timestamp || s.createdAt)}</p>
                                   <p className="text-[10px] text-muted-foreground font-mono">ID: {(s.id || s.screenshotId)?.slice(0, 8).toUpperCase() ?? "UNKNOWN"}</p>
                                </div>
                             </div>
                             <div className="col-span-2 text-right">
                                <p className="text-xs font-medium text-muted-foreground">{formatSize(s.size)}</p>
                             </div>
                             <div className="col-span-2 text-right flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 rounded-md"
                                   onClick={() => setPreviewImage(s.url || s.screenshotUrl)}
                                >
                                   <Maximize2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds([s.id]);
                                    handleDeleteSelected();
                                  }}
                                >
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
          </ScrollArea>
          
          <div className="p-4 border-t flex justify-end bg-muted/30">
             <Button 
                variant="outline"
                className="h-10 px-6 font-medium" 
                onClick={() => onOpenChange(false)}
             >
                Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SAFETY CLEAR ALL CONFIRMATION */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
         <DialogContent className="max-w-md p-6 rounded-xl">
            <div className="flex flex-col items-center text-center gap-4">
               <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                  <AlertCircle className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Clear All Snapshots?</h3>
                  <p className="text-sm text-muted-foreground">This action will permanently delete all historical monitor data for this device. This cannot be undone.</p>
               </div>
               <div className="flex w-full gap-3 mt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1" onClick={handleClearAll}>Confirm Clear</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

      {/* FULL SIZE PREVIEW */}
      {previewImage && (
         <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent 
               className="max-w-[95vw] w-auto h-auto p-0 bg-black/95 border-none shadow-2xl flex items-center justify-center focus-visible:outline-none"
               zIndex={10100}
            >
               <div className="relative group animate-in zoom-in-95 duration-200">
                  <img 
                     src={previewImage} 
                     className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-white/10" 
                     alt="Preview" 
                  />
                  <Button 
                     size="icon" 
                     variant="ghost" 
                     className="absolute top-4 right-4 rounded-full h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all"
                     onClick={() => setPreviewImage(null)}
                  >
                     <X className="h-5 w-5" />
                  </Button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/80 text-[10px] font-medium uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                     ESC to close
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      )}
    </>
  );
}
