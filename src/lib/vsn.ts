export type ParsedVsnFilename = {
  fileName: string;
  titleSnapshot?: string;
  md5?: string;
  sizeBytes?: number;
  programName?: string;
  version?: number;
};

function basename(path: string): string {
  const raw = path.trim();
  const lastSlash = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\'));
  return lastSlash >= 0 && lastSlash + 1 < raw.length ? raw.slice(lastSlash + 1) : raw;
}

export function parseVsnFilename(input?: string | null): ParsedVsnFilename | null {
  if (!input || !input.trim()) return null;

  const fileName = basename(input);
  const lower = fileName.toLowerCase();
  if (!lower.endsWith('.vsn')) {
    return { fileName };
  }

  const withoutExt = fileName.slice(0, -4);
  const lastUnderscore = withoutExt.lastIndexOf('_');
  const secondLastUnderscore = lastUnderscore > 0 ? withoutExt.lastIndexOf('_', lastUnderscore - 1) : -1;

  if (lastUnderscore < 0 || secondLastUnderscore < 0) {
    return { fileName, titleSnapshot: withoutExt };
  }

  const titleSnapshot = withoutExt.slice(0, secondLastUnderscore);
  const md5 = withoutExt.slice(secondLastUnderscore + 1, lastUnderscore);
  const sizeRaw = withoutExt.slice(lastUnderscore + 1);
  const sizeBytes = Number.parseInt(sizeRaw, 10);

  let programName: string | undefined;
  let version: number | undefined;
  const match = titleSnapshot.match(/^(.*)-v(\d+)$/);
  if (match) {
    programName = match[1];
    version = Number.parseInt(match[2], 10);
    if (!Number.isFinite(version)) version = undefined;
  }

  return {
    fileName,
    titleSnapshot,
    md5,
    sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
    programName,
    version,
  };
}

export function formatVsnDisplayName(parsed: ParsedVsnFilename | null | undefined): string | undefined {
  if (!parsed) return undefined;
  if (parsed.programName && parsed.version != null) return `${parsed.programName} v${parsed.version}`;
  return parsed.titleSnapshot || parsed.fileName;
}

export function buildProgramNameVersionKey(programName?: string, version?: number): string | null {
  if (!programName || !programName.trim() || version == null) return null;
  return `${programName.trim()}#${version}`;
}
