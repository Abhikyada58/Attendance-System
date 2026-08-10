'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, User as UserIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function FacultySubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await api('/faculty/me/subjects');
        setSubjects(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Subjects Taught</h1>
        <p className="text-muted-foreground">Your distinct assigned subjects.</p>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-bold">No Subjects Assigned</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              You are not currently assigned to teach any subjects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject: any) => (
            <Card key={subject.id} className="bg-background/60 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                    {subject.code}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium border px-2 py-1 rounded-md">
                    {subject.type}
                  </span>
                </div>
                <CardTitle className="leading-tight">{subject.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-bold">{subject.credits}</span>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="text-muted-foreground">Taught in:</span>
                    <div className="flex flex-wrap gap-1">
                      {subject.classesTaught?.map((className: string, idx: number) => (
                        <span key={idx} className="bg-muted px-2 py-1 rounded-md text-xs">{className}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
