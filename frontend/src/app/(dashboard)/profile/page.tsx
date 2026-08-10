'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = user?.role === 'STUDENT' ? '/students/me' : user?.role === 'FACULTY' ? '/faculty/me' : '/users/me';
        const data = await api(endpoint);
        setProfile(data);
        setEditName((user?.role === 'STUDENT' || user?.role === 'FACULTY') ? data.user.name : data.name);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const endpoint = user?.role === 'STUDENT' ? '/students/me' : user?.role === 'FACULTY' ? '/faculty/me' : '/users/me';
      const updated = await api(endpoint, {
        data: { name: editName },
        method: 'PATCH'
      });
      
      if (user?.role === 'STUDENT' || user?.role === 'FACULTY') {
         setProfile({ ...profile, user: { ...profile.user, name: updated.user.name } });
      } else {
         setProfile({ ...profile, name: updated.name });
      }
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  if (!profile) return <div>Failed to load profile.</div>;

  const displayName = (user?.role === 'STUDENT' || user?.role === 'FACULTY') ? profile.user.name : profile.name;
  const displayEmail = (user?.role === 'STUDENT' || user?.role === 'FACULTY') ? profile.user.email : profile.email;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Update your public facing name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-md border border-red-500/20 text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-500/10 text-green-500 rounded-md border border-green-500/20 text-sm">{success}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Full Name</Label>
              {isEditing ? (
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              ) : (
                <div className="p-2 bg-muted rounded-md">{displayName}</div>
              )}
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Email</Label>
              {/* Emails cannot be changed to prevent identity spoofing */}
              <div className="p-2 bg-muted/50 text-muted-foreground rounded-md cursor-not-allowed">
                {displayEmail}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            {isEditing ? (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {user?.role === 'STUDENT' ? (
        <Card className="bg-background/60 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Authoritative details provided by the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-muted-foreground block">Student ID</span>
                <span className="font-medium">{profile.studentId}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Institute</span>
                <span className="font-medium">{profile.institute?.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Department</span>
                <span className="font-medium">{profile.department?.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Current Semester</span>
                <span className="font-medium">{profile.currentSem?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Academic Year</span>
                <span className="font-medium">{profile.academicYear?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Class Cohort</span>
                <span className="font-medium">{profile.class?.name || 'Not Assigned'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : user?.role === 'FACULTY' ? (
        <Card className="bg-background/60 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Authoritative details provided by the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-muted-foreground block">Faculty ID</span>
                <span className="font-medium">{profile.facultyId}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Institute</span>
                <span className="font-medium">{profile.institute?.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Department</span>
                <span className="font-medium">{profile.department?.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : profile.student && (
        <Card className="bg-background/60 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Authoritative details provided by the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-muted-foreground block">Student ID</span>
                <span className="font-medium">{profile.student.studentId}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Institute</span>
                <span className="font-medium">{profile.student.institute?.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Department</span>
                <span className="font-medium">{profile.student.department?.name}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Current Semester</span>
                <span className="font-medium">{profile.student.currentSem?.name || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
