import { faker } from '@faker-js/faker';
import type { DeviceCustomFieldDef, DeviceCustomFieldValues } from '@/types/device-custom-field';

export const FREE_CUSTOM_FIELD_QUOTA = 2;

export const mockDeviceCustomFieldDefs: DeviceCustomFieldDef[] = [
  {
    fieldId: 9001,
    fieldKey: 'screen_customer',
    fieldType: 'TEXT',
    displayName: 'Screen Customer',
    description: 'Who this screen belongs to (e.g. a telecom operator).',
    planTierRequired: false,
    sequence: 1,
    icon: 'Building2',
  },
  {
    fieldId: 9002,
    fieldKey: 'pricing_tier',
    fieldType: 'SELECT',
    displayName: 'Pricing Tier',
    description: 'Billing tier / price plan.',
    planTierRequired: false,
    sequence: 2,
    icon: 'DollarSign',
    options: [
      { optionId: 9201, optionKey: 'tier-100', displayName: '$100', active: true, sequence: 1, color: 'sky' },
      { optionId: 9202, optionKey: 'tier-300', displayName: '$300', active: true, sequence: 2, color: 'amber' },
      { optionId: 9203, optionKey: 'tier-500', displayName: '$500', active: true, sequence: 3, color: 'rose' },
    ],
  },
  {
    fieldId: 9003,
    fieldKey: 'monthly_fee',
    fieldType: 'NUMBER',
    displayName: 'Monthly Fee',
    description: 'Monthly fee (USD).',
    planTierRequired: true,
    sequence: 3,
    icon: 'CreditCard',
  },
  {
    fieldId: 9004,
    fieldKey: 'contract_end',
    fieldType: 'DATETIME',
    displayName: 'Contract End',
    description: 'Contract end time.',
    planTierRequired: true,
    sequence: 4,
    icon: 'Calendar',
  },
  {
    fieldId: 9005,
    fieldKey: 'managed',
    fieldType: 'BOOLEAN',
    displayName: 'Managed',
    description: 'Managed by our team.',
    planTierRequired: true,
    sequence: 5,
    icon: 'ShieldCheck',
  },
  {
    fieldId: 9006,
    fieldKey: 'regions',
    fieldType: 'MULTI_SELECT',
    displayName: 'Regions',
    description: 'Deployment regions.',
    planTierRequired: true,
    sequence: 6,
    icon: 'Globe',
    options: [
      { optionId: 9301, optionKey: 'apac', displayName: 'APAC', active: true, sequence: 1, color: 'indigo' },
      { optionId: 9302, optionKey: 'emea', displayName: 'EMEA', active: true, sequence: 2, color: 'violet' },
      { optionId: 9303, optionKey: 'na', displayName: 'North America', active: true, sequence: 3, color: 'emerald' },
    ],
  },
  {
    fieldId: 9007,
    fieldKey: 'support_url',
    fieldType: 'URL',
    displayName: 'Support URL',
    description: 'Support portal link.',
    planTierRequired: true,
    sequence: 7,
  },
  {
    fieldId: 9008,
    fieldKey: 'contact_email',
    fieldType: 'EMAIL',
    displayName: 'Contact Email',
    description: 'Primary contact email.',
    planTierRequired: true,
    sequence: 8,
  },
  {
    fieldId: 9009,
    fieldKey: 'hotline',
    fieldType: 'PHONE',
    displayName: 'Hotline',
    description: 'Primary hotline number.',
    planTierRequired: true,
    sequence: 9,
  },
  {
    fieldId: 9010,
    fieldKey: 'country',
    fieldType: 'COUNTRY',
    displayName: 'Country',
    description: 'Country/Region (ISO 3166-1 alpha-2).',
    planTierRequired: true,
    sequence: 10,
  },
];

export function generateMockDeviceCustomFieldValues(deviceIndex: number): DeviceCustomFieldValues {
  const values: DeviceCustomFieldValues = {};

  values['9001'] = faker.helpers.arrayElement([
    'Telecom Operator',
    'Retail Chain',
    'Airport Authority',
    'Coffee Brand',
    'University',
  ]);

  values['9002'] = faker.helpers.arrayElement(['tier-100', 'tier-300', 'tier-500']);

  values['9003'] = faker.number.float({ min: -50, max: 1200, multipleOf: 0.01 });

  values['9004'] = faker.date.soon({ days: 180, refDate: new Date() }).toISOString();

  values['9005'] = faker.datatype.boolean();

  values['9006'] = faker.helpers
    .shuffle(['apac', 'emea', 'na'])
    .slice(0, faker.number.int({ min: 1, max: 2 }));

  values['9007'] = deviceIndex % 3 === 0 ? faker.internet.url() : null;
  values['9008'] = deviceIndex % 4 === 0 ? faker.internet.email() : null;
  values['9009'] = deviceIndex % 5 === 0 ? faker.phone.number() : null;

  values['9010'] = faker.helpers.arrayElement(['US', 'CN', 'JP', 'DE', 'GB', 'SG', 'AU']);

  return values;
}
