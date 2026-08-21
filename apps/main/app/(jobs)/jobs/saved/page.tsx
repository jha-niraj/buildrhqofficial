import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getSavedFeedJobs } from "@/actions/jobs"
import { SavedJobsContent } from "./saved-jobs-content"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Saved Jobs | ShipItHQ",
    description: "Your saved job opportunities"
}

export default async function SavedJobsPage() {
    const [session, result] = await Promise.all([
        getSession(headers()),
        getSavedFeedJobs(1, 20)
    ])

    const isAuthenticated = !!session?.user?.id

    return (
        <Suspense 
            fallback={
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
            }
        >
            <SavedJobsContent 
                initialData={result}
                isAuthenticated={isAuthenticated}
            />
        </Suspense>
    )
}