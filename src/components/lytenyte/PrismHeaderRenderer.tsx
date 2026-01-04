import type {
  AggModelFn,
  Column,
  HeaderCellRendererParams,
  SortModelItem,
} from '@1771technologies/lytenyte-core/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  EyeOff,
  Flag,
  Hash,
  Link2,
  List,
  ListChecks,
  Lock,
  Mail,
  MoreHorizontal,
  Pin,
  PinOff,
  Phone,
  Sigma,
  Spline,
  Text,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveTagIcon } from '@/components/devices/tagging';

function sortKindForColumn<T>(column: Column<T>): SortModelItem<T>['sort'] {
  switch (column.type) {
    case 'number':
      return { kind: 'number' };
    case 'date':
    case 'datetime':
      return { kind: 'date' };
    default:
      return { kind: 'string' };
  }
}

function aggLabel(fn: AggModelFn<unknown>, t: any): string {
  if (typeof fn === 'string') return fn;
  return t('grid.header.custom');
}

function iconForCustomFieldType(type?: unknown) {
  switch (type) {
    case 'TEXT':
      return Text;
    case 'NUMBER':
      return Hash;
    case 'DATETIME':
      return Calendar;
    case 'BOOLEAN':
      return ToggleRight;
    case 'SELECT':
      return List;
    case 'MULTI_SELECT':
      return ListChecks;
    case 'URL':
      return Link2;
    case 'EMAIL':
      return Mail;
    case 'PHONE':
      return Phone;
    case 'COUNTRY':
      return Flag;
    default:
      return null;
  }
}

export function PrismHeaderRenderer<T>({ grid, column }: HeaderCellRendererParams<T>) {
  const { t } = useTranslation();
  const sortModel = grid.state.sortModel.useValue();
  const rowGroupModel = grid.state.rowGroupModel.useValue();
  const columns = grid.state.columns.useValue();
  const aggModel = grid.state.aggModel.useValue();

  const isSortable = column.uiHints?.sortable !== false;
  const isMenuEnabled = column.id !== 'actions' && column.id !== '__globalSearch';

  const sortIndex = sortModel.findIndex((s) => s.columnId === column.id);
  const sortEntry = sortIndex >= 0 ? sortModel[sortIndex] : undefined;
  const sortDir: 'asc' | 'desc' | 'none' =
    !sortEntry ? 'none' : sortEntry.isDescending ? 'desc' : 'asc';

  const currentColumn = columns.find((c) => c.id === column.id) ?? column;
  const pin = currentColumn.pin ?? null;
  const hide = Boolean(currentColumn.hide);

  const customFieldMeta = (() => {
    const raw = (currentColumn as unknown as { prismMeta?: unknown }).prismMeta;
    if (!raw || typeof raw !== 'object') return null;
    const meta = raw as { kind?: unknown; fieldType?: unknown; locked?: unknown; icon?: unknown };
    if (meta.kind !== 'customField') return null;
    return {
      fieldType: meta.fieldType,
      locked: Boolean(meta.locked),
      icon: typeof meta.icon === 'string' ? meta.icon : undefined,
    };
  })();
  const TypeIcon = iconForCustomFieldType(customFieldMeta?.fieldType);
  const UserIcon = resolveTagIcon(customFieldMeta?.icon);
  const isLocked = Boolean(customFieldMeta?.locked);

  const isGrouped = rowGroupModel.some((g) =>
    typeof g === 'string' ? g === column.id : g.id === column.id
  );

  const allowedAggs = currentColumn.uiHints?.aggsAllowed ?? [];
  const currentAgg = aggModel[column.id]?.fn;

  const SortIcon =
    sortDir === 'asc' ? ArrowUp :
    sortDir === 'desc' ? ArrowDown :
    ArrowUpDown;

  const toggleSort = () => {
    if (!isSortable) return;
    const next =
      sortDir === 'none' ? 'asc' :
      sortDir === 'asc' ? 'desc' :
      'none';
    applySort(next);
  };

  const applySort = (dir: 'asc' | 'desc' | 'none') => {
    if (!isSortable) return;
    grid.state.sortModel.set((prev) => {
      const without = prev.filter((s) => s.columnId !== column.id);
      if (dir === 'none') return without;
      const nextItem: SortModelItem<T> = {
        columnId: column.id,
        isDescending: dir === 'desc' ? true : undefined,
        sort: sortKindForColumn(column),
      };
      return [nextItem, ...without];
    });
  };

  const setPin = (nextPin: 'start' | 'end' | null) => {
    grid.state.columns.set((prev) =>
      prev.map((c) => (c.id === column.id ? { ...c, pin: nextPin } : c))
    );
  };

  const setHidden = (nextHide: boolean) => {
    grid.state.columns.set((prev) =>
      prev.map((c) => (c.id === column.id ? { ...c, hide: nextHide } : c))
    );
  };

  const autosizeExpandOnly = (params: { includeHeader: boolean; columns?: (string | number | Column<T>)[] }) => {
    const result = grid.api.columnAutosize({ ...params, dryRun: true });
    const updates: Record<string, { width: number }> = {};
    for (const [id, width] of Object.entries(result)) {
      const currentWidth = columns.find((c) => String(c.id) === String(id))?.width;
      if (typeof currentWidth === 'number' && currentWidth >= width) continue;
      updates[id] = { width };
    }
    if (Object.keys(updates).length > 0) grid.api.columnUpdate(updates);
  };

  const autosizeColumn = (includeHeader: boolean) => {
    autosizeExpandOnly({ columns: [column.id], includeHeader });
  };

  const autosizeAll = (includeHeader: boolean) => {
    autosizeExpandOnly({ includeHeader });
  };

  const toggleGroupBy = () => {
    grid.state.rowGroupModel.set((prev) => {
      const ids = prev.map((g) => (typeof g === 'string' ? g : g.id));
      if (ids.includes(column.id)) {
        return prev.filter((g) => (typeof g === 'string' ? g !== column.id : g.id !== column.id));
      }
      return [...prev, column.id];
    });
  };

  const setAgg = (fn?: AggModelFn<T>) => {
    if (rowGroupModel.length === 0) return;
    grid.state.aggModel.set((prev) => {
      const next = { ...prev };
      if (!fn) delete next[column.id];
      else next[column.id] = { fn };
      return next;
    });
  };

  return (
    <div className="flex w-full items-center gap-2 min-w-0">
      <div className="flex items-center min-w-0 flex-1 gap-2">
        <div className="flex items-center gap-1 min-w-0">
          {UserIcon && <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <span className="truncate font-medium">{column.name ?? column.id}</span>
          {rowGroupModel.length > 0 && currentAgg && (
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              ({aggLabel(currentAgg as AggModelFn<unknown>, t)})
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {TypeIcon && <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          {isLocked && <Lock className="h-3.5 w-3.5 text-amber-600" />}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isSortable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 opacity-0 group-hover:opacity-80 focus-visible:opacity-100',
              sortDir !== 'none' && 'opacity-100'
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSort();
            }}
            aria-label="Toggle sort"
          >
            <SortIcon className="h-4 w-4" />
          </Button>
        )}

        {isMenuEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-80 focus-visible:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label="Column menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem
                disabled={!isSortable}
                onSelect={() => applySort('asc')}
              >
                <ArrowUp className="h-4 w-4" />
                {t('grid.header.sortAsc')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isSortable}
                onSelect={() => applySort('desc')}
              >
                <ArrowDown className="h-4 w-4" />
                {t('grid.header.sortDesc')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!isSortable || sortDir === 'none'}
                onSelect={() => applySort('none')}
              >
                <ArrowUpDown className="h-4 w-4" />
                {t('grid.header.clearSort')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Pin className="h-4 w-4" />
                  {t('grid.header.pin')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={pin ?? 'center'}
                    onValueChange={(v) => setPin(v === 'center' ? null : (v as 'start' | 'end'))}
                  >
                    <DropdownMenuRadioItem value="center">
                      <PinOff className="h-4 w-4" />
                      {t('grid.header.unpinned')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="start">
                      <Pin className="h-4 w-4" />
                      {t('grid.header.pinLeft')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="end">
                      <Pin className="h-4 w-4" />
                      {t('grid.header.pinRight')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Spline className="h-4 w-4" />
                  {t('grid.header.autosize')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => autosizeColumn(false)}>
                    {t('grid.header.autosizeColumn')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => autosizeColumn(true)}>
                    {t('grid.header.autosizeColumnHeader')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => autosizeAll(false)}>
                    {t('grid.header.autosizeAll')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => autosizeAll(true)}>
                    {t('grid.header.autosizeAllHeaders')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={hide}
                onSelect={() => setHidden(true)}
              >
                <EyeOff className="h-4 w-4" />
                {t('grid.header.hideColumn')}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={column.uiHints?.rowGroupable === false}
                onSelect={toggleGroupBy}
              >
                <Text className="h-4 w-4" />
                {isGrouped ? t('grid.header.ungroup') : t('grid.header.groupBy')} {column.name ?? column.id}
              </DropdownMenuItem>

              {allowedAggs.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={rowGroupModel.length === 0}>
                    <Sigma className="h-4 w-4" />
                    {t('grid.header.aggregate')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={currentAgg ? aggLabel(currentAgg as AggModelFn<unknown>, t) : 'none'}
                      onValueChange={(v) => {
                        if (v === 'none') {
                          setAgg(undefined);
                        } else {
                          setAgg(v as unknown as AggModelFn<T>);
                        }
                      }}
                    >
                      <DropdownMenuRadioItem value="none">
                        {t('grid.header.none')}
                      </DropdownMenuRadioItem>
                      {allowedAggs.map((fn) => (
                        <DropdownMenuRadioItem key={fn} value={String(fn)}>
                          {String(fn)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
