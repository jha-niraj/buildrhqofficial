'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Separator } from '@repo/ui/components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import {
    Mic, Target, Plus, ChevronDown, History, LayoutGrid
} from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { MOCK_CATEGORIES } from '../_constants/mock-categories'
import React, { useState } from 'react'
import { useUserStore } from '@/app/store/useUserStore'
import { CreateMockSheet } from '../../_components/create-mock-sheet'

export function VoiceSidebar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentView = searchParams.get('view')
    const currentCategory = searchParams.get('category')

    const isAllMocks = (!currentView && !currentCategory) || currentView === 'all-mocks'
    const isMySessions = currentView === 'my-sessions'
    const isMyMocks = currentView === 'my-mocks'

    const { credits } = useUserStore()
    const [createSheetOpen, setCreateSheetOpen] = useState(false)

    const activeCategoryLabel =
        MOCK_CATEGORIES.find(c => c.value === currentCategory)?.label ?? 'Browse'

    const navItems = [
        { href: '/mock/voice?view=all-mocks', active: isAllMocks, icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'All Mocks' },
        { href: '/mock/voice?view=my-sessions', active: isMySessions, icon: <History className="w-3.5 h-3.5" />, label: 'My Sessions' },
        { href: '/mock/voice?view=my-mocks', active: isMyMocks, icon: <Target className="w-3.5 h-3.5" />, label: 'My Mocks' },
    ]

    return (
        <>
            <nav className="sticky top-0 z-20 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center h-14 px-4 gap-2">

                    {/* Brand */}
                    <Link href="/mock/voice" className="flex items-center gap-2 flex-shrink-0 mr-1">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                            <Mic className="w-3.5 h-3.5 text-white dark:text-black" />
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap hidden sm:block text-neutral-900 dark:text-white">
                            AI Voice Interview
                        </span>
                    </Link>

                    <Separator orientation="vertical" className="h-5 mx-1 flex-shrink-0" />

                    {/* Primary nav tabs */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href}>
                                <button
                                    className={cn(
                                        'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                                        item.active
                                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                                    )}
                                >
                                    {item.icon}
                                    <span className="hidden sm:inline">{item.label}</span>
                                </button>
                            </Link>
                        ))}
                    </div>

                    <Separator orientation="vertical" className="h-5 mx-1 flex-shrink-0" />

                    {/* Categories dropdown - never overflows */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0',
                                    currentCategory
                                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                                )}
                            >
                                <span className="hidden sm:inline">{currentCategory ? activeCategoryLabel : 'Browse'}</span>
                                <span className="sm:hidden">Browse</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {MOCK_CATEGORIES.map(cat => (
                                <DropdownMenuItem
                                    key={cat.value}
                                    className={cn(
                                        'cursor-pointer',
                                        currentCategory === cat.value && 'font-semibold'
                                    )}
                                    onClick={() => {
                                        if (cat.value === 'ALL') {
                                            router.push('/mock/voice?view=all-mocks')
                                        } else {
                                            router.push(`/mock/voice?category=${cat.value}`)
                                        }
                                    }}
                                >
                                    <span className="mr-2">{cat.icon}</span>
                                    {cat.label}
                                    {currentCategory === cat.value && (
                                        <Badge className="ml-auto h-4 px-1 text-xs">active</Badge>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Right side: credits + create */}
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                        {/* Credits chip */}
                        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                            <span className="text-neutral-900 dark:text-neutral-100">✦</span>
                            {credits} credits
                        </div>

                        <Button
                            size="sm"
                            className="h-8 bg-neutral-900 text-white dark:bg-white dark:text-black hover:opacity-90"
                            onClick={() => setCreateSheetOpen(true)}
                        >
                            <Plus className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Create Mock</span>
                        </Button>
                    </div>
                </div>
            </nav>

            <CreateMockSheet
                open={createSheetOpen}
                onOpenChange={setCreateSheetOpen}
                userCredits={credits}
            />
        </>
    )
}
