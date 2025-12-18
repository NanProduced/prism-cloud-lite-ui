export type ProgramDeploymentRecord = {
  programId: string;
  deviceId: string;
  version: number;
  deployedAt: string;
};

type DeploymentsDb = {
  schemaVersion: 1;
  deployments: ProgramDeploymentRecord[];
};

const STORAGE_KEY = 'prism-cloud-lite.program-deployments.v1';

export function listDeployments(): ProgramDeploymentRecord[] {
  return loadDb().deployments;
}

export function listProgramDeployments(programId: string): ProgramDeploymentRecord[] {
  return loadDb().deployments.filter((d) => d.programId === programId);
}

export function listDeviceDeployments(deviceId: string): ProgramDeploymentRecord[] {
  return loadDb().deployments.filter((d) => d.deviceId === deviceId);
}

export function getProgramDeployment(programId: string, deviceId: string): ProgramDeploymentRecord | null {
  const db = loadDb();
  return db.deployments.find((d) => d.programId === programId && d.deviceId === deviceId) ?? null;
}

export function deployProgramVersionToDevices(input: {
  programId: string;
  version: number;
  deviceIds: string[];
}): ProgramDeploymentRecord[] {
  const nowIso = new Date().toISOString();
  const deviceIds = uniq(input.deviceIds).filter(Boolean);
  if (deviceIds.length === 0) return listProgramDeployments(input.programId);

  const db = loadDb();
  for (const deviceId of deviceIds) {
    const existing = db.deployments.find((d) => d.programId === input.programId && d.deviceId === deviceId) ?? null;
    if (existing) {
      existing.version = input.version;
      existing.deployedAt = nowIso;
      continue;
    }
    db.deployments.push({ programId: input.programId, deviceId, version: input.version, deployedAt: nowIso });
  }
  saveDb(db);
  return db.deployments.filter((d) => d.programId === input.programId);
}

export function undeployProgramFromDevices(input: { programId: string; deviceIds: string[] }): ProgramDeploymentRecord[] {
  const deviceIds = new Set(input.deviceIds);
  const db = loadDb();
  db.deployments = db.deployments.filter((d) => !(d.programId === input.programId && deviceIds.has(d.deviceId)));
  saveDb(db);
  return db.deployments.filter((d) => d.programId === input.programId);
}

export function undeployProgramEverywhere(programId: string): void {
  const db = loadDb();
  db.deployments = db.deployments.filter((d) => d.programId !== programId);
  saveDb(db);
}

function loadDb(): DeploymentsDb {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { schemaVersion: 1, deployments: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isDb(parsed)) return { schemaVersion: 1, deployments: [] };
    return parsed;
  } catch {
    return { schemaVersion: 1, deployments: [] };
  }
}

function saveDb(db: DeploymentsDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function isDb(value: unknown): value is DeploymentsDb {
  if (!value || typeof value !== 'object') return false;
  const v = value as DeploymentsDb;
  return v.schemaVersion === 1 && Array.isArray(v.deployments);
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

