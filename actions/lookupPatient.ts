"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Looks up a patient's email by their registration number (RSEMS-XXXX).
 * Uses the admin client to bypass RLS since the user isn't authenticated yet.
 */
export async function lookupEmailByRegNumber(
    registrationNumber: string
): Promise<{ email: string | null; error: string | null }> {
    try {
        const adminClient = createAdminClient();

        // 1. Find the profile by registration number
        const { data: profileData, error: profileError } = await adminClient
            .from("profiles")
            .select("id")
            .eq("registration_number", registrationNumber.toUpperCase().trim())
            .single();

        const profile = profileData as { id: string } | null;

        if (profileError || !profile) {
            return {
                email: null,
                error: "Registration number not found. Please check and try again.",
            };
        }

        // 2. Get the email from auth.users via admin API
        const { data: userData, error: userError } =
            await adminClient.auth.admin.getUserById(profile.id);

        if (userError || !userData?.user?.email) {
            return {
                email: null,
                error: "Could not retrieve account details. Please try logging in with your email.",
            };
        }

        return { email: userData.user.email, error: null };
    } catch (err) {
        console.error("lookupEmailByRegNumber error:", err);
        return {
            email: null,
            error: "An unexpected error occurred. Please try again.",
        };
    }
}

/**
 * Fetches the registration number for a newly created user.
 * Called after signup to display the generated RSEMS number.
 */
export async function getRegistrationNumber(
    userId: string
): Promise<{ registrationNumber: string | null; error: string | null }> {
    try {
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("profiles")
            .select("registration_number")
            .eq("id", userId)
            .single();

        if (error || !data) {
            return {
                registrationNumber: null,
                error: "Could not retrieve your registration number.",
            };
        }

        return {
            registrationNumber: (data as { registration_number: string | null }).registration_number,
            error: null,
        };
    } catch (err) {
        console.error("getRegistrationNumber error:", err);
        return {
            registrationNumber: null,
            error: "An unexpected error occurred.",
        };
    }
}
