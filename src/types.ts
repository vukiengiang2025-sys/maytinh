export type CalcMode = 'basic' | 'scientific' | 'graph' | 'unit' | 'formula';

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

export type ThemeType = 'professional' | 'sweet-pink' | 'galaxy' | 'forest';

export interface UserProfile {
  name: string;
  avatar?: string;
  theme: ThemeType;
  bgImage?: string;
  buttonImages?: Record<string, string>;
}

export interface AppConfig {
  profiles: UserProfile[];
  currentProfileIndex: number;
  soundEnabled: boolean;
  mascotEnabled: boolean;
  kidsMode: boolean;
}

export interface Formula {
  id: string;
  title: string;
  content: string;
  category: 'grade1-5' | 'grade6-9' | 'grade10-12';
}
