"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Lighter than apps/main's components/common/markdown-renderer.tsx on purpose:
 * no Monaco-backed CodeEditor for fenced blocks and no mermaid diagrams. The
 * admin agent answers questions about users, credits and feedback - not code -
 * so a plain `<pre><code>` block covers everything it will ever render. Pull
 * in the heavier renderer only if a future admin tool actually returns code or
 * diagrams worth rendering specially.
 */
export function MarkdownRenderer({ content, className = "" }: { content: string; className?: string }) {
    return (
        <div className={`w-full text-left ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || "")
                        if (!match) {
                            return (
                                <code className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-700" {...props}>
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <pre className="my-3 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-950 p-3 dark:border-neutral-800">
                                <code className="font-mono text-xs text-neutral-100">{children}</code>
                            </pre>
                        )
                    },
                    a({ children, ...props }) {
                        return (
                            <a className="text-neutral-900 underline underline-offset-2 dark:text-white" target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                            </a>
                        )
                    },
                    ul({ children }) {
                        return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
                    },
                    ol({ children }) {
                        return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
                    },
                    p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>
                    },
                    table({ children }) {
                        return (
                            <div className="my-3 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
                                <table className="w-full text-sm">{children}</table>
                            </div>
                        )
                    },
                    th({ children }) {
                        return <th className="border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 text-left font-semibold dark:border-neutral-800 dark:bg-neutral-900">{children}</th>
                    },
                    td({ children }) {
                        return <td className="border-b border-neutral-100 px-3 py-1.5 dark:border-neutral-900">{children}</td>
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

export default MarkdownRenderer
