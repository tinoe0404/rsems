"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, BellRing, X, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database.types";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminNotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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
            console.log('[AdminNotificationBell] No user found');
            return;
        }

        console.log('[AdminNotificationBell] Initializing for user:', user.id);
        setUserId(user.id);
        await fetchNotifications(user.id);

        // Subscribe to new notifications
        console.log('[AdminNotificationBell] Setting up realtime subscription...');
        const channel = supabase
            .channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('[AdminNotificationBell] Received new notification:', payload);
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show toast with appropriate styling for critical alerts
                    if (newNotification.type === 'critical_symptom_alert') {
                        toast.error(newNotification.title, {
                            description: newNotification.message,
                            duration: 5000,
                        });
                    } else {
                        toast.info(newNotification.title, {
                            description: newNotification.message,
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('[AdminNotificationBell] Subscription status:', status);
            });

        return () => {
            console.log('[AdminNotificationBell] Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    };

    const fetchNotifications = async (uid: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error("Error fetching notifications:", error);
            return;
        }

        if (data) {
            const adminNotifications = data as unknown as Notification[];
            setNotifications(adminNotifications);
            setUnreadCount(adminNotifications.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (notificationId: string, type: string, resourceId: string | null) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Background update
        const { error } = await supabase
            .from('notifications')
            // @ts-ignore
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error("Failed to mark as read:", error);
        }

        // Navigate based on notification type
        setIsOpen(false);
        if (type === 'critical_symptom_alert') {
            router.push('/admin/dashboard'); // Triage board
        } else if (type === 'appointment_update') {
            router.push('/admin/appointments');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "No notifications"}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={cn(
                    "relative p-2 transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center",
                    isOpen
                        ? "text-white bg-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                )}
            >
                {unreadCount > 0 ? (
                    <BellRing className="h-5 w-5 animate-pulse" />
                ) : (
                    <Bell className="h-5 w-5" />
                )}

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-[#00695C] flex items-center justify-center text-[10px] font-bold text-white">
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
                            className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-white rounded-xl shadow-xl shadow-slate-300 border border-slate-200 z-50 overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-red-50 to-orange-50">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <h3 className="font-semibold text-slate-900">Alerts</h3>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-12 px-6 text-center text-slate-500">
                                        <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No alerts</p>
                                        <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-50">
                                        {notifications.map((notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    onClick={() => markAsRead(notification.id, notification.type, notification.resource_id)}
                                                    className={cn(
                                                        "w-full text-left p-4 hover:bg-red-50/30 transition-colors flex items-start gap-3",
                                                        !notification.is_read ? "bg-red-50/20" : "opacity-80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                                        !notification.is_read
                                                            ? notification.type === 'critical_symptom_alert'
                                                                ? "bg-red-500"
                                                                : "bg-orange-500"
                                                            : "bg-slate-200"
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
