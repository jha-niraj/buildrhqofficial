'use client'

import { useState } from 'react'
import { ANIMATED_ICONS, AnimatedIcon, type AnimatedIconName, type AnimatedIconMotion } from '@repo/ui/components/animated-icons'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { ScrollArea } from '@repo/ui/components/ui/scroll-area'
import { cn } from '@repo/ui/lib/utils'
import toast from '@repo/ui/components/ui/sonner'

/**
 * The icon set, on a page.
 *
 * Two jobs. It is the reference - what exists, what each one is called, what the
 * motion looks like at the size you are about to use. And it is the pressure
 * test: eleven of these animating side by side is where you find out whether a
 * motion is charming or annoying, which a single icon in a component never tells
 * you.
 */

const NAMES = Object.keys(ANIMATED_ICONS) as AnimatedIconName[]

const CATEGORY_NAMES: AnimatedIconName[] = [
    'dsa', 'web-dev', 'frontend', 'backend', 'devops',
    'ai-ml', 'database', 'system-design', 'mobile', 'interview-prep', 'learning',
]

const SIZES = [24, 32, 48] as const

export function IconGalleryClient() {
    const [query, setQuery] = useState('')
    const [motion, setMotion] = useState<AnimatedIconMotion>('hover')
    const [size, setSize] = useState<number>(32)

    const q = query.trim().toLowerCase()
    const shown = q ? NAMES.filter((n) => n.includes(q)) : NAMES

    const copy = (name: AnimatedIconName) => {
        const snippet = `<AnimatedIcon name="${name}" size={${size}} motion="${motion}" />`
        navigator.clipboard?.writeText(snippet)
        toast.success(`Copied ${name}`)
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <header className="shrink-0 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Animated icons
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
                    For places that show one big icon and mean something by it: category cards,
                    empty states, feature panels. Not sidebars, not buttons - a 16px icon that
                    moves is noise. Every icon draws in <code>currentColor</code> and stops
                    entirely under <code>prefers-reduced-motion</code>.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filter by name..."
                        className="h-9 w-56"
                    />
                    <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
                        {(['hover', 'always', 'none'] as AnimatedIconMotion[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMotion(m)}
                                className={cn(
                                    'cursor-pointer rounded-md px-2.5 py-1 text-xs capitalize transition-colors',
                                    motion === m
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
                        {SIZES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSize(s)}
                                className={cn(
                                    'cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors',
                                    size === s
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                {s}px
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {shown.length} of {NAMES.length}
                    </span>
                </div>
            </header>

            <ScrollArea reflow className="min-h-0 min-w-0 flex-1">
                <div className="space-y-8 p-6">
                    <Section
                        title="Categories"
                        note="One per pathfinder category. Read from PATHFINDER_CATEGORIES[cat].icon so every category surface stays in step."
                        names={shown.filter((n) => CATEGORY_NAMES.includes(n))}
                        size={size}
                        motion={motion}
                        onCopy={copy}
                    />
                    <Section
                        title="Display"
                        note="Empty states, results, feature panels."
                        names={shown.filter((n) => !CATEGORY_NAMES.includes(n))}
                        size={size}
                        motion={motion}
                        onCopy={copy}
                    />

                    <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Using them</h2>
                        <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-100 p-4 text-xs leading-relaxed text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
{`import { AnimatedIcon, TrophyIcon } from "@repo/ui/components/animated-icons"

// By name - for a value out of the database
<AnimatedIcon name={PATHFINDER_CATEGORIES[goal.category].icon} size={20} />

// Directly, when you know which one at author time
<TrophyIcon size={48} motion="always" className="text-neutral-900 dark:text-neutral-100" />`}
                        </pre>
                        <ul className="mt-4 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                            <li><strong className="text-neutral-900 dark:text-neutral-100">motion=&quot;hover&quot;</strong> is the default and the right one in a grid. Ten icons moving at once competes with the page.</li>
                            <li><strong className="text-neutral-900 dark:text-neutral-100">motion=&quot;always&quot;</strong> for a lone hero or empty state, where the icon is the focus.</li>
                            <li>Colour comes from <code>currentColor</code>. Set it on the wrapper and the icon follows - no <code>dark:</code> variant needed.</li>
                            <li>Hover works from an ancestor with <code>.group</code>, so the whole card is the hit area rather than the icon alone.</li>
                        </ul>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}

function Section({
    title, note, names, size, motion, onCopy,
}: {
    title: string
    note: string
    names: AnimatedIconName[]
    size: number
    motion: AnimatedIconMotion
    onCopy: (n: AnimatedIconName) => void
}) {
    if (names.length === 0) return null
    return (
        <section>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
            <p className="mt-0.5 mb-3 text-xs text-neutral-500 dark:text-neutral-400">{note}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {names.map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onCopy(name)}
                        title="Copy the JSX"
                        className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-neutral-200 p-4 text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-100"
                    >
                        <AnimatedIcon name={name} size={size} motion={motion} />
                        <span className="w-full truncate font-mono text-xs">{name}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}
