'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FacultyClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api('/faculty/me/classes');
        setClasses(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Classes</h1>
        <p className="text-muted-foreground">The student cohorts you are assigned to teach.</p>
      </div>

      {classes.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-bold">No Classes Assigned</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You are not currently assigned to teach any classes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((cls: any) => (
            <Card key={cls.id} className="bg-background/60 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                    Sem {cls.semester.term}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium border px-2 py-1 rounded-md">
                    {cls.academicYear.name}
                  </span>
                </div>
                <CardTitle className="leading-tight text-xl">{cls.name}</CardTitle>
                <CardDescription>{cls.department.name} - Div {cls.division || 'General'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col gap-3 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <BookOpen className="w-4 h-4" /> Subjects Taught:
                  </span>
                  <div className="flex flex-col gap-2">
                    {cls.subjects?.map((sub: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/30 p-2 rounded-md border border-border/50">
                        <span className="font-medium">{sub.code} - {sub.name}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                          onClick={async () => {
                            try {
                              const session = await api('/attendance/sessions', {
                                method: 'POST',
                                data: { teachingAssignmentId: sub.assignmentId }
                              });
                              window.location.href = `/attendance/sessions/${session.id}`;
                            } catch (err: any) {
                              alert(err.message || 'Failed to start attendance session');
                            }
                          }}
                        >
                          Start Attendance
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 flex justify-between items-center">
                  <Link href={`/classes/${cls.id}/students`}>
                    <Button variant="default" size="sm">
                      View Class Roster
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
