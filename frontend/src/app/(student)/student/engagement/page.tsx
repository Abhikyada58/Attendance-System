'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Flame, Trophy, Plus, ArrowRight, Zap } from 'lucide-react';
import api from '@/lib/api';

export default function EngagementDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [goalForm, setGoalForm] = useState({
    goalType: 'SUBJECT_GOAL',
    targetPercentage: 75,
    subjectId: ''
  });
  
  const [feasibility, setFeasibility] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchSubjects();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/engagement/dashboard');
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSubjects = async () => {
    try {
      // Fetch subjects for the goal dropdown
      const res = await api.get('/academic/subjects');
      setSubjects(res.data);
    } catch (e) {}
  };

  const checkFeasibility = async () => {
    if (!goalForm.subjectId) return;
    try {
      const res = await api.post('/engagement/goals/feasibility', {
        subjectId: goalForm.subjectId,
        targetPercentage: Number(goalForm.targetPercentage)
      });
      setFeasibility(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feasibility && !feasibility.isPossible) {
      alert('This goal is mathematically impossible.');
      return;
    }
    
    try {
      await api.post('/engagement/goals', {
        ...goalForm,
        targetPercentage: Number(goalForm.targetPercentage)
      });
      setShowGoalModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create goal');
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading engagement data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Engagement & Gamification</h1>
          <p className="text-gray-500">Track your attendance streaks, goals, and achievements.</p>
        </div>
        <Button onClick={() => setShowGoalModal(true)} className="neo-shadow">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Score Card */}
        <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center neo-shadow border-none">
          <Zap className="w-12 h-12 mb-2 text-yellow-300" />
          <h2 className="text-4xl font-black mb-1">{data?.score || 0}</h2>
          <p className="text-indigo-100 font-medium tracking-wider uppercase text-xs">Engagement Score</p>
        </Card>

        {/* Streak Card */}
        <Card className="p-6 bg-gradient-to-br from-orange-400 to-red-500 text-white flex flex-col items-center justify-center neo-shadow border-none">
          <Flame className="w-12 h-12 mb-2 text-yellow-200" />
          <div className="flex items-end space-x-2">
            <h2 className="text-4xl font-black mb-1">{data?.streak?.current || 0}</h2>
            <span className="text-sm pb-2 font-medium">Days</span>
          </div>
          <p className="text-red-100 font-medium tracking-wider uppercase text-xs">Current Streak</p>
          <p className="text-[10px] text-white/70 mt-2">Personal Best: {data?.streak?.longest || 0}</p>
        </Card>
        
        {/* Achievements Quick View */}
        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-yellow-400">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="font-bold">Recent Achievements</h3>
          </div>
          {data?.achievements?.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No achievements unlocked yet. Keep attending classes!</p>
          ) : (
            <div className="space-y-3">
              {data?.achievements?.slice(0,3).map((a: any) => (
                <div key={a.id} className="flex items-center">
                  <span className="text-2xl mr-3">{a.achievement.icon}</span>
                  <div>
                    <p className="text-sm font-bold leading-none">{a.achievement.name}</p>
                    <p className="text-[10px] text-gray-500">{new Date(a.earnedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Active Goals */}
      <h2 className="text-xl font-bold flex items-center pt-4">
        <Target className="w-5 h-5 mr-2 text-primary" /> Active Goals
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {data?.goals?.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 md:col-span-2 border-dashed">
            You don't have any active goals right now. Set one to stay on track!
          </Card>
        ) : (
          data?.goals?.map((goal: any) => (
            <Card key={goal.id} className="p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded mb-2 inline-block">
                    {goal.goalType.replace('_', ' ')}
                  </span>
                  <h3 className="font-bold text-lg">{goal.subject?.name || 'Overall Semester'}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  goal.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {goal.status}
                </span>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Target</span>
                  <span className="font-bold">{goal.targetPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${goal.targetPercentage}%` }}></div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* GOAL CREATION MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Goal</h2>
            
            <form onSubmit={submitGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Goal Type</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={goalForm.goalType}
                  onChange={e => setGoalForm({...goalForm, goalType: e.target.value})}
                >
                  <option value="SUBJECT_GOAL">Subject Goal</option>
                  <option value="SEMESTER_GOAL">Overall Semester Goal</option>
                </select>
              </div>

              {goalForm.goalType === 'SUBJECT_GOAL' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <select 
                    className="w-full p-2 border rounded"
                    value={goalForm.subjectId}
                    onChange={e => {
                      setGoalForm({...goalForm, subjectId: e.target.value});
                      setFeasibility(null);
                    }}
                    required
                  >
                    <option value="">Select a Subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Target Percentage</label>
                <div className="flex space-x-4">
                  <input 
                    type="range" 
                    min="50" max="100" 
                    className="flex-1"
                    value={goalForm.targetPercentage}
                    onChange={e => {
                      setGoalForm({...goalForm, targetPercentage: parseInt(e.target.value)});
                      setFeasibility(null);
                    }}
                  />
                  <span className="font-bold w-12 text-right">{goalForm.targetPercentage}%</span>
                </div>
              </div>

              <div className="pt-2">
                <Button type="button" variant="secondary" onClick={checkFeasibility} className="w-full" disabled={!goalForm.subjectId && goalForm.goalType === 'SUBJECT_GOAL'}>
                  Check Feasibility
                </Button>
              </div>

              {feasibility && (
                <div className={`p-3 rounded text-sm ${feasibility.isPossible ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-bold mb-1">{feasibility.isPossible ? 'Goal is achievable! 🎉' : 'Warning: Goal is impossible. ❌'}</p>
                  <p>{feasibility.message}</p>
                  <p className="mt-2 text-xs opacity-80">
                    Current: {feasibility.currentPercentage.toFixed(1)}% | 
                    Max Possible: {feasibility.maxPossible.toFixed(1)}%
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowGoalModal(false)}>Cancel</Button>
                <Button type="submit" disabled={feasibility && !feasibility.isPossible}>
                  Set Goal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
