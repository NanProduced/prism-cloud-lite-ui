export type ProgramDraftSavePolicy = 'ask' | 'always' | 'never';

const STORAGE_KEY = 'prism.settings.programDraftSavePolicy.v1';

export function getProgramDraftSavePolicy(): ProgramDraftSavePolicy {
  const raw = safeRead();
  if (raw === 'always' || raw === 'never' || raw === 'ask') return raw;
  return 'ask';
}

export function setProgramDraftSavePolicy(next: ProgramDraftSavePolicy): void {
  safeWrite(next);
}

function safeRead(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWrite(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

