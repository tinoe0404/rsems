"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Calendar, Clock, Loader2 } from "lucide-react";

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string | null;
    patientName: string | null;
}

export function ScheduleModal({
    isOpen,
    onClose,
    patientId,
    patientName,
}: ScheduleModalProps) {
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDate("");
            setNotes("");
        }
    }, [isOpen]);

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !date) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/schedule-appointment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    patientId,
                    scheduledAt: date,
                    notes,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to schedule appointment");
            }

            toast.success("Appointment Scheduled", {
                description: `Notification sent to ${patientName}`,
            });

            onClose();
        } catch (error: any) {
            toast.error("Scheduling Failed", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Emergency Review`}>
            <form onSubmit={handleSchedule} className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
                    <p className="text-sm font-medium text-primary-dark">
                        Patient: <span className="font-bold">{patientName}</span>
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Date & Time <span className="text-alert">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Instructions / Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="E.g., Please arrive 15 mins early. Go to Room 4."
                        className="w-full min-h-[100px] p-4 rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading}
                        className="min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Wait...
                            </>
                        ) : (
                            "Confirm & Notify"
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
