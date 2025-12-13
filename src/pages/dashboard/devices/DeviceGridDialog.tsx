import { useMemo, useState } from 'react';
import type { AggModelFn, Column } from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Layers, MoreVertical, Pin, PinOff, Plus, Sigma, SlidersHorizontal, X } from 'lucide-react';

interface DeviceGridDialogProps {
  columns: Column<Device>[];
  groupableColumns: Column<Device>[];
  aggColumns: Column<Device>[];
  rowGroupIds: string[];
  aggModel: Record<string, { fn: AggModelFn<Device> }>;
  onToggleColumn: (id: string) => void;
  onSetPin: (id: string, pin: 'start' | 'end' | null) => void;
  onReorderColumn: (fromId: string, toId: string) => void;
  onAddGroup: (id: string) => void;
  onRemoveGroup: (id: string) => void;
  onSetAgg: (colId: string, fn?: AggModelFn<Device>) => void;
}

function matches(text: string, query: string) {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}

function labelForColumn(col: Column<Device>) {
  return String(col.name ?? col.id);
}

export function DeviceGridDialog({
  columns,
  groupableColumns,
  aggColumns,
  rowGroupIds,
  aggModel,
  onToggleColumn,
  onSetPin,
  onReorderColumn,
  onAddGroup,
  onRemoveGroup,
  onSetAgg,
}: DeviceGridDialogProps) {
  const [open, setOpen] = useState(false);
  const [columnQuery, setColumnQuery] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const [aggQuery, setAggQuery] = useState('');

  const visibleCount = useMemo(() => columns.filter((c) => !c.hide).length, [columns]);
  const filteredColumns = useMemo(() => {
    const q = columnQuery.trim();
    return columns.filter((c) => matches(labelForColumn(c), q) || matches(String(c.id), q));
  }, [columnQuery, columns]);

  const grouped = useMemo(() => {
    const byId = new Map<string, Column<Device>>();
    for (const c of columns) byId.set(String(c.id), c);
    return rowGroupIds.map((id) => byId.get(id) ?? ({ id, name: id } as Column<Device>));
  }, [columns, rowGroupIds]);

  const availableGroups = useMemo(() => {
    const q = groupQuery.trim();
    return groupableColumns
      .filter((c) => !rowGroupIds.includes(String(c.id)))
      .filter((c) => matches(labelForColumn(c), q) || matches(String(c.id), q));
  }, [groupQuery, groupableColumns, rowGroupIds]);

  const filteredAggColumns = useMemo(() => {
    const q = aggQuery.trim();
    return aggColumns.filter((c) => matches(labelForColumn(c), q) || matches(String(c.id), q));
  }, [aggColumns, aggQuery]);

  const isAggEnabled = rowGroupIds.length > 0;
  const dragEnabled = columnQuery.trim().length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Columns
          <Badge variant="secondary" className="ml-1">
            {visibleCount}/{columns.length}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[min(92vw,72rem)] !max-w-none p-0 overflow-hidden flex flex-col h-[min(85vh,48rem)]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Columns</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] border-t flex-1 min-h-0">
          <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Columns</div>
              <Badge variant="secondary" className="shrink-0">
                {visibleCount}/{columns.length}
              </Badge>
            </div>

            <div className="mt-3">
              <Input
                value={columnQuery}
                onChange={(e) => setColumnQuery(e.target.value)}
                placeholder="Search columns…"
                className="h-9"
              />
            </div>

            <ScrollArea className="mt-3 flex-1 min-h-0 pr-2">
              <div className="grid gap-1">
                {filteredColumns.map((c) => {
                  const checked = !c.hide;
                  const colId = String(c.id);
                  const pin = c.pin ?? null;
                  return (
                    <div
                      key={colId}
                      className="group flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-accent text-left"
                      onClick={() => onToggleColumn(colId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onToggleColumn(colId);
                        }
                      }}
                      onDragOver={(e) => {
                        if (!dragEnabled) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        if (!dragEnabled) return;
                        e.preventDefault();
                        const fromId = e.dataTransfer.getData('text/plain');
                        if (!fromId) return;
                        onReorderColumn(fromId, colId);
                      }}
                    >
                      <button
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-accent/60 text-muted-foreground cursor-grab active:cursor-grabbing"
                        draggable={dragEnabled}
                        onDragStart={(e) => {
                          if (!dragEnabled) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', colId);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={dragEnabled ? 'Reorder column' : 'Reorder disabled while searching'}
                        title={dragEnabled ? 'Drag to reorder' : 'Clear search to reorder'}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggleColumn(colId)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={checked ? 'Hide column' : 'Show column'}
                      />
                      <span className="truncate flex-1 min-w-0">{labelForColumn(c)}</span>

                      <span className="ml-auto flex items-center gap-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Column menu"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() => onToggleColumn(colId)}
                            >
                              {checked ? 'Hide column' : 'Show column'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onSelect={() => onSetPin(colId, pin === 'start' ? null : 'start')}
                            >
                              {pin === 'start' ? (
                                <>
                                  <PinOff className="h-4 w-4" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4" />
                                  Pin left
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onSelect={() => onSetPin(colId, pin === 'end' ? null : 'end')}
                            >
                              {pin === 'end' ? (
                                <>
                                  <PinOff className="h-4 w-4" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4" />
                                  Pin right
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 md:p-6 grid gap-6 min-h-0 overflow-hidden md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Row Groups
                </div>
                {rowGroupIds.length > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    {rowGroupIds.length}
                  </Badge>
                )}
              </div>

              <div className="rounded border bg-muted/30 p-3">
                {rowGroupIds.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Select a column to group
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {grouped.map((c) => (
                      <Badge key={String(c.id)} variant="secondary" className="gap-1">
                        <span className="truncate">{labelForColumn(c)}</span>
                        <X
                          className="h-3.5 w-3.5 cursor-pointer"
                          onClick={() => onRemoveGroup(String(c.id))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 min-h-0">
                <Input
                  value={groupQuery}
                  onChange={(e) => setGroupQuery(e.target.value)}
                  placeholder="Search groupable columns…"
                  className="h-9"
                />
                <ScrollArea className="flex-1 min-h-0 pr-2">
                  <div className="grid gap-1">
                    {availableGroups.length === 0 ? (
                      <div className="text-sm text-muted-foreground px-2 py-1">
                        No more groupable columns
                      </div>
                    ) : (
                      availableGroups.map((c) => (
                        <button
                          key={String(c.id)}
                          type="button"
                          className="flex items-center justify-between gap-2 rounded px-2 py-2 text-sm hover:bg-accent"
                          onClick={() => onAddGroup(String(c.id))}
                        >
                          <span className="truncate">{labelForColumn(c)}</span>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sigma className="h-4 w-4 text-muted-foreground" />
                  Aggregations
                </div>
                {Object.keys(aggModel).length > 0 && (
                  <Badge variant="secondary" className="shrink-0">
                    {Object.keys(aggModel).length}
                  </Badge>
                )}
              </div>

              {!isAggEnabled && (
                <div className="text-sm text-muted-foreground">
                  Add a row group to enable aggregations.
                </div>
              )}

              <div className="flex flex-col gap-2 min-h-0">
                <Input
                  value={aggQuery}
                  onChange={(e) => setAggQuery(e.target.value)}
                  placeholder="Search aggregations…"
                  className="h-9"
                  disabled={!isAggEnabled}
                />
                <ScrollArea className="flex-1 min-h-0 pr-2">
                  <div className="grid gap-2">
                    {filteredAggColumns.length === 0 ? (
                      <div className="text-sm text-muted-foreground px-2 py-1">
                        No aggregatable columns
                      </div>
                    ) : (
                      filteredAggColumns.map((c) => {
                        const allowed = c.uiHints?.aggsAllowed ?? [];
                        const current = aggModel[String(c.id)]?.fn;
                        const currentLabel =
                          typeof current === 'string'
                            ? current
                            : current === undefined
                              ? 'none'
                              : 'custom';
                        return (
                          <div
                            key={String(c.id)}
                            className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-2"
                          >
                            <div className="text-sm truncate">{labelForColumn(c)}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  disabled={!isAggEnabled}
                                >
                                  {currentLabel}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onSetAgg(String(c.id), undefined)}>
                                  None
                                </DropdownMenuItem>
                                {allowed.map((fn) => (
                                  <DropdownMenuItem
                                    key={String(fn)}
                                    onSelect={() => onSetAgg(String(c.id), fn as AggModelFn<Device>)}
                                  >
                                    {String(fn)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
