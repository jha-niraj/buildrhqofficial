'use client'

import { AnimatedIcon, isAnimatedIconName, type AnimatedIconName } from '@repo/ui/components/animated-icons'

/**
 * A pathfinder group's icon.
 *
 * `pathfinder_group.emoji` is a text column that used to hold a literal emoji
 * character. It now holds an ANIMATED ICON NAME instead - "target", "rocket" -
 * and this component renders either, because the column is full of old emoji
 * values that must keep working.
 *
 * The column was NOT renamed. Renaming it is a migration plus every read site,
 * for a field whose meaning is "the group's icon" either way. The name is
 * slightly wrong; the alternative is churn.
 */

/** What the picker offers, in order. */
export const GROUP_ICONS: AnimatedIconName[] = [
    'learning', 'target', 'code', 'rocket', 'database',
    'ai-ml', 'sparkle', 'trophy', 'document', 'frontend',
]

export const DEFAULT_GROUP_ICON: AnimatedIconName = 'learning'

export function GroupIcon({
    value,
    size = 18,
    motion = 'hover',
    className,
}: {
    value?: string | null
    size?: number
    motion?: 'hover' | 'always' | 'none'
    className?: string
}) {
    // A known icon name renders as a drawn icon.
    if (isAnimatedIconName(value)) {
        return <AnimatedIcon name={value} size={size} motion={motion} className={className} />
    }
    // Anything else is a legacy emoji. Rendered as text at the requested size so
    // old groups do not become blank squares.
    if (value) {
        return (
            <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>
                {value}
            </span>
        )
    }
    return <AnimatedIcon name={DEFAULT_GROUP_ICON} size={size} motion={motion} className={className} />
}
