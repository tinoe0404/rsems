import { Card } from "@/components/ui/Card";

export default function Loading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Stats Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
                </div>

                <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} padding="md" className="min-w-[140px] flex items-center gap-3 border-l-4 border-gray-200">
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
                        </Card>
                    ))}
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                    ))}
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 flex gap-4">
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
