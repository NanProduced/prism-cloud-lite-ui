import type { MediaAssetNode } from '@/types/media-library';

import type { VsnDocument, VsnItem, VsnPage, VsnProgram, VsnRect, VsnRegion } from './types';

export const DEFAULT_BG_COLOR = '0xFF000000';
export const DEFAULT_BORDER_COLOR = '0xFF000000';
export const DEFAULT_TEXT_COLOR = '0xFFFFFFFF';

export const DEFAULT_ALPHA = '1.000000';
export const DEFAULT_PLAY_TIMES = '1';
export const DEFAULT_RESERVE_AS: '0' | '1' = '0';

export const DEFAULT_VIDEO_VOLUME = '1.000000';
export const DEFAULT_VIDEO_LOOP = '1';

export const DEFAULT_TEXT_FONT_SIZE = '48';
export const DEFAULT_TEXT_FONT_FACE = 'SimHei';

export function createBlankVsnDocument(input: {
  width: number;
  height: number;
  pageDurationMs?: number;
  name?: string;
}): VsnDocument {
  return {
    Programs: {
      Program: createBlankVsnProgram(input),
    },
  };
}

export function createBlankVsnProgram(input: {
  width: number;
  height: number;
  pageDurationMs?: number;
}): VsnProgram {
  const page = createBlankVsnPage({
    width: input.width,
    height: input.height,
    durationMs: input.pageDurationMs ?? 10_000,
  });

  return {
    Information: {
      Width: String(input.width),
      Height: String(input.height),
      Scale: null,
    },
    Pages: {
      Page: [page],
    },
    Id: null,
  };
}

export function createBlankVsnPage(input: { width: number; height: number; durationMs: number }): VsnPage {
  return {
    AppointDuration: String(Math.max(1, Math.round(input.durationMs))),
    LoopType: '1',
    BgColor: DEFAULT_BG_COLOR,
    BgFile: null,
    Regions: {
      Region: [],
    },
  };
}

export function createBlankVsnRegion(input: { name: string; layer: number; rect: VsnRect }): VsnRegion {
  return {
    Layer: String(Math.max(1, Math.round(input.layer))),
    Rect: input.rect,
    Name: input.name,
    IsScheduleRegion: '0',
    Items: {
      Item: [],
    },
  };
}

export function createItemFromMedia(asset: MediaAssetNode, input: { materialId: string }): VsnItem {
  const isVideo = asset.assetKind === 'video';
  const isImage = asset.assetKind === 'image';
  const isGif = isImage && (asset.extension ?? '').toLowerCase() === 'gif';

  if (isVideo) {
    const durationMs = Math.max(1, asset.durationMs ?? 8_000);
    return {
      Type: '3',
      Duration: String(durationMs),
      PlayLength: String(durationMs),
      PlayTimes: DEFAULT_PLAY_TIMES,
      Alhpa: DEFAULT_ALPHA,
      FileSource: { Resource_ID: input.materialId },
      ReserveAS: DEFAULT_RESERVE_AS,
      Volume: DEFAULT_VIDEO_VOLUME,
      Loop: DEFAULT_VIDEO_LOOP,
      inEffect: null,
    };
  }

  if (isGif) {
    const durationMs = 3_000;
    return {
      Type: '6',
      Duration: String(durationMs),
      PlayLength: String(durationMs),
      PlayTimes: DEFAULT_PLAY_TIMES,
      Alhpa: DEFAULT_ALPHA,
      FileSource: { Resource_ID: input.materialId },
      ReserveAS: DEFAULT_RESERVE_AS,
      inEffect: null,
    };
  }

  if (isImage) {
    const durationMs = 3_000;
    return {
      Type: '2',
      Duration: String(durationMs),
      PlayLength: String(durationMs),
      PlayTimes: DEFAULT_PLAY_TIMES,
      Alhpa: DEFAULT_ALPHA,
      FileSource: { Resource_ID: input.materialId },
      ReserveAS: DEFAULT_RESERVE_AS,
      inEffect: null,
    };
  }

  // Unsupported assets fall back to a text placeholder so the editor remains usable.
  const fallbackDurationMs = 3_000;
  return {
    Type: '4',
    backcolor: '0x00000000',
    Duration: String(fallbackDurationMs),
    PlayLength: String(fallbackDurationMs),
    PlayTimes: DEFAULT_PLAY_TIMES,
    Text: asset.name,
    TextColor: DEFAULT_TEXT_COLOR,
    LogFont: {
      lfHeight: DEFAULT_TEXT_FONT_SIZE,
      lfFaceName: DEFAULT_TEXT_FONT_FACE,
      lfWeight: '400',
      lfItalic: '0',
      lfUnderLine: '0',
    },
  };
}

export function createTextItem(input?: { durationMs?: number; text?: string }): VsnItem {
  const durationMs = Math.max(1, input?.durationMs ?? 8_000);
  return {
    Type: '4',
    backcolor: '0x00000000',
    Duration: String(durationMs),
    PlayLength: String(durationMs),
    PlayTimes: DEFAULT_PLAY_TIMES,
    Text: input?.text ?? 'New Text',
    TextColor: DEFAULT_TEXT_COLOR,
    LogFont: {
      lfHeight: DEFAULT_TEXT_FONT_SIZE,
      lfFaceName: DEFAULT_TEXT_FONT_FACE,
      lfWeight: '400',
      lfItalic: '0',
      lfUnderLine: '0',
    },
  };
}

export function createScrollTextItem(input?: { durationMs?: number; text?: string }): VsnItem {
  const item = createTextItem(input);
  return {
    ...item,
    Type: '5',
    IsScroll: '1',
  };
}
