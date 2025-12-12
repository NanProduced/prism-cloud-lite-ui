import { useMemo, useId } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type {
  CellRendererParams,
  Column,
} from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import { DeviceStatusBadge } from '@/components/devices/DeviceStatusBadge';
import { DeviceScreenshot } from '@/components/devices/DeviceScreenshot';
import { Badge } from '@/components/ui/badge';
import { DeviceGridToolbar } from './DeviceGridToolbar';
import { DeviceGridFloatingFilterCell } from './DeviceGridFloatingFilterCell';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import {
  PrismRowSelectionMarkerCellRenderer,
  PrismRowSelectionMarkerHeaderRenderer,
} from '@/components/lytenyte/PrismRowSelectionMarker';
import { PrismRowGroupCell } from '@/components/lytenyte/PrismRowGroupCell';

interface DeviceTableProps {
  devices: Device[];
}

export function DeviceTable({ devices }: DeviceTableProps) {
  const gridId = useId();

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
        rowGroupable: true,
        resizable: true,
        movable: true,
        aggDefault: 'count',
        aggsAllowed: ['count'],
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
            <span className="font-medium truncate">{device.deviceName}</span>
            {device.alias && (
              <span className="text-xs text-muted-foreground truncate">{device.alias}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'latestScreenshot',
      name: 'Screenshot',
      type: 'string',
      width: 120,
      pin: 'start',
      hide: true,
      field: ({ data }) => {
        if (data.kind !== 'leaf' || !data.data) return '';
        return data.data.latestScreenshot?.url ?? '';
      },
      uiHints: {
        sortable: false,
        rowGroupable: false,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        return (
          <DeviceScreenshot
            src={device.latestScreenshot?.url}
            timestamp={device.latestScreenshot?.timestamp}
            deviceName={device.deviceName}
            className="w-14 h-10"
          />
        );
      },
    },
    {
      id: 'status',
      name: 'Status',
      type: 'string',
      width: 160,
      field: 'status',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        return (
          <DeviceStatusBadge
            status={device.status}
            offlineDuration={device.offlineDuration}
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
      },
    },
    {
      id: 'firmwareVersion',
      name: 'Firmware',
      type: 'string',
      width: 140,
      field: 'firmwareVersion',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        resizable: true,
        movable: true,
      },
    },
    {
      id: 'networkType',
      name: 'Network',
      type: 'string',
      width: 160,
      field: 'networkType',
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        rowGroupable: true,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;
        const strength = device.signalStrength;
        return (
          <div className="flex flex-col gap-0.5 px-1">
            <span className="text-sm font-medium">{device.networkType}</span>
            {strength !== undefined && (
              <span className="text-xs font-semibold text-muted-foreground">
                {strength}%
              </span>
            )}
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
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const device = row.data;

        const date = new Date(device.lastReportTime);
        const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
        const isOutdated = diffMinutes > 60;

        return (
          <span className={`text-sm ${isOutdated ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
            {date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      id: 'resolution',
      name: 'Resolution',
      type: 'string',
      width: 140,
      field: ({ data }) => {
        if (data.kind !== 'leaf' || !data.data) return '';
        return `${data.data.resolution.width}×${data.data.resolution.height}`;
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        resizable: true,
        movable: true,
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
        if (data.kind !== 'leaf' || !data.data) return 0;
        const d = data.data;
        return d.storageTotal ? (d.storageUsed / d.storageTotal) * 100 : 0;
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
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

        const used = (row.data.storageUsed / (1024 ** 3)).toFixed(1);
        const total = (row.data.storageTotal / (1024 ** 3)).toFixed(0);
        const percentage = ((row.data.storageUsed / row.data.storageTotal) * 100);
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
      id: 'currentProgram',
      name: 'Program',
      type: 'string',
      width: 160,
      field: ({ data }) => {
        if (data.kind !== 'leaf' || !data.data) return '';
        return data.data.currentProgram?.name ?? '';
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: true,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const program = row.data.currentProgram;
        if (!program) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{program.name}</span>
            <span className="text-xs text-muted-foreground">{program.version}</span>
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
        return data.data.tags.map(t => t.name).join(', ');
      },
      floatingCellRenderer: DeviceGridFloatingFilterCell,
      uiHints: {
        sortable: false,
        resizable: true,
        movable: true,
      },
      cellRenderer: ({ row, grid }: CellRendererParams<Device>) => {
        if (grid.api.rowIsGroup(row) || !row.data) return null;
        const tags = row.data.tags;
        if (tags.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
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
  ], []);

  const dataSource = useClientRowDataSource({ data: devices });

  const grid = useLyteNyte({
    gridId,
    columns,
    rowDataSource: dataSource,
    columnBase: {
      headerRenderer: PrismHeaderRenderer,
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

  return (
    <div className="w-full flex flex-col gap-4">
      <DeviceGridToolbar grid={grid} defaultColumns={columns} />
      <div className="w-full h-[calc(100vh-20rem)]">
        <LyteNyte grid={grid} />
      </div>
    </div>
  );
}
