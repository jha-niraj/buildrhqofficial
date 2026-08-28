import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getSession } from "@repo/auth"
import { headers } from "next/headers"
import { getFollowingFeedJobs } from "@/actions/jobs"
import { FollowingContent } from "./following-content"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

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
                <InlineLoader size="lg" className="text-neutral-400" />
            </div>
        }>
            <FollowingContent 
                initialData={jobsResult}
                isAuthenticated={isAuthenticated}
            />
        </Suspense>
    )
}
