import type { AnimatedIconName } from '@repo/ui/components/animated-icons'

// Mock Category and Level definitions for client components

/**
 * `icon` is a name in `@repo/ui/components/animated-icons`, not an emoji.
 *
 * These were emoji - 💻 🤝 👔 🏗️ - which render differently on every OS, cannot
 * inherit `currentColor`, and so stayed full-colour inside a dark selected row.
 * See MK-1 in plan/mock/tasks.md.
 *
 * `ALL` is a FILTER, not a category, so it takes a neutral mark rather than an
 * icon that implies a subject.
 */
export const MOCK_CATEGORIES = [
    { value: 'ALL', label: 'All Categories', icon: 'target' },
    { value: 'TECHNICAL', label: 'Technical', icon: 'code' },
    { value: 'BEHAVIORAL', label: 'Behavioral', icon: 'interview-prep' },
    { value: 'HR', label: 'HR', icon: 'document' },
    { value: 'SYSTEM_DESIGN', label: 'System Design', icon: 'system-design' },
    { value: 'LEADERSHIP', label: 'Leadership', icon: 'trophy' },
    { value: 'NEGOTIATION', label: 'Negotiation', icon: 'voice' },
    { value: 'CODING', label: 'Coding', icon: 'dsa' },
    { value: 'CASE_STUDY', label: 'Case Study', icon: 'ai-ml' },
    { value: 'GENERAL', label: 'General', icon: 'learning' },
] as const satisfies ReadonlyArray<{ value: string; label: string; icon: AnimatedIconName }>

export const MOCK_LEVELS = [
    { value: 'ALL', label: 'All Levels' },
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
] as const

export type MockCategoryValue = typeof MOCK_CATEGORIES[number]['value']
export type MockLevelValue = typeof MOCK_LEVELS[number]['value']