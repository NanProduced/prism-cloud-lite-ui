import { faker } from '@faker-js/faker';
import type { Device, DeviceLocation, Tag, DeviceStatus, NetworkType } from '@/types/device';
import { generateMockDeviceCustomFieldValues } from './device-custom-fields';

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
  { id: 'tag-1', name: 'Lobby', tagName: 'Lobby', slug: 'lobby', tagSlug: 'lobby', color: 'sky', icon: 'Building2', isSystem: false },
  { id: 'tag-2', name: 'Retail', tagName: 'Retail', slug: 'retail', tagSlug: 'retail', color: 'amber', icon: 'Store', isSystem: false },
  { id: 'tag-3', name: 'Office', tagName: 'Office', slug: 'office', tagSlug: 'office', color: 'slate', icon: 'Briefcase', isSystem: false },
  { id: 'tag-4', name: 'Outdoor', tagName: 'Outdoor', slug: 'outdoor', tagSlug: 'outdoor', color: 'emerald', icon: 'Trees', isSystem: false },
  { id: 'tag-5', name: 'High Priority', tagName: 'High Priority', slug: 'high-priority', tagSlug: 'high-priority', color: 'rose', icon: 'AlertTriangle', isSystem: false },
  { id: 'tag-6', name: 'Test Device', tagName: 'Test Device', slug: 'test-device', tagSlug: 'test-device', color: 'stone', icon: 'FlaskConical', isSystem: false },
];

// Status distribution: 15 online, 3 offline, 2 pending
const STATUS_DISTRIBUTION: DeviceStatus[] = [
  ...Array(15).fill('online'),
  ...Array(3).fill('offline'),
  ...Array(2).fill('pending'),
] as DeviceStatus[];

const LOCATION_CLUSTERS = [
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Hangzhou', lat: 30.2741, lng: 120.1551 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Shenzhen', lat: 22.5431, lng: 114.0579 },
] as const;

function jitterLocation(cluster: (typeof LOCATION_CLUSTERS)[number], radiusKm: number) {
  const radiusLat = radiusKm / 111;
  const radiusLng = radiusKm / (111 * Math.cos((cluster.lat * Math.PI) / 180));
  return {
    lat: cluster.lat + faker.number.float({ min: -radiusLat, max: radiusLat, fractionDigits: 6 }),
    lng: cluster.lng + faker.number.float({ min: -radiusLng, max: radiusLng, fractionDigits: 6 }),
  };
}

function createDeviceLocation(
  source: DeviceLocation['source'],
  point: { lat: number; lng: number },
  timestamp: Date,
  options?: { accuracyM?: number }
): DeviceLocation {
  return {
    lat: point.lat,
    lng: point.lng,
    source,
    timestamp: timestamp.toISOString(),
    accuracyM: options?.accuracyM,
  };
}

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

  const cluster = LOCATION_CLUSTERS[(index - 1) % LOCATION_CLUSTERS.length];
  const hasGps = status !== 'pending' && faker.helpers.maybe(() => true, { probability: 0.9 });
  const reportedLocation = hasGps
    ? createDeviceLocation(
      'reported',
      jitterLocation(cluster, 25),
      lastReportTime,
      { accuracyM: faker.number.int({ min: 5, max: 40 }) }
    )
    : undefined;

  const hasManualLocation = faker.helpers.maybe(() => true, { probability: hasGps ? 0.2 : 0.6 });
  const manualLocation = hasManualLocation
    ? createDeviceLocation(
      'manual',
      jitterLocation(cluster, 3),
      faker.date.recent({ days: 30 })
    )
    : undefined;

  return {
    id: `device-${String(index).padStart(3, '0')}`,
    deviceId: 10000 + index,
    deviceName: `${faker.location.city()} ${faker.helpers.arrayElement(['Display', 'Screen', 'Terminal', 'Panel'])} ${index}`,
    alias: faker.helpers.maybe(() => faker.word.adjective() + ' ' + faker.word.noun(), { probability: 0.3 }),
    serialNumber: faker.string.alphanumeric({ length: 16, casing: 'upper' }),

    // Status
    status,
    onlineStatus: status === 'online' ? 1 : 0,
    lastReportTime: lastReportTime.toISOString(),
    onboardingTime: onboardingTime.toISOString(),
    createTime: onboardingTime.toISOString(),
    offlineDuration,

    // Hardware Info
    model: faker.helpers.arrayElement(DEVICE_MODELS),
    version: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 20 })}`,
    firmwareVersion: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 20 })}`,
    resolution,

    // Network
    networkType,
    websocketStatus: status === 'online' ? 'connected' : 'disconnected',
    ipAddress: status !== 'pending' ? faker.internet.ipv4() : undefined,
    macAddress: faker.internet.mac(),
    signalStrength,
    networkStrength: signalStrength,

    // Display Control
    brightness: faker.number.int({ min: 30, max: 100 }),
    colorTemperature: faker.number.int({ min: 3000, max: 6500 }),
    volume: faker.number.int({ min: 40, max: 80 }),

    // Storage
    storageUsed,
    storageTotal,
    totalStorage: storageTotal,
    freeStorage: storageTotal - storageUsed,

    // Current Program
    currentProgram,
    playingProgram: currentProgram?.name,

    // Tags
    tags: tags.map(t => ({ ...t, tagName: t.name as string, tagSlug: t.slug as string })),

    // Custom Fields
    customFieldValues: generateMockDeviceCustomFieldValues(index),

    // Screenshot
    latestScreenshot,
    lastScreenshotUrl: latestScreenshot?.url,

    reportedLocation,
    manualLocation,
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
