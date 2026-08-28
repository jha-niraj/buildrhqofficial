import { Suspense } from "react"
import { notFound } from "next/navigation"
import { 
    Loader2 
} from "lucide-react"
import { getJobBySlug } from "@/actions/jobs"
import { JobDetailContent } from "./job-detail-content"
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface JobDetailPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: JobDetailPageProps) {
    const { slug } = await params
    const result = await getJobBySlug(slug)
    
    if (!result.success || !result.data) {
        return { title: "Job Not Found" }
    }

    return {
        title: `${result.data.title} at ${result.data.company.name} | ShipItHQ`,
        description: result.data.description?.slice(0, 160)
    }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
    const { slug } = await params
    const result = await getJobBySlug(slug)

    if (!result.success || !result.data) {
        notFound()
    }

    return (
        <Suspense 
            fallback={
                <div className="min-h-full flex items-center justify-center">
                    <InlineLoader size="lg" className="text-neutral-400" />
                </div>
            }
        >
            <JobDetailContent job={result.data} />
        </Suspense>
    )
}