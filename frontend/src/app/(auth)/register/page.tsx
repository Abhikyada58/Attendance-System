'use client';

import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Info } from 'lucide-react';
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

  // Frontend derivation for UI preview only. 
  // The backend will RE-DERIVE these values authoritatively.
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

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      // POST to backend. The backend handles parsing and DB creation.
      await api('/auth/register', {
        data: { email, name, password, confirmPassword }
      });
      
      // Auto-login immediately after successful registration
      const loginRes = await api('/auth/login', {
        data: { email, password }
      });
      
      login(loginRes.token, loginRes.user);

    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-lg border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Register with your institutional email to join AttendX
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-100/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Institutional Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="24cs040@charusat.edu.in" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              {/* Informational UI Preview */}
              {derivedData && (
                <div className="md:col-span-2 p-3 bg-primary/5 border border-primary/20 rounded-md flex gap-3 items-start">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">We detected the following profile:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                      <span>ID: <strong className="text-foreground">{derivedData.studentId}</strong></span>
                      <span>Institute: <strong className="text-foreground">{derivedData.institute}</strong></span>
                      <span>Department: <strong className="text-foreground">{derivedData.department}</strong></span>
                      <span>Batch: <strong className="text-foreground">{derivedData.admissionYear}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
