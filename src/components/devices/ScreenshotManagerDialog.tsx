import { useState, useMemo } from "react";
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

interface ScreenshotManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshots: HistoricalScreenshot[];
  onDelete?: (ids: string[]) => void;
  onClearAll?: () => void;
}

export function ScreenshotManagerDialog({
  open,
  onOpenChange,
  screenshots: initialScreenshots,
  onDelete,
  onClearAll
}: ScreenshotManagerDialogProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localScreenshots, setLocalScreenshots] = useState<HistoricalScreenshot[]>(initialScreenshots);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Snapshot list updated");
    }, 1000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
           className="max-w-5xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl"
           onPointerDownOutside={(e) => {
              if (previewImage || showClearConfirm) e.preventDefault();
           }}
        >
          {/* REDESIGNED HEADER: More professional & visually balanced */}
          <DialogHeader className="px-10 py-8 flex flex-row items-center justify-between border-b bg-gradient-to-r from-muted/20 to-transparent">
            <div className="flex items-center gap-6">
               <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                  <Camera className="h-7 w-7 text-primary" />
               </div>
               <div className="space-y-1">
                  <div className="flex items-center gap-3">
                     <DialogTitle className="text-3xl font-black tracking-tighter uppercase">
                        History Snapshots
                     </DialogTitle>
                     <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black tracking-widest px-2 h-5">
                        ARCHIVE
                     </Badge>
                  </div>
                  <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none opacity-70">
                     Visual monitoring log & storage management
                  </DialogDescription>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="bg-background/80 backdrop-blur-md p-1.5 rounded-2xl border shadow-sm flex items-center gap-1.5">
                  <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                          <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-9 w-9 rounded-xl hover:bg-muted transition-all active:scale-90" 
                             onClick={handleRefresh}
                             disabled={isRefreshing}
                          >
                             <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin text-primary")} />
                          </Button>
                       </TooltipTrigger>
                       <TooltipContent>
                          <p className="text-xs font-bold">Synchronize</p>
                       </TooltipContent>
                     </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-4 mx-1" />

                  <div className="flex items-center gap-1">
                     <Button 
                        variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-9 w-9 rounded-xl shadow-none transition-all active:scale-90"
                        onClick={() => setViewMode('grid')}
                     >
                        <LayoutGrid className="h-4 w-4" />
                     </Button>
                     <Button 
                        variant={viewMode === 'list' ? "secondary" : "ghost"} 
                        size="icon" 
                        className="h-9 w-9 rounded-xl shadow-none transition-all active:scale-90"
                        onClick={() => setViewMode('list')}
                     >
                        <List className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
            </div>
          </DialogHeader>

          <div className="px-8 py-6">
             <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border border-dashed flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-5">
                   <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600 shadow-inner">
                      <HardDrive className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">Storage Usage</p>
                      <div className="flex items-end gap-2">
                         <span className="text-xl font-black tracking-tighter text-amber-600 leading-none">{formatSize(totalSize)}</span>
                         <span className="text-[10px] font-bold text-muted-foreground/40 pb-0.5 uppercase">/ Quota 1.2 GB</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                   <Button 
                      variant="outline" 
                      className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 gap-2 bg-background shadow-sm hover:shadow-md transition-all active:scale-95"
                      onClick={handleSelectAll}
                   >
                      {selectedIds.length === localScreenshots.length && localScreenshots.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      Select All
                   </Button>

                   <div className="flex items-center gap-3 pl-3 border-l border-muted">
                      <Button 
                         variant="destructive" 
                         className={cn(
                            "rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 gap-2 shadow-lg transition-all active:scale-95",
                            selectedIds.length === 0 ? "opacity-20 grayscale pointer-events-none" : "shadow-rose-500/20"
                         )}
                         onClick={handleDeleteSelected}
                         disabled={selectedIds.length === 0}
                      >
                         <Trash2 className="h-4 w-4" />
                         Delete ({selectedIds.length})
                      </Button>
                      <Button 
                         variant="ghost" 
                         className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-all active:scale-95"
                         onClick={() => setShowClearConfirm(true)}
                      >
                         <AlertTriangle className="h-4 w-4" />
                         Clear All
                      </Button>
                   </div>
                </div>
             </div>
          </div>

          <ScrollArea className="flex-1 px-8 pb-8">
             {localScreenshots.length === 0 ? (
               <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-30">
                  <Eye className="h-12 w-12" />
                  <p className="font-black text-[10px] uppercase tracking-[0.2em]">No history snapshots found</p>
               </div>
             ) : viewMode === 'grid' ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {localScreenshots.map((s) => (
                    <div 
                      key={s.id} 
                      className={cn(
                        "group relative aspect-video rounded-3xl overflow-hidden border-2 transition-all cursor-pointer",
                        selectedIds.includes(s.id) ? "border-primary ring-8 ring-primary/5 shadow-xl scale-[0.98]" : "border-muted/50 hover:border-primary/40 shadow-sm"
                      )}
                      onClick={() => setPreviewImage(s.url)}
                    >
                       <img src={s.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="History" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                       
                       <div className="absolute top-4 left-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                             checked={selectedIds.includes(s.id)}
                             className="bg-white/90 border-none shadow-xl h-5 w-5 data-[state=checked]:bg-primary"
                             onCheckedChange={() => handleToggleSelect(s.id)}
                          />
                       </div>

                       <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <div className="text-white text-[10px] font-black tracking-tight leading-none drop-shadow-lg">
                             <p className="flex items-center gap-1.5 mb-1"><Clock className="h-3 w-3 text-primary" /> {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             <p className="opacity-60">{new Date(s.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                             <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-8 w-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl"
                                onClick={() => setPreviewImage(s.url)}
                             >
                                <Maximize2 className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="space-y-3">
                  <div className="grid grid-cols-12 px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b bg-muted/5 rounded-t-2xl">
                     <div className="col-span-1 text-center">Select</div>
                     <div className="col-span-6">Snapshot Details</div>
                     <div className="col-span-3 text-right">File Size</div>
                     <div className="col-span-2 text-right">Actions</div>
                  </div>
                  {localScreenshots.map((s) => (
                    <div 
                      key={s.id} 
                      className={cn(
                        "grid grid-cols-12 px-6 py-5 items-center rounded-2xl transition-all border cursor-pointer",
                        selectedIds.includes(s.id) ? "bg-primary/[0.03] border-primary/20 shadow-inner" : "hover:bg-muted/30 border-transparent"
                      )}
                      onClick={() => handleToggleSelect(s.id)}
                    >
                       <div className="col-span-1 flex justify-center">
                          <Checkbox 
                             checked={selectedIds.includes(s.id)}
                             onCheckedChange={() => handleToggleSelect(s.id)}
                             onClick={(e) => e.stopPropagation()}
                             className="h-5 w-5"
                          />
                       </div>
                       <div className="col-span-6 flex items-center gap-5">
                          <div 
                             className="h-12 w-20 rounded-xl overflow-hidden border bg-muted relative group/thumb shadow-sm"
                             onClick={(e) => { e.stopPropagation(); setPreviewImage(s.url); }}
                          >
                             <img src={s.url} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110" alt="Thumb" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="h-4 w-4 text-white" />
                             </div>
                          </div>
                          <div className="space-y-1">
                             <p className="text-sm font-black tracking-tight">{new Date(s.timestamp).toLocaleString()}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Snapshot ID: {s.id.toUpperCase()}</p>
                          </div>
                       </div>
                       <div className="col-span-3 text-right">
                          <p className="text-sm font-mono font-black text-slate-600">{formatSize(s.size)}</p>
                       </div>
                       <div className="col-span-2 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                             variant="secondary" 
                             size="icon" 
                             className="h-9 w-9 rounded-xl border shadow-sm"
                             onClick={() => setPreviewImage(s.url)}
                          >
                             <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-colors"
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
             )}
          </ScrollArea>
          
          <Separator />
          
          <div className="p-8 flex justify-end bg-muted/5">
             <Button 
                className="rounded-2xl font-black text-xs px-12 h-12 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" 
                onClick={() => onOpenChange(false)}
             >
                Close Management
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SAFETY CLEAR ALL CONFIRMATION */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
         <DialogContent className="max-w-md p-8 rounded-[2rem] z-[10010]" zIndex={10010}>
            <div className="flex flex-col items-center text-center gap-6">
               <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                  <AlertCircle className="h-8 w-8" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight">Clear All Snapshots?</h3>
                  <p className="text-sm text-muted-foreground font-medium">This action will permanently delete all historical monitor data for this device from the server. This cannot be undone.</p>
               </div>
               <div className="flex w-full gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl font-black text-[10px] uppercase h-11" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1 rounded-xl font-black text-[10px] uppercase h-11 shadow-lg shadow-rose-500/20" onClick={handleClearAll}>Confirm Clear</Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

      {/* FULL SIZE PREVIEW - Higher z-index to stay on top */}
      {previewImage && (
         <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent 
               className="max-w-[98vw] w-auto h-auto p-0 bg-transparent border-none shadow-none flex items-center justify-center focus-visible:outline-none scale-100 transition-all"
               zIndex={10100}
            >
               <div className="relative group animate-in zoom-in-95 duration-300 flex flex-col items-center">
                  <img 
                     src={previewImage} 
                     className="max-w-full max-h-[95vh] rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] border-8 border-white/10" 
                     alt="Preview" 
                  />
                  <Button 
                     size="icon" 
                     variant="secondary" 
                     className="absolute top-6 right-6 rounded-full h-12 w-12 shadow-2xl bg-black/50 text-white border-white/10 hover:bg-black/80 backdrop-blur-xl transition-all"
                     onClick={() => setPreviewImage(null)}
                  >
                     <X className="h-6 w-6" />
                  </Button>
                  
                  <div className="mt-6 px-8 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 text-white/90 text-xs font-black uppercase tracking-[0.3em] shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                     Press ESC or Click Outside to exit
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      )}
    </>
  );
}