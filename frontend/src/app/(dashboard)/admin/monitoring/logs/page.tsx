'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Database, Search, AlertCircle, Clock, Info, ShieldAlert, Cpu } from 'lucide-react';
import Link from 'next/link';

interface LogEntry {
  id: string;
  level: string;
  service: string;
  event: string;
  message: string;
  requestId?: string;
  duration?: number;
  createdAt: string;
  metadata?: any;
}

const levelConfig: Record<string, { color: string; bg: string; icon: any }> = {
  DEBUG: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Cpu },
  INFO:  { color: 'text-blue-600', bg: 'bg-blue-100', icon: Info },
  WARN:  { color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertCircle },
  ERROR: { color: 'text-red-600', bg: 'bg-red-100', icon: ShieldAlert },
  FATAL: { color: 'text-purple-600', bg: 'bg-purple-100', icon: ShieldAlert },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterLevel, setFilterLevel] = useState('');
  const [filterService, setFilterService] = useState('');
  const [searchEvent, setSearchEvent] = useState('');
  const [searchReqId, setSearchReqId] = useState('');
  
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterLevel) q.append('level', filterLevel);
      if (filterService) q.append('service', filterService);
      if (searchEvent) q.append('event', searchEvent);
      if (searchReqId) q.append('requestId', searchReqId);
      q.append('hours', '24');
      
      const data = await api(`/monitoring/logs?${q.toString()}`);
      setLogs(data.logs || []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterLevel, filterService]); // auto-reload on quick filters
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-500" /> Application Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">Search structured system logs (last 24 hours)</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Event / Keyword</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchEvent} onChange={e => setSearchEvent(e.target.value)}
              placeholder="e.g. LOGIN_FAILED" 
              className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
        
        <div className="w-40">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Request ID</label>
          <input value={searchReqId} onChange={e => setSearchReqId(e.target.value)}
            placeholder="UUID prefix..." 
            className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>

        <div className="w-32">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Level</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="FATAL">FATAL</option>
          </select>
        </div>

        <div className="w-32">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Service</label>
          <select value={filterService} onChange={e => setFilterService(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white">
            <option value="">All Services</option>
            <option value="http">http</option>
            <option value="auth">auth</option>
            <option value="cron">cron</option>
            <option value="incident">incident</option>
          </select>
        </div>

        <button type="submit" className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0">
          Search
        </button>
      </form>

      {/* Results */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 w-40">Time</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-24">Level</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-32">Service</th>
                <th className="px-4 py-3 font-medium text-gray-500 w-48">Event</th>
                <th className="px-4 py-3 font-medium text-gray-500">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No logs match your criteria.</td></tr>
              ) : (
                logs.map(log => {
                  const cfg = levelConfig[log.level] || levelConfig.INFO;
                  const Icon = cfg.icon;
                  const isExpanded = expandedLog === log.id;
                  
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{log.service}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]" title={log.event}>{log.event}</td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[400px]">{log.message}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-6 text-xs">
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Details</p>
                                <div className="space-y-1">
                                  <p><span className="text-gray-500">ID:</span> <code className="text-gray-900 bg-white px-1 py-0.5 rounded">{log.id}</code></p>
                                  {log.requestId && <p><span className="text-gray-500">Req ID:</span> <code className="text-gray-900 bg-white px-1 py-0.5 rounded">{log.requestId}</code></p>}
                                  {log.duration !== null && log.duration !== undefined && <p><span className="text-gray-500">Duration:</span> {log.duration}ms</p>}
                                  <p><span className="text-gray-500">Time:</span> {new Date(log.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 mb-2">Metadata (Redacted)</p>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed">
                                  {log.metadata ? JSON.stringify(log.metadata, null, 2) : '{}'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
