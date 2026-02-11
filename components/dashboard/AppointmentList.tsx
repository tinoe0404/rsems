"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Appointment } from "@/types/database.types";
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { cancelAppointment } from "@/actions/cancelAppointment";
import { toast } from "sonner";

type AppointmentWithClinician = Appointment & {
    clinician: { full_name: string } | null;
};

interface AppointmentListProps {
    type: 'upcoming' | 'past';
}

export function AppointmentList({ type }: AppointmentListProps) {
    const [appointments, setAppointments] = useState<AppointmentWithClinician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, [type]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    clinician:profiles!clinician_id(full_name)
                `)
                .eq('patient_id', user.id);

            if (type === 'upcoming') {
                query = query.gte('scheduled_at', new Date().toISOString())
                    .in('status', ['scheduled', 'confirmed'])
                    .order('scheduled_at', { ascending: true });
            } else {
                query = query.lt('scheduled_at', new Date().toISOString())
                    .order('scheduled_at', { ascending: false });
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
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 rounded-lg">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAppointments} variant="outline">Try Again</Button>
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-lg text-gray-900 mb-1">
                    {type === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
                </h3>
                <p className="text-gray-500">
                    {type === 'upcoming'
                        ? "You don't have any scheduled visits at the moment."
                        : "You haven't had any appointments yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {appointments.map((apt) => (
                <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-primary/20 transition-colors"
                >
                    {/* Date Box */}
                    <div className={`flex-shrink-0 flex sm:flex-col items-center justify-center p-3 rounded-lg text-center min-w-[80px] ${type === 'upcoming' ? 'bg-primary/5' : 'bg-gray-100'
                        }`}>
                        <span className={`text-xs font-bold uppercase ${type === 'upcoming' ? 'text-primary' : 'text-gray-500'
                            }`}>
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
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {apt.appointment_type || "Follow-up Appointment"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    with {apt.clinician?.full_name || "Clinician"}
                                </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize 
                                ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                    apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-800'}`}>
                                {apt.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {format(new Date(apt.scheduled_at), "h:mm a")} ({apt.duration_minutes} min)
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                Radiotherapy Center
                            </div>
                        </div>

                        {apt.notes && (
                            <div className="p-3 bg-gray-50 rounded text-sm text-gray-600 border border-gray-100 flex gap-2">
                                <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p>{apt.notes}</p>
                            </div>
                        )}

                        {apt.cancellation_reason && apt.status === 'cancelled' && (
                            <div className="mt-2 p-3 bg-red-50 rounded text-sm text-red-700 border border-red-100">
                                <p><span className="font-semibold">Reason:</span> {apt.cancellation_reason}</p>
                            </div>
                        )}

                        {type === 'upcoming' && ['scheduled', 'confirmed'].includes(apt.status) && (
                            <div className="mt-3 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                    onClick={async () => {
                                        if (confirm("Are you sure you want to cancel this appointment?")) {
                                            try {
                                                const result = await cancelAppointment(apt.id);
                                                if (result.success) {
                                                    toast.success("Appointment cancelled");
                                                    fetchAppointments(); // Refresh list
                                                } else {
                                                    toast.error(result.error || "Failed to cancel");
                                                }
                                            } catch (e) {
                                                toast.error("An unexpected error occurred");
                                            }
                                        }
                                    }}
                                >
                                    Cancel Appointment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

