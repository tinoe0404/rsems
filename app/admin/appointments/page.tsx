import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { type Appointment } from "@/types/database.types";
import Link from "next/link";
import { CreateAppointmentDialog } from "@/components/admin/CreateAppointmentDialog";

// Define a type for the joined data
type AppointmentWithDetails = Appointment & {
    patient: { full_name: string } | null;
    clinician: { full_name: string } | null;
};

export default async function AppointmentsPage() {
    const supabase = await createClient();

    // Fetch appointments with patient and clinician details
    const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:profiles!patient_id(full_name),
            clinician:profiles!clinician_id(full_name)
        `)
        .order('scheduled_at', { ascending: true });

    if (error) {
        console.error("Error fetching appointments:", error);
        return <div className="p-8 text-center text-red-500">Error loading appointments.</div>;
    }

    const appointments = appointmentsData as unknown as AppointmentWithDetails[];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'no-show': return 'bg-gray-100 text-gray-700';
            case 'scheduled':
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500 text-sm">Manage patient appointments</p>
                </div>
                <CreateAppointmentDialog />
            </div>

            {/* Desktop Table View */}
            <Card padding="none" className="hidden md:block bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Date & Time</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Patient</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Clinician</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {appointments?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                appointments?.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">
                                                    {format(new Date(apt.scheduled_at), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {format(new Date(apt.scheduled_at), "h:mm a")} ({apt.duration_minutes} min)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {apt.patient?.full_name || "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium capitalize">
                                                {apt.appointment_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-600">
                                                {apt.clinician?.full_name || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/appointments/${apt.id}`}
                                                className="text-primary hover:text-primary-dark font-medium text-sm inline-flex items-center gap-1"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {appointments?.length === 0 ? (
                    <Card padding="lg" className="text-center text-gray-500">
                        No appointments found.
                    </Card>
                ) : (
                    appointments?.map((apt) => (
                        <Card key={apt.id} padding="md" className="flex flex-col gap-3">
                            {/* Row 1: Date + Status */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="font-bold text-gray-900 text-base truncate">
                                            {format(new Date(apt.scheduled_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 ml-6 text-gray-500 text-sm">
                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                        <span>{format(new Date(apt.scheduled_at), "h:mm a")} · {apt.duration_minutes} min</span>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </span>
                            </div>

                            {/* Row 2: Details Grid */}
                            <div className="space-y-2.5">
                                {/* Patient */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="font-medium truncate">{apt.patient?.full_name || "Unknown"}</span>
                                </div>

                                {/* Type */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                        {apt.appointment_type}
                                    </span>
                                </div>

                                {/* Clinician */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="truncate">
                                        {apt.clinician?.full_name ? `Dr. ${apt.clinician.full_name}` : <span className="text-gray-400 italic">Unassigned</span>}
                                    </span>
                                </div>
                            </div>

                            {/* Row 3: Action */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                                <Link
                                    href={`/admin/appointments/${apt.id}`}
                                    className="flex items-center gap-1 text-sm font-semibold text-primary active:text-primary-dark"
                                >
                                    View Details
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
