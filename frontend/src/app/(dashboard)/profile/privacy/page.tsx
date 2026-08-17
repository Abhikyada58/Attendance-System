'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Lock, Bell, Download, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface PrivacySettings {
  emailEnabled: boolean;
  attendanceAlertsEnabled: boolean;
  systemAlertsEnabled: boolean;
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    emailEnabled: false,
    attendanceAlertsEnabled: true,
    systemAlertsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api('/privacy/settings').then(d => {
      if (d.preferences) setSettings(prev => ({ ...prev, ...d.preferences }));
    }).finally(() => setLoading(false));
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await api('/privacy/settings', { method: 'PATCH', data: settings });
      setMessage({ type: 'success', text: 'Privacy settings saved.' });
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setSaving(false); }
  }

  async function exportData() {
    setExporting(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('attendx_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/privacy/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendx-data-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Your data has been exported.' });
    } catch (e: any) { setMessage({ type: 'error', text: e.message || 'Export failed.' }); }
    finally { setExporting(false); }
  }

  const Toggle = ({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description: string }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Lock className="w-6 h-6 text-indigo-600" /> Privacy Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Control your notification preferences and download your data.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto opacity-70">✕</button>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-indigo-500" /> Notification Preferences
        </h2>
        <p className="text-xs text-gray-400 mb-4">Choose what notifications you receive from AttendX.</p>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
        ) : (
          <>
            <Toggle value={settings.emailEnabled} onChange={v => setSettings(p => ({ ...p, emailEnabled: v }))}
              label="Email Notifications" description="Receive important updates via email." />
            <Toggle value={settings.attendanceAlertsEnabled} onChange={v => setSettings(p => ({ ...p, attendanceAlertsEnabled: v }))}
              label="Attendance Alerts" description="Get notified when your attendance drops below thresholds." />
            <Toggle value={settings.systemAlertsEnabled} onChange={v => setSettings(p => ({ ...p, systemAlertsEnabled: v }))}
              label="System Notices" description="Receive announcements and system-wide notifications." />
          </>
        )}

        <div className="mt-4">
          <button onClick={saveSettings} disabled={saving || loading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <Download className="w-5 h-5 text-indigo-500" /> Export Your Data
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Download a copy of your personal data including your profile, attendance records, goals, achievements, and support tickets.
          The export is provided as a JSON file.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mb-4">
          ⚠️ Keep your exported data secure. It contains personal information. Exports are limited to 2 per day.
        </div>
        <button onClick={exportData} disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
          <Download className="w-4 h-4" />
          {exporting ? 'Preparing export...' : 'Download My Data'}
        </button>
      </div>

      {/* Data Categories Info */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-3">What data does AttendX store about you?</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Profile', desc: 'Name, email, role, enrollment details' },
            { label: 'Attendance', desc: 'Session records, status, timestamps' },
            { label: 'Goals & Achievements', desc: 'Your attendance goals and earned badges' },
            { label: 'Support Tickets', desc: 'Issues you raised and their status' },
            { label: 'Notifications', desc: 'Alerts and system messages sent to you' },
            { label: 'Session Logs', desc: 'Login times and devices (retained 30 days)' },
          ].map(item => (
            <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-3">
              <p className="font-medium text-gray-800 text-xs">{item.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
