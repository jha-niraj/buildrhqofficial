import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getForYouFeedJobs } from "@/actions/jobs"
import { BrowseContent } from "./browse-content"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Browse All Jobs | ShipItHQ",
    description: "Browse all available job opportunities"
}

export default async function BrowsePage() {
    const [session, jobsResult] = await Promise.all([
        getSession(headers()),
        getForYouFeedJobs(1, 20)
    ])

    const isAuthenticated = !!session?.user?.id

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        }>
            <BrowseContent 
                initialData={jobsResult}
                isAuthenticated={isAuthenticated}
            />
        </Suspense>
    )
}
