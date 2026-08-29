import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
    getProblemsForModule, getCategoriesForModule, getLeaderboard
} from "@/actions/(main)/practice";
import { ModuleContent } from "../_components/module-content";

function ContentSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {
                    [...Array(9)].map((_, i) => (
                        <Skeleton key={i} className="h-36 w-full rounded-xl" />
                    ))
                }
            </div>
        </div>
    );
}

interface PageProps {
    searchParams: Promise<{
        topic?: string;
    }>;
}

export default async function DSAPracticePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const topic = params.topic ?? null;

    const [problems, categories, leaderboard] = await Promise.all([
        getProblemsForModule("DSA", topic ?? undefined),
        getCategoriesForModule("DSA"),
        getLeaderboard("DSA", 10),
    ]);

    // No scroller here. This div is a block child of the wrapper's <main>, which is
    // the real scroller - `flex-1` does nothing outside a flex parent and
    // `overflow-auto` never fires without a height cap. See JB-1.
    return (
        <div>
            <Suspense fallback={<ContentSkeleton />}>
                <ModuleContent
                    module="DSA"
                    moduleLabel="Data Structures & Algorithms"
                    problems={problems}
                    categories={categories}
                    leaderboard={leaderboard}
                    activeCategory={topic}
                />
            </Suspense>
        </div>
    );
}