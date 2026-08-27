"use client"

import { 
    SidebarProvider, useSidebar 
} from "@/components/navigation/sidebarprovider"
import { HiringSidebar } from "@/components/navigation/sidebar"
import { cn } from "@repo/ui/lib/utils"
import { useSession } from "@repo/auth/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { 
    Loader2 
} from "lucide-react"
import Script from "next/script"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"

function HiringLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { data: session, isPending } = useSession()
    const router = useRouter()

    // Redirect to signin if not authenticated
    useEffect(() => {
        if (!session && !isPending) {
            router.push("/signin")
        }
    }, [session, isPending, router])

    // Redirect to onboarding if not completed
    useEffect(() => {
        if (session && !isPending) {
            const user = session.user as { onboardingCompleted?: boolean }
            if (!user.onboardingCompleted) {
                router.push("/onboarding")
            }
        }
    }, [session, isPending, router])

    if (isPending) {
        return (
            <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    <p className="text-sm text-neutral-500 font-mono">Initializing workspace...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        // `dvh`, not `vh`. On a mobile browser `100vh` is the viewport with the
        // chrome COLLAPSED, which is taller than what is actually visible - so a
        // shell bound at 100vh runs off the bottom of the screen whenever the URL
        // bar is showing, taking the last thing on the page with it. On a list
        // screen that is the pagination.
        //
        // Unlike apps/main and apps/admin, this app publishes no `--page-h` and
        // sets no `data-app-page`, so the `globals.css` rule that retargets the
        // screen-height utilities at that variable does not apply here - these
        // values are literal. See plan/responsiveness/tasks.md RSP-1 and RSP-6.
        <div className="h-dvh overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            <HiringSidebar />
            <main
                className={cn(
                    "h-dvh transition-all duration-300",
                    "lg:ml-[17rem] p-3",
                    isCollapsed && "lg:ml-[106px]"
                )}
            >
                <div className="h-full bg-white dark:bg-neutral-950 lg:rounded-3xl lg:border-l border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                    {/* `reflow` + `min-w-0`: Radix wraps a ScrollArea's viewport children
                        in a `min-width:100%; display:table` box, and `display:table` is
                        shrink-to-fit - it sizes to its content's max-content width. Without
                        the pin, ONE nowrap descendant anywhere in this app widens the whole
                        page body, and because the viewport clips overflow-x, everything to
                        the right is cut off rather than scrolled. The symptom reads as the
                        page being "zoomed in", not as it being narrow. RSP-2. */}
                    <ScrollArea reflow className="h-full w-full min-w-0">
                        {children}
                    </ScrollArea>
                </div>
            </main>
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* Razorpay Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
            <SidebarProvider>
                <HiringLayoutContent>{children}</HiringLayoutContent>
            </SidebarProvider>
        </>
    )
}
