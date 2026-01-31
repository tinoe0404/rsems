"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Notification } from "@/types/database.types";
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

    useEffect(() => {
        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications_update')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${(supabase.auth.getUser() as any).data?.user?.id}` // Ideally we get user ID cleanly
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.info("New Notification", {
                        description: newNotification.title
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10); // Start with latest 10

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

    const markAsRead = async (notificationId: string, resourceId: string | null) => {
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
            // Revert if critical, but for read status it's acceptable to be eventually consistent
        }

        // Action based on resource
        setIsOpen(false);
        if (resourceId) {
            // If it's an appointment, go to appointments page
            // Ideally detailed view, but list is active for now
            router.push('/dashboard/appointments');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 transition-colors rounded-full hover:bg-teal-50",
                    isOpen ? "text-teal-600 bg-teal-50" : "text-slate-400 hover:text-teal-600"
                )}
            >
                {unreadCount > 0 ? <BellRing className="h-5 w-5 animate-pulse" /> : <Bell className="h-5 w-5" />}

                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-100"></span>
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
                            className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                                <h3 className="font-semibold text-slate-800">Notifications</h3>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-50">
                                        {notifications.map((notification) => (
                                            <li key={notification.id}>
                                                <button
                                                    onClick={() => markAsRead(notification.id, notification.resource_id)}
                                                    className={cn(
                                                        "w-full text-left p-4 hover:bg-teal-50/30 transition-colors flex items-start gap-3",
                                                        !notification.is_read ? "bg-teal-50/10" : "opacity-80"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                                                        !notification.is_read ? "bg-teal-500" : "bg-slate-200"
                                                    )} />
                                                    <div>
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
                                                            {new Date(notification.created_at).toLocaleDateString()}
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
