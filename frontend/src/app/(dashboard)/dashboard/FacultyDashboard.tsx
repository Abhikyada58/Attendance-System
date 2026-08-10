'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Calendar, MapPin, Network, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profData, assignData, classData] = await Promise.all([
          api('/faculty/me'),
          api('/faculty/me/assignments'),
          api('/faculty/me/classes')
        ]);
        setProfile(profData);
        setAssignments(assignData);
        setClasses(classData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!profile) return <div className="p-12 text-center text-destructive">Failed to load faculty profile.</div>;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome, Prof. {profile.user.name}</h1>
          <p className="text-muted-foreground">ID: {profile.facultyId} | {profile.department.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned Classes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Teaching Assignments</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <Network className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.department.code}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assignments List */}
        <Card className="lg:col-span-2 bg-background/60 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>My Teaching Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                No teaching assignments have been assigned to you yet.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-md text-primary mt-1">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">{assignment.class.name} <span className="text-muted-foreground text-sm font-normal">({assignment.subject.name})</span></p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sem {assignment.semester.term} • {assignment.academicYear.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Attendance Start Action Placeholder */}
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 neo-shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle>Quick Attendance</CardTitle>
            <CardDescription>Start marking attendance for today.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
              <h3 className="font-semibold text-lg text-muted-foreground">Module 8 feature</h3>
              <p className="text-sm text-muted-foreground px-4">
                Selecting a class and starting attendance marking will appear here shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
