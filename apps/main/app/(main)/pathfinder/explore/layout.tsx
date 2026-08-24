import { getPublicPathfinderGoals } from '@/actions/(main)/pathfinder'
import { ExploreSidebar } from './_components/explore-sidebar'
import Link from 'next/link'
import {
    Target, ArrowLeft
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ExploreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { goals = [] } = await getPublicPathfinderGoals()

    return (
        <div className="h-dvh flex flex-col">
            <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-3">
                <Link
                    href="/pathfinder"
                    className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">My Goals</span>
                </Link>
                <div className="h-4 w-px bg-neutral-200 dark:border-neutral-700" />
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
                    <h1 className="font-semibold text-neutral-900 dark:text-white">
                        Explore Public Goals
                    </h1>
                </div>
            </div>
            <div className="flex-1 flex min-h-0">
                <ExploreSidebar goals={goals} />
                <div className="flex-1 min-w-0 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}