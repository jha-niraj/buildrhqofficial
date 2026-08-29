import { Button } from "./button"
import { ReactNode } from "react"

interface EmptyStateProps {
    icon: ReactNode
    title: string
    description: string
    action?: ReactNode
    actionLabel?: string
    onAction?: () => void
}

export const EmptyState = ({
    icon,
    title,
    description,
    action,
    actionLabel,
    onAction,
}: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl shadow-sm">
            <div className="text-neutral-400 dark:text-neutral-500 mb-4">{icon}</div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{description}</p>
            {
                action ? (
                    action
                ) : actionLabel && onAction ? (
                    <Button onClick={onAction} variant="outline">
                        {actionLabel}
                    </Button>
                ) : null
            }
        </div>
    )
}