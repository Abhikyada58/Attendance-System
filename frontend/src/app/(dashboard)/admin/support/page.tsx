'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, AlertCircle, Clock, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function AdminSupportDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const url = filter === 'ALL' ? '/support/tickets' : `/support/tickets?status=${filter}`;
      const res = await api.get(url);
      setTickets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (id: string) => {
    if (!confirm('Resolve this ticket?')) return;
    try {
      await api.patch(`/support/tickets/${id}/status`, { status: 'RESOLVED' });
      fetchTickets();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to resolve');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading support console...</div>;

  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'REOPENED').length;
  const highPriority = tickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <LifeBuoy className="mr-2 text-primary w-6 h-6" /> Support Console
          </h1>
          <p className="text-gray-500">Manage institution-wide support tickets and knowledge base.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-blue-500 neo-shadow border-y-0 border-r-0">
          <div className="flex items-center text-blue-600 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Active Tickets</h3>
          </div>
          <p className="text-4xl font-black">{openTickets}</p>
        </Card>
        
        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-red-500 neo-shadow border-y-0 border-r-0">
          <div className="flex items-center text-red-600 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-bold">High Priority</h3>
          </div>
          <p className="text-4xl font-black text-red-600">{highPriority}</p>
        </Card>

        <Card className="p-6 flex flex-col justify-center border-l-4 border-l-green-500 neo-shadow border-y-0 border-r-0">
          <div className="flex items-center text-green-600 mb-2">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Resolution Rate</h3>
          </div>
          <p className="text-4xl font-black text-green-600">
            {tickets.length > 0 ? Math.round((tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length / tickets.length) * 100) : 0}%
          </p>
        </Card>
      </div>

      {/* Ticket Queue */}
      <Card className="p-0 overflow-hidden neo-border">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">Ticket Queue</h2>
          <div className="flex space-x-2">
            <select className="p-2 border rounded text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="ALL">All Tickets</option>
              <option value="OPEN">Open Only</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_USER">Waiting for User</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
        
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No tickets found for current filter.</div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded font-bold">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'WAITING_FOR_USER' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                      {ticket.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-md">{ticket.subject}</h3>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <span className="mr-4">From: <span className="font-medium text-gray-800">{ticket.createdBy?.name}</span></span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex space-x-2">
                  {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                    <Button variant="outline" size="sm" onClick={() => resolveTicket(ticket.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => alert('Thread view under construction!')}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
