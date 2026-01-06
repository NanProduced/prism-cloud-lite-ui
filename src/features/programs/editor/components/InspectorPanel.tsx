import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BadgeAlert, ChevronDown, Image as ImageIcon, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { PopoverColorPicker } from '@/components/ui/popover-color-picker';
import { parseResolution } from '@/lib/resolution';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        <p className="text-sm font-medium">{t('programEditor.panels.inspector.title')}</p>
        <p className="text-xs text-muted-foreground">
          {item ? t('programEditor.panels.inspector.item') : region ? t('programEditor.panels.inspector.region') : t('programEditor.panels.inspector.program')}
        </p>
      </div>

      <Separator className="my-3" />

      <ScrollArea className="flex-1">
        <div className="space-y-6 px-4 py-4">
          {!doc || !page ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              {t('programEditor.panels.inspector.noDoc')}
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
            <div className="space-y-8">
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
        </div>
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
  const { t } = useTranslation();
  const [nameDraft, setNameDraft] = useState(programName);
  const [widthDraft, setWidthDraft] = useState(String(programWidth));
  const [heightDraft, setHeightDraft] = useState(String(programHeight));

  useEffect(() => setNameDraft(programName), [programName]);
  useEffect(() => setWidthDraft(String(programWidth)), [programWidth]);
  useEffect(() => setHeightDraft(String(programHeight)), [programHeight]);

  const selectedDevice = useMemo(
    () => (targetDeviceId ? devices.find((d) => String(d.deviceId || d.id) === targetDeviceId) ?? null : null),
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
      <p className="text-sm font-medium">{t('programEditor.panels.inspector.program')}</p>

      <Field label={t('programEditor.panels.inspector.labels.programName')}>
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

          <Field label={t('programEditor.panels.inspector.labels.targetDevice')}>
        <DeviceResolutionPicker
          devices={devices}
          value={targetDeviceId}
          onChange={(deviceId) => {
            if (!deviceId) {
              onSetProgramResolution({ width: programWidth, height: programHeight, targetDeviceId: null });
              return;
            }
            const device = devices.find((d) => String(d.deviceId || d.id) === deviceId);
            if (!device) return;
            const res = parseResolution(device.resolution, { width: programWidth, height: programHeight });

            onSetProgramResolution({
              width: res.width,
              height: res.height,
              targetDeviceId: deviceId,
            });
          }}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{t('programEditor.panels.inspector.labels.canvasResolution')}</p>
          <p className="text-xs text-muted-foreground">max 8192×4096</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('programEditor.panels.inspector.labels.width')}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={8192}
              value={widthDraft}
              onChange={(e) => setWidthDraft(e.target.value)}
              onBlur={commitResolution}
            />
          </Field>
          <Field label={t('programEditor.panels.inspector.labels.height')}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={4096}
              value={heightDraft}
              onChange={(e) => setHeightDraft(e.target.value)}
              onBlur={commitResolution}
            />
          </Field>
        </div>

        {!selectedDevice && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={commitResolution}>
              {t('programEditor.panels.inspector.labels.apply')}
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
  const { t } = useTranslation();
  const cssColor = vsnBgColorToCss(page.BgColor);
  const hexColor = cssColor.startsWith('#') ? cssColor : '#000000';

  return (
    <div className="space-y-5">
      <Field label={t('programEditor.panels.inspector.labels.loopType')}>
        <Select
          value={page.LoopType}
          onValueChange={(v) => onPatch({ LoopType: v as VsnPage['LoopType'] })}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Select loop type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 · {t('programEditor.panels.inspector.labels.autoDuration')}</SelectItem>
            <SelectItem value="0">0 · {t('programEditor.panels.inspector.labels.fixedDuration')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label={t('programEditor.panels.inspector.labels.appointDuration')}>
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

      <Field label={t('programEditor.panels.inspector.labels.background')}>
        <PopoverColorPicker
          value={hexColor}
          onChange={(v) => onPatch({ BgColor: cssHexToVsnBgColor(v) })}
        />
        {showDevFields && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground tracking-tight">VSN Internal</p>
            <Input value={page.BgColor} onChange={(e) => onPatch({ BgColor: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
        )}
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
  const { t } = useTranslation();
  const rect = region.Rect;
  const borderColor = rect.BorderColor ?? '#000000';
  const backColor = rect.BackColor ?? '';
  const mode = getRegionMode(region);
  const title = getRegionDisplayName(region, undefined, t);
  const canSync = regionHasOnlyAllowedItemTypes(region, 'sync');
  const canTicker = regionHasOnlyAllowedItemTypes(region, 'ticker');

  return (
    <div className="space-y-5">
      <Field label={t('programEditor.panels.inspector.labels.title')}>
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

      <Field label={t('programEditor.panels.inspector.labels.windowType')}>
        <Select
          value={mode}
          onValueChange={(v) => {
            const nextMode = v as RegionMode;
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
            const fallbackTitle = editorName ?? ((region.Name ?? '').trim() || t('programEditor.panels.inspector.region'));

            if (nextMode === 'normal') {
              onPatch({ Name: fallbackTitle, [REGION_EDITOR_NAME_KEY]: undefined });
              return;
            }

            const nextName = nextMode === 'sync' ? 'sync_program' : 'singleline_scroll';
            onPatch({ Name: nextName, [REGION_EDITOR_NAME_KEY]: fallbackTitle });
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">{t('programEditor.panels.inspector.labels.normal')}</SelectItem>
            <SelectItem value="sync" disabled={!canSync && mode !== 'sync'}>
              {t('programEditor.panels.inspector.labels.sync')}
            </SelectItem>
            <SelectItem value="ticker" disabled={!canTicker && mode !== 'ticker'}>
              {t('programEditor.panels.inspector.labels.ticker')}
            </SelectItem>
          </SelectContent>
        </Select>
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

      <Field label={t('programEditor.panels.inspector.labels.isSchedule')}>
        <Select
          value={region.IsScheduleRegion}
          onValueChange={(v) => onPatch({ IsScheduleRegion: v as VsnRegion['IsScheduleRegion'] })}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Is schedule region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 · {t('programEditor.panels.inspector.labels.no')}</SelectItem>
            <SelectItem value="1">1 · {t('programEditor.panels.inspector.labels.yes')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label={t('programEditor.panels.inspector.labels.layer')}>
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

      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between text-xs font-bold tracking-tight text-muted-foreground hover:text-foreground">
            {t('programEditor.panels.inspector.labels.rect')}
            <ChevronDown className="h-3 w-3 transition-transform duration-200" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="X">
              <Input
                type="number"
                inputMode="numeric"
                value={rect.X}
                onChange={(e) => onPatchRect({ X: parseNonNegIntInput(e.target.value) ?? '0' })}
              />
            </Field>
            <Field label="Y">
              <Input
                type="number"
                inputMode="numeric"
                value={rect.Y}
                onChange={(e) => onPatchRect({ Y: parseNonNegIntInput(e.target.value) ?? '0' })}
              />
            </Field>
            <Field label={t('programEditor.panels.inspector.labels.width')}>
              <Input
                type="number"
                inputMode="numeric"
                value={rect.Width}
                onChange={(e) => onPatchRect({ Width: parseStrictPosIntInput(e.target.value) ?? '100' })}
              />
            </Field>
            <Field label={t('programEditor.panels.inspector.labels.height')}>
              <Input
                type="number"
                inputMode="numeric"
                value={rect.Height}
                onChange={(e) => onPatchRect({ Height: parseStrictPosIntInput(e.target.value) ?? '100' })}
              />
            </Field>
            <Field label={t('programEditor.panels.inspector.labels.borderWidth')}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={rect.BorderWidth ?? '0'}
                onChange={(e) => onPatchRect({ BorderWidth: parseNonNegIntInput(e.target.value) ?? '0' })}
              />
            </Field>
            <Field label={t('programEditor.panels.inspector.labels.borderColor')}>
              <PopoverColorPicker
                value={vsnBgColorToCss(borderColor)}
                onChange={(v) => onPatchRect({ BorderColor: cssHexToVsnBgColor(v) })}
              />
            </Field>
            <div className="col-span-2">
              <Field label={t('programEditor.panels.inspector.labels.backColor')}>
                <PopoverColorPicker
                  value={backColor ? vsnBgColorToCss(backColor) : ''}
                  onChange={(v) => onPatchRect({ BackColor: v ? cssHexToVsnBgColor(v) : null })}
                />
              </Field>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
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
  const { t } = useTranslation();
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
  const title = material?.name ?? getItemTypeLabel(item.Type, showDevFields, t);
  const details = [
    material ? material.kind.toLowerCase() : getItemTypeLabel(item.Type, false, t).toLowerCase(),
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
          <Field label={t('programEditor.panels.inspector.labels.duration')}>
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

          <Field label={showDevFields ? 'PlayTimes' : t('programEditor.panels.inspector.labels.repeat')}>
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

          <Field label={showDevFields ? 'Alhpa (0..1)' : t('programEditor.panels.inspector.labels.opacity')}>
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

          <Field label={showDevFields ? 'ReserveAS' : t('programEditor.panels.inspector.labels.fit')}>
            <Select
              value={item.ReserveAS ?? '0'}
              onValueChange={(v) => onPatch({ ReserveAS: v })}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select fit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{showDevFields ? '0 · FIT_XY' : t('programEditor.panels.inspector.labels.fill')}</SelectItem>
                <SelectItem value="1">{showDevFields ? '1 · CENTER_INSIDE' : t('programEditor.panels.inspector.labels.contain')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Collapsible className="space-y-2">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between text-xs font-bold tracking-tight text-muted-foreground hover:text-foreground">
                {showDevFields ? 'inEffect' : t('programEditor.panels.inspector.labels.transition')}
                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Select
                    value={effectType}
                    onValueChange={(v) => {
                      const nextType = v;
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
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select transition" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] scrollbar-thin">
                      {EFFECT_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {showDevFields ? `${p.id} · ${p.name}` : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground/60">{t('programEditor.panels.inspector.labels.transitionTime')}</span>
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
              </div>
            </CollapsibleContent>
          </Collapsible>

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
          <Field label={t('programEditor.panels.inspector.labels.duration')}>
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

          <Field label={showDevFields ? 'PlayTimes' : t('programEditor.panels.inspector.labels.repeat')}>
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

          <Field label={t('programEditor.panels.inspector.labels.textMode')}>
            <Select
              value={item.Type === '5' ? 'scroll' : 'normal'}
              onValueChange={(v) => {
                const next = v;
                if (next === 'scroll') {
                  onPatch({ Type: '5', IsScroll: '1' });
                  return;
                }
                onPatch({ Type: '4', IsScroll: undefined });
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('programEditor.panels.inspector.labels.normal')}</SelectItem>
                <SelectItem value="scroll">{t('programEditor.panels.inspector.labels.ticker')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t('programEditor.panels.inspector.labels.text')}>
            <Input
              ref={textInputRef}
              value={item.Text ?? ''}
              onChange={(e) => onPatch({ Text: e.target.value })}
            />
          </Field>

          <Field label={t('programEditor.panels.inspector.labels.textColor')}>
            <PopoverColorPicker
              value={vsnBgColorToCss(item.TextColor || '0xFFFFFFFF')}
              onChange={(v) => onPatch({ TextColor: cssHexToVsnBgColor(v) })}
            />
          </Field>

          <Field label={t('programEditor.panels.inspector.labels.backColor')}>
            <PopoverColorPicker
              value={vsnBgColorToCss(item.backcolor || '0x00000000')}
              onChange={(v) => onPatch({ backcolor: cssHexToVsnBgColor(v) })}
            />
          </Field>

          <Separator />

          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between text-xs font-bold tracking-tight text-muted-foreground hover:text-foreground">
                {t('programEditor.panels.inspector.labels.font')}
                <ChevronDown className="h-3 w-3 transition-transform duration-200" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
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
                <Field label={t('programEditor.panels.inspector.labels.italic')}>
                  <Select
                    value={item.LogFont?.lfItalic ?? '0'}
                    onValueChange={(v) => onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfItalic: v } })}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder={t('programEditor.panels.inspector.labels.italic')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 · {t('programEditor.panels.inspector.labels.no')}</SelectItem>
                      <SelectItem value="1">1 · {t('programEditor.panels.inspector.labels.yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('programEditor.panels.inspector.labels.underline')}>
                  <Select
                    value={item.LogFont?.lfUnderLine ?? '0'}
                    onValueChange={(v) =>
                      onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfUnderLine: v } })
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder={t('programEditor.panels.inspector.labels.underline')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 · {t('programEditor.panels.inspector.labels.no')}</SelectItem>
                      <SelectItem value="1">1 · {t('programEditor.panels.inspector.labels.yes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CollapsibleContent>
          </Collapsible>
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

function getItemTypeLabel(type: string, showDevFields: boolean, t: any): string {
  if (type === '2') return t('programEditor.panels.items.image');
  if (type === '3') return t('programEditor.panels.items.video');
  if (type === '4' || type === '5') return t('programEditor.panels.items.text');
  if (type === '6') return t('programEditor.panels.items.gif');
  return showDevFields ? `Item type ${type}` : t('programEditor.panels.items.unsupported');
}
