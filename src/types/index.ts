export type AgeGroup = 'Children' | 'Teenagers' | 'Young Adults' | 'Adults';
export type GroupSize = '0-10' | '10-20' | '20+';
export type TimeRange = '0-15min' | '15-30min' | '30min+';
export type GameSetting = 'Virtual' | 'In-Person' | 'Both';

export interface Game {
  id: string;
  name: string;
  ageGroups: AgeGroup[];
  groupSize: GroupSize;
  setupTime: TimeRange;
  playTime: TimeRange;
  setting: GameSetting;
  suppliesRequired: string[];
  setupInstructions: string;
  howToPlay: string;
  tags: string[];
  featured: boolean;
}

export interface Filters {
  search: string;
  ageGroups: AgeGroup[];
  groupSizes: GroupSize[];
  setupTimes: TimeRange[];
  playTimes: TimeRange[];
  settings: GameSetting[];
  tags: string[];
}
