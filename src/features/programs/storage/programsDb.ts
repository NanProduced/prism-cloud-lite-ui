import type { VsnDocument } from '@/features/programs/vsn/types';

import { createBlankVsnDocument } from '../vsn/defaults';

export type ProgramDraftRecord = {
  id: string;
  baseVersion: number | null;
  createdAt: string;
  updatedAt: string;
  vsn: VsnDocument;
};

export type ProgramVersionRecord = {
  version: number;
  createdAt: string;
  sourceDraftId: string;
  vsn: VsnDocument;
};

export type ProgramRecord = {
  id: string;
  name: string;
  width: number;
  height: number;
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

export function renameProgram(programId: string, name: string): ProgramRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;
  program.name = name;
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

export function saveDraft(programId: string, draftId: string, vsn: VsnDocument): ProgramDraftRecord | null {
  const db = loadDb();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;

  const draft = program.drafts.find((d) => d.id === draftId);
  if (!draft) return null;

  const nowIso = new Date().toISOString();
  draft.vsn = deepClone(vsn);
  draft.updatedAt = nowIso;
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

