import type { SchedulePolicy } from '@/types/schedule';

export const mockSchedulePolicies: SchedulePolicy[] = [
  {
    id: 'policy-001',
    name: 'Standard Business Day',
    description: 'Automatic power on/off and brightness adjustment for retail stores.',
    updatedAt: '2025-12-19T10:00:00Z',
    deviceCount: 12,
    contents: [
      {
        id: 'c-1',
        programId: 'prog-001',
        programName: 'Lobby Loop V4',
        type: 'rotation',
        priority: 1,
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        weekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        timeRange: { start: '08:30:00', end: '20:00:00' }
      },
      {
        id: 'c-2',
        programId: 'prog-002',
        programName: 'Flash Sale Alert',
        type: 'spot',
        priority: 10,
        dateRange: { start: '2025-12-20', end: '2025-12-25' },
        weekDays: ['SAT', 'SUN'],
        timeRange: { start: '10:00:00', end: '12:00:00' }
      }
    ],
    commands: [
      {
        id: 'cmd-1',
        name: 'Wakeup',
        params: {},
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        weekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        timeRange: { start: '08:00:00', end: '08:00:05' }
      },
      {
        id: 'cmd-2',
        name: 'Brightness_Control',
        params: { brightness: 100 },
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        weekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        timeRange: { start: '10:00:00', end: '10:00:05' }
      },
      {
        id: 'cmd-3',
        name: 'Sleep',
        params: {},
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        weekDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        timeRange: { start: '22:00:00', end: '22:00:05' }
      }
    ]
  },
  {
    id: 'policy-002',
    name: 'Weekend Promotion',
    description: 'High-impact content for peak weekend hours.',
    updatedAt: '2025-12-18T15:30:00Z',
    deviceCount: 5,
    contents: [],
    commands: []
  },
  {
    id: 'policy-003',
    name: 'Night Mode Energy Saving',
    description: 'Reduce brightness and volume during night hours.',
    updatedAt: '2025-12-15T09:00:00Z',
    deviceCount: 0,
    contents: [],
    commands: []
  }
];
