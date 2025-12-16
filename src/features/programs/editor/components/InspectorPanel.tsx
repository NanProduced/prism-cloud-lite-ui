import { useMemo, type ReactNode } from 'react';
import { BadgeAlert, Image as ImageIcon, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { VsnDocument, VsnItem, VsnPage, VsnRect, VsnRegion } from '@/features/programs/vsn/types';

import type { EditorMaterial, EditorSelection } from '../types';
import { cssHexToVsnBgColor, formatDurationMs, vsnBgColorToCss } from '../utils';
import { getItems, getPages, getRegions } from '../vsnOps';

type MaterialIndex = Record<string, EditorMaterial>;

export function InspectorPanel({
  doc,
  selection,
  materialIndex,
  onPatchPage,
  onPatchRegion,
  onPatchRegionRect,
  onPatchItem,
}: {
  doc: VsnDocument | null;
  selection: EditorSelection;
  materialIndex: MaterialIndex;
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
          {item ? 'Item' : region ? 'Region' : 'Page'}
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
            item={item}
            material={resolveMaterial(materialIndex, item)}
            onPatch={(patch) => onPatchItem(selection.pageIndex, selection.regionIndex!, selection.itemIndex!, patch)}
          />
        ) : region ? (
          <RegionInspector
            region={region}
            onPatch={(patch) => onPatchRegion(selection.pageIndex, selection.regionIndex!, patch)}
            onPatchRect={(patch) => onPatchRegionRect(selection.pageIndex, selection.regionIndex!, patch)}
          />
        ) : (
          <PageInspector page={page} onPatch={(patch) => onPatchPage(selection.pageIndex, patch)} />
        )}
      </ScrollArea>
    </div>
  );
}

function resolveMaterial(materialIndex: MaterialIndex, item: VsnItem): EditorMaterial | null {
  const id = item.FileSource?.Resource_ID;
  if (!id) return null;
  return materialIndex[id] ?? null;
}

function PageInspector({ page, onPatch }: { page: VsnPage; onPatch: (patch: Partial<VsnPage>) => void }) {
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
        <Input value={page.AppointDuration} onChange={(e) => onPatch({ AppointDuration: e.target.value })} />
      </Field>

      <Field label="Background">
        <div className="flex items-center gap-2">
          <Input value={page.BgColor} onChange={(e) => onPatch({ BgColor: e.target.value })} />
          <input
            aria-label="Pick background color"
            type="color"
            value={hexColor}
            className="h-9 w-10 cursor-pointer rounded-md border bg-background p-1"
            onChange={(e) => onPatch({ BgColor: cssHexToVsnBgColor(e.target.value) })}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Stored as 0xAARRGGBB in VSN.</p>
      </Field>
    </div>
  );
}

function RegionInspector({
  region,
  onPatch,
  onPatchRect,
}: {
  region: VsnRegion;
  onPatch: (patch: Partial<VsnRegion>) => void;
  onPatchRect: (patch: Partial<VsnRect>) => void;
}) {
  const rect = region.Rect;
  const borderColor = rect.BorderColor ?? '#000000';
  const backColor = rect.BackColor ?? '';

  return (
    <div className="space-y-5">
      <Field label="Name">
        <Input value={region.Name} onChange={(e) => onPatch({ Name: e.target.value })} />
      </Field>

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
        <Input value={region.Layer ?? ''} onChange={(e) => onPatch({ Layer: e.target.value })} placeholder="e.g. 1" />
      </Field>

      <Separator />

      <p className="text-xs font-medium text-muted-foreground">Rect</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="X">
          <Input value={rect.X} onChange={(e) => onPatchRect({ X: e.target.value })} />
        </Field>
        <Field label="Y">
          <Input value={rect.Y} onChange={(e) => onPatchRect({ Y: e.target.value })} />
        </Field>
        <Field label="Width">
          <Input value={rect.Width} onChange={(e) => onPatchRect({ Width: e.target.value })} />
        </Field>
        <Field label="Height">
          <Input value={rect.Height} onChange={(e) => onPatchRect({ Height: e.target.value })} />
        </Field>
        <Field label="BorderWidth">
          <Input value={rect.BorderWidth} onChange={(e) => onPatchRect({ BorderWidth: e.target.value })} />
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
  onPatch,
}: {
  item: VsnItem;
  material: EditorMaterial | null;
  onPatch: (patch: Partial<VsnItem>) => void;
}) {
  const icon = item.Type === '3' ? VideoIcon : item.Type === '2' || item.Type === '6' ? ImageIcon : TypeIcon;
  const Icon = icon;
  const durationLabel = material?.durationMs ? formatDurationMs(material.durationMs) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-background p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{material?.name ?? `Item type ${item.Type}`}</p>
            <p className="text-xs text-muted-foreground">
              {item.FileSource?.Resource_ID ? `materialId: ${item.FileSource.Resource_ID}` : 'no material'}
              {durationLabel ? ` · ${durationLabel}` : ''}
            </p>
          </div>
        </div>
      </div>

      <Field label="Type">
        <Input value={item.Type} readOnly />
      </Field>

      {item.Type === '2' || item.Type === '3' || item.Type === '6' ? (
        <div className="space-y-3">
          <Field label="Duration (ms)">
            <Input value={item.Duration ?? ''} onChange={(e) => onPatch({ Duration: e.target.value, PlayLength: e.target.value })} />
          </Field>

          <Field label="PlayTimes">
            <Input value={item.PlayTimes ?? ''} onChange={(e) => onPatch({ PlayTimes: e.target.value })} />
          </Field>

          <Field label="Alhpa (0..1)">
            <Input value={item.Alhpa ?? ''} onChange={(e) => onPatch({ Alhpa: e.target.value })} />
          </Field>

          <Field label="ReserveAS">
            <select
              value={item.ReserveAS ?? '0'}
              onChange={(e) => onPatch({ ReserveAS: e.target.value })}
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="0">0 · FIT_XY</option>
              <option value="1">1 · CENTER_INSIDE</option>
            </select>
          </Field>

          {item.Type === '3' && (
            <>
              <Field label="Volume (0..1)">
                <Input value={item.Volume ?? ''} onChange={(e) => onPatch({ Volume: e.target.value })} />
              </Field>
              <Field label="Loop">
                <Input value={item.Loop ?? ''} onChange={(e) => onPatch({ Loop: e.target.value })} />
              </Field>
            </>
          )}
        </div>
      ) : item.Type === '4' || item.Type === '5' ? (
        <div className="space-y-3">
          <Field label="Duration (ms)">
            <Input value={item.Duration ?? ''} onChange={(e) => onPatch({ Duration: e.target.value, PlayLength: e.target.value })} />
          </Field>

          <Field label="PlayTimes">
            <Input value={item.PlayTimes ?? ''} onChange={(e) => onPatch({ PlayTimes: e.target.value })} />
          </Field>

          <Field label="Text">
            <Input value={item.Text ?? ''} onChange={(e) => onPatch({ Text: e.target.value })} />
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
                value={item.LogFont?.lfHeight ?? ''}
                onChange={(e) =>
                  onPatch({ LogFont: { ...(item.LogFont ?? { lfHeight: '32' }), lfHeight: e.target.value } })
                }
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
          Item type {JSON.stringify(item.Type)} is not editable in MVP.
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
