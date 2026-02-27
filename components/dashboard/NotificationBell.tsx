"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DbNotification as Notification } from "@/types/database.types";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const supabase = createClient();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click and Escape key
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, []);

    useEffect(() => {
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('[NotificationBell] No user found');
            return;
        }

        console.log('[NotificationBell] Initializing for user:', user.id);
        await fetchNotifications(user.id);

        // Subscribe to new notifications
        const channel = supabase
            .channel('patient_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('[NotificationBell] Received new notification:', payload);
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.info(newNotification.title, {
                        description: newNotification.message,
                    });
                }
            )
            .subscribe((status) => {
                console.log('[NotificationBell] Subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const fetchNotifications = async (uid: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error fetching notifications:", error);
            return;
        }

        if (data) {
            const userNotifications = data as unknown as Notification[];
            setNotifications(userNotifications);
            setUnreadCount(userNotifications.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (notificationId: string, type: string, resourceId: string | null) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Background update
        const { error } = await (supabase
            .from('notifications') as any)
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error("Failed to mark as read:", error);
        }

        // Navigate based on notification type
        setIsOpen(false);
        if (type === 'appointment_new' || type === 'appointment_update') {
            router.push('/dashboard/appointments');
        }
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        // Background update
        await (supabase
            .from('notifications') as any)
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "No notifications"}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={cn(
                    "relative p-2 transition-colors rounded-full hover:bg-teal-50 min-h-[44px] min-w-[44px] flex items-center justify-center",
                    isOpen ? "text-teal-600 bg-teal-50" : "text-slate-400 hover:text-teal-600"
                )}
            >
                {unreadCount > 0 ? <BellRing className="h-5 w-5 animate-pulse" /> : <Bell className="h-5 w-5" />}

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-16 md:top-full mt-0 md:mt-3 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                                <h3 className="font-semibold text-slate-800">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                                        >
                                            <Check className="h-3 w-3" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-medium">No notifications yet</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            You&apos;ll be notified about appointments and updates here.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-50">
                                        {notifications.map((notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    onClick={() => markAsRead(notification.id, notification.type, notification.resource_id)}
                                                    className={cn(
                                                        "w-full text-left p-4 hover:bg-teal-50/30 transition-colors flex items-start gap-3",
                                                        !notification.is_read ? "bg-teal-50/10" : "opacity-80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                                        !notification.is_read ? "bg-teal-500" : "bg-slate-200"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={cn(
                                                            "text-sm font-medium",
                                                            !notification.is_read ? "text-slate-900" : "text-slate-600"
                                                        )}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 mt-2 block">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
