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

export interface LogSubmissionInput {
    symptomId: number;
    notes?: string;
}

export async function submitDailyLog(
    selectedSymptoms: LogSubmissionInput[],
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

        // 2. Fetch Symptom Details & Severities from DB
        const symptomIds = selectedSymptoms.map(s => s.symptomId);
        const { data: symptomDetails, error: symptomError } = await supabase
            .from("symptoms_master")
            .select("id, name, default_severity")
            .in("id", symptomIds);

        if (symptomError || !symptomDetails) {
            console.error("Error fetching symptoms:", symptomError);
            return { success: false, error: "Failed to validate symptoms" };
        }

        // Map input to full entries
        const symptomsEntry: SymptomEntry[] = selectedSymptoms.map(input => {
            // Explicitly cast or rely on Supabase types if they were working, but here we cast for safety
            const detail = (symptomDetails as any[]).find((d: any) => d.id === input.symptomId);
            return {
                symptom_id: input.symptomId,
                symptom_name: detail?.name || "Unknown Symptom",
                severity: detail?.default_severity || 1, // Default to 1 if not found (fallback)
                notes: input.notes
            };
        });

        // 3. Triage Logic: Calculate Risk Score
        // The score is the MAXIMUM severity found in the symptoms.
        const severities = symptomsEntry.map((s) => s.severity);
        const calculatedRiskScore = Math.max(...severities);

        // 4. Determine if Action is Required (Red/3 = Critical)
        const requiresAction = calculatedRiskScore === 3;

        // 5. Insert or Update into Database (Upsert)
        const { error } = await (supabase.from("daily_logs") as any).upsert({
            user_id: user.id,
            log_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
            symptoms_entry: symptomsEntry,
            calculated_risk_score: calculatedRiskScore,
            requires_action: requiresAction,
            additional_notes: additionalNotes || null,
        }, { onConflict: 'user_id, log_date' });

        if (error) {
            console.error("Database Error:", error);
            return { success: false, error: "Failed to save log" };
        }

        // 6. Notify clinicians if critical symptoms detected
        if (requiresAction) {
            console.log('[DEBUG] Critical symptom detected, notifying clinicians...');
            try {
                // Get patient name for notification
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                const patientName = (profileData as Profile | null)?.full_name || "A patient";
                console.log('[DEBUG] Patient name:', patientName);

                // Get all clinicians
                const { data: clinicians, error: clinicianError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'clinician');

                console.log('[DEBUG] Clinicians found:', clinicians?.length || 0);
                if (clinicianError) {
                    console.error('[DEBUG] Error fetching clinicians:', clinicianError);
                }

                if (clinicians && clinicians.length > 0) {
                    // Create notifications for all clinicians
                    const notifications = (clinicians as { id: string }[]).map(clinician => ({
                        userId: clinician.id,
                        type: 'critical_symptom_alert',
                        title: '🚨 Critical Symptom Alert',
                        message: `${patientName} logged severe symptoms (Risk Score: 3). Immediate review recommended.`,
                        resourceId: user.id, // Link to patient for drill-down
                    }));

                    console.log('[DEBUG] Creating notifications for', notifications.length, 'clinicians');
                    const result = await createBulkNotifications(notifications);
                    console.log('[DEBUG] Notification creation result:', result);
                } else {
                    console.warn('No clinicians found to notify for critical symptom');
                }
            } catch (notificationError) {
                // Log error but don't fail the submission
                console.error('Failed to create clinician notifications:', notificationError);
            }
        }


        // 7. Return success and triage result
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
