'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Trash2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface CalendarEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  isWorkingDay: boolean;
}

export default function CalendarManagementPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<string>(''); // Ideally fetched from context or API

  useEffect(() => {
    // In a real app, you'd fetch the active academic year first.
    // For this prototype, we'll assume it's passed or fetched.
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    // Mocking an academic year fetch for now if we don't have it
    // const { data } = await api.get('/calendar?academicYearId=' + academicYearId);
    // setEvents(data);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOLIDAY': return 'bg-red-100 text-red-800 border-red-200';
      case 'EXAM': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BREAK': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SPECIAL_EVENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Academic Calendar</h1>
          <p className="text-gray-500">Manage holidays, exams, and special events</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start">
        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold">Important Note</h3>
          <p className="text-sm mt-1">
            Events marked as non-working days (like Holidays) will automatically prevent scheduled classes from being generated on those dates.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500 py-12">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>Calendar visualization will be rendered here.</p>
          <p className="text-sm mt-2">Currently showing list view placeholder.</p>
        </div>
      </Card>
    </div>
  );
}
