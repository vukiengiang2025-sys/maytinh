export type CalcMode = 'basic' | 'scientific';

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}
