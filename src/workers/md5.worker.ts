/// <reference lib="webworker" />

import SparkMD5 from 'spark-md5';

type Md5ComputeMessage = {
  type: 'compute';
  clientId: string;
  file: File;
  chunkSize?: number;
};

type Md5CancelMessage = {
  type: 'cancel';
  clientId: string;
};

type Md5WorkerInMessage = Md5ComputeMessage | Md5CancelMessage;

type Md5WorkerOutMessage =
  | { type: 'progress'; clientId: string; processedBytes: number; totalBytes: number }
  | { type: 'done'; clientId: string; md5: string }
  | { type: 'canceled'; clientId: string }
  | { type: 'error'; clientId: string; message: string };

const canceled = new Set<string>();
const queue: Md5ComputeMessage[] = [];
let activeClientId: string | null = null;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<Md5WorkerInMessage>) => {
  const message = event.data;

  if (message.type === 'cancel') {
    canceled.add(message.clientId);
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i]?.clientId === message.clientId) queue.splice(i, 1);
    }
    if (activeClientId !== message.clientId) canceled.delete(message.clientId);
    return;
  }

  queue.push(message);
  void runNext();
};

async function runNext() {
  if (activeClientId) return;
  const message = queue.shift();
  if (!message) return;

  const { clientId, file } = message;
  const chunkSize = message.chunkSize ?? 8 * 1024 * 1024;

  if (canceled.has(clientId)) {
    canceled.delete(clientId);
    ctx.postMessage({ type: 'canceled', clientId } satisfies Md5WorkerOutMessage);
    void runNext();
    return;
  }

  activeClientId = clientId;

  try {
    const spark = new SparkMD5.ArrayBuffer();
    const totalBytes = file.size;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));

    let lastEmit = 0;
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (canceled.has(clientId)) {
        canceled.delete(clientId);
        ctx.postMessage({ type: 'canceled', clientId } satisfies Md5WorkerOutMessage);
        return;
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, totalBytes);

      const buffer = await file.slice(start, end).arrayBuffer();
      spark.append(buffer);

      const now = Date.now();
      if (now - lastEmit > 120 || chunkIndex === totalChunks - 1) {
        lastEmit = now;
        ctx.postMessage({
          type: 'progress',
          clientId,
          processedBytes: end,
          totalBytes,
        } satisfies Md5WorkerOutMessage);
      }
    }

    ctx.postMessage({ type: 'done', clientId, md5: spark.end() } satisfies Md5WorkerOutMessage);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Failed to compute MD5.';
    ctx.postMessage({ type: 'error', clientId, message: messageText } satisfies Md5WorkerOutMessage);
  } finally {
    activeClientId = null;
    void runNext();
  }
}
