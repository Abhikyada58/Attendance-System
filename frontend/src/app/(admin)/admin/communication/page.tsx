'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Users, Calendar, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: string;
  targetAudience: string;
  priority: string;
  createdAt: string;
  publishAt?: string;
}

export default function CommunicationHubPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetAudience: 'ALL_USERS',
    targetId: '',
    status: 'PUBLISHED',
    publishAt: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (payload.status === 'SCHEDULED' && payload.publishAt) {
        payload.publishAt = new Date(payload.publishAt).toISOString();
      } else {
        delete payload.publishAt;
      }
      
      const res = await api.post('/announcements', payload);
      
      if (payload.status === 'PUBLISHED') {
        // Automatically dispatch through the pipeline if published immediately
        await api.post(`/announcements/${res.data.id}/publish`);
      }
      
      alert('Announcement created successfully');
      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      alert('Failed to create announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Communication Hub</h1>
          <p className="text-gray-500">Manage institution-wide announcements and notifications</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Megaphone className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="animate-pulse h-32 bg-gray-100 rounded-lg w-full"></div>
        ) : announcements.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            No announcements found.
          </div>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} className="p-5 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  ann.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  ann.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {ann.status}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  ann.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  ann.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {ann.priority}
                </span>
              </div>
              
              <h3 className="font-bold text-lg mb-1">{ann.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">{ann.content}</p>
              
              <div className="mt-auto space-y-2 text-xs text-gray-500 pt-3 border-t">
                <div className="flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Audience: {ann.targetAudience}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" /> 
                  {ann.status === 'SCHEDULED' ? `Scheduled: ${new Date(ann.publishAt!).toLocaleString()}` : `Created: ${new Date(ann.createdAt).toLocaleDateString()}`}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border rounded-md"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-2 border rounded-md"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Audience</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="STUDENTS">All Students</option>
                    <option value="FACULTY">All Faculty</option>
                    <option value="DEPARTMENT">Specific Department</option>
                    <option value="CLASS">Specific Class</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {(formData.targetAudience === 'CLASS' || formData.targetAudience === 'DEPARTMENT') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Target ID (UUID)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border rounded-md"
                    value={formData.targetId}
                    onChange={(e) => setFormData({...formData, targetId: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Publish Status</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PUBLISHED">Publish Immediately</option>
                  <option value="SCHEDULED">Schedule for Later</option>
                  <option value="DRAFT">Save as Draft</option>
                </select>
              </div>

              {formData.status === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Publish At</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full p-2 border rounded-md"
                    value={formData.publishAt}
                    onChange={(e) => setFormData({...formData, publishAt: e.target.value})}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
