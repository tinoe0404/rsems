"use server";

import { createClient } from "@/lib/supabase/server";
import { type SymptomEntry, type Profile } from "@/types/database.types";
import { createBulkNotifications } from "./createNotification";

export interface LogSubmissionResult {
    success: boolean;
    score?: number;
    requiresAction?: boolean;
    error?: string;
}

export async function submitDailyLog(
    selectedSymptoms: SymptomEntry[],
    additionalNotes?: string
): Promise<LogSubmissionResult> {
    const supabase = await createClient();

    try {
        // 1. Authenticate User
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        if (!selectedSymptoms || selectedSymptoms.length === 0) {
            return { success: false, error: "No symptoms selected" };
        }

        // 2. Triage Logic: Calculate Risk Score
        // The score is the MAXIMUM severity found in the symptoms.
        // 0 = None, 1 = Mild, 2 = Moderate, 3 = Severe
        const severities = selectedSymptoms.map((s) => s.severity);
        const calculatedRiskScore = Math.max(...severities);

        // 3. Determine if Action is Required (Red/3 = Critical)
        const requiresAction = calculatedRiskScore === 3;

        // 4. Insert or Update into Database (Upsert)
        const { error } = await (supabase.from("daily_logs") as any).upsert({
            user_id: user.id,
            log_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
            symptoms_entry: selectedSymptoms,
            calculated_risk_score: calculatedRiskScore,
            requires_action: requiresAction,
            additional_notes: additionalNotes || null,
        }, { onConflict: 'user_id, log_date' });

        if (error) {
            console.error("Database Error:", error);
            return { success: false, error: "Failed to save log" };
        }

        // 5. Notify clinicians if critical symptoms detected
        if (requiresAction) {
            try {
                // Get patient name for notification
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                const patientName = (profileData as Profile | null)?.full_name || "A patient";

                // Get all clinicians
                const { data: clinicians } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'clinician');

                if (clinicians && clinicians.length > 0) {
                    // Create notifications for all clinicians
                    const notifications = (clinicians as { id: string }[]).map(clinician => ({
                        userId: clinician.id,
                        type: 'critical_symptom_alert',
                        title: '🚨 Critical Symptom Alert',
                        message: `${patientName} logged severe symptoms (Risk Score: 3). Immediate review recommended.`,
                        resourceId: user.id, // Link to patient for drill-down
                    }));

                    await createBulkNotifications(notifications);
                } else {
                    console.warn('No clinicians found to notify for critical symptom');
                }
            } catch (notificationError) {
                // Log error but don't fail the submission
                console.error('Failed to create clinician notifications:', notificationError);
            }
        }

        // 6. Return success and triage result
        return {
            success: true,
            score: calculatedRiskScore,
            requiresAction,
        };
    } catch (err) {
        console.error("Unexpected Error:", err);
        return { success: false, error: "An unexpected error occurred" };
    }
}
