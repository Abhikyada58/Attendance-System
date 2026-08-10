'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, ShieldAlert } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api('/admin/settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      await api(`/admin/settings/${key}`, {
        method: 'PUT',
        data: { value: String(value) }
      });
      alert('Setting updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Manage global attendance rules and security thresholds.</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Warning:</strong> Modifying these values will immediately affect how attendance analytics are calculated and how secure methods (Face/QR) behave globally. Every change is logged in the Audit Ledger.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow">
          <CardHeader>
            <CardTitle>Low Attendance Warning Threshold</CardTitle>
            <CardDescription>Students below this percentage will receive a warning alert (Default: 75)</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 items-center">
            <Input 
              type="number" 
              className="max-w-[200px]" 
              value={settings?.WARNING_THRESHOLD || 75} 
              onChange={(e) => setSettings({...settings, WARNING_THRESHOLD: e.target.value})}
            />
            <Button onClick={() => handleSave('WARNING_THRESHOLD', settings?.WARNING_THRESHOLD)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow">
          <CardHeader>
            <CardTitle>Critical Attendance Threshold</CardTitle>
            <CardDescription>Students below this percentage will receive a critical alert (Default: 60)</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 items-center">
            <Input 
              type="number" 
              className="max-w-[200px]" 
              value={settings?.CRITICAL_THRESHOLD || 60} 
              onChange={(e) => setSettings({...settings, CRITICAL_THRESHOLD: e.target.value})}
            />
            <Button onClick={() => handleSave('CRITICAL_THRESHOLD', settings?.CRITICAL_THRESHOLD)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow">
          <CardHeader>
            <CardTitle>Face Match Threshold</CardTitle>
            <CardDescription>Maximum Euclidean distance allowed for a valid face match. Lower is stricter. (Default: 0.45)</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 items-center">
            <Input 
              type="number" 
              step="0.01"
              className="max-w-[200px]" 
              value={settings?.FACE_MATCH_THRESHOLD || 0.45} 
              onChange={(e) => setSettings({...settings, FACE_MATCH_THRESHOLD: e.target.value})}
            />
            <Button onClick={() => handleSave('FACE_MATCH_THRESHOLD', settings?.FACE_MATCH_THRESHOLD)} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
