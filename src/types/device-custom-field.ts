export type DeviceCustomFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'COUNTRY';

export interface DeviceCustomFieldOption {
  optionId: number;
  optionKey: string;
  displayName: string;
  description?: string;
  sequence?: number;
  active: boolean;
  /**
   * Preset key (e.g. "slate") or hex color (e.g. "#64748b").
   */
  color?: string;
}

export interface DeviceCustomFieldDef {
  fieldId: number;
  fieldKey: string;
  fieldType: DeviceCustomFieldType;
  displayName: string;
  description?: string;
  planTierRequired: boolean;
  sequence?: number;
  /**
   * Optional Lucide icon key (Tag-style).
   */
  icon?: string;
  options?: DeviceCustomFieldOption[];
}

export type DeviceCustomFieldValue = string | number | boolean | string[] | null;

/**
 * Keys are `fieldKey` from `DeviceCustomFieldDef.fieldKey`.
 */
export type DeviceCustomFieldValues = Record<string, DeviceCustomFieldValue>;
