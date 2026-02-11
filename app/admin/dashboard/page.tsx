import { createClient } from "@/lib/supabase/server";
import { RealtimePatientList } from "@/components/admin/RealtimePatientList";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, AlertCircle, Filter, Calendar, Plus, Clock, Activity, UserPlus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { CreateAppointmentDialog } from "@/components/admin/CreateAppointmentDialog";

export default async function ClinicianDashboard() {
    const supabase = await createClient();

    // 1. Fetch latest logs
    const { data: logsData, error } = await supabase
        .from('daily_logs')
        .select(`
      id,
      user_id,
      log_date,
      created_at,
      calculated_risk_score,
      requires_action,
      symptoms_entry
    `)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to 10 for dashboard view

    if (error) {
        console.error("Error loading dashboard data:", error);
        return <div>Error loading triage board.</div>;
    }

    const logs = logsData as any[];

    // 2. Fetch recent appointments
    const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
            id,
            scheduled_at,
            status,
            patient:profiles!patient_id(full_name),
            clinician:profiles!clinician_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    const recentAppointments = (appointmentsData || []) as any[];

    // 3. Get unique user IDs to fetch profiles for logs
    const userIds = Array.from(new Set(logs?.map(log => log.user_id) || []));

    const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, cancer_type')
        .in('id', userIds);

    const profiles = (profilesData || []) as any[];
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // 4. Aggregate Data (Latest log per user)
    const latestLogsMap = new Map();

    if (logs) {
        logs.forEach(log => {
            if (!latestLogsMap.has(log.user_id)) {
                const profile = profileMap.get(log.user_id);
                if (profile) {
                    latestLogsMap.set(log.user_id, {
                        log_id: log.id,
                        user_id: log.user_id,
                        full_name: profile.full_name,
                        cancer_type: profile.cancer_type,
                        log_date: log.log_date,
                        created_at: log.created_at,
                        calculated_risk_score: log.calculated_risk_score,
                        requires_action: log.requires_action,
                        symptom_count: Array.isArray(log.symptoms_entry) ? log.symptoms_entry.length : 0
                    });
                }
            }
        });
    }

    const processedPatients = Array.from(latestLogsMap.values());

    // 5. SORT by Risk (Desc) then Time (Desc)
    processedPatients.sort((a, b) => {
        if (b.calculated_risk_score !== a.calculated_risk_score) {
            return b.calculated_risk_score - a.calculated_risk_score;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const highRiskCount = processedPatients.filter(p => p.calculated_risk_score >= 3).length;
    const moderateRiskCount = processedPatients.filter(p => p.calculated_risk_score === 2).length;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clinician Dashboard</h1>
                    <p className="text-gray-500 text-sm">Overview of patient status and activities</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="w-full sm:w-auto">
                        <CreateAppointmentDialog />
                    </div>
                    <Link href="/signup" className="w-full sm:w-auto">
                        <Button variant="outline" className="gap-2 w-full justify-center">
                            <UserPlus className="h-4 w-4" />
                            Register Patient
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card padding="sm" className="flex flex-col sm:flex-row items-center sm:gap-3 gap-2 min-w-0 bg-white border-l-4 border-l-alert">
                    <div className="text-center sm:text-left flex-1 w-full">
                        <p className="text-[10px] sm:text-xs text-muted font-bold uppercase tracking-wide">Critical</p>
                        <p className="text-xl sm:text-2xl font-bold text-alert leading-tight">{highRiskCount}</p>
                    </div>
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-alert/50 flex-shrink-0" />
                </Card>

                <Card padding="sm" className="flex flex-col sm:flex-row items-center sm:gap-3 gap-2 min-w-0 bg-white border-l-4 border-l-warning">
                    <div className="text-center sm:text-left flex-1 w-full">
                        <p className="text-[10px] sm:text-xs text-muted font-bold uppercase tracking-wide">Watchlist</p>
                        <p className="text-xl sm:text-2xl font-bold text-warning-dark leading-tight">{moderateRiskCount}</p>
                    </div>
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-warning/50 flex-shrink-0" />
                </Card>

                <Card padding="sm" className="col-span-2 md:col-span-1 flex flex-col sm:flex-row items-center sm:gap-3 gap-2 min-w-0 bg-white border-l-4 border-l-primary">
                    <div className="text-center sm:text-left flex-1 w-full">
                        <p className="text-[10px] sm:text-xs text-muted font-bold uppercase tracking-wide">Active</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary leading-tight">{processedPatients.length}</p>
                    </div>
                    <Filter className="h-5 w-5 sm:h-6 sm:w-6 text-primary/50 flex-shrink-0" />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main Column: Triage Board */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-gray-500" />
                            Patient Triage Board
                        </h2>
                        <Link href="/admin/logs" className="text-sm text-primary hover:underline">
                            View All Logs
                        </Link>
                    </div>

                    <RealtimePatientList initialPatients={processedPatients} />
                </div>

                {/* Side Column: Recent Activity / Quick Links */}
                <div className="space-y-6">
                    {/* Recent Activity */}
                    <Card padding="none" className="bg-white overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                Recent Activity
                            </h3>
                            <Link href="/admin/appointments" className="text-xs text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentAppointments.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No recent activity</div>
                            ) : (
                                recentAppointments.map((apt: any) => (
                                    <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {apt.status === 'scheduled' ? 'New Appointment' : apt.status}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(apt.scheduled_at), 'MMM d')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">
                                            <span className="font-medium">{apt.patient?.full_name}</span> w/ {apt.clinician?.full_name?.split(' ')[0] || 'Unassigned'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Quick Links Card */}
                    <Card padding="md" className="bg-white">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <Link href="/admin/patients" className="block w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Patient Directory
                            </Link>
                            <Link href="/admin/appointments" className="block w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Appointment Calendar
                            </Link>
                            <Link href="/admin/logs" className="block w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Symptom Logs
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
