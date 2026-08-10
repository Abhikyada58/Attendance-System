'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Polling unread count every 60s
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchUnreadCount = async () => {
      try {
        const res = await api('/notifications/unread-count');
        setUnreadCount(res.count);
      } catch (err) {
        console.error('Failed to fetch unread count');
      }
    };

    fetchUnreadCount();

    const handleFocus = () => {
      fetchUnreadCount();
      interval = setInterval(fetchUnreadCount, 60000);
    };

    const handleBlur = () => {
      clearInterval(interval);
    };

    interval = setInterval(fetchUnreadCount, 60000);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api('/notifications?limit=20');
      setNotifications(res.notifications);
      
      // Update unread count locally just in case
      setUnreadCount(res.notifications.filter((n: any) => !n.readAt).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string, metadata?: any) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate if applicable
      if (metadata?.subjectId) {
        router.push(`/analytics?subject=${metadata.subjectId}`);
        setIsOpen(false);
      } else if (metadata?.sessionId) {
        router.push(`/attendance/history`);
        setIsOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-muted/50 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center neo-shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-[380px] p-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/50 neo-shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center p-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground p-8 text-center">
              <Bell className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs opacity-70 mt-1">No new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/20">
              {notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`flex gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!notif.readAt ? 'bg-primary/5' : 'opacity-70'}`}
                  onClick={() => handleMarkAsRead(notif.id, notif.metadata)}
                >
                  <div className="shrink-0 mt-1">
                    {getPriorityIcon(notif.priority)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notif.readAt ? 'font-semibold' : 'font-medium'} leading-none`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notif.readAt && (
                    <div className="shrink-0 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
