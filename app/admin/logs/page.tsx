import { createClient } from "@/lib/supabase/server";
import { AdminLogsTable } from "@/components/admin/AdminLogsTable";

export default async function AdminLogsPage() {
    const supabase = await createClient();

    // Fetch logs with patient profile
    const { data: logs, error } = await supabase
        .from('daily_logs')
        .select(`
            *,
            profiles (
                full_name,
                phone_number,
                cancer_type
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching logs:", error);
        return (
            <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200 text-red-700">
                <p className="font-bold">Error loading logs</p>
                <p className="text-sm">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Patient Symptom Logs</h1>
                <p className="text-gray-500 text-sm">Real-time daily reports from all patients</p>
            </div>

            <AdminLogsTable logs={logs || []} />
        </div>
    );
}
