import { VoiceSidebar } from './_components/voice-sidebar'
import { Suspense } from 'react'

export default function VoiceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Top nav - same on all screen sizes */}
            <Suspense fallback={<div className="h-14 border-b border-neutral-200 dark:border-neutral-800" />}>
                <VoiceSidebar />
            </Suspense>
            <main className="flex-1">
                {children}
            </main>
        </div>
    )
}