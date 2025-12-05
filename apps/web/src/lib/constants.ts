import type { Department } from '@jwc/schema';

// 소속 옵션
export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: 'youth1', label: '청년1부' },
  { value: 'youth2', label: '청년2부' },
  { value: 'other', label: '기타' },
];

// 연령대 옵션
export const AGE_GROUPS: { value: string; label: string }[] = [
  { value: '97또래', label: '97또래' },
  { value: '98또래', label: '98또래' },
  { value: '99또래', label: '99또래' },
  { value: '00또래', label: '00또래' },
  { value: '01또래', label: '01또래' },
  { value: '02또래', label: '02또래' },
  { value: '03또래', label: '03또래' },
  { value: '04또래', label: '04또래' },
  { value: '05또래', label: '05또래' },
  { value: '06또래', label: '06또래' },
];
