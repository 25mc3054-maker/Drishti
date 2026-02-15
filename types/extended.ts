// Custom type definitions extend the base types

import type { GeminiAnalysisResult } from './index';

export interface ExtendedMetadata {
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface AnalysisHistory {
  id: string;
  timestamp: number;
  result: GeminiAnalysisResult;
  imageThumbnail: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'ta' | 'te' | 'bn';
  notifications: boolean;
}

export * from './index';
