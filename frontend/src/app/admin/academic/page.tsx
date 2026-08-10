'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, Building2, Book, Layers } from 'lucide-react';

export default function AdminAcademicPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Structure</h1>
        <p className="text-muted-foreground">Manage Institutes, Departments, Subjects, and Semesters.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary group-hover:text-primary">
              <Building2 className="w-5 h-5" />
              Institutes & Departments
            </CardTitle>
            <CardDescription>Manage the organizational hierarchy of the university.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary group-hover:text-primary">
              <Layers className="w-5 h-5" />
              Academic Years & Semesters
            </CardTitle>
            <CardDescription>Define terms, active semesters, and academic timelines.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary group-hover:text-primary">
              <Book className="w-5 h-5" />
              Subjects & Courses
            </CardTitle>
            <CardDescription>Manage curriculum, subject codes, and credit hours.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow hover:border-primary/50 transition-colors cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary group-hover:text-primary">
              <GraduationCap className="w-5 h-5" />
              Classes & Divisions
            </CardTitle>
            <CardDescription>Group students into cohorts for teaching assignments.</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-border/50 border-dashed">
        <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-semibold">Detailed Management Views</h3>
        <p className="text-sm mt-1">Detailed CRUD operations for Academic structures are accessible via dedicated sub-routes.</p>
      </div>
    </div>
  );
}
