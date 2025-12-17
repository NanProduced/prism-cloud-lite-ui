import type { VsnDocument, VsnFileSource, VsnItem, VsnLogFont, VsnPage, VsnProgram, VsnRect, VsnRegion } from './types';

export type VsnValidationSeverity = 'error' | 'warning';

export type VsnValidationIssue = {
  severity: VsnValidationSeverity;
  code: string;
  message: string;
  path: string;
};

export type VsnValidationResult = {
  issues: VsnValidationIssue[];
  isValid: boolean;
};

const COLOR_RE = /^(?:0x[0-9A-Fa-f]{8}|#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8}))$/;
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function validateVsnDocument(doc: unknown, mode: 'draft' | 'publish'): VsnValidationResult {
  const issues: VsnValidationIssue[] = [];

  const push = (issue: VsnValidationIssue) => issues.push(issue);
  const req = (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => {
    if (cond) return;
    push({ severity: 'error', ...issue });
  };
  const warn = (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => {
    if (cond) return;
    push({ severity: 'warning', ...issue });
  };

  if (!isObject(doc)) {
    push({ severity: 'error', code: 'root.not_object', message: 'VSN JSON must be an object.', path: '$' });
    return { issues, isValid: false };
  }

  const programs = (doc as VsnDocument).Programs;
  req(isObject(programs), { code: 'Programs.missing', message: 'Missing Programs.', path: '$.Programs' });
  if (!isObject(programs)) return { issues, isValid: false };

  const program = (programs as { Program?: unknown }).Program;
  req(isObject(program), { code: 'Program.missing', message: 'Missing Programs.Program.', path: '$.Programs.Program' });
  if (!isObject(program)) return { issues, isValid: false };

  validateProgram(program as VsnProgram, { mode, push, req, warn });
  const hasErrors = issues.some((i) => i.severity === 'error');
  return { issues, isValid: !hasErrors };
}

function validateProgram(
  program: VsnProgram,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  const infoPath = '$.Programs.Program.Information';
  ctx.req(isObject(program.Information), {
    code: 'Information.missing',
    message: 'Missing Information.',
    path: infoPath,
  });
  if (isObject(program.Information)) {
    const info = program.Information;
    ctx.req(isStrictPosIntString(info.Width), { code: 'Information.Width.invalid', message: 'Width must be a positive integer string.', path: `${infoPath}.Width` });
    ctx.req(isStrictPosIntString(info.Height), { code: 'Information.Height.invalid', message: 'Height must be a positive integer string.', path: `${infoPath}.Height` });
  }

  const pagesPath = '$.Programs.Program.Pages.Page';
  const pages = program.Pages?.Page;
  ctx.req(Array.isArray(pages), { code: 'Pages.missing', message: 'Missing Pages.Page array.', path: pagesPath });
  if (!Array.isArray(pages)) return;
  if (ctx.mode === 'publish') {
    ctx.req(pages.length > 0, { code: 'Pages.empty', message: 'At least one Page is required.', path: pagesPath });
  } else {
    ctx.warn(pages.length > 0, { code: 'Pages.empty', message: 'No pages yet. Add a page to start building your program.', path: pagesPath });
  }

  pages.forEach((page, pageIndex) => validatePage(page as VsnPage, pageIndex, ctx));
}

function validatePage(
  page: VsnPage,
  pageIndex: number,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  const basePath = `$.Programs.Program.Pages.Page[${pageIndex}]`;
  ctx.req(isString(page.LoopType) && (page.LoopType === '0' || page.LoopType === '1'), {
    code: 'Page.LoopType.invalid',
    message: 'LoopType must be "0" or "1".',
    path: `${basePath}.LoopType`,
  });

  if (page.LoopType === '0') {
    ctx.req(isStrictPosIntString(page.AppointDuration), {
      code: 'Page.AppointDuration.required',
      message: 'AppointDuration is required when LoopType is "0".',
      path: `${basePath}.AppointDuration`,
    });
  } else {
    ctx.warn(isStrictPosIntString(page.AppointDuration), {
      code: 'Page.AppointDuration.recommended',
      message: 'AppointDuration should be provided (even when LoopType is "1").',
      path: `${basePath}.AppointDuration`,
    });
  }

  ctx.req(isString(page.BgColor) && COLOR_RE.test(page.BgColor), {
    code: 'Page.BgColor.invalid',
    message: 'BgColor must be a color string like 0xAARRGGBB or #RRGGBB.',
    path: `${basePath}.BgColor`,
  });

  const regions = page.Regions?.Region;
  const regionsPath = `${basePath}.Regions.Region`;
  ctx.req(Array.isArray(regions), { code: 'Regions.missing', message: 'Missing Regions.Region array.', path: regionsPath });
  if (!Array.isArray(regions)) return;
  if (ctx.mode === 'publish') {
    ctx.req(regions.length > 0, { code: 'Regions.empty', message: 'At least one Region is required.', path: regionsPath });
  } else {
    ctx.warn(regions.length > 0, { code: 'Regions.empty', message: 'No regions yet. Add a region to place content.', path: regionsPath });
  }

  regions.forEach((region, regionIndex) => validateRegion(region as VsnRegion, pageIndex, regionIndex, ctx));
}

function validateRegion(
  region: VsnRegion,
  pageIndex: number,
  regionIndex: number,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  const basePath = `$.Programs.Program.Pages.Page[${pageIndex}].Regions.Region[${regionIndex}]`;

  ctx.req(isNonEmptyString(region.Name), {
    code: 'Region.Name.required',
    message: 'Region Name is required.',
    path: `${basePath}.Name`,
  });

  ctx.req(isString(region.IsScheduleRegion) && (region.IsScheduleRegion === '0' || region.IsScheduleRegion === '1'), {
    code: 'Region.IsScheduleRegion.invalid',
    message: 'IsScheduleRegion must be "0" or "1".',
    path: `${basePath}.IsScheduleRegion`,
  });

  ctx.warn(isStrictPosIntString(region.Layer ?? ''), {
    code: 'Region.Layer.recommended',
    message: 'Layer should be provided when using multiple regions.',
    path: `${basePath}.Layer`,
  });

  validateRect(region.Rect as VsnRect, `${basePath}.Rect`, ctx);

  const items = region.Items?.Item;
  const itemsPath = `${basePath}.Items.Item`;
  ctx.req(Array.isArray(items), { code: 'Items.missing', message: 'Missing Items.Item array.', path: itemsPath });
  if (!Array.isArray(items)) return;
  if (ctx.mode === 'publish') {
    ctx.req(items.length > 0, { code: 'Items.empty', message: 'At least one Item is required in each Region.', path: itemsPath });
  } else {
    ctx.warn(items.length > 0, { code: 'Items.empty', message: 'This region has no items yet.', path: itemsPath });
  }

  const isSyncRegion = region.Name === 'sync_program';
  const isTickerRegion = region.Name === 'singleline_scroll';

  items.forEach((item, itemIndex) => {
    validateItem(item as VsnItem, `${itemsPath}[${itemIndex}]`, ctx);
    if (isSyncRegion) {
      const type = (item as VsnItem).Type;
      const ok = type === '2' || type === '3' || type === '6';
      if (ctx.mode === 'publish') {
        ctx.req(ok, {
          code: 'sync_program.invalid_type',
          message: 'sync_program region only supports item types 2/3/6 (image/video/GIF).',
          path: `${itemsPath}[${itemIndex}].Type`,
        });
      } else {
        ctx.warn(ok, {
          code: 'sync_program.invalid_type',
          message: 'sync_program region only supports item types 2/3/6 (image/video/GIF).',
          path: `${itemsPath}[${itemIndex}].Type`,
        });
      }
    }

    if (isTickerRegion) {
      const type = (item as VsnItem).Type;
      const okType = type === '2' || type === '5';
      const isScroll = (item as unknown as { IsScroll?: unknown }).IsScroll;
      const okScroll = type !== '5' || isScroll === '1';
      const ok = okType && okScroll;
      const message = okType
        ? 'singleline_scroll text items require IsScroll="1".'
        : 'singleline_scroll region only supports item types 2/5 (image/scroll text).';
      if (ctx.mode === 'publish') {
        ctx.req(ok, {
          code: okType ? 'singleline_scroll.missing_IsScroll' : 'singleline_scroll.invalid_type',
          message,
          path: okType ? `${itemsPath}[${itemIndex}].IsScroll` : `${itemsPath}[${itemIndex}].Type`,
        });
      } else {
        ctx.warn(ok, {
          code: okType ? 'singleline_scroll.missing_IsScroll' : 'singleline_scroll.invalid_type',
          message,
          path: okType ? `${itemsPath}[${itemIndex}].IsScroll` : `${itemsPath}[${itemIndex}].Type`,
        });
      }
    }
  });
}

function validateRect(
  rect: VsnRect,
  path: string,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  ctx.req(isObject(rect), { code: 'Rect.missing', message: 'Missing Rect.', path });
  if (!isObject(rect)) return;

  ctx.req(isIntString(rect.X), { code: 'Rect.X.invalid', message: 'Rect.X must be an integer string.', path: `${path}.X` });
  ctx.req(isIntString(rect.Y), { code: 'Rect.Y.invalid', message: 'Rect.Y must be an integer string.', path: `${path}.Y` });
  ctx.req(isStrictPosIntString(rect.Width), { code: 'Rect.Width.invalid', message: 'Rect.Width must be a positive integer string.', path: `${path}.Width` });
  ctx.req(isStrictPosIntString(rect.Height), { code: 'Rect.Height.invalid', message: 'Rect.Height must be a positive integer string.', path: `${path}.Height` });
  ctx.req(isPosIntString(rect.BorderWidth), { code: 'Rect.BorderWidth.invalid', message: 'Rect.BorderWidth must be a non-negative integer string.', path: `${path}.BorderWidth` });

  if (ctx.mode === 'publish') {
    ctx.req(isNonEmptyString(rect.BorderColor ?? ''), {
      code: 'Rect.BorderColor.required',
      message: 'Rect.BorderColor is required for publish.',
      path: `${path}.BorderColor`,
    });
  } else {
    ctx.warn(isNonEmptyString(rect.BorderColor ?? ''), {
      code: 'Rect.BorderColor.recommended',
      message: 'Rect.BorderColor is recommended.',
      path: `${path}.BorderColor`,
    });
  }
}

function validateItem(
  item: VsnItem,
  path: string,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  ctx.req(isObject(item), { code: 'Item.invalid', message: 'Item must be an object.', path });
  if (!isObject(item)) return;

  ctx.req(isNonEmptyString(item.Type), {
    code: 'Item.Type.required',
    message: 'Item.Type is required.',
    path: `${path}.Type`,
  });

  const type = item.Type;

  if (type === '2' || type === '3' || type === '6') {
    reqMediaFields(item, path, ctx);
    if (type === '3') {
      ctx.req(isFloatInRange(item.Volume, 0, 1), {
        code: 'Item.Volume.required',
        message: 'Video Volume must be a float string in [0,1].',
        path: `${path}.Volume`,
      });
      ctx.req(isStrictPosIntString(item.Loop ?? ''), {
        code: 'Item.Loop.required',
        message: 'Video Loop must be a positive integer string.',
        path: `${path}.Loop`,
      });
    }
    return;
  }

  if (type === '4' || type === '5') {
    ctx.req(isStrictPosIntString(item.Duration ?? ''), { code: 'Item.Duration.required', message: 'Text Duration is required (ms as string).', path: `${path}.Duration` });
    ctx.req(isStrictPosIntString(item.PlayLength ?? ''), { code: 'Item.PlayLength.required', message: 'Text PlayLength is required (ms as string).', path: `${path}.PlayLength` });
    ctx.req(isStrictPosIntString(item.PlayTimes ?? ''), { code: 'Item.PlayTimes.required', message: 'Text PlayTimes is required.', path: `${path}.PlayTimes` });

    ctx.req(isNonEmptyString(item.Text ?? ''), { code: 'Item.Text.required', message: 'Text content is required.', path: `${path}.Text` });
    ctx.req(isString(item.TextColor) && COLOR_RE.test(item.TextColor), {
      code: 'Item.TextColor.required',
      message: 'TextColor is required and must be a valid color string.',
      path: `${path}.TextColor`,
    });

    validateLogFont(item.LogFont as VsnLogFont, `${path}.LogFont`, ctx);
    return;
  }

  ctx.warn(ctx.mode === 'draft', {
    code: 'Item.Type.unsupported',
    message: `Item type ${JSON.stringify(type)} is not supported by the MVP editor.`,
    path: `${path}.Type`,
  });
}

function reqMediaFields(
  item: VsnItem,
  path: string,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  ctx.req(isStrictPosIntString(item.Duration ?? ''), { code: 'Item.Duration.required', message: 'Duration is required (ms as string).', path: `${path}.Duration` });
  ctx.req(isStrictPosIntString(item.PlayLength ?? ''), { code: 'Item.PlayLength.required', message: 'PlayLength is required (ms as string).', path: `${path}.PlayLength` });
  ctx.req(isStrictPosIntString(item.PlayTimes ?? ''), { code: 'Item.PlayTimes.required', message: 'PlayTimes is required.', path: `${path}.PlayTimes` });

  ctx.req(isFloatInRange(item.Alhpa, 0, 1), {
    code: 'Item.Alhpa.required',
    message: 'Alhpa must be a float string in [0,1].',
    path: `${path}.Alhpa`,
  });

  ctx.req(item.ReserveAS === '0' || item.ReserveAS === '1', {
    code: 'Item.ReserveAS.required',
    message: 'ReserveAS must be "0" or "1".',
    path: `${path}.ReserveAS`,
  });

  validateFileSource(item.FileSource as VsnFileSource, `${path}.FileSource`, ctx);

  if (item.Duration && item.PlayLength && item.Duration !== item.PlayLength) {
    ctx.warn(false, {
      code: 'Item.PlayLength.mismatch',
      message: 'PlayLength differs from Duration.',
      path: `${path}.PlayLength`,
    });
  }
}

function validateFileSource(
  fileSource: VsnFileSource,
  path: string,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  ctx.req(isObject(fileSource), { code: 'FileSource.required', message: 'FileSource is required.', path });
  if (!isObject(fileSource)) return;

  ctx.req(isString(fileSource.Resource_ID) && UUID_RE.test(fileSource.Resource_ID), {
    code: 'FileSource.Resource_ID.invalid',
    message: 'FileSource.Resource_ID must be a UUID string (materialId).',
    path: `${path}.Resource_ID`,
  });
}

function validateLogFont(
  logFont: VsnLogFont,
  path: string,
  ctx: {
    mode: 'draft' | 'publish';
    push: (issue: VsnValidationIssue) => void;
    req: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
    warn: (cond: boolean, issue: Omit<VsnValidationIssue, 'severity'>) => void;
  },
) {
  ctx.req(isObject(logFont), { code: 'LogFont.required', message: 'LogFont is required.', path });
  if (!isObject(logFont)) return;
  ctx.req(isStrictPosIntString(logFont.lfHeight), { code: 'LogFont.lfHeight.required', message: 'LogFont.lfHeight is required.', path: `${path}.lfHeight` });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIntString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^-?\d+$/.test(value);
}

function isPosIntString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d+$/.test(value);
}

function isStrictPosIntString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^\d+$/.test(value) && value !== '0';
}

function isFloatInRange(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) return false;
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  return num >= min && num <= max;
}
