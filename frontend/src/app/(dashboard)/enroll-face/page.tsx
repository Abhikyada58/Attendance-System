'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function FaceEnrollmentPage() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
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

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) return;

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
      await api('/face/enroll', {
        method: 'POST',
        data: { image: base64Image }
      });
      setSuccess(true);
      stopCamera();
    } catch (err: any) {
      setError(err.message || 'Failed to enroll face.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 max-w-md mx-auto space-y-6 text-center">
        <ShieldCheck className="w-24 h-24 text-green-500" />
        <h1 className="text-3xl font-bold">Enrollment Complete</h1>
        <p className="text-muted-foreground">
          Your face has been securely mapped and stored. You can now use Face ID to mark attendance.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Face Enrollment</h1>
        <p className="text-muted-foreground">Setup biometric attendance verification.</p>
      </div>

      <Card className="bg-background/60 backdrop-blur-xl border-border/50 neo-shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" /> Face Capture
          </CardTitle>
          <CardDescription>
            Ensure you are in a well-lit area and looking directly at the camera. Only one face should be visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center border border-border">
            {!stream ? (
              <div className="text-center p-6 space-y-4">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                <Button onClick={startCamera}>Grant Camera Access</Button>
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
                {/* Guide overlay */}
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
                onClick={captureAndEnroll} 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                {loading ? 'Processing...' : 'Capture & Enroll'}
              </Button>
              <Button variant="outline" size="lg" onClick={stopCamera} disabled={loading}>
                Cancel
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground text-center">
        Privacy Note: We extract a mathematical representation of your face. Your raw image is instantly discarded and never saved.
      </div>
    </div>
  );
}
