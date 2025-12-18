export type ProgramActionType = 
  | 'CREATE' 
  | 'EDIT' 
  | 'SAVE_DRAFT' 
  | 'CREATE_VERSION' 
  | 'PUBLISH_START' 
  | 'PUBLISH_COMPLETE' 
  | 'UNDEPLOY';

export type ProgramAuditLog = {
  id: string;
  programId: string;
  timestamp: string;
  action: ProgramActionType;
  userId: string;
  userName: string;
  details: {
    version?: number;
    deviceCount?: number;
    snapshotId?: string;
    description?: string;
    strategy?: string;
  };
};

const STORAGE_KEY = 'prism-cloud-lite.program-audit.v1';

export function listProgramAuditLogs(programId: string): ProgramAuditLog[] {
  const db = loadDb();
  return db.filter(log => log.programId === programId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function addProgramAuditLog(log: Omit<ProgramAuditLog, 'id' | 'timestamp'>) {
  const db = loadDb();
  const newEntry: ProgramAuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  db.unshift(newEntry);
  saveDb(db);
}

function loadDb(): ProgramAuditLog[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveDb(db: ProgramAuditLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
