'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Clock, Users, Building, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomId: string;
  isActive: boolean;
  teachingAssignment: {
    faculty: { user: { name: string } };
    subject: { name: string; code: string };
    class: { name: string };
  };
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableManagementPage() {
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const { data } = await api.get('/timetable?isActive=true');
      setTimetables(data);
    } catch (error) {
      console.error('Failed to fetch timetables', error);
    } finally {
      setLoading(false);
    }
  };

  const generateClasses = async () => {
    setIsGenerating(true);
    try {
      await api.post('/timetable/generate', { days: 30 });
      alert('Successfully generated scheduled classes for the next 30 days.');
    } catch (error) {
      console.error('Failed to generate classes', error);
      alert('Failed to generate scheduled classes.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div>Loading timetable...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Timetable Management</h1>
          <p className="text-gray-500">Manage recurring academic schedules</p>
        </div>
        <div className="space-x-3">
          <Button onClick={generateClasses} disabled={isGenerating} variant="outline">
            {isGenerating ? 'Generating...' : 'Generate 30-Day Schedule'}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Slot
          </Button>
        </div>
      </div>

      {days.map((dayName, dayIndex) => {
        const slotsForDay = timetables.filter(t => t.dayOfWeek === dayIndex);
        if (slotsForDay.length === 0) return null;

        return (
          <div key={dayIndex} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              {dayName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {slotsForDay.map(slot => (
                <Card key={slot.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium border border-primary/20">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg">{slot.teachingAssignment.subject.name}</h3>
                  <div className="space-y-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 opacity-70" />
                      {slot.teachingAssignment.class.name}
                    </div>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 opacity-70" />
                      {slot.roomId || 'Not assigned'}
                    </div>
                    <div className="flex items-center pt-2 border-t mt-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold mr-2">
                        {slot.teachingAssignment.faculty.user.name.charAt(0)}
                      </div>
                      {slot.teachingAssignment.faculty.user.name}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
