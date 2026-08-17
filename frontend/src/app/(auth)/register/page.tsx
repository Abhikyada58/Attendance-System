'use client';

import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const derivedData = useMemo(() => {
    if (!email || !email.includes('@')) return null;
    const [localPart, domain] = email.toLowerCase().split('@');
    if (domain !== 'charusat.edu.in') return null;
    const match = localPart.match(/^(\d{2})([a-z]{2})(\d{3})$/);
    if (!match) return null;
    const deptMap: Record<string, string> = {
      'cs': 'CSE', 'ce': 'CE', 'it': 'IT', 'ec': 'EC', 'ee': 'EE', 'me': 'ME'
    };
    return {
      studentId: localPart,
      institute: 'CSPIT',
      department: deptMap[match[2]] || 'Unknown',
      admissionYear: 2000 + parseInt(match[1])
    };
  }, [email]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await api('/auth/register', { data: { email, name, password, confirmPassword } });
      const loginRes = await api('/auth/login', { data: { email, password } });
      login(loginRes.token, loginRes.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white font-black text-lg">A</span>
        </div>
        <span className="text-2xl font-black text-indigo-600 tracking-tight">AttendX</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Register with your institutional email to join AttendX</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-gray-700 text-sm font-medium">Full Name</Label>
            <Input
              id="name" type="text" placeholder="John Doe" required value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Institutional Email</Label>
            <Input
              id="email" type="email" placeholder="24cs040@charusat.edu.in" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-gray-900 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Auto-detected profile */}
          {derivedData && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex gap-3 items-start">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-indigo-900 mb-2">We detected the following profile:</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-gray-600">
                  <span>ID: <strong className="text-gray-900">{derivedData.studentId}</strong></span>
                  <span>Institute: <strong className="text-gray-900">{derivedData.institute}</strong></span>
                  <span>Department: <strong className="text-gray-900">{derivedData.department}</strong></span>
                  <span>Batch: <strong className="text-gray-900">{derivedData.admissionYear}</strong></span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-gray-900 pr-12 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword" type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-gray-900 transition-all"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 mt-1">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>) : ('Register')}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6">© 2025 AttendX · CSPIT · Charusat University</p>
    </div>
  );
}
