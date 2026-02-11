import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Users, Search, Calendar, Phone, Activity, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { type Profile } from "@/types/database.types";

export default async function AllPatientsPage() {
    const supabase = await createClient();

    // Fetch all patients
    const { data: patientsData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('full_name', { ascending: true });

    const patients = patientsData as Profile[] | null;

    if (error) {
        console.error("Error fetching patients:", error);
        return <div className="p-8 text-center text-red-500">Error loading patients.</div>;
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Patients</h1>
                    <p className="text-gray-500 text-sm">Directory of all registered patients</p>
                </div>
            </div>

            {/* Desktop Table View */}
            <Card padding="none" className="hidden md:block bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Patient Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Diagnosis</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Treatment Start</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {patients?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No patients found.
                                    </td>
                                </tr>
                            ) : (
                                patients?.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{patient.full_name}</p>
                                                    <p className="text-xs text-gray-500">ID: {patient.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {patient.phone_number ? (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{patient.phone_number}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No phone</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {patient.cancer_type || "Not specified"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {patient.treatment_start_date
                                                        ? format(new Date(patient.treatment_start_date), 'MMM d, yyyy')
                                                        : "Not started"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/patients/${patient.id}`}
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

            {/* Android/Mobile List View - Stacked Layout for clarity */}
            <div className="md:hidden space-y-4">
                {patients?.length === 0 ? (
                    <Card padding="lg" className="text-center text-gray-500">
                        No patients found.
                    </Card>
                ) : (
                    patients?.map((patient) => (
                        <Card key={patient.id} padding="md" className="flex flex-col gap-4">
                            {/* Row 1: Identity */}
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {patient.full_name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 truncate text-base">
                                        {patient.full_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        ID: {patient.id.slice(0, 8)}...
                                    </p>
                                </div>
                            </div>

                            {/* Row 2: Key Details Stack */}
                            <div className="space-y-2.5">
                                {/* Diagnosis */}
                                <div className="flex items-center gap-2.5">
                                    <div className="w-5 flex justify-center">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {patient.cancer_type || "No Diagnosis"}
                                        </span>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="truncate">
                                        {patient.phone_number || <span className="text-gray-400 italic">No phone connected</span>}
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span>
                                        {patient.treatment_start_date
                                            ? `Started ${format(new Date(patient.treatment_start_date), 'MMM d, yyyy')}`
                                            : <span className="text-gray-400 italic">Treatment not started</span>}
                                    </span>
                                </div>
                            </div>

                            {/* Row 3: Actions */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end mt-1">
                                <Link
                                    href={`/admin/patients/${patient.id}`}
                                    className="flex items-center gap-1 text-sm font-semibold text-primary active:text-primary-dark"
                                >
                                    View Patient Profile
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
