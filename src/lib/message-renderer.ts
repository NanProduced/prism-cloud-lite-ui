import type { MessageListItem } from "@/types/message";
import i18n from "@/i18n/config";

export interface RenderedMessage {
  title: string;
  summary: string;
}

export function renderMessage(message: MessageListItem): RenderedMessage {
  const { type, status, payload = {}, kind } = message;
  const t = i18n.t.bind(i18n);

  const statusLabel = status ? t(`message.status.${status}`) : '';
  const kindLabel = t(`message.kind.${kind}`);

  switch (type) {
    case 'device.command.finished':
      return {
        title: t('message.type.device.command.finished.title', { status: statusLabel }),
        summary: t('message.type.device.command.finished.summary', { 
          actionType: payload.actionType || 'Unknown', 
          target: message.deviceName || payload.deviceId || 'Device' 
        })
      };

    case 'device.command.batch.finished':
      return {
        title: t('message.type.device.command.batch.finished.title'),
        summary: t('message.type.device.command.batch.finished.summary', {
          success: payload.success ?? 0,
          total: payload.total ?? 0,
          failed: payload.failed ?? 0
        })
      };

    case 'program.publish.online.finished':
      return {
        title: t('message.type.program.publish.online.finished.title', { status: statusLabel }),
        summary: t('message.type.program.publish.online.finished.summary', {
          programName: payload.programName || 'Program',
          version: payload.version !== undefined ? payload.version : '?',
          onlineTargets: payload.onlineTargets ?? 0,
          totalTargets: payload.totalTargets ?? 0
        })
      };

    case 'program.publish.finished':
      return {
        title: t('message.type.program.publish.finished.title'),
        summary: t('message.type.program.publish.finished.summary', {
          programName: payload.programName || 'Program',
          version: payload.version !== undefined ? payload.version : '?',
          totalTargets: payload.totalTargets ?? 0
        })
      };

    case 'media.transcode':
      const hasProgress = payload.progress?.percent !== undefined;
      const progressText = hasProgress ? ` (${Math.round(payload.progress.percent * 100)}%)` : '';
      
      const stageMap: Record<string, string> = {
        'PENDING': 'Queued',
        'DOWNLOADING': 'Preparing source',
        'TRANSCODING': 'Processing',
        'UPLOADING': 'Finalizing',
        'FINALIZING': 'Saving to library',
        'SUCCESS': 'Completed',
        'FAILED': 'Failed'
      };

      const stageText = stageMap[payload.stage as string] || payload.stage || '';
      
      return {
        title: t('message.type.media.transcode.title', { status: statusLabel }),
        summary: t('message.type.media.transcode.summary', {
          sourceTitle: payload.source?.title || 'Unknown Media',
          stage: stageText,
          progress: progressText
        })
      };

    default:
      return {
        title: t('message.unknown.title'),
        summary: t('message.unknown.summary', { kind: kindLabel })
      };
  }
}
