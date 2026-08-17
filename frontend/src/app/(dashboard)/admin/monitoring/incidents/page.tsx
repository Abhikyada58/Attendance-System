'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  AlertTriangle, Plus, CheckCircle, Clock, Loader2, ChevronDown,
  ArrowLeft, Shield, Flame, Wrench, Eye
} from 'lucide-react';
import Link from 'next/link';

interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  severity: string;
  status: string;
  affectedService?: string;
  detectedAt: string;
  resolvedAt?: string;
  notes: { content: string; createdAt: string }[];
}

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  SEV1: { color: 'text-red-700',    bg: 'bg-red-100',    label: 'SEV1 — Critical' },
  SEV2: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'SEV2 — High' },
  SEV3: { color: 'text-amber-700',  bg: 'bg-amber-100',  label: 'SEV3 — Medium' },
  SEV4: { color: 'text-blue-700',   bg: 'bg-blue-100',   label: 'SEV4 — Low' },
};

const statusConfig: Record<string, { icon: any; color: string }> = {
  DETECTED:     { icon: AlertTriangle, color: 'text-red-600' },
  INVESTIGATING:{ icon: Eye,           color: 'text-orange-600' },
  MITIGATING:   { icon: Wrench,        color: 'text-amber-600' },
  MONITORING:   { icon: Loader2,       color: 'text-blue-600' },
  RESOLVED:     { icon: CheckCircle,   color: 'text-emerald-600' },
  CLOSED:       { icon: CheckCircle,   color: 'text-gray-500' },
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', severity: 'SEV3', affectedService: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api(`/monitoring/incidents${filterStatus ? `?status=${filterStatus}` : ''}`);
      setIncidents(data.incidents || []);
    } catch { setIncidents([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function createIncident(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/monitoring/incidents', { method: 'POST', data: newForm });
      setShowNew(false);
      setNewForm({ title: '', description: '', severity: 'SEV3', affectedService: '' });
      await load();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/monitoring/incidents/${id}/status`, { method: 'PATCH', data: { status } });
      await load();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/monitoring" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" /> Incident Management
            </h1>
            <p className="text-gray-400 text-sm">Track, investigate, and resolve operational incidents.</p>
          </div>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Declare Incident
        </button>
      </div>

      {/* Create Incident Form */}
      {showNew && (
        <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Declare New Incident</h2>
          <form onSubmit={createIncident} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                  required placeholder="e.g. QR scan failures affecting all sessions"
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Severity</label>
                <select value={newForm.severity} onChange={e => setNewForm(p => ({ ...p, severity: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                  {['SEV1 — Critical', 'SEV2 — High', 'SEV3 — Medium', 'SEV4 — Low'].map(s => (
                    <option key={s} value={s.split(' ')[0]}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Affected Service</label>
                <input value={newForm.affectedService} onChange={e => setNewForm(p => ({ ...p, affectedService: e.target.value }))}
                  placeholder="e.g. QR Attendance, Notifications"
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                <textarea value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe what is happening and initial observations..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Declaring...' : 'Declare Incident'}
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        {['', 'DETECTED', 'INVESTIGATING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />) :
         incidents.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No incidents found</p>
            <p className="text-sm text-gray-400">System is operating normally.</p>
          </div>
        ) : incidents.map(inc => {
          const sev = severityConfig[inc.severity] || severityConfig.SEV4;
          const st = statusConfig[inc.status] || statusConfig.DETECTED;
          const StIcon = st.icon;
          return (
            <div key={inc.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={`mt-0.5 text-xs font-bold px-2 py-1 rounded-lg ${sev.bg} ${sev.color} shrink-0`}>
                    {inc.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400">{inc.incidentNumber}</code>
                      {inc.affectedService && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{inc.affectedService}</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 mt-0.5">{inc.title}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(inc.detectedAt)}
                      {inc.resolvedAt && ` · Resolved ${timeAgo(inc.resolvedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`flex items-center gap-1 text-xs font-medium ${st.color}`}>
                    <StIcon className="w-3.5 h-3.5" /> {inc.status}
                  </span>
                  {inc.status !== 'CLOSED' && (
                    <select value={inc.status}
                      onChange={e => updateStatus(inc.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                      {['DETECTED','INVESTIGATING','MITIGATING','MONITORING','RESOLVED','CLOSED'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
