'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Activity, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Server, Database, Cpu, Zap, Shield, Layers, ArrowRight,
  TrendingUp, XCircle
} from 'lucide-react';

interface ServiceCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

interface HealthData {
  status: string;
  uptime: number;
  uptimeFormatted: string;
  services: ServiceCheck[];
  metrics: {
    totalRequests: number;
    errors5xx: number;
    jobsFailed: number;
    httpLatency: { count: number; avg: number; p50: number; p95: number; p99: number };
  };
}

interface IncidentSummary {
  open: number;
  investigating: number;
  mitigating: number;
  resolvedToday: number;
  totalThisMonth: number;
}

interface OverviewData {
  uptime: number;
  uptimeFormatted: string;
  metrics: { counters: Record<string, number>; histograms: Record<string, any> };
  incidents: IncidentSummary;
}

const statusConfig = {
  healthy:     { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-400' },
  degraded:    { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: AlertTriangle, dot: 'bg-amber-400' },
  unavailable: { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     icon: XCircle, dot: 'bg-red-500' },
  unknown:     { color: 'text-gray-500',    bg: 'bg-gray-50',    border: 'border-gray-200',    icon: Clock, dot: 'bg-gray-400' },
};

function ServiceCard({ svc }: { svc: ServiceCheck }) {
  const cfg = statusConfig[svc.status] || statusConfig.unknown;
  const Icon = cfg.icon;
  return (
    <div className={`border rounded-xl p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
        <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
          {svc.status}
        </span>
      </div>
      {svc.latencyMs !== undefined && (
        <p className="text-xs text-gray-500">{svc.latencyMs}ms response</p>
      )}
      {svc.message && <p className="text-xs text-gray-400 mt-1 truncate">{svc.message}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const load = useCallback(async () => {
    try {
      const [h, o] = await Promise.all([
        fetch('/api/v1/health').then(r => r.json()),
        api('/monitoring/overview'),
      ]);
      setHealth(h);
      setOverview(o);
      setLastRefreshed(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const refresh = () => { setRefreshing(true); load(); };

  const counters = overview?.metrics?.counters || {};
  const histograms = overview?.metrics?.histograms || {};
  const latency = histograms['http.latency'] || {};

  const overallStatus = health?.status || 'unknown';
  const statusCfg = statusConfig[overallStatus as keyof typeof statusConfig] || statusConfig.unknown;
  const OverallIcon = statusCfg.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" /> System Monitoring
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Last refreshed {lastRefreshed.toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/monitoring/incidents"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <AlertTriangle className="w-4 h-4" /> Incidents
          </Link>
          <button onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div className={`border rounded-2xl p-5 flex items-center gap-4 ${statusCfg.bg} ${statusCfg.border}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
              <OverallIcon className={`w-6 h-6 ${statusCfg.color}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 capitalize">
                System is {overallStatus} · Uptime {health?.uptimeFormatted}
              </p>
              <p className="text-sm text-gray-500">
                {overview?.incidents?.open || 0} open incident{(overview?.incidents?.open || 0) !== 1 ? 's' : ''}
                {' · '}
                {overview?.incidents?.resolvedToday || 0} resolved today
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={TrendingUp} label="Total Requests" value={(counters['http.requests.total'] || 0).toLocaleString()} color="bg-indigo-50 text-indigo-600" />
            <StatCard icon={XCircle} label="5xx Errors" value={counters['http.5xx.total'] || 0} color="bg-red-50 text-red-600" />
            <StatCard icon={Zap} label="Avg Latency" value={`${latency.avg || 0}ms`} sub={`p95: ${latency.p95 || 0}ms`} color="bg-amber-50 text-amber-600" />
            <StatCard icon={Layers} label="Jobs Failed" value={counters['job.failed.total'] || 0} color="bg-orange-50 text-orange-600" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Shield} label="Logins Today" value={counters['auth.login.success'] || 0} color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={AlertTriangle} label="Failed Logins" value={counters['auth.login.failed'] || 0} color="bg-yellow-50 text-yellow-600" />
            <StatCard icon={Activity} label="Attendance Marked" value={counters['attendance.marked.total'] || 0} color="bg-blue-50 text-blue-600" />
            <StatCard icon={CheckCircle} label="Notifications Sent" value={counters['notification.sent'] || 0} color="bg-purple-50 text-purple-600" />
          </div>

          {/* Service Health */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" /> Service Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {health?.services?.map((svc, i) => <ServiceCard key={i} svc={svc} />) || (
                <p className="text-sm text-gray-400 col-span-3 text-center py-4">No service data available.</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/admin/security', icon: Shield, label: 'Security Events', desc: 'View security audit log' },
              { href: '/admin/monitoring/incidents', icon: AlertTriangle, label: 'Incidents', desc: `${overview?.incidents?.open || 0} open` },
              { href: '/admin/monitoring/logs', icon: Database, label: 'Application Logs', desc: 'Search structured logs' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
