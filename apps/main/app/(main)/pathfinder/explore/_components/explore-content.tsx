'use client'

import {
    MousePointerClick, BookOpen, Brain, Code2
} from 'lucide-react'

export function ExploreContent() {
    return (
        <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
                    <MousePointerClick className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    Select a goal to preview
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    Choose a public learning goal from the sidebar to see its study plan, topics, and structure.
                    Copy any goal to your own workspace.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Topics
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" />
                        Quizzes
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Coding
                    </span>
                </div>
            </div>
        </div>
    )
}
