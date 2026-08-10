'use client';

import { useAuth } from '@/context/AuthContext';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  if (user?.role === 'FACULTY') {
    return <FacultyDashboard />;
  }

  // Fallback for Admin or unknown roles
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
      <p className="text-muted-foreground mt-2">Use the sidebar to navigate to your administration tools.</p>
    </div>
  );
}
