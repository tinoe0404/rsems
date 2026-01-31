import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // 1. Verify Authentication & Role
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: { role: string } | null };

    if (profile?.role !== "clinician") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { patientId, scheduledAt, notes } = await request.json();

        if (!patientId || !scheduledAt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Insert Appointment into Database
        // Using explicit typing or 'any' if schema types are outdated for 'appointments'

        // Create notification for the patient
        // We need the Appointment ID to link it. Supabase v2 insert().select() returns data.
        // Let's refactor the insert above slightly to get ID, or we fetch the latest.
        // Actually, let's just do a fire-and-forget notification if strict linking isn't critical,
        // but better: update the insert to return data.

        // Refetched strategy:
        const { data: appointmentData, error: aptError } = await (supabase.from("appointments") as any)
            .insert({
                patient_id: patientId,
                clinician_id: user.id,
                scheduled_at: scheduledAt,
                status: "scheduled",
                notes: notes,
            })
            .select()
            .single();

        if (aptError) {
            console.error("Database Error:", aptError);
            return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
        }

        const { error: notificationError } = await (supabase.from('notifications') as any)
            .insert({
                user_id: patientId,
                type: 'appointment_new',
                title: 'New Appointment Scheduled',
                message: `You have a new appointment scheduled for ${new Date(scheduledAt).toLocaleDateString()}.`,
                resource_id: appointmentData.id,
                is_read: false
            });

        if (notificationError) {
            console.error('Error creating notification:', notificationError);
        }

        // 3. Send Email Notification
        // We attempt to send email, but don't fail the request if it fails (just log it)
        try {
            // Fetch patient email if possible. 
            // Note: 'profiles' usually doesn't store email. We might need it from client or user metadata.
            // For MVP, if we can't get it from DB easily without Admin rights, we'll Mock it or use a test email.
            // Option: Pass email from client if displayed, or fetch from auth admin if we had service key.
            // Let's cheat slightly for MVP and send to the 'User' if we could, 
            // but since we lack Admin Key usage here, we'll log the email intent.

            // HOWEVER, to be "The Best", we should try.
            // If we can't get the email, we'll log a warning.

            // Setup Transporter
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.example.com",
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            // Mock email for now since we don't have the patient's email address readily available 
            // in the 'profiles' table (usually) without a join on auth.users which needs admin.
            // Or we could have passed it from the frontend if we displayed it.
            // Let's assume we won't send a REAL email to a dynamic address in this demo environment
            // unless provided. We will log the success.

            console.log(`[Mock Email] Sending to patient ${patientId}: Appointment at ${scheduledAt}`);

            // In a real production app with Service Role:
            // const { data: userData } = await supabaseAdmin.auth.admin.getUserById(patientId);
            // const email = userData.user.email;
            // await transporter.sendMail({ ... });

        } catch (emailError) {
            console.error("Email/Notification Failed:", emailError);
            // We do NOT return error, because the appointment IS booked.
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Unexpected Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
