// Mock Schedule Data - Outdated but kept for reference
// To be updated when real mock data is needed for local dev without backend

export const mockScheduleRecords: any[] = [
  {
    id: 'sch-001',
    name: 'Standard Business Day',
    description: 'Automatic power on/off and brightness adjustment for retail stores.',
    enabled: true,
    timezone: 'Asia/Shanghai',
    syncStatus: 'synced',
    lastPushedAt: '2025-12-19T10:05:00Z',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-12-19T10:00:00Z',
    boundDeviceCount: 12,
    programRules: [
      {
        id: 'r-1',
        type: 'rotation',
        priority: 1,
        releaseProgramId: 1001,
        programId: 'prog-001',
        programName: 'Lobby Loop V4',
        version: 4,
        ifLimitDate: true,
        limitDate: { start: '2025-01-01', end: '2025-12-31' },
        ifLimitWeekday: true,
        limitWeekday: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        ifLimitTime: true,
        limitTime: { start: '08:30:00', end: '20:00:00' }
      },
      {
        id: 'r-2',
        type: 'spot',
        priority: 10,
        releaseProgramId: 1002,
        programId: 'prog-002',
        programName: 'Flash Sale Alert',
        version: 2,
        ifLimitDate: true,
        limitDate: { start: '2025-12-20', end: '2025-12-25' },
        ifLimitWeekday: true,
        limitWeekday: ['SAT', 'SUN'],
        ifLimitTime: true,
        limitTime: { start: '10:00:00', end: '12:00:00' }
      }
    ],
    commandRules: [
      {
        id: 'c-1',
        name: 'Wakeup',
        payloadJson: '{"type":"Wakeup"}',
        ifLimitDate: false,
        ifLimitWeekday: false,
        ifLimitTime: true,
        limitTime: { start: '08:00:00', end: '08:00:05' }
      },
      {
        id: 'c-2',
        name: 'Brightness_Control',
        payloadJson: '{"type":"Brightness_Control", "brightness": 100}',
        ifLimitDate: false,
        ifLimitWeekday: false,
        ifLimitTime: true,
        limitTime: { start: '10:00:00', end: '10:00:05' }
      },
      {
        id: 'c-3',
        name: 'Sleep',
        payloadJson: '{"type":"Sleep"}',
        ifLimitDate: false,
        ifLimitWeekday: false,
        ifLimitTime: true,
        limitTime: { start: '22:00:00', end: '22:00:05' }
      }
    ]
  },
  {
    id: 'sch-002',
    name: 'Weekend Promotion',
    description: 'High-impact content for peak weekend hours.',
    enabled: true,
    timezone: 'UTC',
    syncStatus: 'partial',
    lastPushedAt: '2025-12-18T16:00:00Z',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-12-18T15:30:00Z',
    boundDeviceCount: 5,
    programRules: [],
    commandRules: []
  },
  {
    id: 'sch-003',
    name: 'Night Mode Energy Saving',
    description: 'Reduce brightness and volume during night hours.',
    enabled: false,
    timezone: 'America/New_York',
    syncStatus: 'pending',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-12-15T09:00:00Z',
    boundDeviceCount: 0,
    programRules: [],
    commandRules: []
  }
];
