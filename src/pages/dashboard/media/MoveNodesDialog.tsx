import { useMemo, useState } from 'react';
import { Folder, ChevronRight, Check, Library } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MediaNode } from '@/types/media-library';
import { getAllFolders } from '@/services/mediaApi';

interface MoveNodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeIds: string[];
  nodeNames: string[];
  currentParentId: string | null;
  onConfirm: (targetParentId: string | null) => void;
}

export function MoveNodesDialog({
  open,
  onOpenChange,
  nodeIds,
  nodeNames,
  currentParentId,
  onConfirm,
}: MoveNodesDialogProps) {
  const { t } = useTranslation();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentParentId);

  const { data: foldersData, isLoading } = useQuery({
    queryKey: ['media', 'folders'],
    queryFn: getAllFolders,
    enabled: open,
  });

  const folderNodes = foldersData?.data || [];

  // Build a tree structure for rendering
  const folderTree = useMemo(() => {
    const map = new Map<string, { node: MediaNode; children: any[] }>();
    const roots: any[] = [];

    folderNodes.forEach(node => {
      map.set(node.id, { node, children: [] });
    });

    folderNodes.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(map.get(node.id));
      } else {
        roots.push(map.get(node.id));
      }
    });

    return roots;
  }, [folderNodes]);

  const handleConfirm = () => {
    onConfirm(selectedFolderId);
    onOpenChange(false);
  };

  const isMovingToSame = selectedFolderId === currentParentId;
  const isTargetIllegal = nodeIds.includes(selectedFolderId || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
        <div className="flex flex-col">
          <div className="px-8 py-6 border-b bg-muted/10">
            <DialogHeader className="space-y-1.5 mb-0">
              <DialogTitle className="text-xl font-bold tracking-tight">{t('media.dialogs.move.title')}</DialogTitle>
              <DialogDescription className="text-sm">
                {t('media.dialogs.move.desc', { count: nodeNames.length, names: nodeNames.join(', ') })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-0">
            <ScrollArea className="h-[300px] px-4 py-4">
              <div className="space-y-1">
                <FolderItem
                  name={t('media.dialogs.move.root')}
                  id={null}
                  isSelected={selectedFolderId === null}
                  onSelect={() => setSelectedFolderId(null)}
                  isRoot
                />
                <div className="pl-4 space-y-1 border-l ml-4 mt-1">
                  {isLoading ? (
                    <p className="text-xs text-muted-foreground p-4">{t('media.dialogs.move.loadingFolders')}</p>
                  ) : folderTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">{t('media.dialogs.move.noSubfolders')}</p>
                  ) : (
                    folderTree.map(item => (
                      <RecursiveFolderItem
                        key={item.node.id}
                        item={item}
                        selectedId={selectedFolderId}
                        onSelect={setSelectedFolderId}
                        disabledIds={nodeIds}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="px-8 py-4 bg-muted/5 border-t flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              {t('common.actions.cancel')}
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isMovingToSame || isTargetIllegal}
              className="rounded-xl px-8 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {t('media.dialogs.move.moveHere')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecursiveFolderItem({ 
  item, 
  selectedId, 
  onSelect, 
  disabledIds,
  depth = 0 
}: { 
  item: any; 
  selectedId: string | null; 
  onSelect: (id: string) => void; 
  disabledIds: string[];
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.children.length > 0;
  const isSelected = selectedId === item.node.id;
  const isDisabled = disabledIds.includes(item.node.id);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 group">
        {hasChildren ? (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
          </button>
        ) : (
          <div className="w-6" />
        )}
        <FolderItem
          name={item.node.name}
          id={item.node.id}
          isSelected={isSelected}
          onSelect={() => !isDisabled && onSelect(item.node.id)}
          disabled={isDisabled}
        />
      </div>
      {isOpen && hasChildren && (
        <div className="pl-6 space-y-1 border-l ml-3">
          {item.children.map((child: any) => (
            <RecursiveFolderItem
              key={child.node.id}
              item={child}
              selectedId={selectedId}
              onSelect={onSelect}
              disabledIds={disabledIds}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderItem({ 
  name, 
  id, 
  isSelected, 
  onSelect, 
  disabled = false,
  isRoot = false
}: { 
  name: string; 
  id: string | null; 
  isSelected: boolean; 
  onSelect: () => void;
  disabled?: boolean;
  isRoot?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left group",
        isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50 text-muted-foreground",
        disabled && "opacity-40 cursor-not-allowed grayscale"
      )}
    >
      {isRoot ? <Library className="h-4 w-4 shrink-0" /> : <Folder className={cn("h-4 w-4 shrink-0", isSelected ? "fill-primary/20" : "fill-muted-foreground/10")} />}
      <span className="truncate flex-1">{name}</span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
      {disabled && <span className="text-[10px] font-bold uppercase opacity-50">{t('media.dialogs.move.currentOrSub')}</span>}
    </button>
  );
}