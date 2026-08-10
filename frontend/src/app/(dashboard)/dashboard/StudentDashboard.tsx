'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Calendar, MapPin, Network, Clock, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [profData, subjData] = await Promise.all([
          api('/students/me'),
          api('/students/me/subjects')
        ]);
        setProfile(profData);
        setSubjects(subjData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!profile) return <div className="p-12 text-center text-destructive">Failed to load student profile.</div>;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back, {profile.user.name}</h1>
          <p className="text-muted-foreground">ID: {profile.studentId} | {profile.institute.code}</p>
        </div>
      </div>

      {!profile.class ? (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            <div>
              <h3 className="font-bold text-amber-700 dark:text-amber-500">Academic Profile Incomplete</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">Your academic class has not been assigned yet. Please contact administration.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Academic Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Department</CardTitle>
                <Network className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{profile.department.code}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Semester</CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">Sem {profile.currentSem.term}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Class & Division</CardTitle>
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{profile.class.name}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{profile.academicYear.name}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subjects List */}
            <Card className="lg:col-span-2 bg-background/60 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  My Subjects
                  <span className="text-sm font-normal text-muted-foreground">{subjects.length} Enrolled</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                    No subjects are currently assigned to your academic profile.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjects.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-md text-primary mt-1">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold">{assignment.subject.code}</p>
                            <p className="text-sm text-muted-foreground">{assignment.subject.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">Prof. {assignment.faculty.user.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{assignment.subject.credits} Credits</p>
                          <p className="text-xs text-muted-foreground">{assignment.subject.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Placeholder */}
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 neo-shadow-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle>Attendance Insights</CardTitle>
                <CardDescription>Your upcoming attendance metrics.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-primary opacity-50" />
                  </div>
                  <h3 className="font-semibold text-lg text-muted-foreground">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Attendance marking and insights will appear here once Module 7 is implemented.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
