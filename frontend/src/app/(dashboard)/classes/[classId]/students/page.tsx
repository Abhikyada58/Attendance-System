'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ClassStudentsPage({ params }: { params: { classId: string } }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api(`/faculty/me/classes/${params.classId}/students`);
        setStudents(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [params.classId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;

  if (error) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Link href="/classes" className="text-primary mt-4 inline-block hover:underline">
          Return to My Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/classes" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Roster</h1>
          <p className="text-muted-foreground">Students enrolled in this class.</p>
        </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Enrolled Students
            <span className="text-sm font-normal text-muted-foreground px-3 py-1 bg-muted rounded-full">
              {students.length} Total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
              No students are currently enrolled in this class.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 rounded-tl-md">Roll No / ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3 rounded-tr-md">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any) => (
                    <tr key={student.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {student.user.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {student.user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.user.status === 'ACTIVE' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {student.user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
