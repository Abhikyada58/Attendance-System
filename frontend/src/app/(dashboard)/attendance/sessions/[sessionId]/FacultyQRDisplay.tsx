import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, RefreshCw, XCircle } from 'lucide-react';

export default function FacultyQRDisplay({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchToken = async () => {
    try {
      const response = await api(`/attendance/sessions/${sessionId}/qr`, { method: 'POST' });
      setToken(response.token);
      setExpiresAt(new Date(response.expiresAt));
    } catch (err: any) {
      alert(err.message || 'Failed to generate QR Code');
      setIsOpen(false);
    }
  };

  const revokeToken = async () => {
    try {
      await api(`/attendance/sessions/${sessionId}/qr/revoke`, { method: 'POST' });
      setToken(null);
      setExpiresAt(null);
      setTimeLeft(0);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke QR Code');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!token) {
      fetchToken();
    }

    const interval = setInterval(() => {
      if (expiresAt) {
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);

        // Auto-refresh when time is up
        if (remaining === 0) {
          fetchToken();
        }
      }
    }, 1000);
    
    timerRef.current = interval;

    return () => clearInterval(interval);
  }, [isOpen, expiresAt]);

  // When modal closes, revoke the token for security
  useEffect(() => {
    if (!isOpen && token) {
      revokeToken();
    }
  }, [isOpen]);

  const qrPayload = JSON.stringify({ type: 'ATTENDX_ATTENDANCE', token });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
          <QrCode className="w-4 h-4 mr-2" /> Show Dynamic QR
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold tracking-tight">Scan for Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {token ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                <QRCode value={qrPayload} size={256} className="w-64 h-64" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Expires In</p>
                <div className={`text-4xl font-black ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1" onClick={fetchToken}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh Now
                </Button>
                <Button variant="destructive" className="flex-1" onClick={revokeToken}>
                  <XCircle className="w-4 h-4 mr-2" /> Revoke QR
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
