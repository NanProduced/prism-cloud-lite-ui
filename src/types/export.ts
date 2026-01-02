export const ExportType = {
  DEVICE_LOGS: 'DEVICE_LOGS',
  COMMAND_LOGS: 'COMMAND_LOGS',
  DEVICE_ONLINE_SESSIONS: 'DEVICE_ONLINE_SESSIONS',
  PROGRAM_PLAY_SESSIONS: 'PROGRAM_PLAY_SESSIONS',
  MEDIA_PLAY_SESSIONS: 'MEDIA_PLAY_SESSIONS',
} as const;

export type ExportType = (typeof ExportType)[keyof typeof ExportType];

export type ExportValueType = 'TEXT' | 'INT' | 'LONG' | 'DOUBLE' | 'BOOLEAN' | 'DATETIME' | 'JSON';

export interface ExportFieldDefinition {
  key: string;
  headerI18nKey: string;
  valueType: ExportValueType;
}

export interface ExportSchemaResponse {
  exportType: ExportType;
  allowedFormats: string[];
  defaultFields: string[];
  fields: ExportFieldDefinition[];
}

export interface CreateExportRequest {
  exportType: ExportType;
  format: string;
  locale: string;
  timeZone: string;
  fields?: string[];
  filters: Record<string, any>;
}

export interface CreateExportResponse {
  taskId: string;
  messageId: string;
  exportId: string;
}

export interface ExportDownloadResponse {
  url: string;
  expiresAt: string;
}
