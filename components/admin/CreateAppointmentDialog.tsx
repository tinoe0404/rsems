"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Loader2, Plus, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Patient {
    id: string;
    full_name: string;
    cancer_type?: string;
}

interface CreateAppointmentDialogProps {
    onAppointmentCreated?: () => void;
}

export function CreateAppointmentDialog({ onAppointmentCreated }: CreateAppointmentDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);

    // Fetch patients when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPatients();
            setDate("");
            setNotes("");
            setSelectedPatientId("");
            setSearchTerm("");
        }
    }, [isOpen]);

    const fetchPatients = async () => {
        setIsLoadingPatients(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, cancer_type')
                .eq('role', 'patient')
                .order('full_name');

            if (data) {
                setPatients(data);
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
            toast.error("Failed to load patients");
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !date) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/schedule-appointment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: selectedPatientId,
                    scheduledAt: date,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to schedule appointment");
            }

            toast.success("Appointment Scheduled", {
                description: "The appointment has been created successfully.",
            });

            setIsOpen(false);
            router.refresh(); // Refresh Sever Components to show new data

            if (onAppointmentCreated) {
                onAppointmentCreated();
            }
        } catch (error: any) {
            toast.error("Scheduling Failed", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Appointment
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Schedule New Appointment">
                <form onSubmit={handleSchedule} className="space-y-6">

                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Select Patient <span className="text-red-500">*</span>
                        </label>

                        {isLoadingPatients ? (
                            <div className="text-sm text-muted animate-pulse">Loading patients...</div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                                <select
                                    required
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    size={5} // Show as list
                                >
                                    <option value="" disabled className="text-gray-400">-- Select a patient --</option>
                                    {filteredPatients.map((patient) => (
                                        <option key={patient.id} value={patient.id} className="py-1">
                                            {patient.full_name} {patient.cancer_type ? `(${patient.cancer_type})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">Select a patient from the list above.</p>
                            </div>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Notes / Instructions
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for appointment..."
                            className="w-full min-h-[100px] p-4 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading || !selectedPatientId}
                            className="min-w-[140px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Wait...
                                </>
                            ) : (
                                "Schedule Appointment"
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
