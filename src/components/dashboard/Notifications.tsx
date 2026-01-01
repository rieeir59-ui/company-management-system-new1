'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useFirebase } from '@/firebase/provider';
import { useCurrentUser } from '@/context/UserContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  limit,
  type Timestamp,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
  id: string;
  type: 'leave_request' | 'leave_status';
  message: string;
  relatedId: string;
  status: 'read' | 'unread';
  recipientRole?: 'admin';
  recipientId?: string;
  createdAt: Timestamp;
};

export function Notifications() {
  const { firestore } = useFirebase();
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isAdmin = useMemo(() => user?.departments.some(d => ['admin', 'ceo', 'software-engineer', 'hr'].includes(d)), [user]);

  useEffect(() => {
    if (!firestore || !user) return;

    const notificationsRef = collection(firestore, 'notifications');
    let queries;

    // Admins see role-based notifications AND notifications sent to their specific ID
    if (isAdmin) {
       queries = [
         query(notificationsRef, where('recipientRole', '==', 'admin'), orderBy('createdAt', 'desc'), limit(10)),
         query(notificationsRef, where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10))
       ];
    } 
    // Regular users only see notifications targeted to their UID
    else {
         queries = [query(notificationsRef, where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20))];
    }

    const unsubscribes = queries.map(q => 
      onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Notification));
        
        setNotifications(prev => {
          const newNotifications = [...prev];
          fetchedNotifications.forEach(newNotif => {
            const index = newNotifications.findIndex(n => n.id === newNotif.id);
            if (index > -1) {
              newNotifications[index] = newNotif; // Update existing
            } else {
              newNotifications.push(newNotif); // Add new
            }
          });
          // Sort and limit the combined list
          return newNotifications
            .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
            .slice(0, 20);
        });
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, [firestore, user, isAdmin]);

  const unreadCount = useMemo(() => {
    // Use a Set to count unique unread notifications
    const unreadIds = new Set<string>();
    notifications.forEach(n => {
        if (n.status === 'unread') {
            unreadIds.add(n.id);
        }
    });
    return unreadIds.size;
  }, [notifications]);
  
  const handleMarkAsRead = async (id: string) => {
    if (!firestore) return;
    const notifRef = doc(firestore, 'notifications', id);
    try {
      await updateDoc(notifRef, { status: 'read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };


  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4">
          <h4 className="font-medium leading-none">Notifications</h4>
          <p className="text-sm text-muted-foreground">You have {unreadCount} unread messages.</p>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No notifications</p>
            ) : (
                [...new Map(notifications.map(item => [item.id, item])).values()]
                  .sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime())
                  .map(notification => (
                     <div key={notification.id} className={cn("p-4 border-b", notification.status === 'unread' ? 'bg-primary/10' : '')}>
                        <div className="flex justify-between items-start">
                            <p className="text-sm pr-2">{notification.message}</p>
                            {notification.status === 'unread' && (
                                 <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)} className="h-auto p-1 text-xs text-primary hover:bg-primary/20">
                                     <Check className="h-3 w-3 mr-1" />
                                     Mark as Read
                                 </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                        </p>
                    </div>
                ))
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
