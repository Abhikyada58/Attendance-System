'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface PlanningMetric {
  subject: { name: string; code: string };
  currentPercentage: number;
  totalConducted: number;
  totalPresent: number;
  targetPercentage: number;
  remainingClasses: number;
  requiredClasses: number;
  maxPossiblePercentage: number;
  minPossiblePercentage: number;
  isReachable: boolean;
}

export default function StudentPlanningPage() {
  const [metrics, setMetrics] = useState<PlanningMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/planning/student/metrics');
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch planning metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl w-full"></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Planning</h1>
        <p className="text-gray-500">Track your progress against your 75% target</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {metrics.map((metric, idx) => {
          const isDanger = !metric.isReachable;
          const isWarning = metric.currentPercentage < metric.targetPercentage && metric.isReachable;
          const isSafe = metric.currentPercentage >= metric.targetPercentage;

          let statusColor = 'text-gray-500';
          let bgColor = 'bg-gray-50 border-gray-200';
          
          if (isDanger) {
            statusColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-200';
          } else if (isWarning) {
            statusColor = 'text-yellow-600';
            bgColor = 'bg-yellow-50 border-yellow-200';
          } else if (isSafe) {
            statusColor = 'text-green-600';
            bgColor = 'bg-green-50 border-green-200';
          }

          return (
            <Card key={idx} className={`p-6 border-2 ${bgColor} transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{metric.subject.name}</h3>
                  <p className="text-sm text-gray-500">{metric.subject.code}</p>
                </div>
                <div className={`text-2xl font-black ${statusColor}`}>
                  {metric.currentPercentage}%
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">
                    {metric.totalPresent} / {metric.totalConducted} classes attended
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${metric.currentPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Target</p>
                  <div className="flex items-center text-sm font-semibold">
                    <Target className="w-4 h-4 mr-1.5 text-blue-500" />
                    75% required
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Forecast</p>
                  <div className="flex items-center text-sm font-semibold">
                    <TrendingUp className="w-4 h-4 mr-1.5 text-purple-500" />
                    Max possible: {metric.maxPossiblePercentage}%
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/60 rounded-lg backdrop-blur-sm border border-white">
                {isDanger ? (
                  <div className="flex text-sm text-red-700">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    Cannot reach target. Even if you attend all {metric.remainingClasses} remaining classes, you will reach {metric.maxPossiblePercentage}%.
                  </div>
                ) : isWarning ? (
                  <div className="flex text-sm text-yellow-700">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                    You must attend {metric.requiredClasses} of the next {metric.remainingClasses} classes to reach 75%.
                  </div>
                ) : (
                  <div className="flex text-sm text-green-700">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                    You are safely above target. You can miss up to {metric.remainingClasses - metric.requiredClasses} upcoming classes.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
