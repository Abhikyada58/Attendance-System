'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function StudentRequestsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'PERSONAL',
    reason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/workflow/my-requests');
      setLeaves(data.leaves);
      setCorrections(data.corrections);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/workflow/leave', leaveForm);
      setShowLeaveModal(false);
      setLeaveForm({ startDate: '', endDate: '', leaveType: 'PERSONAL', reason: '' });
      fetchRequests();
      alert('Leave request submitted!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold flex items-center"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'APPROVED': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold flex items-center"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-gray-500">Manage your leave and attendance correction requests</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setShowLeaveModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Request Leave
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Leave Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" /> Leave Requests
          </h2>
          {loading ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : leaves.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">No leave requests found.</Card>
          ) : (
            leaves.map(req => (
              <Card key={req.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-primary">{req.leaveType}</span>
                  {getStatusBadge(req.status)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                </div>
                <p className="text-sm mb-3">"{req.reason}"</p>
                {req.reviewComment && (
                  <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                    <strong>Reviewer Note:</strong> {req.reviewComment}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Correction Requests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Attendance Corrections
          </h2>
          {loading ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : corrections.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>No correction requests.</p>
              <p className="text-xs mt-2">You can request corrections from your Attendance History page.</p>
            </Card>
          ) : (
            corrections.map(req => (
              <Card key={req.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-primary">Requested: {req.requestedStatus}</span>
                  {getStatusBadge(req.status)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Subject: {req.attendanceRecord?.session?.teachingAssignment?.subject?.name || 'N/A'}
                </div>
                <p className="text-sm mb-3">"{req.reason}"</p>
                {req.reviewComment && (
                  <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                    <strong>Reviewer Note:</strong> {req.reviewComment}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">Request Leave</h2>
            <form onSubmit={submitLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Start Date</label>
                  <input type="date" required className="w-full p-2 border rounded" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input type="date" required className="w-full p-2 border rounded" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Leave Type</label>
                <select className="w-full p-2 border rounded" value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})}>
                  <option value="PERSONAL">Personal</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Reason</label>
                <textarea required rows={3} className="w-full p-2 border rounded" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
