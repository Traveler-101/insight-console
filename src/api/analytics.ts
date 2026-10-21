import type { AnalyticsPayload, TrendRange } from '@/types';
import { mockRequest } from './client';
import { buildAnalytics } from './mockData';

const RANGE_DAYS: Record<TrendRange, number> = { '7d': 7, '30d': 30, '90d': 90 };
const RANGE_SEED: Record<TrendRange, number> = { '7d': 20261021, '30d': 30815, '90d': 90117 };

export async function getAnalytics(range: TrendRange, signal?: AbortSignal): Promise<AnalyticsPayload> {
  return mockRequest(() => buildAnalytics(RANGE_DAYS[range], RANGE_SEED[range]), {
    signal,
    delay: 520,
  });
}
