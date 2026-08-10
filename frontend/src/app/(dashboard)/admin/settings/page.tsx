'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Shield, Target, Smartphone, Sparkles, CheckSquare, Activity, AlertTriangle, Search } from 'lucide-react';
import api from '@/lib/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
      setFlags(res.data.flags);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string, category: string, type: string) => {
    if (!confirm(`Are you sure you want to change ${key}?`)) return;
    try {
      await api.put(`/admin/settings/${key}`, { value, category, type });
      fetchConfig();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to update setting');
    }
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    if (!confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} ${key}?`)) return;
    try {
      await api.put(`/admin/feature-flags/${key}`, { enabled });
      fetchConfig();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to update flag');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Configuration Engine...</div>;

  const categories = ['SYSTEM', 'INSTITUTION', 'ATTENDANCE', 'FACE_RECOGNITION', 'GAMIFICATION'];

  const filteredSettings = settings.filter(s => 
    (search === '' ? s.category === activeTab : true) &&
    (s.key.toLowerCase().includes(search.toLowerCase()) || (s.description && s.description.toLowerCase().includes(search.toLowerCase())))
  );

  const filteredFlags = flags.filter(f => 
    f.key.toLowerCase().includes(search.toLowerCase()) || (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Settings className="mr-2 text-primary w-6 h-6" /> System Configuration
          </h1>
          <p className="text-gray-500">Manage institution policies and feature flags.</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-sm text-yellow-900 flex items-start neo-shadow border-r-0 border-y-0">
        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
        <div>
          <strong>Warning: Configuration Changes are Live!</strong>
          <p>Changing thresholds (like WARNING_THRESHOLD) will immediately affect AI predictions, analytics calculations, and Gamification goals. All changes are strictly audited.</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          className="pl-10 neo-border" 
          placeholder="Search settings..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Settings Panel */}
        <div className="flex-1 space-y-6">
          {!search && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <Button 
                  key={cat} 
                  variant={activeTab === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(cat)}
                  className={activeTab === cat ? 'neo-shadow' : ''}
                >
                  {cat.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          )}

          <Card className="p-0 neo-border overflow-hidden">
            <div className="bg-gray-50 p-4 border-b font-bold text-gray-700">
              {search ? 'Search Results' : `${activeTab.replace(/_/g, ' ')} Settings`}
            </div>
            <div className="divide-y">
              {filteredSettings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No settings found in this category.</div>
              ) : (
                filteredSettings.map(setting => (
                  <SettingRow key={setting.key} setting={setting} onSave={updateSetting} />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Feature Flags Panel */}
        <div className="w-full md:w-96 space-y-4">
          <Card className="p-0 neo-border overflow-hidden">
            <div className="bg-slate-800 text-white p-4 border-b font-bold flex justify-between items-center">
              <span>Feature Flags</span>
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            <div className="divide-y">
              {filteredFlags.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No flags found.</div>
              ) : (
                filteredFlags.map(flag => (
                  <div key={flag.key} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{flag.key}</h4>
                      <p className="text-xs text-gray-500">{flag.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={flag.enabled} 
                        onChange={(e) => toggleFlag(flag.key, e.target.checked)} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        
      </div>
    </div>
  );
}

function SettingRow({ setting, onSave }: { setting: any, onSave: any }) {
  const [val, setVal] = useState(setting.value);
  const isChanged = val !== setting.value;

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
      <div className="flex-1 mr-4">
        <h4 className="font-bold text-gray-800 font-mono text-sm">{setting.key}</h4>
        {setting.description && <p className="text-sm text-gray-500">{setting.description}</p>}
      </div>
      <div className="flex items-center space-x-2">
        {setting.type === 'BOOLEAN' ? (
          <select className="border rounded p-2 text-sm bg-white" value={val} onChange={e => setVal(e.target.value)}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <Input 
            className="w-32 text-sm" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
            type={setting.type === 'NUMBER' ? 'number' : 'text'}
          />
        )}
        <Button 
          size="sm" 
          disabled={!isChanged} 
          onClick={() => onSave(setting.key, val, setting.category, setting.type)}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
