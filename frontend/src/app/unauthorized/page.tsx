'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="p-6 rounded-full bg-destructive/10 text-destructive mb-6 shadow-sm border border-destructive/20">
        <ShieldAlert size={64} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-2">403 Access Denied</h1>
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        You do not have permission to view this page or your account has been suspended.
      </p>
      
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
