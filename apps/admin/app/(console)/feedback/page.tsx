import { getAllFeedback } from "@/actions/main/feedback.action"
import { FeedbackClient, type Feedback } from "./_components/feedback-client"

/** Server component (ADM-8) - see admins/profile/page.tsx for the pattern note. */
export default async function FeedbackPage() {
    const res = await getAllFeedback({ category: "all", status: "all" }, { page: 1, limit: 20 })

    const initialFeedback: Feedback[] = res.success ? res.data.feedback : []
    const initialTotal = res.success ? res.data.total : 0
    const initialPages = res.success ? res.data.pages : 0

    return (
        <FeedbackClient
            initialFeedback={initialFeedback}
            initialTotal={initialTotal}
            initialPages={initialPages}
            loadError={res.success ? null : res.error}
        />
    )
}
