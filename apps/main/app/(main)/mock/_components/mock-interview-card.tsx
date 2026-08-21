'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@repo/ui/components/ui/badge'
import { Button } from '@repo/ui/components/ui/button'
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@repo/ui/components/ui/card'
import {
    Clock, Users, Star, Sparkles, Brain, TrendingUp, Lock, Globe, Shield
} from 'lucide-react'

interface MockInterviewCardProps {
    mock: MockData
    onStart?: (mockId: string) => void
    variant?: 'default' | 'compact' | 'featured'
    showAdminBadge?: boolean
}

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
    createdBy?: {
        id?: string | null
        username?: string | null
        name?: string | null
        image?: string | null
    } | null
    popularity?: number
    totalSessions?: number
    averageRating?: number | null
    tags?: string[]
}

const levelColors = {
    'BEGINNER': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800/50',
    'INTERMEDIATE': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    'ADVANCED': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800/50',
    'EXPERT': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50',
}

const categoryIcons: Record<string, string> = {
    'TECHNICAL': '💻',
    'BEHAVIORAL': '🤝',
    'HR': '👔',
    'SYSTEM_DESIGN': '🏗️',
    'LEADERSHIP': '👑',
    'NEGOTIATION': '💰',
    'CODING': '⌨️',
    'CASE_STUDY': '📊',
    'GENERAL': '📋',
}

export function MockInterviewCard({ mock, onStart, variant = 'default', showAdminBadge }: MockInterviewCardProps) {
    const [, setIsHovered] = useState(false)

    const hasCategory = !!mock.category
    const isUserGenerated = 'isPublic' in mock && !mock.byAdmin
    const shouldShowAdminBadge = showAdminBadge || mock.byAdmin

    if (variant === 'compact') {
        return (
            <Card className="group hover:shadow-lg transition-all duration-300 border border-neutral-200 dark:border-neutral-800">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {
                                    hasCategory && mock.category && (
                                        <span className="text-xl">{categoryIcons[mock.category]}</span>
                                    )
                                }
                                <Badge className={levelColors[mock.level as keyof typeof levelColors]}>
                                    {mock.level}
                                </Badge>
                                {
                                    shouldShowAdminBadge && (
                                        <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs">
                                            <Shield className="w-3 h-3 mr-1" />
                                            Official
                                        </Badge>
                                    )
                                }
                            </div>
                            <CardTitle className="text-lg line-clamp-1">{mock.title}</CardTitle>
                        </div>
                        {
                            isUserGenerated && mock.isPublic && (
                                <Globe className="w-4 h-4 text-neutral-800 dark:text-neutral-100" />
                            )
                        }
                    </div>
                    <CardDescription className="line-clamp-2 text-sm">
                        {mock.description}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{mock.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                            <span>{mock.creditsRequired}c</span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onStart?.(mock.id)}
                        className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                    >
                        Start
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (variant === 'featured') {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="h-full"
            >
                <Card className="relative overflow-hidden h-full flex flex-col border-2 border-neutral-200 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-800/60 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-neutral-50/50 via-neutral-50/30 to-neutral-50/30 dark:from-neutral-900/20 dark:via-neutral-900/10 dark:to-neutral-900/10">
                    <div className="absolute top-0 right-0 z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-neutral-900 blur-sm"></div>
                            <div className="relative bg-gradient-to-r from-neutral-900 to-neutral-900 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl shadow-md flex items-center gap-1.5">
                                <Star className="w-3 h-3 fill-current" />
                                FEATURED
                            </div>
                        </div>
                    </div>
                    <CardHeader className="pb-5 pt-6 px-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-start gap-4">
                                {
                                    hasCategory && mock.category && (
                                        <div className="text-4xl pt-1">{categoryIcons[mock.category]}</div>
                                    )
                                }
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className={`${levelColors[mock.level as keyof typeof levelColors]} mb-1`}>
                                            {mock.level}
                                        </Badge>
                                        {
                                            shouldShowAdminBadge && (
                                                <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs mb-1">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Official
                                                </Badge>
                                            )
                                        }
                                    </div>
                                    <CardTitle className="text-xl leading-tight">{mock.title}</CardTitle>
                                </div>
                            </div>
                            {
                                mock.popularity && (
                                    <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800/30 px-3 py-1.5 rounded-full">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-semibold">{mock.popularity}%</span>
                                    </div>
                                )
                            }
                        </div>
                        <CardDescription className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                            {mock.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 px-6 pb-5">
                        {
                            mock.tags && mock.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {
                                        mock.tags?.map((tag, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-100">
                                                {tag}
                                            </Badge>
                                        ))
                                    }
                                </div>
                            )
                        }
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="flex flex-col items-center p-3 bg-white/60 dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-800/40">
                                <Clock className="w-5 h-5 text-neutral-800 dark:text-neutral-100 mb-2" />
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Duration</p>
                                <p className="font-bold text-neutral-900 dark:text-white">{mock.duration} min</p>
                            </div>
                            {
                                mock.questionsCount && (
                                    <div className="flex flex-col items-center p-3 bg-white/60 dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-800/40">
                                        <Brain className="w-5 h-5 text-neutral-800 dark:text-neutral-100 mb-2" />
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Questions</p>
                                        <p className="font-bold text-neutral-900 dark:text-white">{mock.questionsCount}</p>
                                    </div>
                                )
                            }
                            <div className="flex flex-col items-center p-3 bg-white/60 dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-800/40">
                                <Sparkles className="w-5 h-5 text-neutral-800 dark:text-neutral-100 mb-2" />
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Credits</p>
                                <p className="font-bold text-neutral-900 dark:text-white">{mock.creditsRequired}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 mt-auto">
                        <Button
                            onClick={() => onStart?.(mock.id)}
                            className="w-full bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 hover:from-neutral-800 hover:via-neutral-800 hover:to-neutral-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            size="lg"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Start Interview
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        )
    }

    // Default variant
    return (
        <motion.div
            whileHover={{ y: -4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="h-full"
        >
            <Card className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            {
                                hasCategory && mock.category && (
                                    <span className="text-2xl">{categoryIcons[mock.category]}</span>
                                )
                            }
                            <Badge className={`${levelColors[mock.level as keyof typeof levelColors]} border text-xs font-medium px-2.5 py-0.5`}>
                                {mock.level}
                            </Badge>
                            {
                                shouldShowAdminBadge && (
                                    <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-100 text-xs">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Official
                                    </Badge>
                                )
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            {
                                isUserGenerated && (
                                    <>
                                        {
                                            mock.isPublic ? (
                                                <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                                                    <Globe className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                                                </div>
                                            ) : (
                                                <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                                                    <Lock className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                                                </div>
                                            )
                                        }
                                    </>
                                )
                            }
                            {
                                mock.popularity && mock.popularity > 80 && (
                                    <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800/30 rounded">
                                        <TrendingUp className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-100" />
                                    </div>
                                )
                            }
                        </div>
                    </div>
                    <CardTitle className="text-lg text-left font-semibold text-neutral-900 dark:text-white line-clamp-1 mb-2">
                        {mock.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {mock.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-4 flex-1 space-y-3.5">
                    {
                        mock.tags && mock.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {
                                    mock.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-normal border-neutral-300 dark:border-neutral-700">
                                            {tag}
                                        </Badge>
                                    ))
                                }
                                {
                                    mock.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs font-normal border-neutral-300 dark:border-neutral-700">
                                            +{mock.tags.length - 3}
                                        </Badge>
                                    )
                                }
                            </div>
                        )
                    }
                    <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{mock.duration} min</span>
                        </div>
                        {
                            mock.questionsCount && (
                                <div className="flex items-center gap-1.5">
                                    <Brain className="w-3.5 h-3.5" />
                                    <span>{mock.questionsCount} qs</span>
                                </div>
                            )
                        }
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                            <span className="font-medium">{mock.creditsRequired}c</span>
                        </div>
                    </div>
                    {
                        isUserGenerated && mock.createdBy && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                                <Users className="w-3 h-3" />
                                <span>By <span className="font-medium text-neutral-700 dark:text-neutral-300">{mock.createdBy.name}</span></span>
                            </div>
                        )
                    }
                </CardContent>
                <CardFooter className="p-5 pt-0 mt-auto">
                    <Button
                        onClick={() => onStart?.(mock.id)}
                        className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 h-9"
                    >
                        Start Now
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}