'use client'
import Link from "next/link";

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback, useTransition } from 'react'
import {
    LayoutGrid, List, Search, Loader2, FolderOpen, Brain,
    Target, Users
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@repo/ui/components/ui/select'
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink,
    PaginationNext, PaginationPrevious
} from '@repo/ui/components/ui/pagination'
import { useUserStore } from '@/app/store/useUserStore'
import { MockInterviewCard } from '../../_components/mock-interview-card'
import { SessionCard } from '../../_components/session-card'
import { PurchaseMockSheet } from '../../_components/purchase-mock-sheet'
import { createMockVoiceSession } from '@/actions/(main)/mockvoice/session.action'
import { MOCK_LEVELS } from '../_constants/mock-categories'
import { toast } from '@repo/ui/components/ui/sonner'
import { cn } from '@repo/ui/lib/utils'

interface MockData {
    id: string
    title: string
    description: string
    category?: string
    level: string
    duration: number
    creditsRequired: number
    questionsCount?: number
    isPublic?: boolean
    byAdmin?: boolean
    isFeatured?: boolean
    createdAt?: Date
    popularity?: number
    totalSessions?: number
    averageRating?: number | null
    tags?: string[]
    createdBy?: {
        image: string | null
        name: string | null
        username: string | null
    } | null
}

interface SessionData {
    id: string
    status: string
    createdAt: Date
    completedAt: Date | null
    duration: number | null
    creditsUsed: number
    mock: {
        id: string
        title: string
        description: string
        level: string
        category: string
        duration: number | null
        creditsRequired: number
    }
}

interface VoiceMainContentProps {
    mocks?: MockData[]
    sessions?: SessionData[]
    total?: number
    totalPages?: number
    currentPage?: number
    view: 'all-mocks' | 'my-mocks' | 'my-sessions' | 'category'
    categoryLabel?: string
}

export function VoiceMainContent({
    mocks = [],
    sessions = [],
    total = 0,
    totalPages = 1,
    currentPage = 1,
    view,
    categoryLabel
}: VoiceMainContentProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { credits } = useUserStore()

    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isPending, startTransition] = useTransition()
    const [purchaseSheetOpen, setPurchaseSheetOpen] = useState(false)
    const [selectedMock, setSelectedMock] = useState<MockData | null>(null)
    const [retakingId, setRetakingId] = useState<string | null>(null)

    // Filters (synced with URL)
    const currentSearch = searchParams.get('search') || ''
    const currentLevel = searchParams.get('level') || 'ALL'

    // Debounced Search Handler
    const handleSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }
        params.set('page', '1') // Reset page on search
        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }, [searchParams, router])

    const handleLevelChange = (level: string) => {
        const params = new URLSearchParams(searchParams)
        if (level && level !== 'ALL') {
            params.set('level', level)
        } else {
            params.delete('level')
        }
        params.set('page', '1')
        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', page.toString())
        startTransition(() => {
            router.replace(`?${params.toString()}`)
        })
    }

    // Mock Actions
    const handleStartMock = (mockId: string) => {
        const mock = mocks.find(m => m.id === mockId)
        if (mock) {
            setSelectedMock(mock)
            setPurchaseSheetOpen(true)
        }
    }

    const handleRetake = async (session: SessionData) => {
        const retakeCredits = Math.ceil((session.creditsUsed || session.mock.creditsRequired) / 2)
        if (credits < retakeCredits) {
            toast.error(`Insufficient credits. Retake costs ${retakeCredits} credits.`)
            return
        }

        setRetakingId(session.id)
        try {
            const result = await createMockVoiceSession({
                mockId: session.mock.id,
                mockType: 'custom',
                retakeCredits,
            })
            if (result.success && result.sessionId) {
                toast.success('Starting retake...')
                router.push(`/mock/voice/interview/${result.sessionId}`)
            } else {
                toast.error(result.error || 'Failed to start retake')
            }
        } catch {
            toast.error('Failed to start retake')
        } finally {
            setRetakingId(null)
        }
    }

    // Header Content based on View
    const getHeaderContent = () => {
        switch (view) {
            case 'my-sessions':
                return {
                    title: 'My Interview Sessions',
                    description: `Track your progress and review ${total} past interviews`,
                    icon: <FolderOpen className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
                }
            case 'my-mocks':
                return {
                    title: 'My Created Mocks',
                    description: `Manage your ${total} custom interview scenarios`,
                    icon: <Brain className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
                }
            case 'category':
                return {
                    title: `${categoryLabel || 'Category'} Mocks`,
                    description: `Browse ${total} interviews in ${categoryLabel}`,
                    icon: <Target className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
                }
            default:
                return {
                    title: 'All Public Interviews',
                    description: `Explore ${total} community and expert created mocks`,
                    icon: <Users className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
                }
        }
    }

    const header = getHeaderContent()

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        {header.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {header.title}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {header.description}
                        </p>
                    </div>
                </div>
                {view === 'my-sessions' && (
                    <div className="flex-shrink-0">
                        <Button variant="outline" asChild><Link href='/mock/voice'>
                            Browse Mocks
                        </Link></Button>
                    </div>
                )}
            </div>

            {
                view !== 'my-sessions' && (
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                placeholder="Search interviews..."
                                className="pl-10"
                                defaultValue={currentSearch}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Select value={currentLevel} onValueChange={handleLevelChange}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {
                                        MOCK_LEVELS.map(level => (
                                            <SelectItem key={level.value} value={level.value}>
                                                {level.label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-2.5 transition-colors",
                                        viewMode === 'grid'
                                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-2.5 transition-colors",
                                        viewMode === 'list'
                                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                            : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"
                                    )}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="min-h-[400px] relative">
                {
                    isPending && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-neutral-950/50 z-10 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )
                }

                {
                    view === 'my-sessions' ? (
                        sessions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {
                                    sessions.map((session) => (
                                        <SessionCard
                                            key={session.id}
                                            session={session}
                                            userCredits={credits}
                                            onRetake={handleRetake}
                                            retakingId={retakingId}
                                        />
                                    ))
                                }
                            </div>
                        ) : (
                            <div className="text-center py-20 text-neutral-500 dark:text-neutral-400">
                                <p>No sessions found.</p>
                            </div>
                        )
                    ) : (
                        mocks.length > 0 ? (
                            <div className={cn(
                                "grid gap-6",
                                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                            )}>
                                {
                                    mocks.map((mock) => (
                                        <MockInterviewCard
                                            key={mock.id}
                                            mock={mock}
                                            onStart={handleStartMock}
                                            showAdminBadge={mock.byAdmin}
                                            variant={viewMode === 'list' ? 'compact' : 'default'}
                                        />
                                    ))
                                }
                            </div>
                        ) : (
                            <div className="text-center py-24 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                                <div className="mb-4 bg-neutral-100 dark:bg-neutral-900 p-4 rounded-full w-fit mx-auto">
                                    <Search className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                    No mocks found
                                </h3>
                                <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
                                    We couldn&apos;t find any mocks matching your criteria. Try adjusting your filters or create a new one.
                                </p>
                                <Button asChild><Link href='/mock/voice?view=all-mocks'>
                                    Browse All Mocks
                                </Link></Button>
                            </div>
                        )
                    )
                }
            </div>

            {
                totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationLink isActive>{currentPage}</PaginationLink>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )
            }

            <PurchaseMockSheet
                isOpen={purchaseSheetOpen}
                onClose={() => setPurchaseSheetOpen(false)}
                mock={selectedMock}
                userCredits={credits}
            />
        </div>
    )
}