'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, BookOpen, Clock } from 'lucide-react';

export default function FacultyAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oData, cData] = await Promise.all([
          api('/analytics/faculty/overview'),
          api('/analytics/faculty/classes')
        ]);
        setOverview(oData);
        setClasses(cData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Faculty Analytics</h1>
        <p className="text-muted-foreground">Aggregated performance across your assigned classes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.averageAttendance}%</div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Official Sessions</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.officialSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">{overview.sessionsConducted} total started</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes Taught</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalClasses}</div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Distinct Subjects</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalSubjects}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Class Cohort Performance</CardTitle>
          <CardDescription>Attendance breakdown by assigned classes.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
              No analytics available. Ensure you have closed at least one attendance session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Class</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3 text-center">Students</th>
                    <th className="px-4 py-3 text-center">Avg Attendance</th>
                    <th className="px-4 py-3 text-center rounded-tr-md">At Risk (Below 75%)</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {cls.className}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {cls.subjectName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cls.totalStudents}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {cls.averageAttendance}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          cls.studentsBelowThreshold > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                        }`}>
                          {cls.studentsBelowThreshold}
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
