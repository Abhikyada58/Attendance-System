'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, QrCode, RefreshCw } from 'lucide-react';

export default function StudentScanPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Scanner only on the client
    const scanner = new Html5QrcodeScanner('reader', { 
      qrbox: { width: 250, height: 250 },
      fps: 5 
    }, false);

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      if (loading) return; // Prevent multiple scans
      
      try {
        const payload = JSON.parse(decodedText);
        if (payload.type !== 'ATTENDX_ATTENDANCE' || !payload.token) {
          setError('Invalid QR Code format.');
          return;
        }

        // Pause scanning while submitting
        scanner.pause(true);
        submitToken(payload.token);

      } catch (e) {
        setError('Invalid QR Code payload.');
      }
    }

    function onScanFailure(error: any) {
      // Html5QrcodeScanner constantly emits failures when no QR is found. We ignore them.
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const submitToken = async (token: string) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await api('/attendance/qr/scan', {
        method: 'POST',
        data: { token }
      });
      setScanResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    window.location.reload(); // Simple way to re-init scanner completely
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scan Attendance</h1>
        <p className="text-muted-foreground">Scan the dynamic QR code displayed by your professor.</p>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" /> QR Scanner
          </CardTitle>
          <CardDescription>Position the QR code inside the frame.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!scanResult && !error && (
            <div id="reader" className="w-full border-none"></div>
          )}

          {scanResult && (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-bold text-green-500">Attendance Marked!</h2>
              <p className="text-muted-foreground">You have been successfully marked Present for this session.</p>
              <Button onClick={resetScanner} className="mt-4" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Scan Another
              </Button>
            </div>
          )}

          {error && (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
              <h2 className="text-xl font-bold text-red-500">Scan Failed</h2>
              <p className="text-muted-foreground font-medium">{error}</p>
              <Button onClick={resetScanner} className="mt-4" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
