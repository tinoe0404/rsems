import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, User, Phone, Activity, AlertTriangle, ArrowLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { AdminLogsTable } from "@/components/admin/AdminLogsTable";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (profileError || !profileData) {
        return notFound();
    }

    // Cast to a concrete type so TS doesn't narrow to 'never' after notFound()
    const profile = profileData as {
        id: string;
        full_name: string;
        registration_number: string | null;
        cancer_type: string;
        phone_number: string | null;
        date_of_birth: string | null;
        treatment_start_date: string | null;
    };

    // 2. Fetch Logs
    const { data: logsData } = await supabase
        .from('daily_logs')
        .select(`
            *,
            profiles!user_id(
                full_name,
                phone_number,
                cancer_type
            )
        `)
        .eq('user_id', id)
        .order('log_date', { ascending: false });

    const logs = (logsData || []) as any[];

    // 3. Fetch Appointments
    const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
            *,
            clinician:profiles!clinician_id(full_name)
        `)
        .eq('patient_id', id)
        .order('scheduled_at', { ascending: true });

    const appointments = (appointmentsData || []) as any[];

    // Calculate stats
    const totalLogs = logs.length;
    const highRiskLogs = logs.filter((l) => l.calculated_risk_score >= 3).length;
    const lastLogDate = logs[0]?.log_date || null;

    // Sort appointments: Upcoming vs Past
    const now = new Date();
    const upcomingApts = appointments.filter((a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled');
    const pastApts = appointments.filter((a) => new Date(a.scheduled_at) < now || a.status === 'cancelled');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/patients">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            {profile.registration_number && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    {profile.registration_number}
                                </span>
                            )}
                            <p className="text-sm text-gray-500">ID: {profile.id.slice(0, 8)}...</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {/* Add actions here if needed, e.g. Edit Profile */}
                </div>
            </div>

            {/* Quick Stats / Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="md" className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Details</p>
                        <p className="font-semibold text-gray-900">{profile.cancer_type || "No diagnosis"}</p>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone_number || "No phone"}
                        </div>
                    </div>
                </Card>

                <Card padding="md" className="flex items-start gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Engagement</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{totalLogs}</span>
                            <span className="text-sm text-gray-500">total logs</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Last log: {lastLogDate ? format(new Date(lastLogDate), "MMM d, yyyy") : "Never"}
                        </p>
                    </div>
                </Card>

                <Card padding="md" className="flex items-start gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Risk Profile</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">{highRiskLogs}</span>
                            <span className="text-sm text-gray-500">high risk logs</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {highRiskLogs > 0 ? "Requires attention" : "Stable condition"}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Main Content: Logs & Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Symptom History (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Symptom History</h2>
                    </div>

                    {/* Reuse AdminLogsTable passing specific logs */}
                    {/* Note: AdminLogsTable has its own search/filter which might duplicate logic, 
                        but it handles display well. We can pass the logs we fetched. */}
                    <AdminLogsTable logs={logs} />
                </div>

                {/* Right Column: Appointments (1/3 width) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Appointments</h2>
                        <Link href="/admin/appointments">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
                                View All
                            </Button>
                        </Link>
                    </div>

                    <Card className="divide-y divide-gray-100">
                        {upcomingApts.length === 0 && pastApts.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No appointments found.</div>
                        ) : (
                            <>
                                {upcomingApts.length > 0 && (
                                    <div className="p-4 bg-gray-50/50">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h3>
                                        <div className="space-y-3">
                                            {upcomingApts.map((apt: any) => (
                                                <Link key={apt.id} href={`/admin/appointments/${apt.id}`}>
                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary/50 transition-colors group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-medium text-gray-900 text-sm">{format(new Date(apt.scheduled_at), "MMM d, yyyy")}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{apt.status}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(apt.scheduled_at), "h:mm a")} ({apt.duration_minutes}m)
                                                        </div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                                            <User className="h-3 w-3" />
                                                            {apt.clinician?.full_name || "Unassigned"}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pastApts.length > 0 && (
                                    <div className="p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Past</h3>
                                        <div className="space-y-3">
                                            {pastApts.slice(0, 3).map((apt: any) => (
                                                <Link key={apt.id} href={`/admin/appointments/${apt.id}`}>
                                                    <div className="group flex items-center justify-between p-2 rounded hover:bg-gray-50">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700 group-hover:text-primary">
                                                                {format(new Date(apt.scheduled_at), "MMM d, yyyy")}
                                                            </p>
                                                            <p className="text-xs text-gray-500 capitalize">{apt.appointment_type} • {apt.status}</p>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                                                    </div>
                                                </Link>
                                            ))}
                                            {pastApts.length > 3 && (
                                                <p className="text-xs text-center text-gray-400 mt-2">
                                                    +{pastApts.length - 3} more past appointments
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
