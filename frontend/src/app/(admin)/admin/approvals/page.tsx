'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ApprovalsDashboard() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [processingModal, setProcessingModal] = useState<{ type: 'LEAVE' | 'CORRECTION', id: string } | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'APPROVED', comment: '' });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/workflow/pending');
      setLeaves(data.leaves || []);
      setCorrections(data.corrections || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingModal) return;

    try {
      const endpoint = processingModal.type === 'LEAVE' 
        ? `/workflow/leave/${processingModal.id}/process` 
        : `/workflow/correction/${processingModal.id}/process`;
      
      await api.post(endpoint, reviewForm);
      setProcessingModal(null);
      setReviewForm({ status: 'APPROVED', comment: '' });
      fetchPending();
      alert('Request processed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process request');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approval Workflow</h1>
        <p className="text-gray-500">Review pending leave and attendance correction requests</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* LEAVE REQUESTS */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            Pending Leave Requests
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{leaves.length}</span>
          </h2>
          {loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : leaves.length === 0 ? (
            <Card className="p-6 text-center text-gray-500 border-dashed">No pending leave requests.</Card>
          ) : (
            leaves.map(req => (
              <Card key={req.id} className="p-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{req.student?.user?.name || 'Unknown Student'}</h3>
                    <p className="text-xs text-gray-500">{req.student?.user?.email}</p>
                  </div>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{req.leaveType}</span>
                </div>
                
                <div className="bg-gray-50 p-2 rounded text-sm mb-3">
                  <p><strong>Dates:</strong> {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                  <p><strong>Reason:</strong> {req.reason}</p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button size="sm" onClick={() => setProcessingModal({ type: 'LEAVE', id: req.id })}>
                    Review
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* CORRECTION REQUESTS */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center text-gray-800">
            Pending Corrections
            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">{corrections.length}</span>
          </h2>
          {loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
          ) : corrections.length === 0 ? (
            <Card className="p-6 text-center text-gray-500 border-dashed">No pending correction requests.</Card>
          ) : (
            corrections.map(req => (
              <Card key={req.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{req.student?.user?.name || 'Unknown Student'}</h3>
                    <p className="text-xs text-gray-500">{req.student?.user?.email}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">
                    Requesting: {req.requestedStatus}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-2 rounded text-sm mb-3">
                  <p><strong>Context:</strong> {req.attendanceRecord?.session?.teachingAssignment?.subject?.name || 'Unknown Subject'}</p>
                  <p><strong>Reason:</strong> {req.reason}</p>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button size="sm" onClick={() => setProcessingModal({ type: 'CORRECTION', id: req.id })}>
                    Review
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {processingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">Review Request</h2>
            
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <p>Your decision will be audited and the student will be notified immediately.</p>
            </div>

            <form onSubmit={processRequest} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 font-medium">Decision</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="status" 
                      value="APPROVED" 
                      checked={reviewForm.status === 'APPROVED'}
                      onChange={e => setReviewForm({...reviewForm, status: e.target.value})}
                    />
                    <span className="text-green-700 font-bold flex items-center"><Check className="w-4 h-4 mr-1"/> Approve</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="status" 
                      value="REJECTED" 
                      checked={reviewForm.status === 'REJECTED'}
                      onChange={e => setReviewForm({...reviewForm, status: e.target.value})}
                    />
                    <span className="text-red-700 font-bold flex items-center"><X className="w-4 h-4 mr-1"/> Reject</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 font-medium">Review Comment (Optional)</label>
                <textarea 
                  rows={3} 
                  className="w-full p-2 border rounded" 
                  placeholder="Explain your decision..."
                  value={reviewForm.comment} 
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} 
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setProcessingModal(null)}>Cancel</Button>
                <Button type="submit" variant={reviewForm.status === 'APPROVED' ? 'default' : 'destructive'}>
                  Confirm {reviewForm.status === 'APPROVED' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
