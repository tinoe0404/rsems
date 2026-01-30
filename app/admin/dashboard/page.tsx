import { createClient } from "@/lib/supabase/server";
import { RealtimePatientList } from "@/components/admin/RealtimePatientList";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, AlertCircle, Filter } from "lucide-react";

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
        .limit(100);

    if (error) {
        console.error("Error loading dashboard data:", error);
        return <div>Error loading triage board.</div>;
    }

    const logs = logsData as any[];

    // 2. Get unique user IDs to fetch profiles
    const userIds = Array.from(new Set(logs?.map(log => log.user_id) || []));

    const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, cancer_type')
        .in('id', userIds);

    const profiles = (profilesData || []) as any[];
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // 3. Aggregate Data (Latest log per user)
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

    // 4. SORT by Risk (Desc) then Time (Desc)
    processedPatients.sort((a, b) => {
        if (b.calculated_risk_score !== a.calculated_risk_score) {
            return b.calculated_risk_score - a.calculated_risk_score;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const highRiskCount = processedPatients.filter(p => p.calculated_risk_score >= 3).length;
    const moderateRiskCount = processedPatients.filter(p => p.calculated_risk_score === 2).length;

    return (
        <div className="space-y-8">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Triage Board</h1>
                    <p className="text-gray-500 text-sm">Real-time patient monitoring</p>
                </div>

                <div className="flex gap-4">
                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-alert">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Critical</p>
                            <p className="text-2xl font-bold text-alert">{highRiskCount}</p>
                        </div>
                        <AlertTriangle className="h-6 w-6 text-alert/50" />
                    </Card>

                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-warning">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Monitor</p>
                            <p className="text-2xl font-bold text-warning-dark">{moderateRiskCount}</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-warning/50" />
                    </Card>

                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-primary">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Total</p>
                            <p className="text-2xl font-bold text-primary">{processedPatients.length}</p>
                        </div>
                        <Filter className="h-6 w-6 text-primary/50" />
                    </Card>
                </div>
            </div>

            {/* Real-time List */}
            <RealtimePatientList initialPatients={processedPatients} />
        </div>
    );
}
