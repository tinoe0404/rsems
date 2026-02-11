"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppointmentList } from "@/components/dashboard/AppointmentList";

export default function PatientAppointmentsPage() {
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="-ml-2">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                My Appointments
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage your visits
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">

                {/* Tabs */}
                <div className="flex p-1 bg-white border border-gray-200 rounded-lg mb-6 w-full max-w-md mx-auto shadow-sm">
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${filter === 'upcoming'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${filter === 'past'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Past History
                    </button>
                </div>

                <AppointmentList type={filter} />
            </main>
        </div>
    );
}
