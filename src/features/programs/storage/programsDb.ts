import type { VsnDocument } from '@/features/programs/vsn/types';

import { createBlankVsnDocument } from '../vsn/defaults';

export type ProgramDraftRecord = {
  id: string;
  name?: string | null;
  baseVersion: number | null;
  createdAt: string;
  updatedAt: string;
  vsn: VsnDocument;
  thumbnail?: string | null;
};

export type ProgramVersionRecord = {
  version: number;
  createdAt: string;
  sourceDraftId: string;
  vsn: VsnDocument;
  thumbnail?: string | null;
};

export type ProgramRecord = {
  id: string;
  name: string;
  width: number;
  height: number;
  targetDeviceId?: string | null;
  createdAt: string;
  updatedAt: string;
  defaultVersion: number | null;
  drafts: ProgramDraftRecord[];
  versions: ProgramVersionRecord[];
};

type ProgramsDb = {
  schemaVersion: 1;
  programs: ProgramRecord[];
};

const STORAGE_KEY = 'prism-cloud-lite.programs.v1';
const PUBLISHED_VERSION_LIMIT = 10;

export function listPrograms(): ProgramRecord[] {
  return loadDb().programs;
}

export function getProgram(programId: string): ProgramRecord | null {
  const db = loadDb();
  return db.programs.find((p) => p.id === programId) ?? null;
}

export function createProgram(input: { name: string; width: number; height: number }): ProgramRecord {
  const nowIso = new Date().toISOString();
  const id = safeRandomUUID();
  const blank = createBlankVsnDocument({ width: input.width, height: input.height, name: input.name });
  const draft: ProgramDraftRecord = {
    id: safeRandomUUID(),
    name: null,
    baseVersion: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    vsn: blank,
  };

  const record: ProgramRecord = {
    id,
    name: input.name,
    width: input.width,
    height: input.height,
    createdAt: nowIso,
    updatedAt: nowIso,
    defaultVersion: null,
    drafts: [draft],
    versions: [],
  };

  const db = loadDb();
  db.programs.unshift(record);
  saveDb(db);
  return record;
}

export function createProgramFromSeed(input: { name: string; width: number; height: number; vsn: VsnDocument }): ProgramRecord {
  const nowIso = new Date().toISOString();
  const id = safeRandomUUID();
  const draft: ProgramDraftRecord = {
    id: safeRandomUUID(),
    name: null,
    baseVersion: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    vsn: deepClone(input.vsn),
  };

  const record: ProgramRecord = {
    id,
    name: input.name,
    width: input.width,
    height: input.height,
    createdAt: nowIso,
    updatedAt: nowIso,
    defaultVersion: null,
    drafts: [draft],
    versions: [],
  };

  const db = loadDb();
  db.programs.unshift(record);
  saveDb(db);
  return record;
}

export function renameProgram(programId: string, name: string): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  program.name = name;
  program.updatedAt = new Date().toISOString();
  saveDb(db);
  return program;
}

export function deleteProgram(programId: string): boolean {
  const db = loadDb();
  const before = db.programs.length;
  db.programs = db.programs.filter((p) => p.id !== programId);
  saveDb(db);
  return db.programs.length !== before;
}

export function updateProgramCanvas(
  programId: string,
  input: { width: number; height: number; targetDeviceId: string | null },
): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  program.width = Math.max(1, Math.round(input.width));
  program.height = Math.max(1, Math.round(input.height));
  program.targetDeviceId = input.targetDeviceId;
  program.updatedAt = new Date().toISOString();
  saveDb(db);
  return program;
}

export function ensureDraft(programId: string, baseVersion: number | null): ProgramDraftRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;

  const existing = program.drafts.find((d) => d.baseVersion === baseVersion);
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const seed = baseVersion ? program.versions.find((v) => v.version === baseVersion)?.vsn : null;
  const draft: ProgramDraftRecord = {
    id: safeRandomUUID(),
    name: null,
    baseVersion,
    createdAt: nowIso,
    updatedAt: nowIso,
    vsn: deepClone(seed ?? createBlankVsnDocument({ width: program.width, height: program.height, name: program.name })),
  };
  program.drafts.push(draft);
  program.updatedAt = nowIso;
  saveDb(db);
  return draft;
}

export function renameDraft(programId: string, draftId: string, name: string): ProgramDraftRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  const draft = program.drafts.find((d) => d.id === draftId);
  if (!draft) return null;
  draft.name = name.trim() || null;
  draft.updatedAt = new Date().toISOString();
  program.updatedAt = draft.updatedAt;
  saveDb(db);
  return draft;
}

export function deleteDraft(programId: string, draftId: string): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  const before = program.drafts.length;
  program.drafts = program.drafts.filter((d) => d.id !== draftId);
  if (program.drafts.length === before) return null;
  program.updatedAt = new Date().toISOString();
  saveDb(db);
  return program;
}

export function saveDraft(
  programId: string,
  draftId: string,
  vsn: VsnDocument,
  thumbnail?: string | null,
): ProgramDraftRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;

  const draft = program.drafts.find((d) => d.id === draftId);
  if (!draft) return null;

  const nowIso = new Date().toISOString();
  draft.vsn = deepClone(vsn);
  draft.updatedAt = nowIso;
  if (thumbnail !== undefined) {
    draft.thumbnail = thumbnail;
  }
  program.updatedAt = nowIso;
  saveDb(db);
  return draft;
}

export function publishDraft(programId: string, draftId: string): { program: ProgramRecord; version: ProgramVersionRecord } | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;

  if (program.versions.length >= PUBLISHED_VERSION_LIMIT) {
    throw new Error(`Published versions limit reached (${PUBLISHED_VERSION_LIMIT}).`);
  }

  const draft = program.drafts.find((d) => d.id === draftId);
  if (!draft) return null;

  const nextVersion = Math.max(0, ...program.versions.map((v) => v.version)) + 1;
  const nowIso = new Date().toISOString();

  const version: ProgramVersionRecord = {
    version: nextVersion,
    createdAt: nowIso,
    sourceDraftId: draft.id,
    vsn: deepClone(draft.vsn),
    thumbnail: draft.thumbnail,
  };

  program.versions.push(version);
  program.defaultVersion = nextVersion;
  program.updatedAt = nowIso;

  // Move the published draft baseline forward so continued edits start from the new version.
  draft.baseVersion = nextVersion;
  draft.updatedAt = nowIso;

  saveDb(db);
  return { program, version };
}

export function setDefaultProgramVersion(programId: string, version: number | null): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  if (version != null && !program.versions.some((v) => v.version === version)) return null;
  program.defaultVersion = version;
  program.updatedAt = new Date().toISOString();
  saveDb(db);
  return program;
}

export function deleteProgramVersion(programId: string, version: number): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  if (program.defaultVersion === version) return null;
  if (program.drafts.some((d) => d.baseVersion === version)) return null;
  const before = program.versions.length;
  program.versions = program.versions.filter((v) => v.version !== version);
  if (program.versions.length === before) return null;
  program.updatedAt = new Date().toISOString();
  saveDb(db);
  return program;
}

function loadDb(): ProgramsDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { schemaVersion: 1, programs: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isDb(parsed)) return { schemaVersion: 1, programs: [] };
    return parsed;
  } catch {
    return { schemaVersion: 1, programs: [] };
  }
}

function saveDb(db: ProgramsDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function isDb(value: unknown): value is ProgramsDb {
  if (!value || typeof value !== 'object') return false;
  const v = value as ProgramsDb;
  return v.schemaVersion === 1 && Array.isArray(v.programs);
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeRandomUUID(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
