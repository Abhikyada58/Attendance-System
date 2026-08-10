'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await api(`/admin/users${query}`);
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) return;
    try {
      await api(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        data: { status: newStatus }
      });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, and account status.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or email..." 
            className="pl-8 bg-background/50 neo-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                          user.role === 'FACULTY' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          user.status === 'ACTIVE' ? 'text-green-500' : 
                          user.status === 'INACTIVE' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {user.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : 
                           user.status === 'INACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {user.status !== 'ACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, 'ACTIVE')} className="text-green-500 h-8">
                              Activate
                            </Button>
                          )}
                          {user.status !== 'INACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(user.id, 'INACTIVE')} className="text-amber-500 h-8">
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
