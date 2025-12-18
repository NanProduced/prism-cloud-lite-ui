import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BadgeAlert, Image as ImageIcon, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Device } from '@/types/device';
import type { VsnDocument, VsnItem, VsnPage, VsnRect, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import {
  REGION_EDITOR_NAME_KEY,
  cssHexToVsnBgColor,
  formatDurationMs,
  getEditorRegionName,
  getRegionDisplayName,
  getRegionMode,
  regionHasOnlyAllowedItemTypes,
  vsnBgColorToCss,
  type RegionMode,
} from '../utils';
import { getItems, getPages, getRegions } from '../vsnOps';
import { DeviceResolutionPicker } from './DeviceResolutionPicker';

type MaterialIndex = Record<string, EditorMaterial>;

export function InspectorPanel({
  doc,
  selection,
  programName,
  programWidth,
  programHeight,
  targetDeviceId,
  devices,
  materialIndex,
  showDevFields = false,
  onRenameProgram,
  onSetProgramResolution,
  onPatchPage,
  onPatchRegion,
  onPatchRegionRect,
  onPatchItem,
}: {
  doc: VsnDocument | null;
  selection: EditorSelection;
  programName: string;
  programWidth: number;
  programHeight: number;
  targetDeviceId: string | null;
  devices: Device[];
  materialIndex: MaterialIndex;
  showDevFields?: boolean;
  onRenameProgram: (name: string) => void;
  onSetProgramResolution: (input: { width: number; height: number; targetDeviceId: string | null }) => void;
  onPatchPage: (pageIndex: number, patch: Partial<VsnPage>) => void;
  onPatchRegion: (pageIndex: number, regionIndex: number, patch: Partial<VsnRegion>) => void;
  onPatchRegionRect: (pageIndex: number, regionIndex: number, patch: Partial<VsnRect>) => void;
  onPatchItem: (pageIndex: number, regionIndex: number, itemIndex: number, patch: Partial<VsnItem>) => void;
}) {
  const page = useMemo(() => getPages(doc)[selection.pageIndex] ?? null, [doc, selection.pageIndex]);
  const region = useMemo(
    () => (selection.regionIndex == null ? null : getRegions(doc, selection.pageIndex)[selection.regionIndex] ?? null),
    [doc, selection.pageIndex, selection.regionIndex],
  );
  const item = useMemo(
    () =>
      selection.regionIndex == null || selection.itemIndex == null
        ? null
        : getItems(doc, selection.pageIndex, selection.regionIndex)[selection.itemIndex] ?? null,
    [doc, selection.itemIndex, selection.pageIndex, selection.regionIndex],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Inspector</p>
        <p className="text-xs text-muted-foreground">
          {item ? 'Item' : region ? 'Window' : 'Program'}
        </p>
      </div>

      <Separator className="my-3" />

      <ScrollArea className="flex-1 pr-3">
        {!doc || !page ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No document loaded.
          </div>
        ) : item ? (
          <ItemInspector
            key={`item-${selection.pageIndex}-${selection.regionIndex}-${selection.itemIndex}`}
            item={item}
            material={resolveMaterial(materialIndex, item)}
            showDevFields={showDevFields}
            onPatch={(patch) => onPatchItem(selection.pageIndex, selection.regionIndex!, selection.itemIndex!, patch)}
          />
        ) : region ? (
          <RegionInspector
            key={`region-${selection.pageIndex}-${selection.regionIndex}`}
            region={region}
            showDevFields={showDevFields}
            onPatch={(patch) => onPatchRegion(selection.pageIndex, selection.regionIndex!, patch)}
            onPatchRect={(patch) => onPatchRegionRect(selection.pageIndex, selection.regionIndex!, patch)}
          />
        ) : (
          <div className="space-y-6">
            <ProgramInspector
              programName={programName}
              programWidth={programWidth}
              programHeight={programHeight}
              targetDeviceId={targetDeviceId}
              devices={devices}
              onRenameProgram={onRenameProgram}
              onSetProgramResolution={onSetProgramResolution}
            />
            <Separator />
            <PageInspector
              key={`page-${selection.pageIndex}`}
              page={page}
              showDevFields={showDevFields}
              onPatch={(patch) => onPatchPage(selection.pageIndex, patch)}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ProgramInspector({
  programName,
  programWidth,
  programHeight,
  targetDeviceId,
  devices,
  onRenameProgram,
  onSetProgramResolution,
}: {
  programName: string;
  programWidth: number;
  programHeight: number;
  targetDeviceId: string | null;
  devices: Device[];
  onRenameProgram: (name: string) => void;
  onSetProgramResolution: (input: { width: number; height: number; targetDeviceId: string | null }) => void;
}) {
  const [nameDraft, setNameDraft] = useState(programName);
  const [widthDraft, setWidthDraft] = useState(String(programWidth));
  const [heightDraft, setHeightDraft] = useState(String(programHeight));

  useEffect(() => setNameDraft(programName), [programName]);
  useEffect(() => setWidthDraft(String(programWidth)), [programWidth]);
  useEffect(() => setHeightDraft(String(programHeight)), [programHeight]);

  const selectedDevice = useMemo(
    () => (targetDeviceId ? devices.find((d) => d.id === targetDeviceId) ?? null : null),
    [devices, targetDeviceId],
  );

  const commitName = () => {
    const next = nameDraft.trim();
    if (!next || next === programName) return;
    onRenameProgram(next);
  };

  const commitResolution = () => {
    const parsedW = parseResolutionInput(widthDraft, 8192);
    const parsedH = parseResolutionInput(heightDraft, 4096);
    if (!parsedW || !parsedH) return;
    if (parsedW === programWidth && parsedH === programHeight && targetDeviceId == null) return;
    onSetProgramResolution({ width: parsedW, height: parsedH, targetDeviceId: null });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium">Program</p>

      <Field label="Program name">
        <Input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="e.g. Lobby Screen"
        />
      </Field>

      <Field label="Target device (resolution)">
        <DeviceResolutionPicker
          devices={devices}
          value={targetDeviceId}
          onChange={(deviceId) => {
            if (!deviceId) {
              onSetProgramResolution({ width: programWidth, height: programHeight, targetDeviceId: null });
              return;
            }
            const device = devices.find((d) => d.id === deviceId);
            if (!device) return;
            onSetProgramResolution({
              width: device.resolution.width,
              height: device.resolution.height,
              targetDeviceId: deviceId,
            });
          }}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Canvas resolution</p>
          <p className="text-xs text-muted-foreground">max 8192×4096</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Width">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={8192}
              value={selectedDevice ? String(selectedDevice.resolution.width) : widthDraft}
              disabled={Boolean(selectedDevice)}
              onChange={(e) => setWidthDraft(e.target.value)}
            />
          </Field>
          <Field label="Height">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={4096}
              value={selectedDevice ? String(selectedDevice.resolution.height) : heightDraft}
              disabled={Boolean(selectedDevice)}
              onChange={(e) => setHeightDraft(e.target.value)}
            />
          </Field>
        </div>

        {!selectedDevice && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={commitResolution}>
              Apply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function resolveMaterial(materialIndex: MaterialIndex, item: VsnItem): EditorMaterial | null {
  const id = item.FileSource?.Resource_ID;
  if (!id) return null;
  return materialIndex[id] ?? null;
}

function PageInspector({
  page,
  showDevFields,
  onPatch,
}: {
  page: VsnPage;
  showDevFields: boolean;
  onPatch: (patch: Partial<VsnPage>) => void;
}) {
  const cssColor = vsnBgColorToCss(page.BgColor);
  const hexColor = cssColor.startsWith('#') ? cssColor : '#000000';

  return (
    <div className="space-y-5">
      <Field label="Loop type">
        <select
          value={page.LoopType}
          onChange={(e) => onPatch({ LoopType: e.target.value as VsnPage['LoopType'] })}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="1">1 · Auto duration</option>
          <option value="0">0 · Fixed duration</option>
        </select>
      </Field>

      <Field label="AppointDuration (ms)">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          value={page.AppointDuration}
          onChange={(e) => {
            const value = parseStrictPosIntInput(e.target.value);
            if (value == null) return;
            onPatch({ AppointDuration: value });
          }}
        />
      </Field>

      <Field label="Background">
        <div className="flex items-center gap-2">
          {showDevFields ? (
            <Input value={page.BgColor} onChange={(e) => onPatch({ BgColor: e.target.value })} />
          ) : (
            <Input value={hexColor} readOnly />
          )}
          <input
            aria-label="Pick background color"
            type="color"
            value={hexColor}
            className="h-9 w-10 cursor-pointer rounded-md border bg-background p-1"
            onChange={(e) => onPatch({ BgColor: cssHexToVsnBgColor(e.target.value) })}
          />
        </div>
        {showDevFields && <p className="mt-1 text-xs text-muted-foreground">Stored as 0xAARRGGBB in VSN.</p>}
      </Field>
    </div>
  );
}

function RegionInspector({
  region,
  showDevFields,
  onPatch,
  onPatchRect,
}: {
  region: VsnRegion;
  showDevFields: boolean;
  onPatch: (patch: Partial<VsnRegion>) => void;
  onPatchRect: (patch: Partial<VsnRect>) => void;
}) {
  const rect = region.Rect;
  const borderColor = rect.BorderColor ?? '#000000';
  const backColor = rect.BackColor ?? '';
  const mode = getRegionMode(region);
  const title = getRegionDisplayName(region);
  const canSync = regionHasOnlyAllowedItemTypes(region, 'sync');
  const canTicker = regionHasOnlyAllowedItemTypes(region, 'ticker');

  return (
    <div className="space-y-5">
      <Field label="Title">
        <Input
          value={title}
          onChange={(e) => {
            const value = e.target.value;
            if (mode === 'normal') {
              onPatch({ Name: value, [REGION_EDITOR_NAME_KEY]: undefined });
              return;
            }
            onPatch({ [REGION_EDITOR_NAME_KEY]: value });
          }}
        />
      </Field>

      <Field label="Window type">
        <select
          value={mode}
          onChange={(e) => {
            const nextMode = e.target.value as RegionMode;
            if (nextMode === mode) return;

            if (nextMode === 'sync' && !canSync) {
              toast.error('Sync window only supports image/video/GIF items. Remove other items first.');
              return;
            }
            if (nextMode === 'ticker' && !canTicker) {
              toast.error('Ticker window only supports image or scroll-text items. Remove other items first.');
              return;
            }

            const editorName = getEditorRegionName(region);
            const fallbackTitle = editorName ?? ((region.Name ?? '').trim() || 'Window');

            if (nextMode === 'normal') {
              onPatch({ Name: fallbackTitle, [REGION_EDITOR_NAME_KEY]: undefined });
              return;
            }

            const nextName = nextMode === 'sync' ? 'sync_program' : 'singleline_scroll';
            onPatch({ Name: nextName, [REGION_EDITOR_NAME_KEY]: fallbackTitle });
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="normal">Normal</option>
          <option value="sync" disabled={!canSync && mode !== 'sync'}>
            Sync playback
          </option>
          <option value="ticker" disabled={!canTicker && mode !== 'ticker'}>
            Single-line ticker
          </option>
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === 'sync'
            ? 'Sync windows play items in lockstep across all sync windows on the page.'
            : mode === 'ticker'
              ? 'Ticker windows are optimized for single-line scrolling text.'
              : 'Normal windows support any item types.'}
        </p>
      </Field>

      {showDevFields && (
        <Field label="VSN Name">
          <Input value={region.Name} readOnly />
        </Field>
      )}

      <Field label="IsScheduleRegion">
        <select
          value={region.IsScheduleRegion}
          onChange={(e) => onPatch({ IsScheduleRegion: e.target.value as VsnRegion['IsScheduleRegion'] })}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="0">0 · No</option>
          <option value="1">1 · Yes</option>
        </select>
      </Field>

      <Field label="Layer">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={region.Layer ?? ''}
          onChange={(e) => {
            const value = parseStrictPosIntInput(e.target.value);
            if (value == null) return;
            onPatch({ Layer: value });
          }}
          placeholder="e.g. 1"
        />
      </Field>

      <Separator />

      <p className="text-xs font-medium text-muted-foreground">Rect</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="X">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={rect.X}
            onChange={(e) => {
              const value = parseNonNegIntInput(e.target.value);
              if (value == null) return;
              onPatchRect({ X: value });
            }}
          />
        </Field>
        <Field label="Y">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={rect.Y}
            onChange={(e) => {
              const value = parseNonNegIntInput(e.target.value);
              if (value == null) return;
              onPatchRect({ Y: value });
            }}
          />
        </Field>
        <Field label="Width">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={rect.Width}
            onChange={(e) => {
              const value = parseStrictPosIntInput(e.target.value);
              if (value == null) return;
              onPatchRect({ Width: value });
            }}
          />
        </Field>
        <Field label="Height">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={rect.Height}
            onChange={(e) => {
              const value = parseStrictPosIntInput(e.target.value);
              if (value == null) return;
              onPatchRect({ Height: value });
            }}
          />
        </Field>
        <Field label="BorderWidth">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={rect.BorderWidth}
            onChange={(e) => {
              const value = parseNonNegIntInput(e.target.value);
              if (value == null) return;
              onPatchRect({ BorderWidth: value });
            }}
          />
        </Field>
        <Field label="BorderColor">
          <div className="flex items-center gap-2">
            <Input value={borderColor} onChange={(e) => onPatchRect({ BorderColor: e.target.value })} />
            <input
              aria-label="Pick border color"
              type="color"
              value={borderColor.startsWith('#') ? borderColor.slice(0, 7) : '#000000'}
              className="h-9 w-10 cursor-pointer rounded-md border bg-background p-1"
              onChange={(e) => onPatchRect({ BorderColor: e.target.value })}
            />
          </div>
        </Field>
        <Field label="BackColor (optional)">
          <Input
            value={backColor}
            onChange={(e) => onPatchRect({ BackColor: e.target.value ? e.target.value : null })}
            placeholder="#000000"
          />
        </Field>
      </div>
    </div>
  );
}

function ItemInspector({
  item,
  material,
  showDevFields,
  onPatch,
}: {
  item: VsnItem;
  material: EditorMaterial | null;
  showDevFields: boolean;
  onPatch: (patch: Partial<VsnItem>) => void;
}) {
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item.Type === '4' || item.Type === '5') {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = item.Type === '3' ? VideoIcon : item.Type === '2' || item.Type === '6' ? ImageIcon : TypeIcon;
  const Icon = icon;
  const durationLabel = material?.durationMs ? formatDurationMs(material.durationMs) : null;
  const title = material?.name ?? getItemTypeLabel(item.Type, showDevFields);
  const details = [
    material ? material.kind.toLowerCase() : getItemTypeLabel(item.Type, false).toLowerCase(),
    material?.width && material?.height ? `${material.width}×${material.height}` : null,
    durationLabel,
    showDevFields && item.FileSource?.Resource_ID ? `materialId: ${item.FileSource.Resource_ID}` : null,
  ].filter((v): v is string => Boolean(v));
  const rawAlpha = Number.parseFloat(item.Alhpa ?? '');
  const alpha = clampFloat(Number.isFinite(rawAlpha) ? rawAlpha : 1, 0, 1);
  const rawEffect = (item as unknown as { inEffect?: unknown }).inEffect;
  const effect = isPlainObject(rawEffect) ? rawEffect : null;
  const effectType = String((effect?.Type as string | undefined) ?? '0');
  const effectTime = String((effect?.Time as string | undefined) ?? '500');

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-background p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{details.join(' · ')}</p>
          </div>
        </div>
      </div>

      {showDevFields && (
        <Field label="Type">
          <Input value={item.Type} readOnly />
        </Field>
      )}

      {item.Type === '2' || item.Type === '3' || item.Type === '6' ? (
        <div className="space-y-3">
          <Field label="Duration (ms)">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1000}
              value={item.Duration ?? ''}
              onChange={(e) => {
                const value = parseStrictPosIntInput(e.target.value);
                if (value == null) return;
                onPatch({ Duration: value, PlayLength: value });
              }}
            />
          </Field>

          <Field label={showDevFields ? 'PlayTimes' : 'Repeat'}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={item.PlayTimes ?? ''}
              onChange={(e) => {
                const value = parseStrictPosIntInput(e.target.value);
                if (value == null) return;
                onPatch({ PlayTimes: value });
              }}
            />
          </Field>

          <Field label={showDevFields ? 'Alhpa (0..1)' : 'Opacity'}>
            <div className="flex items-center gap-3">
              <input
                aria-label="Opacity"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={alpha}
                onChange={(e) => onPatch({ Alhpa: clampFloat(Number(e.target.value), 0, 1).toFixed(6) })}
                className="flex-1"
              />
              <Input className="w-20" value={alpha.toFixed(2)} readOnly />
            </div>
          </Field>

          <Field label={showDevFields ? 'ReserveAS' : 'Fit'}>
            <select
              value={item.ReserveAS ?? '0'}
              onChange={(e) => onPatch({ ReserveAS: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="0">{showDevFields ? '0 · FIT_XY' : 'Fill'}</option>
              <option value="1">{showDevFields ? '1 · CENTER_INSIDE' : 'Contain'}</option>
            </select>
          </Field>

          <Field label={showDevFields ? 'inEffect' : 'Transition'}>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <select
                  value={effectType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const preset = EFFECT_PRESETS.find((p) => p.id === nextType) ?? EFFECT_PRESETS[0];
                    if (!preset || preset.id === '0') {
                      onPatch({ inEffect: null });
                      return;
                    }
                    const next = {
                      ...(effect ?? {}),
                      Type: preset.id,
                      Name: preset.name,
                      Time: effectTime,
                    };
                    onPatch({ inEffect: next });
                  }}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {EFFECT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {showDevFields ? `${p.id} · ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Time (ms)</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={100}
                  disabled={effectType === '0'}
                  value={effectType === '0' ? '' : effectTime}
                  onChange={(e) => {
                    const value = parseStrictPosIntInput(e.target.value);
                    if (value == null) return;
                    if (effectType === '0') return;
                    const preset = EFFECT_PRESETS.find((p) => p.id === effectType) ?? EFFECT_PRESETS[0];
                    const next = { ...(effect ?? {}), Type: preset.id, Name: preset.name, Time: value };
                    onPatch({ inEffect: next });
                  }}
                />
              </div>
              <div />
            </div>
          </Field>

          {item.Type === '3' && (
            <>
              <Field label="Volume (0..1)">
                <Input value={item.Volume ?? ''} onChange={(e) => onPatch({ Volume: e.target.value })} />
              </Field>
              <Field label="Loop">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={item.Loop ?? ''}
                  onChange={(e) => {
                    const value = parseStrictPosIntInput(e.target.value);
                    if (value == null) return;
                    onPatch({ Loop: value });
                  }}
                />
              </Field>
            </>
          )}
        </div>
      ) : item.Type === '4' || item.Type === '5' ? (
        <div className="space-y-3">
          <Field label="Duration (ms)">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1000}
              value={item.Duration ?? ''}
              onChange={(e) => {
                const value = parseStrictPosIntInput(e.target.value);
                if (value == null) return;
                onPatch({ Duration: value, PlayLength: value });
              }}
            />
          </Field>

          <Field label={showDevFields ? 'PlayTimes' : 'Repeat'}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={item.PlayTimes ?? ''}
              onChange={(e) => {
                const value = parseStrictPosIntInput(e.target.value);
                if (value == null) return;
                onPatch({ PlayTimes: value });
              }}
            />
          </Field>

          <Field label="Text mode">
            <select
              value={item.Type === '5' ? 'scroll' : 'normal'}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'scroll') {
                  onPatch({ Type: '5', IsScroll: '1' });
                  return;
                }
                onPatch({ Type: '4', IsScroll: undefined });
              }}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="normal">Normal</option>
              <option value="scroll">Single-line scroll</option>
            </select>
          </Field>

          <Field label="Text">
            <Input
              ref={textInputRef}
              value={item.Text ?? ''}
              onChange={(e) => onPatch({ Text: e.target.value })}
            />
          </Field>

          <Field label="TextColor">
            <div className="flex items-center gap-2">
              <Input value={item.TextColor ?? ''} onChange={(e) => onPatch({ TextColor: e.target.value })} />
              <input
                aria-label="Pick text color"
                type="color"
                value={(item.TextColor ?? '#ffffff').startsWith('#') ? (item.TextColor ?? '#ffffff').slice(0, 7) : '#ffffff'}
                className="h-9 w-10 cursor-pointer rounded-md border bg-background p-1"
                onChange={(e) => onPatch({ TextColor: e.target.value })}
              />
            </div>
          </Field>

          <Separator />

          <p className="text-xs font-medium text-muted-foreground">Font</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="lfHeight">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={item.LogFont?.lfHeight ?? ''}
                onChange={(e) => {
                  const value = parseStrictPosIntInput(e.target.value);
                  if (value == null) return;
                  onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfHeight: value } });
                }}
              />
            </Field>
            <Field label="lfFaceName">
              <Input
                value={item.LogFont?.lfFaceName ?? ''}
                onChange={(e) =>
                  onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfFaceName: e.target.value } })
                }
                placeholder="e.g. SimHei"
              />
            </Field>
            <Field label="lfWeight">
              <Input
                value={item.LogFont?.lfWeight ?? ''}
                onChange={(e) => onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfWeight: e.target.value } })}
                placeholder="400 / 700"
              />
            </Field>
            <Field label="Italic">
              <select
                value={item.LogFont?.lfItalic ?? '0'}
                onChange={(e) => onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfItalic: e.target.value } })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="0">0 · No</option>
                <option value="1">1 · Yes</option>
              </select>
            </Field>
            <Field label="Underline">
              <select
                value={item.LogFont?.lfUnderLine ?? '0'}
                onChange={(e) =>
                  onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfUnderLine: e.target.value } })
                }
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="0">0 · No</option>
                <option value="1">1 · Yes</option>
              </select>
            </Field>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <BadgeAlert className="h-4 w-4 text-muted-foreground" />
          </div>
          This item type is not editable in MVP.
          {showDevFields && <div className="mt-2 text-xs">Type: {JSON.stringify(item.Type)}</div>}
          <div className="mt-3">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              Keep raw fields
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const EFFECT_PRESETS: { id: string; name: string }[] = [
  { id: '0', name: 'No Effect' },
  { id: '1', name: 'Random' },
  { id: '2', name: 'Wipe left' },
  { id: '3', name: 'Wipe right' },
  { id: '4', name: 'Wipe up' },
  { id: '5', name: 'Wipe down' },
  { id: '6', name: 'Wipe top-left (diagonal)' },
  { id: '7', name: 'Wipe top-right (diagonal)' },
  { id: '8', name: 'Wipe bottom-left (diagonal)' },
  { id: '9', name: 'Wipe bottom-right (diagonal)' },
  { id: '10', name: 'Wipe top-left (line)' },
  { id: '11', name: 'Wipe top-right (line)' },
  { id: '12', name: 'Wipe bottom-left (line)' },
  { id: '13', name: 'Wipe bottom-right (line)' },
  { id: '14', name: 'Blinds horizontal' },
  { id: '15', name: 'Blinds vertical' },
  { id: '16', name: 'Split open (horizontal)' },
  { id: '17', name: 'Split open (vertical)' },
  { id: '18', name: 'Close (horizontal)' },
  { id: '19', name: 'Close (vertical)' },
  { id: '20', name: 'Slide up' },
  { id: '21', name: 'Slide down' },
  { id: '22', name: 'Slide left' },
  { id: '23', name: 'Slide right' },
  { id: '24', name: 'Slide top-left' },
  { id: '25', name: 'Slide top-right' },
  { id: '26', name: 'Slide bottom-left' },
  { id: '27', name: 'Slide bottom-right' },
  { id: '28', name: 'Mosaic (small)' },
  { id: '29', name: 'Mosaic (medium)' },
  { id: '30', name: 'Mosaic (large)' },
  { id: '31', name: 'Fade' },
  { id: '32', name: 'Rotate right 360' },
  { id: '33', name: 'Rotate left 360' },
  { id: '34', name: 'Rotate right 180' },
  { id: '35', name: 'Rotate left 180' },
  { id: '36', name: 'Rotate right 90' },
  { id: '37', name: 'Rotate left 90' },
  { id: '38', name: 'Scale up (center)' },
  { id: '39', name: 'Scale up (top-left)' },
  { id: '40', name: 'Scale up (top-right)' },
  { id: '41', name: 'Scale up (bottom-right)' },
  { id: '42', name: 'Scale up (bottom-left)' },
  { id: '43', name: 'Rectangle expand (center)' },
  { id: '44', name: 'Rectangle close (center)' },
  { id: '45', name: 'Diamond expand (center)' },
  { id: '46', name: 'Diamond close (center)' },
  { id: '47', name: 'Cross expand (center)' },
  { id: '48', name: 'Cross close (center)' },
  { id: '49', name: '3D animation 1' },
  { id: '50', name: '3D animation 2' },
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResolutionInput(value: string, max: number): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return null;
  const clamped = Math.max(1, Math.min(max, Math.trunc(num)));
  return clamped;
}

function parseNonNegIntInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return String(Math.trunc(num));
}

function parseStrictPosIntInput(value: string): string | null {
  const parsed = parseNonNegIntInput(value);
  if (parsed == null) return null;
  if (parsed === '0') return null;
  return parsed;
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getItemTypeLabel(type: string, showDevFields: boolean): string {
  if (type === '2') return 'Image';
  if (type === '3') return 'Video';
  if (type === '4' || type === '5') return 'Text';
  if (type === '6') return 'GIF';
  return showDevFields ? `Item type ${type}` : 'Unsupported item';
}
