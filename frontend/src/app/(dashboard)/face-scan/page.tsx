'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, Loader2, Key } from 'lucide-react';

export default function FaceScanPage() {
  const [sessionId, setSessionId] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    if (!sessionId || sessionId.length < 10) {
      setError("Please enter a valid Session ID first.");
      return;
    }
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    setLoading(true);
    setError(null);

    try {
      await api('/attendance/face/verify', {
        method: 'POST',
        data: { 
          sessionId,
          image: base64Image 
        }
      });
      setSuccess(true);
      stopCamera();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setError(null);
    setSessionId('');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Face Verification</h1>
        <p className="text-muted-foreground">Mark your attendance securely using Face ID.</p>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm overflow-hidden">
        
        {success ? (
          <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold text-green-500">Identity Verified!</h2>
            <p className="text-muted-foreground">You have been marked Present.</p>
            <Button onClick={reset} className="mt-4" variant="outline">
              Mark Another Session
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" /> Live Scan
              </CardTitle>
              <CardDescription>
                Enter the session ID provided by your professor, then scan your face.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {!stream && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session ID</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Enter 36-character UUID..." 
                        className="pl-9"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center border border-border mt-4">
                {!stream ? (
                  <div className="text-center p-6 space-y-4">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                    <Button onClick={startCamera}>Start Camera</Button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform scale-x-[-1]" 
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-64 border-2 border-primary/50 rounded-full border-dashed animate-pulse"></div>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-md text-sm border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {stream && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    size="lg" 
                    onClick={verifyFace} 
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                    {loading ? 'Verifying...' : 'Verify Face'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={stopCamera} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
