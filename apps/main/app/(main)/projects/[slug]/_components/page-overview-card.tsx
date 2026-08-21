'use client'

import { useState } from 'react'
import {
    Clock, Code2, CheckCircle2, Target, Layers, Users
} from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { 
    Card, CardContent, CardHeader, CardTitle 
} from '@repo/ui/components/ui/card'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@repo/ui/components/ui/sheet'
import { ProjectV2Page } from '@/types/project'

// ============================================================================
// Page Overview Card Component with Bottom Sheet
// ============================================================================

interface PageOverviewCardProps {
    page: ProjectV2Page
    difficultyColors: Record<string, string>
}

export function PageOverviewCard({ page, difficultyColors }: PageOverviewCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    return (
        <>
            <Card
                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setIsSheetOpen(true)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-white text-xs font-bold">
                                {page.orderIndex !== undefined ? page.orderIndex + 1 : '#'}
                            </div>
                            <CardTitle className="text-base group-hover:text-neutral-800 dark:group-hover:text-neutral-100 transition-colors">{page.name}</CardTitle>
                        </div>
                        <Badge className={difficultyColors[page.difficulty as keyof typeof difficultyColors] || ''}>
                            {page.difficulty}
                        </Badge>
                    </div>
                    {
                        page.route && (
                            <code className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded mt-1 inline-block">
                                {page.route}
                            </code>
                        )
                    }
                </CardHeader>
                <CardContent className="pt-0">
                    {
                        page.purpose && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                                {page.purpose}
                            </p>
                        )
                    }
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{page.coreFeatures?.length || 0} features</span>
                        <span>{page.recommendedComponents?.length || 0} components</span>
                        {page.estimatedTime && <span>{page.estimatedTime}</span>}
                    </div>
                </CardContent>
            </Card>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="bottom" className="h-[90vh] w-full overflow-y-auto">
                    <SheetHeader className="max-w-7xl mx-auto text-left pb-6 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-white text-lg font-bold">
                                {page.orderIndex !== undefined ? page.orderIndex + 1 : '#'}
                            </div>
                            <div>
                                <SheetTitle className="text-xl">{page.name}</SheetTitle>
                                {
                                    page.route && (
                                        <code className="text-sm text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/30 px-2 py-0.5 rounded">
                                            {page.route}
                                        </code>
                                    )
                                }
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge className={difficultyColors[page.difficulty as keyof typeof difficultyColors] || ''}>
                                {page.difficulty}
                            </Badge>
                            {
                                page.estimatedTime && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {page.estimatedTime}
                                    </Badge>
                                )
                            }
                        </div>
                    </SheetHeader>
                    <div className="max-w-7xl mx-auto py-6 space-y-6">
                        {
                            page.purpose && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Purpose
                                    </h4>
                                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {page.purpose}
                                    </p>
                                </div>
                            )
                        }
                        {
                            page.layout && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Layout
                                    </h4>
                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                                        <Badge variant="secondary" className="mb-3">
                                            {page.layout.type || 'Standard'}
                                        </Badge>
                                        {
                                            page.layout.sections && page.layout.sections.length > 0 && (
                                                <div className="space-y-2">
                                                    {
                                                        page.layout.sections.map((section, idx: number) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="text-neutral-700 dark:text-neutral-300">{section.name}</span>
                                                                <span className="text-neutral-500 dark:text-neutral-400 text-xs">{section.purpose}</span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        }
                        {
                            page.coreFeatures && page.coreFeatures.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Core Features
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {
                                            page.coreFeatures.map((feature: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                                    <CheckCircle2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200 flex-shrink-0 mt-0.5" />
                                                    {feature}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                        {
                            page.components && page.components.length > 0 ? (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                                        <Code2 className="w-4 h-4" />
                                        Components to Build
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {
                                            page.components.map((comp, idx: number) => (
                                                <div key={idx} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-neutral-900 dark:text-white text-sm">{comp.name}</span>
                                                        <Badge variant="outline" className="text-xs">{comp.type}</Badge>
                                                    </div>
                                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">{comp.description}</p>
                                                    {
                                                        comp.interactivity && comp.interactivity.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {
                                                                    comp.interactivity.map((action: string, aIdx: number) => (
                                                                        <span key={aIdx} className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800/30 text-neutral-700 dark:text-neutral-100 rounded">
                                                                            {action}
                                                                        </span>
                                                                    ))
                                                                }
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            ) : page.recommendedComponents && page.recommendedComponents.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <Code2 className="w-4 h-4" />
                                        Recommended Components
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {
                                            page.recommendedComponents.map((comp: string, idx: number) => (
                                                <Badge key={idx} variant="outline">{comp}</Badge>
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }
                        {
                            page.userInteractions && page.userInteractions.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        User Interactions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {
                                            page.userInteractions.map((interaction: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {interaction}
                                                </Badge>
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }
                        {
                            page.dataNeeded && page.dataNeeded.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                        <Layers className="w-4 h-4" />
                                        Data Requirements
                                    </h4>
                                    <ul className="space-y-1">
                                        {
                                            page.dataNeeded.map((data: string, idx: number) => (
                                                <li key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                                                    {data}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                    </div>
                    <SheetFooter className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    )
}
