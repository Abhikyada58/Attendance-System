'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Shield, AlertTriangle, Monitor, LogIn, Activity, RefreshCw, Eye } from 'lucide-react';

interface Summary {
  activeSessions: number;
  failedLoginsLast24h: number;
  openSecurityEvents: number;
  criticalEventsLast24h: number;
  highSeverityEventsLast24h: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  actorId: string | null;
  ipAddress: string | null;
  status: string;
  createdAt: string;
  metadata: any;
}

const severityColor: Record<string, string> = {
  INFO: 'bg-blue-50 text-blue-700 border-blue-200',
  LOW: 'bg-green-50 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const statusColor: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  INVESTIGATING: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  FALSE_POSITIVE: 'bg-gray-100 text-gray-700',
};

export default function AdminSecurityPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('');

  async function load() {
    try {
      const [sumData, evData] = await Promise.all([
        api('/admin/security/summary'),
        api(`/admin/security/events?limit=25${filterSeverity ? `&severity=${filterSeverity}` : ''}`),
      ]);
      setSummary(sumData.summary);
      setEvents(evData.events || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, [filterSeverity]);

  const refresh = () => { setRefreshing(true); load(); };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Security Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor security events and active sessions.</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={Monitor} label="Active Sessions" value={summary?.activeSessions || 0} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={LogIn} label="Failed Logins (24h)" value={summary?.failedLoginsLast24h || 0} color="bg-yellow-50 text-yellow-600" />
          <StatCard icon={AlertTriangle} label="Open Events" value={summary?.openSecurityEvents || 0} color="bg-orange-50 text-orange-600" />
          <StatCard icon={Activity} label="Critical (24h)" value={summary?.criticalEventsLast24h || 0} color="bg-red-50 text-red-600" />
          <StatCard icon={Activity} label="High Severity (24h)" value={summary?.highSeverityEventsLast24h || 0} color="bg-pink-50 text-pink-600" />
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Security Events</h2>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="">All Severities</option>
            {['INFO','LOW','MEDIUM','HIGH','CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No security events found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className={`text-xs font-semibold px-2 py-1 rounded border ${severityColor[ev.severity] || 'bg-gray-100 text-gray-600'}`}>
                  {ev.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">
                    {ev.ipAddress && `${ev.ipAddress} · `}{timeAgo(ev.createdAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ev.status] || 'bg-gray-100 text-gray-600'}`}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
