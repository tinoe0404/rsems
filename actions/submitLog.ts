"use server";

import { createClient } from "@/lib/supabase/server";
import { type SymptomEntry } from "@/types/database.types";

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

        // 4. Insert into Database
        // We cast the insert object to any if needed to bypass strict typing issues,
        // but ideally we utilize the types we have.
        const { error } = await (supabase.from("daily_logs") as any).insert({
            user_id: user.id,
            log_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
            symptoms_entry: selectedSymptoms,
            calculated_risk_score: calculatedRiskScore,
            requires_action: requiresAction,
            additional_notes: additionalNotes || null,
        });

        if (error) {
            console.error("Database Error:", error);
            return { success: false, error: "Failed to save log" };
        }

        // 5. Return success and triage result
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
