import { randomUUID } from 'crypto';

export function generateTraceId(): string {
  return `trc_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export interface TraceContext {
  traceId: string;
  userId?: string;
  route?: string;
  startedAt: number;
}

export function startTrace(route?: string, userId?: string): TraceContext {
  return {
    traceId: generateTraceId(),
    userId,
    route,
    startedAt: Date.now(),
  };
}

export function getTraceLatency(trace: TraceContext): number {
  return Date.now() - trace.startedAt;
}
