'use client'

import { useEffect, useState } from 'react'
import { getPublicProjects } from '@/actions/(main)/projects/project.action'
import {
    ProjectCard, ProjectCardSkeleton
} from '@/components/projects/project-card'
import {
    Terminal, AlertCircle
} from 'lucide-react'
import { ProjectV2Basic } from '@/types/project'



export function PublicProjectsGrid() {
    const [projects, setProjects] = useState<ProjectV2Basic[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true)
                // Assuming pagination or limit is handled by backend or fixed number
                const result = await getPublicProjects(9)

                if (result.success && result.data) {
                    setProjects(result.data)
                } else {
                    // If success is false but no crash, usually implies empty or specific error
                    // Keeping loading false but maybe set empty projects
                    setProjects([])
                }
            } catch (err) {
                console.error("Failed to fetch public projects", err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchProjects()
    }, [])

    if (loading) {
        return <PublicProjectsGridSkeleton />
    }

    if (error) {
        return (
            <div className="w-full py-12 border border-dashed border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                <p className="text-neutral-900 dark:text-white font-medium">System Error</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1">
                    Unable to retrieve project registry. Please try refreshing the connection.
                </p>
            </div>
        )
    }

    if (projects.length === 0) {
        // Compact, and with NO call to action.
        //
        // This grid sits at the bottom of the hub, under an "In progress" section
        // whose own empty state already offers "Generate a project". A 16rem-tall
        // dashed panel repeating the same button turned a page with nothing on it
        // into a page with the same invitation three times, stacked - which is
        // what made the overview read as dead rather than as new. One line is
        // enough to say the shelf is bare.
        return (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-4 py-5 dark:border-neutral-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    <Terminal className="h-4 w-4" />
                </span>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Nothing published to the public catalogue yet. Projects people mark
                    public will show up here.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
                projects.map((project: ProjectV2Basic) => (
                    <ProjectCard key={project.id} project={project} />
                ))
            }
        </div>
    )
}

export function PublicProjectsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
                [...Array(6)].map((_, i) => (
                    <ProjectCardSkeleton key={i} />
                ))
            }
        </div>
    )
}