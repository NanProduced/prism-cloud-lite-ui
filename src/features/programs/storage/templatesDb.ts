import type { VsnDocument } from '@/features/programs/vsn/types';

import { createTemplateFromVsn } from '@/features/programs/vsn/template';

export type ProgramTemplateRecord = {
  id: string;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  vsn: VsnDocument;
};

type TemplatesDb = {
  schemaVersion: 1;
  templates: ProgramTemplateRecord[];
};

const STORAGE_KEY = 'prism-cloud-lite.program-templates.v1';

export function listProgramTemplates(): ProgramTemplateRecord[] {
  return loadDb().templates;
}

export function getProgramTemplate(templateId: string): ProgramTemplateRecord | null {
  const db = loadDb();
  return db.templates.find((t) => t.id === templateId) ?? null;
}

export function createProgramTemplate(input: {
  name: string;
  description?: string | null;
  sourceVsn: VsnDocument;
}): ProgramTemplateRecord {
  const nowIso = new Date().toISOString();
  const id = safeRandomUUID();
  const width = Number.parseInt(input.sourceVsn.Programs?.Program?.Information?.Width ?? '0', 10) || 1920;
  const height = Number.parseInt(input.sourceVsn.Programs?.Program?.Information?.Height ?? '0', 10) || 1080;
  const vsn = createTemplateFromVsn({ doc: input.sourceVsn, keepPageSettings: true });

  const record: ProgramTemplateRecord = {
    id,
    name: input.name.trim() || 'Untitled template',
    description: input.description?.trim() || null,
    width,
    height,
    createdAt: nowIso,
    updatedAt: nowIso,
    vsn,
  };

  const db = loadDb();
  db.templates.unshift(record);
  saveDb(db);
  return record;
}

export function renameProgramTemplate(templateId: string, name: string): ProgramTemplateRecord | null {
  const db = loadDb();
  const template = db.templates.find((t) => t.id === templateId);
  if (!template) return null;
  template.name = name.trim() || template.name;
  template.updatedAt = new Date().toISOString();
  saveDb(db);
  return template;
}

export function deleteProgramTemplate(templateId: string): boolean {
  const db = loadDb();
  const before = db.templates.length;
  db.templates = db.templates.filter((t) => t.id !== templateId);
  saveDb(db);
  return db.templates.length !== before;
}

function loadDb(): TemplatesDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { schemaVersion: 1, templates: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isDb(parsed)) return { schemaVersion: 1, templates: [] };
    return parsed;
  } catch {
    return { schemaVersion: 1, templates: [] };
  }
}

function saveDb(db: TemplatesDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function isDb(value: unknown): value is TemplatesDb {
  if (!value || typeof value !== 'object') return false;
  const v = value as TemplatesDb;
  return v.schemaVersion === 1 && Array.isArray(v.templates);
}

function safeRandomUUID(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

