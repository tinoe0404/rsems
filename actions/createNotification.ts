"use server";

import { createClient } from "@/lib/supabase/server";
import { type NotificationInsert } from "@/types/database.types";

export interface CreateNotificationParams {
    userId: string;
    type: string;
    title: string;
    message: string;
    resourceId?: string | null;
}

export interface CreateNotificationResult {
    success: boolean;
    error?: string;
}

/**
 * Creates a notification for a specific user
 * Used for appointment scheduling and critical symptom alerts
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    resourceId = null,
}: CreateNotificationParams): Promise<CreateNotificationResult> {
    try {
        const supabase = await createClient();

        const notificationData: NotificationInsert = {
            user_id: userId,
            type,
            title,
            message,
            resource_id: resourceId,
            is_read: false,
        };

        const { error } = await (supabase
            .from("notifications") as any)
            .insert(notificationData);

        if (error) {
            console.error("Failed to create notification:", error);
            return {
                success: false,
                error: "Failed to create notification",
            };
        }

        return { success: true };
    } catch (err) {
        console.error("Unexpected error creating notification:", err);
        return {
            success: false,
            error: "An unexpected error occurred",
        };
    }
}

/**
 * Creates notifications for multiple users
 * Useful for notifying all clinicians about critical events
 */
export async function createBulkNotifications(
    notifications: CreateNotificationParams[]
): Promise<CreateNotificationResult> {
    try {
        const supabase = await createClient();

        const notificationData: NotificationInsert[] = notifications.map(n => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            resource_id: n.resourceId || null,
            is_read: false,
        }));

        const { error } = await (supabase
            .from("notifications") as any)
            .insert(notificationData);

        if (error) {
            console.error("Failed to create bulk notifications:", error);
            console.error("Notification data attempted:", JSON.stringify(notificationData, null, 2));
            return {
                success: false,
                error: "Failed to create notifications",
            };
        }

        console.log(`[DEBUG] Successfully created ${notificationData.length} notifications`);
        return { success: true };
    } catch (err) {
        console.error("Unexpected error creating bulk notifications:", err);
        return {
            success: false,
            error: "An unexpected error occurred",
        };
    }
}
