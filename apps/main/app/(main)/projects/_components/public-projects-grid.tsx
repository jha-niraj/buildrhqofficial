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
import ProjectGenerateSheet from '@/components/projects/project-generate-sheet'

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
        return (
            <div className="w-full py-16 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
                    <Terminal className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Registry Empty</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
                    No public projects have been deployed to the registry yet. Be the first to ship.
                </p>
                <ProjectGenerateSheet />
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