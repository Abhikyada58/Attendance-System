'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, BookOpen, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface UpcomingClass {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  timetable: {
    teachingAssignment: {
      subject: { name: string; code: string };
      faculty: { user: { name: string } };
    }
  };
}

export default function StudentSchedulePage() {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const { data } = await api.get('/schedule/student/upcoming');
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch schedule', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upcoming Classes</h1>
        <p className="text-gray-500">Your scheduled academic sessions</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg w-full"></div>)}
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-medium text-gray-700">No Upcoming Classes</h2>
          <p>Enjoy your free time!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="p-4 flex flex-col sm:flex-row sm:items-center hover:shadow-md transition-shadow">
              
              <div className="flex-shrink-0 w-32 mb-3 sm:mb-0 sm:pr-4 sm:border-r border-gray-100">
                <div className="text-primary font-bold">{formatDate(cls.date)}</div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formatTime(cls.startTime)}
                </div>
              </div>

              <div className="sm:pl-6 flex-grow">
                <h3 className="text-lg font-bold text-gray-900">{cls.timetable.teachingAssignment.subject.name}</h3>
                <div className="text-sm text-gray-500 mt-1 flex items-center space-x-4">
                  <span className="flex items-center">
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    {cls.timetable.teachingAssignment.subject.code}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {cls.timetable.teachingAssignment.faculty.user.name}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 sm:pl-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cls.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                  cls.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {cls.status}
                </span>
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
