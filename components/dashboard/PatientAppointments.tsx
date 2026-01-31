"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Appointment } from "@/types/database.types";
import { Calendar, Clock, MapPin, Loader2, Video, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type AppointmentWithClinician = Appointment & {
    clinician: { full_name: string } | null;
};

export function PatientAppointments() {
    const [appointments, setAppointments] = useState<AppointmentWithClinician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch appointments
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clinician:profiles!clinician_id(full_name)
                `)
                .eq('patient_id', user.id)
                .in('status', ['scheduled', 'confirmed'])
                .order('scheduled_at', { ascending: true });

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
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6 text-red-500 bg-red-50 rounded-lg">
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchAppointments} className="mt-2 text-red-600 hover:bg-red-100">
                    Try Again
                </Button>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">No Upcoming Appointments</h3>
                <p className="text-sm text-gray-500 mt-1">You don&apos;t have any scheduled appointments.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((apt) => (
                <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-surface hover:shadow-sm transition-shadow"
                >
                    {/* Date Box */}
                    <div className="flex-shrink-0 flex sm:flex-col items-center justify-center p-3 bg-primary/5 rounded-lg text-center min-w-[80px]">
                        <span className="text-xs font-bold text-primary uppercase">
                            {format(new Date(apt.scheduled_at), "MMM")}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 mx-2 sm:mx-0">
                            {format(new Date(apt.scheduled_at), "d")}
                        </span>
                        <span className="text-xs text-gray-500">
                            {format(new Date(apt.scheduled_at), "EEE")}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {apt.appointment_type || "Follow-up Appointment"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    with {apt.clinician?.full_name || "Clinician"}
                                </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize 
                                ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {apt.status}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {format(new Date(apt.scheduled_at), "h:mm a")} ({apt.duration_minutes} min)
                            </div>
                            {/* Assuming 'notes' might contain location or we default to 'Radiotherapy Unit' for now since location isn't in schema explicitely yet except notes */}
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                Radiotherapy Center
                            </div>
                        </div>

                        {apt.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100 flex gap-2">
                                <AlertCircle className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p>{apt.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
