import { useEffect, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type {
  CellRendererParams,
  Column,
} from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { type Device, type Tag, resolveDeviceStatus } from '@/types/device';
import type { DeviceCustomFieldDef, DeviceCustomFieldValue } from '@/types/device-custom-field';
import { DeviceStatusBadge } from '@/components/devices/DeviceStatusBadge';
import { DeviceScreenshot } from '@/components/devices/DeviceScreenshot';
import { Badge } from '@/components/ui/badge';
import { TagChip } from '@/components/devices/TagChip';
import { TagPicker } from '@/components/devices/TagPicker';
import { getTagPresetClassName, hexToRgba, isHexColor } from '@/components/devices/tagging';
import { DeviceGridToolbar } from './DeviceGridToolbar';
import { DeviceGridFloatingFilterCell } from './DeviceGridFloatingFilterCell';
import { DeviceCustomFieldEditRenderer, DeviceCustomFieldFloatingFilterCell } from './DeviceCustomFieldCells';
import { customFieldColumnId } from './customFieldColumnId';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import {
  PrismRowSelectionMarkerCellRenderer,
  PrismRowSelectionMarkerHeaderRenderer,
} from '@/components/lytenyte/PrismRowSelectionMarker';
import { PrismRowGroupCell } from '@/components/lytenyte/PrismRowGroupCell';
import { toast } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/country-flag';
import { UrlGlimpseLink } from './UrlGlimpseLink';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Plus } from 'lucide-react';

interface DeviceTableProps {
  devices: Device[];
  customFieldDefs: DeviceCustomFieldDef[];
  tags: Tag[];
  isProActive: boolean;
  selectedDeviceIds: Set<string>;
  pulsingDeviceIds?: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onBatchCommand: () => void;
  onProActiveChange?: (next: boolean) => void;
  onCustomFieldDefsChange: (next: DeviceCustomFieldDef[]) => void;
  onCustomFieldCreate: (def: DeviceCustomFieldDef) => void;
  onCustomFieldDelete: (fieldId: number) => void;
  onCustomFieldValueChange: (deviceId: string, fieldId: number, value: DeviceCustomFieldValue) => void;   
  onToggleDeviceTag: (deviceId: string, tag: Tag) => void;
  onCreateTag: (draft: { name: string; color: string; icon?: string }) => Tag;
}

function CustomFieldOptionChip({
  label,
  color,
  inactive,
  className,
}: {
  label: string;
  color?: string;
  inactive?: boolean;
  className?: string;
}) {
  const presetClassName = color ? getTagPresetClassName(color) : null;
  const isCustomHex = Boolean(color && isHexColor(color));

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border px-2 py-0.5 text-xs font-medium',
        presetClassName ?? 'border-border bg-transparent',
        inactive && 'border-dashed opacity-70',
        className,
      )}
      style={
        isCustomHex && color
          ? {
              borderColor: color,
              color: color,
              backgroundColor: hexToRgba(color, 0.12),
            }
          : undefined
      }
    >
      <span className="truncate">{label}</span>
    </Badge>
  );
}

export function DeviceTable({
  devices,
  customFieldDefs,
  tags,
  isProActive,
  selectedDeviceIds,
  pulsingDeviceIds,
  onSelectionChange,
  onProActiveChange,
  onCustomFieldDefsChange,
  onCustomFieldCreate,
  onCustomFieldDelete,
  onCustomFieldValueChange,
  onBatchCommand,
  onToggleDeviceTag,
  onCreateTag,
}: DeviceTableProps) {
  const gridId = useId();
  const navigate = useNavigate();
  const { formatDateTime } = useTimeFormatter();

  const customColumns = useMemo<Column<Device>[]>(() => {
    const sorted = customFieldDefs.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    return sorted.map((def) => {
      const id = customFieldColumnId(def.fieldId);
      const locked = Boolean(def.planTierRequired && !isProActive);
      const type: Column<Device>['type'] =
        def.fieldType === 'NUMBER' ? 'number' :
        def.fieldType === 'DATETIME' ? 'datetime' :
        'string';

      const column = {
        id,
        name: def.displayName,
        type,
        width: 180,
        field: ({ data }) => {
          if (data.kind !== 'leaf' || !data.data) return type === 'number' ? 0 : '';
          const raw = data.data.customFieldValues?.[def.fieldKey];
          if (raw == null) return '';
          if (def.fieldType === 'NUMBER') return typeof raw === 'number' ? raw : Number(raw);
          if (def.fieldType === 'BOOLEAN') return raw === true ? 'true' : raw === false ? 'false' : '';   
          if (def.fieldType === 'SELECT') {
            if (typeof raw !== 'string') return '';
            const hit = def.options?.find((o) => o.optionKey === raw);
            return hit?.displayName ?? raw;
          }
          if (def.fieldType === 'MULTI_SELECT') {
            if (!Array.isArray(raw)) return '';
            const options = def.options ?? [];
            return raw.map((k) => {
              const hit = options.find((o) => o.optionKey === k);
              return hit?.displayName ?? k;
            }).join(', ');
          }
          if (typeof raw === 'string') return raw;
          return String(raw);
        },
        cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
          if (grid.api.rowIsGroup(row) || !row.data) return null;
          const raw = row.data.customFieldValues?.[def.fieldKey];
          if (raw == null) return <span className="text-muted-foreground">-</span>;

          if (def.fieldType === 'NUMBER') {
            const num = typeof raw === 'number' ? raw : Number(raw);
            if (Number.isNaN(num)) return <span className="text-muted-foreground">-</span>;
            return (
              <span className={num < 0 ? 'text-red-600' : ''}>
                {num.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            );
          }

          if (def.fieldType === 'DATETIME' && typeof raw === 'string') {
            const d = new Date(raw);
            if (Number.isNaN(d.getTime())) return <span className="text-muted-foreground">-</span>;       
            return <span className="text-sm">{formatDateTime(raw)}</span>;
          }

          if (def.fieldType === 'BOOLEAN') {
            const v = raw === true ? 'True' : raw === false ? 'False' : undefined;
            if (!v) return <span className="text-muted-foreground">-</span>;
            return (
              <Badge
                variant={raw === true ? 'default' : 'secondary'}
                className="text-xs font-medium"
              >
                {v}
              </Badge>
            );
          }

          if (def.fieldType === 'SELECT' && typeof raw === 'string') {
            const hit = def.options?.find((o) => o.optionKey === raw);
            const label = hit?.displayName ?? raw;
            const inactive = hit?.active === false;
            return <CustomFieldOptionChip label={label} color={hit?.color} inactive={inactive} />;        
          }

          if (def.fieldType === 'MULTI_SELECT' && Array.isArray(raw)) {
            if (raw.length === 0) return <span className="text-muted-foreground">-</span>;
            const labels = raw.map((k) => {
              const hit = def.options?.find((o) => o.optionKey === k);
              return { key: k, label: hit?.displayName ?? k, inactive: hit?.active === false, color: hit?.color };
            });
            const shown = labels.slice(0, 2);
            const more = labels.length - shown.length;
            return (
              <div className="flex flex-wrap gap-1">
                {shown.map((o) => (
                  <CustomFieldOptionChip
                    key={o.key}
                    label={o.label}
                    color={o.color}
                    inactive={o.inactive}
                  />
                ))}
                {more > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{more}
                  </Badge>
                )}
              </div>
            );
          }

          if (def.fieldType === 'COUNTRY' && typeof raw === 'string') {
            const code = raw.trim().toUpperCase();
            if (!code) return <span className="text-muted-foreground">-</span>;
            return (
              <span className="truncate flex items-center gap-2">
                <CountryFlag code={code} />
                <span>{code}</span>
              </span>
            );
          }

          if (def.fieldType === 'URL' && typeof raw === 'string') {
            return <UrlGlimpseLink value={raw} />;
          }

          if (def.fieldType === 'EMAIL' && typeof raw === 'string') {
            return (
              <a
                href={`mailto:${raw}`}
                className="text-sky-600 hover:underline truncate block"
              >
                {raw}
              </a>
            );
          }

          if (def.fieldType === 'PHONE' && typeof raw === 'string') {
            return (
              <a
                href={`tel:${raw}`}
                className="text-sky-600 hover:underline truncate block"
              >
                {raw}
              </a>
            );
          }

          return <span className="truncate block">{String(raw)}</span>;
        },
        floatingCellRenderer: (params) => (
          <DeviceCustomFieldFloatingFilterCell {...params} fieldDef={def} />
        ),
        uiHints: {
          sortable: true,
          rowGroupable:
            def.fieldType === 'SELECT' ||
            def.fieldType === 'BOOLEAN' ||
            def.fieldType === 'COUNTRY',
          resizable: true,
          movable: true,
          ...(def.fieldType === 'NUMBER'
            ? { aggsAllowed: ['sum', 'avg', 'min', 'max', 'count', 'first', 'last'] }
            : def.fieldType === 'DATETIME'
              ? { aggsAllowed: ['min', 'max', 'count', 'first', 'last'] }
              : def.fieldType === 'SELECT' ||
                  def.fieldType === 'BOOLEAN' ||
                  def.fieldType === 'COUNTRY'
                ? { aggsAllowed: ['count'] }
                : {}),
        },
        editable: ({ row }) => row.kind === 'leaf',
        editRenderer: (params) => (
          <DeviceCustomFieldEditRenderer {...params} fieldDef={def} />
        ),
        editSetter: ({ data, value }) => {
          const next = structuredClone(data) as Device;
          const current = next.customFieldValues ?? {};
          const nextValues = { ...current };

          const normalized: DeviceCustomFieldValue = (() => {
            if (value == null) return null;
            if (def.fieldType === 'NUMBER') {
              const num = typeof value === 'number' ? value : Number(value);
              return Number.isNaN(num) ? null : num;
            }
            if (def.fieldType === 'DATETIME') {
              if (typeof value !== 'string') return null;
              return value.trim() ? value : null;
            }
            if (def.fieldType === 'BOOLEAN') {
              if (typeof value === 'boolean') return value;
              if (value === 'true') return true;
              if (value === 'false') return false;
              return null;
            }
            if (def.fieldType === 'MULTI_SELECT') {
              if (!Array.isArray(value)) return null;
              return value as string[];
            }
            if (typeof value === 'string') return value.trim() ? value : null;
            return String(value);
          })();

          nextValues[def.fieldKey] = normalized;
          next.customFieldValues = nextValues;
          return next;
        },
        prismMeta: {
          kind: 'customField',
          fieldId: def.fieldId,
          fieldKey: def.fieldKey,
          fieldType: def.fieldType,
          icon: def.icon,
          planTierRequired: def.planTierRequired,
          locked,
        },
      } satisfies Column<Device> & { prismMeta: Record<string, unknown> };

      return column;
    });
  }, [customFieldDefs, isProActive]);

  const columns = useMemo<Column<Device>[]>(() => [
    {
      id: 'deviceName',
      name: 'Device Name',
      type: 'string',
      width: 320,
      pin: 'start',
      field: 'deviceName',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
        aggDefault: 'count',
        aggsAllowed: ['count'],
      },
      autosizeCellFn: ({ grid, row }) => {
        if (row.kind !== 'leaf' || !row.data) return null;
        const device = row.data;
        const vp = grid.state.viewport.get() ?? undefined;
        const w1 = measureText(device.deviceName ?? '', vp).width;
        const w2 = measureText(device.description ?? '', vp).width;
        return Math.max(w1, w2) + 24;
      },
      cellRenderer: ({ row }: CellRendererParams<Device>) => {
        if (row.kind === 'branch') {
          const value = row.data['deviceName'];
          if (typeof value !== 'number') return null;
          return (
            <span className="text-sm font-medium">
              {value} {value === 1 ? 'device' : 'devices'}
            </span>
          );
        }
        if (!row.data) return null;
        const device = row.data;

        return (
          <div className="flex flex-col gap-0.5 min-w-0 px-1">
            <span 
              className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/dashboard/devices/${device.deviceId}`)}
            >
              {device.deviceName}
            </span>
            {device.description && (
              <span className="text-xs text-muted-foreground truncate">{device.description}</span>
            )}
          </div>
        );
      },
    },    {
      id: 'lastScreenshotUrl',
      name: 'Screenshot',
      type: 'string',
      width: 120,
      pin: 'start',
      hide: true,
      field: 'lastScreenshotUrl',
      floatingCellRenderer: () => null,
      uiHints: {
        sortable: false,
        rowGroupable: false,
        resizable: true,
        movable: true,
      },
      autosizeCellFn: () => 120,
      autosizeHeaderFn: () => 120,
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        return (
          <DeviceScreenshot
            src={device.lastScreenshotUrl}
            timestamp={device.lastReportTime}
            deviceName={device.deviceName}
            className="w-14 h-10"
          />
        );
      },
    },
    {
      id: 'onlineStatus',
      name: 'Status',
      type: 'string',
      width: 160,
      field: (data) => {
        if (data.kind !== 'leaf' || !data.data) return '';
        return resolveDeviceStatus(data.data);
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggsAllowed: ['count'],
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        return (
          <DeviceStatusBadge
            status={resolveDeviceStatus(device)}
            powerStatus={device.powerStatus}
            pulse={pulsingDeviceIds?.has(String(device.deviceId))}
          />
        );
      },
    },
    {
      id: 'model',
      name: 'Model',
      type: 'string',
      width: 140,
      field: 'model',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggsAllowed: ['count'],
      },
    },
    {
      id: 'version',
      name: 'Version',
      type: 'string',
      width: 140,
      field: 'version',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggsAllowed: ['count'],
      },
    },
    {
      id: 'networkType',
      name: 'Network',
      type: 'string',
      width: 140,
      field: 'networkType',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggsAllowed: ['count'],
      },
    },
    {
      id: 'networkStrength',
      name: 'Signal',
      type: 'number',
      width: 120,
      field: 'networkStrength',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
        aggsAllowed: ['avg', 'min', 'max'],
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        const strength = device.networkStrength;
        const is4G = device.networkType === '4G' || device.networkType === 'FOUR_G';
        
        if (!is4G || strength === undefined) return <span className="text-muted-foreground">-</span>;
        
        return (
          <div className="flex items-center gap-2 px-1">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              strength > 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
              strength > 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            )}>
              {strength}%
            </span>
          </div>
        );
      },
    },
    {
      id: 'lastReportTime',
      name: 'Last Report',
      type: 'datetime',
      width: 190,
      field: 'lastReportTime',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        const status = resolveDeviceStatus(device);

        if (status === 'pending') {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground italic">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs">Waiting for first report...</span>
            </div>
          );
        }

        if (!device.lastReportTime) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }

        const date = new Date(device.lastReportTime);
        const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
        const isOutdated = diffMinutes > 60;

        return (
          <span className={`text-sm ${isOutdated ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
            {formatDateTime(device.lastReportTime)}
          </span>
        );
      },
    },
    {
      id: 'resolution',
      name: 'Resolution',
      type: 'string',
      width: 140,
      field: 'resolution',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggsAllowed: ['count'],
      },
    },
    {
      id: 'brightness',
      name: 'Brightness',
      type: 'number',
      width: 170,
      field: 'brightness',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
        aggDefault: 'avg',
        aggsAllowed: ['avg', 'min', 'max'],
      },
      cellRenderer: ({ row }: CellRendererParams<Device>) => {
        if (row.kind === 'branch') {
          const value = row.data['brightness'];
          if (typeof value !== 'number') return null;
          return <span className="text-sm font-medium">{value.toFixed(0)}%</span>;
        }
        if (!row.data) return null;
        
        const brightness = row.data.brightness;
        if (brightness === null || brightness === undefined) return <span className="text-muted-foreground">—</span>;

        let barColor = 'bg-blue-500';
        let labelColor = 'text-gray-600';
        if (brightness < 20) {
          barColor = 'bg-amber-500';
          labelColor = 'text-amber-600 font-semibold';
        } else if (brightness > 80) {
          barColor = 'bg-green-500';
          labelColor = 'text-green-600';
        }
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${barColor}`} style={{ width: `${brightness}%` }} />
            </div>
            <span className={`text-sm font-medium ${labelColor} min-w-10`}>
              {brightness}%
            </span>
          </div>
        );
      },
    },
    {
      id: 'storagePct',
      name: 'Storage',
      type: 'number',
      width: 220,
      field: ({ data }) => {
        if (data.kind !== 'leaf' || !data.data) return null;
        const d = data.data;
        if (!d.totalStorage) return null;
        const storageUsed = d.totalStorage - d.freeStorage;
        return (storageUsed / d.totalStorage) * 100;
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
        aggDefault: 'avg',
        aggsAllowed: ['avg', 'min', 'max'],
      },
      cellRenderer: ({ row }: CellRendererParams<Device>) => {
        if (row.kind === 'branch') {
          const value = row.data['storagePct'];
          if (typeof value !== 'number') return null;
          return <span className="text-sm font-medium">{value.toFixed(0)}%</span>;
        }
        if (!row.data) return null;

        if (!row.data.totalStorage) return <span className="text-muted-foreground">—</span>;

        const storageUsed = row.data.totalStorage - row.data.freeStorage;
        const used = (storageUsed / (1024 ** 3)).toFixed(1);
        const total = (row.data.totalStorage / (1024 ** 3)).toFixed(0);
        const percentage = ((storageUsed / row.data.totalStorage) * 100);
        const percentNum = Math.min(100, percentage);

        let labelColor = 'text-gray-600';
        let bgColor = '';
        let progressColor = 'bg-blue-500';
        if (percentNum > 80) {
          labelColor = 'text-red-600 font-semibold';
          bgColor = 'bg-red-50';
          progressColor = 'bg-red-500';
        } else if (percentNum > 60) {
          labelColor = 'text-amber-600';
          bgColor = 'bg-amber-50';
          progressColor = 'bg-amber-500';
        } else if (percentNum > 40) {
          labelColor = 'text-blue-600';
          progressColor = 'bg-blue-500';
        }

        return (
          <div className={`flex flex-col gap-1.5 px-2 py-1 rounded ${bgColor}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-medium ${labelColor}`}>
                {used}/{total} GB
              </span>
              <span className={`text-xs font-semibold ${labelColor}`}>{percentNum.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${progressColor}`} style={{ width: `${percentNum}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      id: 'playingProgram',
      name: 'Program',
      type: 'string',
      width: 160,
      field: 'playingProgram',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: false,
        resizable: true,
        movable: true,
      },
      autosizeCellFn: ({ grid, row }) => {
        if (row.kind !== 'leaf' || !row.data) return null;
        const program = row.data.playingProgram;
        if (!program) return null;
        const vp = grid.state.viewport.get() ?? undefined;
        return measureText(program ?? '', vp).width + 24;
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const program = row.data.playingProgram;
        if (!program) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{program}</span>
          </div>
        );
      },
    },
    {
      id: 'tags',
      name: 'Tags',
      type: 'string',
      width: 220,
      field: ({ data }) => {
        if (data.kind !== 'leaf' || !data.data) return '';
        return data.data.tags.map(t => t.tagName).join(', ');
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: false,
        rowGroupable: false,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        const tagsList = device.tags || [];
        const displayedTags = tagsList.slice(0, 3);
        const remainingTagCount = Math.max(0, tagsList.length - displayedTags.length);

        return (
          <TagPicker
            allTags={tags}
            selectedTagIds={tagsList.map((t) => t.tagSlug)}
            onToggleTag={(tag) => onToggleDeviceTag(String(device.deviceId), tag)}
            onCreateTag={onCreateTag}
          >
            <button
              type="button"
              className={cn(
                'w-full h-full flex items-center gap-1.5 rounded-md px-1 text-left transition-colors hover:bg-muted/50 group/tag-trigger',
                tagsList.length === 0 && 'text-muted-foreground',
              )}
              aria-label="Edit tags"
            >
              <div className="flex flex-wrap gap-1 min-w-0 flex-1">
                {displayedTags.length > 0 ? (
                  <>
                    {displayedTags.map((tag) => (
                      <TagChip key={tag.tagSlug} tag={tag} className="max-w-[120px]" />
                    ))}
                    {remainingTagCount > 0 && (
                      <Badge variant="outline" className="text-xs h-5 px-1 font-normal">
                        +{remainingTagCount}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] opacity-0 group-hover/tag-trigger:opacity-100 transition-opacity">Add tags...</span>
                )}
              </div>
              <Plus className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover/tag-trigger:opacity-100" />
            </button>
          </TagPicker>
        );
      },
    },
    ...customColumns,
    {
      id: '__globalSearch',
      hide: true,
      type: 'string',
      field: () => '',
      uiHints: {
        sortable: false,
        resizable: false,
        movable: false,
      },
    },
  ], [customColumns, navigate]);

  const dataSource = useClientRowDataSource({ data: devices, reflectData: true });

  const grid = useLyteNyte({
    gridId,
    columns,
    rowDataSource: dataSource,
    editCellMode: 'cell',
    editClickActivator: 'double-click',
    columnBase: {
      headerRenderer: PrismHeaderRenderer,
      autosizeHeaderFn: ({ grid, column }) => {
        const vp = grid.state.viewport.get() ?? undefined;
        const text = String(column.name ?? column.id ?? '');
        const textWidth = measureText(text, vp).width;

        const isSortable = column.uiHints?.sortable !== false;
        const isMenuEnabled = column.id !== 'actions' && column.id !== '__globalSearch';

        const rawMeta = (column as unknown as { prismMeta?: unknown }).prismMeta;
        const meta =
          rawMeta && typeof rawMeta === 'object'
            ? (rawMeta as { kind?: unknown; fieldType?: unknown; locked?: unknown; icon?: unknown })
            : null;

        const isCustomField = meta?.kind === 'customField';
        const hasUserIcon = isCustomField && typeof meta?.icon === 'string' && meta.icon.trim().length > 0;
        const hasTypeIcon = isCustomField && typeof meta?.fieldType === 'string' && meta.fieldType.trim().length > 0;
        const hasLock = Boolean(isCustomField && meta?.locked);

        // PrismHeaderRenderer layout reserves space for:
        // - left (optional) user icon
        // - right (optional) type/lock icons
        // - right-side sort and menu buttons
        // plus padding/gaps.
        const basePadding = 22;
        const leftIcons = hasUserIcon ? 18 : 0;
        const rightIcons = (hasTypeIcon ? 18 : 0) + (hasLock ? 18 : 0);
        const sortButton = isSortable ? 30 : 0;
        const menuButton = isMenuEnabled ? 34 : 0;
        const gaps = 16;

        return Math.ceil(textWidth + basePadding + leftIcons + rightIcons + sortButton + menuButton + gaps);
      },
    },
    columnMarkerEnabled: true,
    columnMarker: {
      width: 42,
      headerRenderer: PrismRowSelectionMarkerHeaderRenderer,
      cellRenderer: PrismRowSelectionMarkerCellRenderer,
      uiHints: {
        resizable: false,
        movable: false,
        sortable: false,
      },
    },
    floatingRowEnabled: true,
    rowGroupDisplayMode: 'single-column',
    rowGroupDefaultExpansion: 1,
    rowGroupColumn: {
      name: 'Group',
      width: 220,
      pin: 'start',
      headerRenderer: ({ column }) => (
        <div className="flex items-center w-full px-2">
          <span className="truncate font-medium">{column.name ?? column.id}</span>
        </div>
      ),
      floatingCellRenderer: () => null,
      uiHints: {
        sortable: false,
        movable: false,
        resizable: true,
      },
      cellRenderer: PrismRowGroupCell,
    },
    rowSelectionMode: 'multiple',
    rowSelectionActivator: 'none',
    rowSelectChildren: true,
  });

  const gridSelectedIds = grid.state.rowSelectedIds.useValue();

  // Sync external selection -> grid
  useEffect(() => {
    const external = selectedDeviceIds;
    const currentGrid = new Set(grid.state.rowSelectedIds.get());
    
    let changed = external.size !== currentGrid.size;
    if (!changed) {
      for (const id of external) {
        if (!currentGrid.has(id)) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      grid.state.rowSelectedIds.set(new Set(external));
    }
  }, [grid, selectedDeviceIds]);

  // Sync grid selection -> external
  useEffect(() => {
    const nextSet = new Set(gridSelectedIds);
    const external = selectedDeviceIds;

    let changed = nextSet.size !== external.size;
    if (!changed) {
      for (const id of nextSet) {
        if (!external.has(id)) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      onSelectionChange(nextSet);
    }
  }, [gridSelectedIds, onSelectionChange, selectedDeviceIds]);

  useEffect(() => {
    const merge = (prev: Column<Device>[], next: Column<Device>[]) => {
      const nextById = new Map(next.map((c) => [c.id, c]));
      const prevById = new Map(prev.map((c) => [c.id, c]));

      const mergeOne = (fresh: Column<Device>, existing?: Column<Device>): Column<Device> => {
        if (!existing) return fresh;
        const override: Record<string, unknown> = {};
        for (const key of ['hide', 'width', 'widthMin', 'widthMax', 'widthFlex', 'pin', 'groupVisibility'] as const) {
          const v = existing[key];
          if (v !== undefined) override[key] = v;
        }
        return { ...fresh, ...(override as Partial<Column<Device>>) };
      };

      const isCustomFieldColumn = (id: string) => id.startsWith('cf:');
      const freshCustomColumns = next.filter((c) => isCustomFieldColumn(c.id));

      const ordered: Column<Device>[] = [];
      const seen = new Set<string>();
      let insertedCustom = false;

      for (const existing of prev) {
        const fresh = nextById.get(existing.id);
        if (!fresh) continue;

        if (isCustomFieldColumn(existing.id)) {
          if (insertedCustom) continue;
          for (const custom of freshCustomColumns) {
            ordered.push(mergeOne(custom, prevById.get(custom.id)));
            seen.add(custom.id);
          }
          insertedCustom = true;
          continue;
        }

        ordered.push(mergeOne(fresh, existing));
        seen.add(existing.id);
      }

      if (!insertedCustom) {
        for (const custom of freshCustomColumns) {
          ordered.push(mergeOne(custom, prevById.get(custom.id)));
          seen.add(custom.id);
        }
      }

      for (const fresh of next) {
        if (seen.has(fresh.id)) continue;
        ordered.push(mergeOne(fresh, prevById.get(fresh.id)));
        seen.add(fresh.id);
      }

      const globalIdx = ordered.findIndex((c) => c.id === '__globalSearch');
      if (globalIdx >= 0) {
        const [global] = ordered.splice(globalIdx, 1);
        if (global) ordered.push(global);
      }

      return ordered;
    };

    grid.state.columns.set((prev) => merge(prev, columns));
  }, [columns, grid]);

  useEffect(() => {
    const getCustomFieldMeta = (column: Column<Device>) => {
      const raw = (column as unknown as { prismMeta?: unknown }).prismMeta;
      if (!raw || typeof raw !== 'object') return null;
      const meta = raw as { kind?: unknown; fieldId?: unknown; fieldKey?: unknown; locked?: unknown };
      if (meta.kind !== 'customField') return null;
      if (typeof meta.fieldId !== 'number') return null;
      if (typeof meta.fieldKey !== 'string') return null;
      return { fieldId: meta.fieldId, fieldKey: meta.fieldKey, locked: Boolean(meta.locked) };
    };

    const removeEditBegin = grid.api.eventAddListener('editBegin', ({ column, preventDefault }) => {
      const meta = getCustomFieldMeta(column);
      if (!meta) return;
      if (!meta.locked) return;
      preventDefault();
      toast('Read-only custom field', {
        description: 'This field requires an active Pro subscription to edit.',
      });
    });

    const removeEditEnd = grid.api.eventAddListener('editEnd', ({ column, data }) => {
      const meta = getCustomFieldMeta(column);
      if (!meta) return;
      const { fieldId, fieldKey } = meta;
      const device = data as Device;
      const value = device.customFieldValues?.[fieldKey] ?? null;
      onCustomFieldValueChange(String(device.deviceId), fieldId, value);
    });

    const removeEditError = grid.api.eventAddListener('editError', ({ column, validation, error }) => {
      const meta = getCustomFieldMeta(column);
      if (!meta) return;
      toast('Edit failed', {
        description:
          error instanceof Error ? error.message : validation ? 'Validation failed.' : 'Unknown error.',
      });
    });

    return () => {
      removeEditBegin();
      removeEditEnd();
      removeEditError();
    };
  }, [grid, onCustomFieldValueChange]);

  return (
    <div className="w-full flex flex-col gap-4">
      <DeviceGridToolbar
        grid={grid}
        defaultColumns={columns}
        customFieldDefs={customFieldDefs}
        isProActive={isProActive}
        onBatchCommand={onBatchCommand}
        onProActiveChange={onProActiveChange}
        onCustomFieldDefsChange={onCustomFieldDefsChange}
        onCustomFieldCreate={onCustomFieldCreate}
        onCustomFieldDelete={onCustomFieldDelete}
      />
      <div className="w-full h-[calc(100vh-20rem)]">
        <LyteNyte grid={grid} />
      </div>
    </div>
  );
}
