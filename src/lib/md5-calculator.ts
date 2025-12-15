type Md5WorkerOutMessage =
  | { type: 'progress'; clientId: string; processedBytes: number; totalBytes: number }
  | { type: 'done'; clientId: string; md5: string }
  | { type: 'canceled'; clientId: string }
  | { type: 'error'; clientId: string; message: string };

type Md5WorkerInMessage =
  | { type: 'compute'; clientId: string; file: File; chunkSize?: number }
  | { type: 'cancel'; clientId: string };

type PendingTask = {
  resolve: (md5: string) => void;
  reject: (error: Error) => void;
  onProgress?: (percent: number, data: { processedBytes: number; totalBytes: number }) => void;
  signal?: AbortSignal;
  abortListener?: () => void;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingTask>();

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('../workers/md5.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<Md5WorkerOutMessage>) => {
    const message = event.data;
    const task = pending.get(message.clientId);
    if (!task) return;

    if (message.type === 'progress') {
      const percent = message.totalBytes === 0 ? 1 : message.processedBytes / message.totalBytes;
      task.onProgress?.(percent, { processedBytes: message.processedBytes, totalBytes: message.totalBytes });
      return;
    }

    cleanupTask(message.clientId);

    if (message.type === 'done') {
      task.resolve(message.md5);
      return;
    }

    if (message.type === 'canceled') {
      task.reject(new Error('Canceled.'));
      return;
    }

    task.reject(new Error(message.message));
  };

  return worker;
}

function cleanupTask(clientId: string) {
  const task = pending.get(clientId);
  if (!task) return;
  if (task.signal && task.abortListener) task.signal.removeEventListener('abort', task.abortListener);
  pending.delete(clientId);
}

export async function computeMd5(
  file: File,
  clientId: string,
  options?: {
    chunkSize?: number;
    onProgress?: (percent: number, data: { processedBytes: number; totalBytes: number }) => void;
    signal?: AbortSignal;
  },
): Promise<string> {
  if (pending.has(clientId)) throw new Error(`Duplicate MD5 task: ${clientId}`);

  const task: PendingTask = {
    resolve: () => {},
    reject: () => {},
    onProgress: options?.onProgress,
    signal: options?.signal,
  };

  const promise = new Promise<string>((resolve, reject) => {
    task.resolve = resolve;
    task.reject = reject;
  });

  if (task.signal) {
    const onAbort = () => {
      cancelMd5(clientId);
    };
    task.abortListener = onAbort;
    task.signal.addEventListener('abort', onAbort, { once: true });
  }

  pending.set(clientId, task);
  getWorker().postMessage({ type: 'compute', clientId, file, chunkSize: options?.chunkSize } satisfies Md5WorkerInMessage);

  return promise;
}

export function cancelMd5(clientId: string) {
  const task = pending.get(clientId);
  if (!task) return;
  cleanupTask(clientId);
  getWorker().postMessage({ type: 'cancel', clientId } satisfies Md5WorkerInMessage);
  task.reject(new Error('Canceled.'));
}

