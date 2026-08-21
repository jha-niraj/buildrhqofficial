'use client'

import { Users, Crown } from 'lucide-react'
import { Badge } from '@repo/ui/components/ui/badge'
import {
    Avatar, AvatarFallback, AvatarImage
} from '@repo/ui/components/ui/avatar'
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@repo/ui/components/ui/tooltip'

// ============================================================================
// Types
// ============================================================================

export interface TeamMemberDisplay {
    id: string
    role: 'ADMIN' | 'MEMBER'
    user: {
        id: string
        name: string | null
        username: string | null
        image: string | null
    }
}

interface TeamMembersDisplayProps {
    members: TeamMemberDisplay[]
    maxDisplay?: number
    showLabel?: boolean
}

// ============================================================================
// Team Members Display Component
// ============================================================================

export function TeamMembersDisplay({
    members,
    maxDisplay = 5,
    showLabel = true
}: TeamMembersDisplayProps) {
    if (members.length === 0) {
        return null
    }

    const displayMembers = members.slice(0, maxDisplay)
    const remainingCount = members.length - maxDisplay
    const admins = members.filter(m => m.role === 'ADMIN')

    return (
        <div className="flex items-center gap-3">
            {showLabel && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <Users className="w-4 h-4" />
                    <span>Team</span>
                </div>
            )}
            <div className="flex items-center">
                <TooltipProvider>
                    {displayMembers.map((member, idx) => (
                        <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                                <div
                                    className="relative"
                                    style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
                                >
                                    <Avatar className="w-8 h-8 border-2 border-white dark:border-neutral-900 cursor-pointer hover:z-10 transition-transform hover:scale-110">
                                        <AvatarImage src={member.user.image || ''} />
                                        <AvatarFallback className="text-xs bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
                                            {(member.user.name ?? member.user.username ?? '?').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.role === 'ADMIN' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-900 rounded-full flex items-center justify-center">
                                            <Crown className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <span>{member.user.name || member.user.username}</span>
                                    {member.role === 'ADMIN' && (
                                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {remainingCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="relative"
                                    style={{ marginLeft: '-8px' }}
                                >
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">
                                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                            +{remainingCount}
                                        </span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{remainingCount} more team members</span>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>

            {/* Admin count badge */}
            {admins.length > 0 && (
                <Badge variant="outline" className="text-xs text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700">
                    {admins.length} {admins.length === 1 ? 'Admin' : 'Admins'}
                </Badge>
            )}
        </div>
    )
}

// ============================================================================
// Team Collaboration Badge Component
// ============================================================================

interface TeamCollaborationBadgeProps {
    memberCount: number
}

export function TeamCollaborationBadge({ memberCount }: TeamCollaborationBadgeProps) {
    if (memberCount <= 1) {
        return null
    }

    return (
        <Badge
            variant="secondary"
            className="bg-gradient-to-r from-neutral-100 to-neutral-100 dark:from-neutral-800/30 dark:to-neutral-800/30 text-neutral-700 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800"
        >
            <Users className="w-3 h-3 mr-1" />
            Team Project ({memberCount})
        </Badge>
    )
}
