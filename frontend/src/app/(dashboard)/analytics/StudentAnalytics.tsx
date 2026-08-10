'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export default function StudentAnalytics() {
  const [overview, setOverview] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oData, sData, mData] = await Promise.all([
          api('/analytics/students/me/overview'),
          api('/analytics/students/me/subjects'),
          api('/analytics/students/me/monthly')
        ]);
        setOverview(oData);
        setSubjects(sData);
        setMonthly(mData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  const getStatusColor = (status: string) => {
    if (status === 'SAFE') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (status === 'WARNING') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    if (status === 'CRITICAL') return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-muted-foreground bg-muted/50 border-border/50';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SAFE') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'WARNING') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (status === 'CRITICAL') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Analytics</h1>
        <p className="text-muted-foreground">Historical attendance trends and subject performance.</p>
      </div>

      {overview?.totalSessions === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-bold">No Data Available</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Your professors have not recorded any official closed attendance sessions yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Global Attendance</CardTitle>
                {getStatusIcon(overview.status)}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.attendancePercentage}%</div>
                <div className="mt-2 flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border font-bold ${getStatusColor(overview.status)}`}>
                    {overview.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.totalSessions}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{overview.present}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{overview.absent}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-background/60 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Monthly Trend
                </CardTitle>
                <CardDescription>Your attendance percentage over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Percentage breakdown by subject</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjects} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={12} />
                    <YAxis dataKey="code" type="category" stroke="#888" fontSize={12} width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="attendancePercentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
