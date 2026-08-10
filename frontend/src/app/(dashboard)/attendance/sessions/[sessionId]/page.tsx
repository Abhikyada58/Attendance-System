'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Clock, Save, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

import FacultyQRDisplay from './FacultyQRDisplay';

export default function AttendanceSessionPage({ params }: { params: { sessionId: string } }) {
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for tracking attendance choices before saving
  const [records, setRecords] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-fetch students to see QR updates
  const refreshStudents = async () => {
    try {
      const studentData = await api(`/attendance/sessions/${params.sessionId}/students`);
      setStudents(studentData);
      
      const newRecords: Record<string, string> = { ...records };
      let updated = false;
      studentData.forEach((s: any) => {
        if (s.attendanceStatus && s.attendanceStatus !== records[s.id]) {
          newRecords[s.id] = s.attendanceStatus;
          updated = true;
        }
      });
      if (updated) setRecords(newRecords);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const [sessData, studentData] = await Promise.all([
          api(`/attendance/sessions/${params.sessionId}`),
          api(`/attendance/sessions/${params.sessionId}/students`)
        ]);
        
        setSession(sessData);
        setStudents(studentData);
        
        const initialRecords: Record<string, string> = {};
        studentData.forEach((s: any) => {
          if (s.attendanceStatus) {
            initialRecords[s.id] = s.attendanceStatus;
          }
        });
        setRecords(initialRecords);
        setIsDirty(false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [params.sessionId]);

  // Poll for student updates if session is open (to see live QR scans)
  useEffect(() => {
    if (!session || session.status === 'CLOSED') return;
    const interval = setInterval(() => {
      refreshStudents();
    }, 5000);
    return () => clearInterval(interval);
  }, [session, records]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!session) return <div className="p-12 text-center text-destructive font-bold">Failed to load session or Access Denied.</div>;

  const isClosed = session.status === 'CLOSED';

  const handleMark = (studentId: string, status: string) => {
    if (isClosed) return;
    setRecords(prev => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
  };

  const markAll = (status: string) => {
    if (isClosed) return;
    const newRecords: Record<string, string> = {};
    students.forEach(s => newRecords[s.id] = status);
    setRecords(newRecords);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (isClosed) return;
    setSaving(true);
    try {
      const payload = Object.keys(records).map(studentId => ({
        studentId,
        status: records[studentId]
      }));

      await api(`/attendance/sessions/${params.sessionId}/records`, {
        method: 'POST',
        data: { records: payload }
      });
      
      setIsDirty(false);
      alert('Attendance saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close this session? It will become read-only and no further changes can be made.')) return;
    
    try {
      await api(`/attendance/sessions/${params.sessionId}/close`, { method: 'POST' });
      setSession({ ...session, status: 'CLOSED' });
      setIsDirty(false);
      alert('Session closed securely.');
    } catch (err: any) {
      alert(err.message || 'Failed to close session');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/classes" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Attendance Session</h1>
            {isClosed ? (
              <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">CLOSED</span>
            ) : (
              <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">OPEN</span>
            )}
          </div>
          <p className="text-muted-foreground">
            {session.teachingAssignment.subject.name} • {session.teachingAssignment.class.name}
          </p>
        </div>
        
        {!isClosed && (
          <div className="flex gap-2">
            <FacultyQRDisplay sessionId={params.sessionId} />
            <Button variant="outline" onClick={() => markAll('PRESENT')} disabled={saving}>
              All Present
            </Button>
            <Button variant="outline" onClick={() => markAll('ABSENT')} disabled={saving}>
              All Absent
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
            <Button variant="destructive" onClick={handleCloseSession} disabled={saving || isDirty}>
              <Lock className="w-4 h-4 mr-2" />
              Close Session
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Class Roster</CardTitle>
          <CardDescription>
            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Roll No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Method / Time</th>
                  <th className="px-4 py-3 text-center rounded-tr-md">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => {
                  const currentStatus = records[student.id];
                  
                  let methodBadge = null;
                  if (student.markedBy === 'SYSTEM_FACE') {
                    methodBadge = <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 ml-2">FACE ID</span>;
                  } else if (student.markedBy === 'SYSTEM_QR') {
                    methodBadge = <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded border border-purple-500/20 ml-2">QR</span>;
                  }
                  
                  return (
                    <tr key={student.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {student.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground flex items-center h-full pt-4">
                        {student.markedAt ? new Date(student.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        {methodBadge}
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                          className={`h-8 px-3 ${currentStatus === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          onClick={() => handleMark(student.id, 'PRESENT')}
                          disabled={isClosed}
                        >
                          <Check className="w-4 h-4 mr-1" /> P
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'ABSENT' ? 'destructive' : 'outline'}
                          className={`h-8 px-3 ${currentStatus === 'ABSENT' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                          onClick={() => handleMark(student.id, 'ABSENT')}
                          disabled={isClosed}
                        >
                          <X className="w-4 h-4 mr-1" /> A
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'LATE' ? 'secondary' : 'outline'}
                          className={`h-8 px-3 ${currentStatus === 'LATE' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                          onClick={() => handleMark(student.id, 'LATE')}
                          disabled={isClosed}
                        >
                          <Clock className="w-4 h-4 mr-1" /> L
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
