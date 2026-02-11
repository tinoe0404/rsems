"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Appointment } from "@/types/database.types";
import { Clock, MapPin, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import Link from "next/link"; // For the footer link if needed, though parent handles it

type AppointmentWithClinician = Appointment & {
    clinician: { full_name: string } | null;
};

interface PatientAppointmentsProps {
    limit?: number;
}

export function PatientAppointments({ limit }: PatientAppointmentsProps) {
    const [appointments, setAppointments] = useState<AppointmentWithClinician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, [limit]); // Re-fetch if limit changes

    const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('appointments')
                .select(`*, clinician:profiles!clinician_id(full_name)`)
                .eq('patient_id', user.id)
                .in('status', ['scheduled', 'confirmed'])
                .gte('scheduled_at', new Date().toISOString()) // Only future appointments
                .order('scheduled_at', { ascending: true });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;
            if (error) throw error;

            setAppointments(data as unknown as AppointmentWithClinician[]);
        } catch (err: any) {
            console.error("Error fetching appointments:", err);
            setError("Failed to load appointments");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchAppointments} className="mt-1 text-xs text-red-700">
                    Try Again
                </Button>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center p-6 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No upcoming appointments</p>
                <p className="text-xs text-slate-400">You're all clear for now.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {appointments.map((apt) => (
                <div
                    key={apt.id}
                    className="group relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-300"
                >
                    <div className="flex gap-4">
                        {/* Date Column */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-teal-50 rounded-lg text-teal-700">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {format(new Date(apt.scheduled_at), "MMM")}
                            </span>
                            <span className="text-xl font-bold leading-none">
                                {format(new Date(apt.scheduled_at), "d")}
                            </span>
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-slate-900 truncate pr-2">
                                        {apt.appointment_type || "Follow-up"}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        with {apt.clinician?.full_name || "Clinician"}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 capitalize">
                                    {apt.status}
                                </span>
                            </div>

                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    {format(new Date(apt.scheduled_at), "h:mm a")}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                    Radiotherapy Center
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
