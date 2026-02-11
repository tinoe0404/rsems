"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

import { type Appointment } from "@/types/database.types";

export async function cancelAppointment(appointmentId: string, reason?: string) {
    const supabase = await createClient();

    try {
        // 1. Authenticate User
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // 2. Fetch the appointment to check ownership and get clinician_id
        const { data: appointmentData, error: fetchError } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single();

        if (fetchError || !appointmentData) {
            console.error("Error fetching appointment:", fetchError);
            return { success: false, error: "Appointment not found" };
        }

        const appointment = appointmentData as Appointment;

        if (appointment.patient_id !== user.id) {
            return { success: false, error: "Unauthorized to cancel this appointment" };
        }

        // 3. Update status to 'cancelled'
        const { error: updateError } = await (supabase.from("appointments") as any)
            .update({
                status: "cancelled",
                cancellation_reason: reason || "Patient cancelled via dashboard",
            })
            .eq("id", appointmentId);

        if (updateError) {
            console.error("Error cancelling appointment:", updateError);
            return { success: false, error: "Failed to cancel appointment" };
        }

        // 4. Notify Clinician
        if (appointment.clinician_id) {
            const supabaseAdmin = createAdminClient();

            // Get patient name for the notification
            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

            const patientName = (profileData as any)?.full_name || "Patient";

            const { error: notificationError } = await (supabaseAdmin.from("notifications") as any)
                .insert({
                    user_id: appointment.clinician_id,
                    type: "appointment_update", // Matches AdminNotificationBell handling
                    title: "📅 Appointment Cancelled",
                    message: `${patientName} has cancelled their appointment scheduled for ${new Date(appointment.scheduled_at).toLocaleDateString()}.`,
                    resource_id: appointmentId,
                    is_read: false,
                });

            if (notificationError) {
                console.error("Error creating notification:", notificationError);
            }
        }

        revalidatePath("/dashboard/appointments");
        return { success: true };

    } catch (err) {
        console.error("Unexpected error cancelling appointment:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
