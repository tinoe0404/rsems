import { Card } from "@/components/ui/Card";

export default function Loading() {
    return (
        <div className="space-y-6 p-4 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-72 bg-gray-200 rounded-md animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} padding="lg" className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
