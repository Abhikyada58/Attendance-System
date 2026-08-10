'use client';

import { useAuth } from '@/context/AuthContext';
import StudentAnalytics from './StudentAnalytics';
import FacultyAnalytics from './FacultyAnalytics';

export default function AnalyticsPage() {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') {
    return <StudentAnalytics />;
  }

  if (user?.role === 'FACULTY') {
    return <FacultyAnalytics />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Not Authorized</h1>
      <p className="text-muted-foreground mt-2">Analytics are only available for Students and Faculty.</p>
    </div>
  );
}
