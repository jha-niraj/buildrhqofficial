import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getFollowingFeedJobs } from "@/actions/jobs"
import { FollowingContent } from "./following-content"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Following - Jobs | ShipItHQ",
    description: "Jobs from companies you follow"
}

export default async function FollowingPage() {
    const [session, jobsResult] = await Promise.all([
        getSession(headers()),
        getFollowingFeedJobs(1, 20)
    ])

    const isAuthenticated = !!session?.user?.id
    
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        }>
            <FollowingContent 
                initialData={jobsResult}
                isAuthenticated={isAuthenticated}
            />
        </Suspense>
    )
}
