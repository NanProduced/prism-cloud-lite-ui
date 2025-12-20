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
  X
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
  deviceName: string;
  screenshots: HistoricalScreenshot[];
  onDelete?: (ids: string[]) => void;
  onClearAll?: () => void;
}

export function ScreenshotManagerDialog({
  open,
  onOpenChange,
  deviceName,
  screenshots: initialScreenshots,
  onDelete,
  onClearAll
}: ScreenshotManagerDialogProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localScreenshots, setLocalScreenshots] = useState<HistoricalScreenshot[]>(initialScreenshots);

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

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === localScreenshots.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localScreenshots.map(s => s.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    toast.promise(new Promise(r => setTimeout(r, 800)), {
      loading: `正在删除 ${selectedIds.length} 张截图...`,
      success: () => {
        const remaining = localScreenshots.filter(s => !selectedIds.includes(s.id));
        setLocalScreenshots(remaining);
        onDelete?.(selectedIds);
        setSelectedIds([]);
        return `已删除 ${selectedIds.length} 张截图`;
      },
      error: "删除失败",
    });
  };

  const handleClearAll = () => {
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: "正在清空所有历史截图...",
      success: () => {
        setLocalScreenshots([]);
        setSelectedIds([]);
        onClearAll?.();
        return "已清空所有历史记录";
      },
      error: "清空失败",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              截图管理器
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 h-5 border-primary/20 bg-primary/5 text-primary">
                {deviceName}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              管理存储在服务器上的历史监控画面
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-muted/50 p-1 rounded-xl flex items-center">
                <Button 
                   variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                   size="icon" 
                   className="h-8 w-8 rounded-lg"
                   onClick={() => setViewMode('grid')}
                >
                   <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                   variant={viewMode === 'list' ? "secondary" : "ghost"} 
                   size="icon" 
                   className="h-8 w-8 rounded-lg"
                   onClick={() => setViewMode('list')}
                >
                   <List className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </DialogHeader>

        <div className="px-8 py-6">
           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-dashed flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-600">
                    <HardDrive className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">存储占用</p>
                    <p className="text-sm font-black tracking-tight">
                       <span className="text-amber-600">{formatSize(totalSize)}</span>
                       <span className="text-muted-foreground/40 mx-2">/</span>
                       <span className="text-muted-foreground">配额 1.2 GB</span>
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-4 gap-2"
                    onClick={handleSelectAll}
                 >
                    {selectedIds.length === localScreenshots.length && localScreenshots.length > 0 ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                    全选
                 </Button>
                 {selectedIds.length > 0 && (
                    <Button 
                       variant="destructive" 
                       size="sm" 
                       className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-4 gap-2 shadow-lg shadow-rose-500/20"
                       onClick={handleDeleteSelected}
                    >
                       <Trash2 className="h-3.5 w-3.5" />
                       删除所选 ({selectedIds.length})
                    </Button>
                 )}
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-4 gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50"
                    onClick={handleClearAll}
                 >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    清空历史
                 </Button>
              </div>
           </div>
        </div>

        <ScrollArea className="flex-1 px-8 pb-8">
           {localScreenshots.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-30">
                <Eye className="h-12 w-12" />
                <p className="font-black text-[10px] uppercase tracking-[0.2em]">暂无历史截图记录</p>
             </div>
           ) : viewMode === 'grid' ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {localScreenshots.map((s) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                      selectedIds.includes(s.id) ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-muted/50 hover:border-primary/40 shadow-sm"
                    )}
                    onClick={() => handleToggleSelect(s.id)}
                  >
                     <img src={s.url} className="w-full h-full object-cover" alt="History" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     
                     <div className="absolute top-3 left-3">
                        <Checkbox 
                           checked={selectedIds.includes(s.id)}
                           className="bg-white/90 border-none shadow-sm"
                        />
                     </div>

                     <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between translate-y-2 group-hover:translate-y-0 transition-transform">
                        <div className="text-white text-[9px] font-black tracking-tight leading-none">
                           <p className="flex items-center gap-1 mb-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                           <p className="opacity-60">{new Date(s.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                           <Button size="icon" variant="secondary" className="h-6 w-6 rounded-lg scale-90">
                              <Download className="h-3 w-3" />
                           </Button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="space-y-2">
                <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b">
                   <div className="col-span-1">选择</div>
                   <div className="col-span-6">截图时间</div>
                   <div className="col-span-3 text-right">文件大小</div>
                   <div className="col-span-2 text-right">操作</div>
                </div>
                {localScreenshots.map((s) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "grid grid-cols-12 px-6 py-4 items-center rounded-xl transition-colors border-b last:border-0",
                      selectedIds.includes(s.id) ? "bg-primary/[0.03]" : "hover:bg-muted/30"
                    )}
                  >
                     <div className="col-span-1">
                        <Checkbox 
                           checked={selectedIds.includes(s.id)}
                           onCheckedChange={() => handleToggleSelect(s.id)}
                        />
                     </div>
                     <div className="col-span-6 flex items-center gap-4">
                        <div className="h-10 w-16 rounded-lg overflow-hidden border bg-muted">
                           <img src={s.url} className="w-full h-full object-cover" alt="Thumb" />
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-sm font-black tracking-tight">{new Date(s.timestamp).toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">Snapshot_{s.id.slice(-6)}</p>
                        </div>
                     </div>
                     <div className="col-span-3 text-right">
                        <p className="text-xs font-mono font-bold">{formatSize(s.size)}</p>
                     </div>
                     <div className="col-span-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => {
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
        <div className="p-8 flex justify-end gap-3 bg-muted/5">
           <Button variant="outline" className="rounded-xl font-black text-xs px-8" onClick={() => onOpenChange(false)}>
              完成管理
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
