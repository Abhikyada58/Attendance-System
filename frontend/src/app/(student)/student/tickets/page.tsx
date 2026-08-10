'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LifeBuoy, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

export default function StudentTicketsDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    category: 'ATTENDANCE',
    subject: '',
    description: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets/me');
      setTickets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/support/tickets', form);
      setShowCreateModal(false);
      setForm({ category: 'ATTENDANCE', subject: '', description: '' });
      fetchTickets();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to submit ticket');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <LifeBuoy className="mr-2 text-primary w-6 h-6" /> Support Tickets
          </h1>
          <p className="text-gray-500">Track and manage your support requests.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="neo-shadow">
          <Plus className="w-4 h-4 mr-2" /> New Ticket
        </Button>
      </div>

      <div className="grid gap-4">
        {tickets.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 border-dashed">
            You don't have any open support tickets. Need help? Click "New Ticket".
          </Card>
        ) : (
          tickets.map(ticket => (
            <Card key={ticket.id} className="p-5 flex flex-col md:flex-row justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">
                    {ticket.ticketNumber}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                    ticket.status === 'WAITING_FOR_USER' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {ticket.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{ticket.subject}</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{ticket.description}</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end text-sm text-gray-500">
                <span className="flex items-center mb-1"><Clock className="w-4 h-4 mr-1" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                {ticket.assignedTo && (
                  <span className="text-xs">Assigned to: {ticket.assignedTo.name}</span>
                )}
                <Button variant="link" className="px-0 mt-2 h-auto text-primary" onClick={() => alert('Detailed ticket view is under construction!')}>
                  View Thread <MessageSquare className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            
            {form.category === 'ATTENDANCE' && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 text-sm text-yellow-900 rounded-r">
                <AlertTriangle className="w-4 h-4 inline mr-1 mb-1" />
                <strong>Note:</strong> Support staff cannot directly modify your attendance records. 
                If you were marked absent, please use the <strong>My Requests</strong> tab to submit a correction request to your faculty.
              </div>
            )}

            <form onSubmit={submitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                >
                  <option value="ATTENDANCE">Attendance Issue</option>
                  <option value="ACCOUNT">Account Issue</option>
                  <option value="QR_ATTENDANCE">QR Code Problem</option>
                  <option value="FACE_RECOGNITION">Face Scan Problem</option>
                  <option value="TIMETABLE">Timetable Error</option>
                  <option value="TECHNICAL">Other Technical Issue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input 
                  required
                  placeholder="Brief description of the problem"
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Details</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-2 border rounded resize-none"
                  placeholder="Provide as much detail as possible..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Submit Ticket</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
