import { faker } from '@faker-js/faker';
import type { Device, Tag, DeviceStatus, NetworkType } from '@/types/device';

// Pre-defined constants
const DEVICE_MODELS = ['DS-2000X', 'DS-3000Pro', 'DS-4000Ultra', 'DS-5000Max', 'PS-1000Lite'];
const RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
];

// Pre-defined tags
const MOCK_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Lobby', slug: 'lobby', color: '#3b82f6', isSystem: false },
  { id: 'tag-2', name: 'Retail', slug: 'retail', color: '#10b981', isSystem: false },
  { id: 'tag-3', name: 'Office', slug: 'office', color: '#f59e0b', isSystem: false },
  { id: 'tag-4', name: 'Outdoor', slug: 'outdoor', color: '#8b5cf6', isSystem: false },
  { id: 'tag-5', name: 'High Priority', slug: 'high-priority', color: '#ef4444', isSystem: false },
  { id: 'tag-6', name: 'Test Device', slug: 'test-device', color: '#6b7280', isSystem: false },
  { id: 'sys-1', name: 'Never Online', slug: 'never-online', color: '#dc2626', isSystem: true },
  { id: 'sys-2', name: 'Needs Firmware Update', slug: 'needs-update', color: '#ea580c', isSystem: true },
];

// Status distribution: 15 online, 3 offline, 2 pending
const STATUS_DISTRIBUTION: DeviceStatus[] = [
  ...Array(15).fill('online'),
  ...Array(3).fill('offline'),
  ...Array(2).fill('pending'),
] as DeviceStatus[];

function generateMockDevice(index: number): Device {
  // Shuffle status distribution for randomness
  const status = STATUS_DISTRIBUTION[index] || 'online';

  // Network type with weighted distribution
  const networkRandom = Math.random();
  let networkType: NetworkType = 'WiFi';
  if (networkRandom > 0.6 && networkRandom <= 0.9) networkType = 'Ethernet';
  else if (networkRandom > 0.9) networkType = '4G';

  // Resolution with weighted distribution
  const resolutionRandom = Math.random();
  let resolution = RESOLUTIONS[0];
  if (resolutionRandom > 0.5 && resolutionRandom <= 0.8) resolution = RESOLUTIONS[1];
  else if (resolutionRandom > 0.8 && resolutionRandom <= 0.95) resolution = RESOLUTIONS[2];
  else if (resolutionRandom > 0.95) resolution = RESOLUTIONS[3];

  // Random tags (1-3 per device)
  const tagCount = faker.number.int({ min: 1, max: 3 });
  const tags = faker.helpers.shuffle(MOCK_TAGS).slice(0, tagCount);

  // Generate timestamps
  const onboardingTime = faker.date.past({ years: 1 });
  const lastReportTime = status === 'pending'
    ? onboardingTime
    : faker.date.recent({ days: status === 'offline' ? 7 : 1 });

  // Offline duration (only for offline devices)
  const offlineDuration = status === 'offline'
    ? faker.number.int({ min: 300, max: 86400 * 3 }) // 5 min to 3 days
    : undefined;

  // Storage (used 20-90% of total)
  const storageTotal = faker.helpers.arrayElement([32, 64, 128, 256]) * 1024 * 1024 * 1024; // GB to bytes
  const storageUsed = Math.floor(storageTotal * faker.number.float({ min: 0.2, max: 0.9 }));

  // Current program (70% of devices have a program)
  const hasProgram = faker.helpers.maybe(() => true, { probability: 0.7 });
  const currentProgram = hasProgram ? {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement([
      'Summer Campaign',
      'Daily Notices',
      'Lobby Loop',
      'Menu Board',
      'Welcome Screen',
      'Promotion Video',
    ]),
    version: `v${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}`,
  } : undefined;

  // Screenshot (80% have screenshots)
  const hasScreenshot = status !== 'pending' && faker.helpers.maybe(() => true, { probability: 0.8 });
  const latestScreenshot = hasScreenshot ? {
    url: `https://picsum.photos/seed/${index}/800/450`,
    timestamp: lastReportTime.toISOString(),
  } : undefined;

  // Signal strength (only for WiFi and 4G)
  const signalStrength = networkType !== 'Ethernet'
    ? faker.number.int({ min: 30, max: 100 })
    : undefined;

  return {
    id: `device-${String(index).padStart(3, '0')}`,
    deviceName: `${faker.location.city()} ${faker.helpers.arrayElement(['Display', 'Screen', 'Terminal', 'Panel'])} ${index}`,
    alias: faker.helpers.maybe(() => faker.word.adjective() + ' ' + faker.word.noun(), { probability: 0.3 }),
    serialNumber: faker.string.alphanumeric({ length: 16, casing: 'upper' }),

    // Status
    status,
    lastReportTime: lastReportTime.toISOString(),
    onboardingTime: onboardingTime.toISOString(),
    offlineDuration,

    // Hardware Info
    model: faker.helpers.arrayElement(DEVICE_MODELS),
    firmwareVersion: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 20 })}`,
    resolution,

    // Network
    networkType,
    websocketStatus: status === 'online' ? 'connected' : 'disconnected',
    ipAddress: status !== 'pending' ? faker.internet.ipv4() : undefined,
    macAddress: faker.internet.mac(),
    signalStrength,

    // Display Control
    brightness: faker.number.int({ min: 30, max: 100 }),
    colorTemperature: faker.number.int({ min: 3000, max: 6500 }),
    volume: faker.number.int({ min: 40, max: 80 }),

    // Storage
    storageUsed,
    storageTotal,

    // Current Program
    currentProgram,

    // Tags
    tags,

    // Screenshot
    latestScreenshot,
  };
}

// Generate 20 mock devices
export const mockDevices: Device[] = Array.from({ length: 20 }, (_, i) =>
  generateMockDevice(i + 1)
);

// Export tags for reference
export const mockTags = MOCK_TAGS;

// Helper function to get device by ID
export function getMockDeviceById(id: string): Device | undefined {
  return mockDevices.find(device => device.id === id);
}

// Helper function to filter devices by status
export function getMockDevicesByStatus(status: DeviceStatus): Device[] {
  return mockDevices.filter(device => device.status === status);
}
