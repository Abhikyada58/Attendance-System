'use client';

import { useAuth } from '@/context/AuthContext';
import StudentSubjects from './StudentSubjects';
import FacultySubjects from './FacultySubjects';

export default function SubjectsPage() {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') {
    return <StudentSubjects />;
  }

  if (user?.role === 'FACULTY') {
    return <FacultySubjects />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Not Authorized</h1>
      <p className="text-muted-foreground mt-2">Subjects are only available for Students and Faculty.</p>
    </div>
  );
}
