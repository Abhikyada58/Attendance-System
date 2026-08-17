/**
 * In-Process Metrics Registry — Module 26
 *
 * Light-weight in-memory metrics store.
 * No external dependency (no Prometheus client, no statsd).
 *
 * Tracks:
 *   - Counters (monotonically increasing)
 *   - Histograms (latency buckets)
 *   - Gauges (current value)
 *
 * Metrics are exposed via GET /admin/monitoring/metrics
 * Periodic snapshots are persisted to AppMetricSnapshot for trend analysis.
 */

import { prisma } from '../utils/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Counter { value: number; }
interface Gauge   { value: number; }
interface Histogram {
  count: number;
  sum: number;
  min: number;
  max: number;
  buckets: number[]; // sorted observations (capped at 1000)
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const counters  = new Map<string, Counter>();
const gauges    = new Map<string, Gauge>();
const histograms = new Map<string, Histogram>();

// ─── Counter ─────────────────────────────────────────────────────────────────

export function increment(name: string, by = 1): void {
  const c = counters.get(name) || { value: 0 };
  c.value += by;
  counters.set(name, c);
}

export function getCounter(name: string): number {
  return counters.get(name)?.value ?? 0;
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

export function setGauge(name: string, value: number): void {
  gauges.set(name, { value });
}

export function getGauge(name: string): number {
  return gauges.get(name)?.value ?? 0;
}

// ─── Histogram ────────────────────────────────────────────────────────────────

export function observe(name: string, valueMs: number): void {
  let h = histograms.get(name);
  if (!h) {
    h = { count: 0, sum: 0, min: Infinity, max: -Infinity, buckets: [] };
    histograms.set(name, h);
  }
  h.count++;
  h.sum += valueMs;
  h.min = Math.min(h.min, valueMs);
  h.max = Math.max(h.max, valueMs);
  if (h.buckets.length < 1000) h.buckets.push(valueMs); // cap to last 1000
}

export function getHistogramStats(name: string): {
  count: number; avg: number; p50: number; p95: number; p99: number; min: number; max: number;
} {
  const h = histograms.get(name);
  if (!h || h.count === 0) return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };

  const sorted = [...h.buckets].sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.floor(sorted.length * p / 100)] ?? 0;

  return {
    count: h.count,
    avg: Math.round(h.sum / h.count),
    p50: pct(50),
    p95: pct(95),
    p99: pct(99),
    min: h.min === Infinity ? 0 : h.min,
    max: h.max === -Infinity ? 0 : h.max,
  };
}

// ─── Snapshot All Metrics ─────────────────────────────────────────────────────

export function snapshotAll(): Record<string, any> {
  const result: Record<string, any> = { counters: {}, gauges: {}, histograms: {} };

  counters.forEach((v, k)   => { result.counters[k] = v.value; });
  gauges.forEach((v, k)     => { result.gauges[k] = v.value; });
  histograms.forEach((_, k) => { result.histograms[k] = getHistogramStats(k); });

  return result;
}

// ─── Persist Snapshot to DB (every 5 min via cron) ───────────────────────────

export async function persistMetricSnapshot(): Promise<void> {
  try {
    const snapshot = snapshotAll();
    const rows: { metric: string; value: number; tags?: any }[] = [];

    // Persist important counters
    for (const [k, v] of Object.entries(snapshot.counters as Record<string, number>)) {
      rows.push({ metric: k, value: v });
    }
    // Persist p95 latencies
    for (const [k, stats] of Object.entries(snapshot.histograms as Record<string, any>)) {
      if (stats.count > 0) rows.push({ metric: `${k}.p95`, value: stats.p95 });
    }

    if (rows.length > 0) {
      await prisma.appMetricSnapshot.createMany({ data: rows.map(r => ({ ...r, capturedAt: new Date() })) });
    }
  } catch { /* never block on metrics */ }
}

// ─── High-Level Domain Metrics ────────────────────────────────────────────────

export const metrics = {
  // HTTP
  httpRequest: (method: string, route: string, status: number, durationMs: number) => {
    const key = `http.${method}.${status < 400 ? '2xx' : status < 500 ? '4xx' : '5xx'}`;
    increment('http.requests.total');
    increment(key);
    observe('http.latency', durationMs);
    observe(`http.route.${route.replace(/\//g, '.').replace(/:/g, '_')}.latency`, durationMs);
  },

  // Authentication
  loginSuccess: ()       => increment('auth.login.success'),
  loginFailed: ()        => increment('auth.login.failed'),
  loginLockedOut: ()     => increment('auth.login.locked'),

  // Attendance
  attendanceMarked: ()   => increment('attendance.marked.total'),
  attendanceFailed: ()   => increment('attendance.marked.failed'),
  attendanceDuplicate: () => increment('attendance.duplicate.rejected'),

  // QR
  qrCreated: ()          => increment('qr.session.created'),
  qrScanSuccess: ()      => increment('qr.scan.success'),
  qrScanFailed: (reason: 'expired' | 'invalid' | 'replay') => increment(`qr.scan.failed.${reason}`),

  // Face Recognition
  faceEnrolled: ()       => increment('face.enrolled'),
  faceRecognized: ()     => increment('face.recognition.success'),
  faceFailed: ()         => increment('face.recognition.failed'),
  faceLatency: (ms: number) => observe('face.recognition.latency', ms),

  // Notifications
  notificationSent: ()   => increment('notification.sent'),
  notificationFailed: () => increment('notification.failed'),

  // AI
  aiRequest: ()          => increment('ai.request.total'),
  aiSuccess: ()          => increment('ai.request.success'),
  aiFailed: ()           => increment('ai.request.failed'),
  aiLatency: (ms: number) => observe('ai.latency', ms),

  // Jobs
  jobStarted: (name: string) => {
    increment(`job.${name}.started`);
    setGauge(`job.${name}.running`, 1);
  },
  jobCompleted: (name: string, ms: number) => {
    increment(`job.${name}.completed`);
    setGauge(`job.${name}.running`, 0);
    observe(`job.${name}.duration`, ms);
  },
  jobFailed: (name: string) => {
    increment(`job.${name}.failed`);
    setGauge(`job.${name}.running`, 0);
    increment('job.failed.total');
  },

  // Uptime
  setActiveConnections: (n: number) => setGauge('db.active_connections', n),

  // Snapshots
  snapshotAll,
  persistMetricSnapshot,

  // Getters
  getCounter,
  getHistogramStats,
};
