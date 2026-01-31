import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, FileText, ArrowLeft, MapPin, AlertCircle, Phone, UserCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { type Appointment } from "@/types/database.types";

export default async function AppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch appointment with full details
    const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:profiles!patient_id(*),
            clinician:profiles!clinician_id(*),
            created_by_user:profiles!created_by(full_name)
        `)
        .eq('id', id)
        .single();

    if (error || !appointmentData) {
        console.error("Error fetching appointment:", error);
        notFound();
    }

    // Type assertion
    const apt = appointmentData as any;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'scheduled':
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/appointments">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    <Card padding="lg">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    {apt.appointment_type || "General Appointment"}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    ID: {apt.id}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(apt.status)} capitalize`}>
                                {apt.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Date</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {format(new Date(apt.scheduled_at), "EEEE, MMMM d, yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Time</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {format(new Date(apt.scheduled_at), "h:mm a")}
                                        <span className="text-sm font-normal text-gray-500 ml-1">
                                            ({apt.duration_minutes} mins)
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Clinical Notes
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 min-h-[100px]">
                                {apt.notes || "No notes provided for this appointment."}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Patient Info */}
                    <Card padding="lg">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Patient Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{apt.patient?.full_name}</p>
                                    <p className="text-xs text-gray-500">{apt.patient?.cancer_type || "General Patient"}</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    {apt.patient?.phone_number || "No phone number"}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <User className="h-4 w-4 text-gray-400" />
                                    DOB: {apt.patient?.date_of_birth ? format(new Date(apt.patient.date_of_birth), "PP") : "Not set"}
                                </div>
                            </div>

                            <Link href={`/admin/patients/${apt.patient_id}`} className="block mt-2">
                                <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary-dark hover:bg-primary/5">
                                    View Patient Profile
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Clinician Info */}
                    <Card padding="lg">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Assigned Clinician
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                                DR
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{apt.clinician?.full_name || "Unassigned"}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Cancellation Info (if cancelled) */}
                    {apt.status === 'cancelled' && (
                        <Card padding="lg" className="border-red-200 bg-red-50">
                            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Cancellation Reason
                            </h3>
                            <p className="text-sm text-red-700">
                                {apt.cancellation_reason || "No reason provided."}
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
