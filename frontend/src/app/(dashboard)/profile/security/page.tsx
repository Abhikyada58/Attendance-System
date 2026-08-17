'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Shield, Monitor, Smartphone, Clock, LogOut, AlertTriangle, Key, CheckCircle } from 'lucide-react';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export default function SecuritySettingsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    try {
      const data = await api('/auth/sessions');
      setSessions(data.sessions || []);
    } catch { setSessions([]); } finally { setLoading(false); }
  }

  async function revokeSession(id: string) {
    setRevoking(id);
    try {
      await api(`/auth/sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Session revoked.' });
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setRevoking(null); }
  }

  async function revokeAllOthers() {
    setRevokingAll(true);
    try {
      const data = await api('/auth/sessions/others', { method: 'DELETE' });
      await fetchSessions();
      setMessage({ type: 'success', text: `${data.revokedCount} other session(s) signed out.` });
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setRevokingAll(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setMessage({ type: 'error', text: "New passwords don't match." }); return;
    }
    setPwLoading(true);
    try {
      await api('/auth/change-password', { method: 'POST', data: pwForm });
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setMessage({ type: 'success', text: 'Password changed. Other sessions have been signed out.' });
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setPwLoading(false); }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Security Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your password and active sessions.</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-indigo-500" /> Change Password
        </h2>
        <form onSubmit={changePassword} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmNewPassword'] as const).map(field => (
            <div key={field}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={pwForm[field]}
                onChange={e => setPwForm(prev => ({ ...prev, [field]: e.target.value }))}
                required
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} />
              Show passwords
            </label>
            <button type="submit" disabled={pwLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-500" /> Active Sessions
          </h2>
          {sessions.length > 1 && (
            <button onClick={revokeAllOthers} disabled={revokingAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50">
              <LogOut className="w-4 h-4" />
              {revokingAll ? 'Signing out...' : 'Sign out all others'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.deviceInfo || 'Unknown device'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last active {timeAgo(session.lastUsedAt)}
                      {session.ipAddress && <span className="ml-1">· {session.ipAddress}</span>}
                    </p>
                  </div>
                </div>
                <button onClick={() => revokeSession(session.id)} disabled={revoking === session.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                  {revoking === session.id ? '...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
