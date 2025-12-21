export interface AvatarPreset {
  id: string;
  url: string;
  label: string;
  category: 'male' | 'female';
}

export const MALE_AVATARS: AvatarPreset[] = [
  { id: 'm-1', url: '/assets/avatars/male/Number=1.png', label: 'Male 1', category: 'male' },
  { id: 'm-104', url: '/assets/avatars/male/Number=104.png', label: 'Male 2', category: 'male' },
  { id: 'm-107', url: '/assets/avatars/male/Number=107.png', label: 'Male 3', category: 'male' },
  { id: 'm-11', url: '/assets/avatars/male/Number=11.png', label: 'Male 4', category: 'male' },
  { id: 'm-112', url: '/assets/avatars/male/Number=112.png', label: 'Male 5', category: 'male' },
  { id: 'm-12', url: '/assets/avatars/male/Number=12.png', label: 'Male 6', category: 'male' },
  { id: 'm-18', url: '/assets/avatars/male/Number=18.png', label: 'Male 7', category: 'male' },
  { id: 'm-20', url: '/assets/avatars/male/Number=20.png', label: 'Male 8', category: 'male' },
  { id: 'm-22', url: '/assets/avatars/male/Number=22.png', label: 'Male 9', category: 'male' },
  { id: 'm-24', url: '/assets/avatars/male/Number=24.png', label: 'Male 10', category: 'male' },
  { id: 'm-6', url: '/assets/avatars/male/Number=6.png', label: 'Male 11', category: 'male' },
  { id: 'm-7', url: '/assets/avatars/male/Number=7.png', label: 'Male 12', category: 'male' },
  { id: 'm-71', url: '/assets/avatars/male/Number=71.png', label: 'Male 13', category: 'male' },
  { id: 'm-72', url: '/assets/avatars/male/Number=72.png', label: 'Male 14', category: 'male' },
  { id: 'm-80', url: '/assets/avatars/male/Number=80.png', label: 'Male 15', category: 'male' },
  { id: 'm-87', url: '/assets/avatars/male/Number=87.png', label: 'Male 16', category: 'male' },
  { id: 'm-88', url: '/assets/avatars/male/Number=88.png', label: 'Male 17', category: 'male' },
  { id: 'm-9', url: '/assets/avatars/male/Number=9.png', label: 'Male 18', category: 'male' },
];

export const FEMALE_AVATARS: AvatarPreset[] = [
  { id: 'f-26', url: '/assets/avatars/female/Number=26.png', label: 'Female 1', category: 'female' },
  { id: 'f-29', url: '/assets/avatars/female/Number=29.png', label: 'Female 2', category: 'female' },
  { id: 'f-30', url: '/assets/avatars/female/Number=30.png', label: 'Female 3', category: 'female' },
  { id: 'f-33', url: '/assets/avatars/female/Number=33.png', label: 'Female 4', category: 'female' },
  { id: 'f-35', url: '/assets/avatars/female/Number=35.png', label: 'Female 5', category: 'female' },
  { id: 'f-42', url: '/assets/avatars/female/Number=42.png', label: 'Female 6', category: 'female' },
  { id: 'f-46', url: '/assets/avatars/female/Number=46.png', label: 'Female 7', category: 'female' },
  { id: 'f-47', url: '/assets/avatars/female/Number=47.png', label: 'Female 8', category: 'female' },
  { id: 'f-48', url: '/assets/avatars/female/Number=48.png', label: 'Female 9', category: 'female' },
  { id: 'f-49', url: '/assets/avatars/female/Number=49.png', label: 'Female 10', category: 'female' },
  { id: 'f-54', url: '/assets/avatars/female/Number=54.png', label: 'Female 11', category: 'female' },
  { id: 'f-55', url: '/assets/avatars/female/Number=55.png', label: 'Female 12', category: 'female' },
  { id: 'f-58', url: '/assets/avatars/female/Number=58.png', label: 'Female 13', category: 'female' },
  { id: 'f-59', url: '/assets/avatars/female/Number=59.png', label: 'Female 14', category: 'female' },
  { id: 'f-60', url: '/assets/avatars/female/Number=60.png', label: 'Female 15', category: 'female' },
  { id: 'f-92', url: '/assets/avatars/female/Number=92.png', label: 'Female 16', category: 'female' },
  { id: 'f-96', url: '/assets/avatars/female/Number=96.png', label: 'Female 17', category: 'female' },
  { id: 'f-97', url: '/assets/avatars/female/Number=97.png', label: 'Female 18', category: 'female' },
];

export const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];

export function getAvatarById(id: string): AvatarPreset | undefined {
  return ALL_AVATARS.find(a => a.id === id);
}
