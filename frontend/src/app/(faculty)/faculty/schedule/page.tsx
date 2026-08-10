'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin, CheckCircle, Play } from 'lucide-react';
import api from '@/lib/api';

interface ScheduledClass {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  timetable: {
    teachingAssignment: {
      subject: { name: string; code: string };
      class: { name: string };
    }
  };
  attendanceSession?: any;
}

export default function FacultySchedulePage() {
  const [todayClasses, setTodayClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const { data } = await api.get('/schedule/faculty/today');
      setTodayClasses(data);
    } catch (error) {
      console.error('Failed to fetch schedule', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today's Schedule</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
        </div>
      ) : todayClasses.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-medium text-gray-700">No Classes Scheduled</h2>
          <p>You have a free day today!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {todayClasses.map((cls) => {
            const isCompleted = cls.status === 'COMPLETED' || !!cls.attendanceSession;
            
            return (
              <Card key={cls.id} className={`p-5 ${isCompleted ? 'border-green-200 bg-green-50' : 'hover:border-primary/50 transition-colors'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                  </div>
                  {isCompleted && (
                    <span className="flex items-center text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold">{cls.timetable.teachingAssignment.subject.name}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {cls.timetable.teachingAssignment.class.name} • {cls.timetable.teachingAssignment.subject.code}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" /> Room {cls.timetable.roomId || 'TBD'}
                  </div>
                  
                  {!isCompleted && (
                    <button className="flex items-center text-sm font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors">
                      <Play className="w-4 h-4 mr-1.5" />
                      Start Attendance
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
