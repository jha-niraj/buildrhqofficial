"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

/**
 * ── The sliding indicator ──
 *
 * The active tab used to be a `data-[state=active]:bg-*` on the trigger itself, which means
 * switching tabs cross-fades one background out and another in. Two things blink and nothing
 * connects them, so the eye has no idea the two are the same object moving.
 *
 * So: one pill, positioned absolutely behind the triggers, that MOVES. That needs the active
 * trigger's box, and there is no CSS way to read a sibling's geometry - hence the measuring.
 *
 * ── Why a MutationObserver and not an onValueChange callback ──
 *
 * `Tabs` is `TabsPrimitive.Root` re-exported, so a controlled caller never tells this
 * component anything. Radix does write `data-state="active"` on the trigger, and watching for
 * that attribute means the indicator works for every caller - controlled, uncontrolled,
 * keyboard, or a programmatic value change - without any of them opting in.
 *
 * ResizeObserver covers the other half: the pill is positioned in pixels, so it has to be
 * re-measured whenever the list changes size. That happens on window resize, but also when
 * the AI rail opens and narrows the page under it, which no resize event would report.
 */
function useActiveTabIndicator() {
    const listRef = React.useRef<HTMLDivElement>(null)
    const [box, setBox] = React.useState<{ left: number; width: number } | null>(null)

    React.useEffect(() => {
        const list = listRef.current
        if (!list) return

        const measure = () => {
            const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
            if (!active) return setBox(null)
            setBox({ left: active.offsetLeft, width: active.offsetWidth })
        }

        measure()

        const mo = new MutationObserver(measure)
        mo.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true })

        const ro = new ResizeObserver(measure)
        ro.observe(list)
        // Each trigger too: a label can change width without the list doing so.
        list.querySelectorAll('[role="tab"]').forEach((el) => ro.observe(el))

        return () => {
            mo.disconnect()
            ro.disconnect()
        }
    }, [])

    return { listRef, box }
}

/**
 * TabsList
 * - Full-width, rounded, bordered container
 * - Carries the sliding active indicator
 */
const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
    const { listRef, box } = useActiveTabIndicator()

    // Merge the forwarded ref with the one the measuring needs.
    const setRefs = React.useCallback(
        (node: HTMLDivElement | null) => {
            ;(listRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === "function") ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        },
        [ref, listRef],
    )

    return (
        <TabsPrimitive.List
            ref={setRefs}
            className={cn(
                `
      relative isolate flex w-full
      rounded-xl border p-1
      bg-white dark:bg-neutral-900
      border-gray-200 dark:border-neutral-700
      `,
                className,
            )}
            {...props}
        >
            {/* The pill. `aria-hidden` and behind everything: it is the same information the
                trigger's own `data-state` already carries, so a screen reader must not meet it
                twice. Rendered only once measured, so it never flashes at 0,0 on first paint.
                Motion is disabled under `prefers-reduced-motion` - a control that slides across
                the screen is exactly what that setting is asking us not to do. */}
            {box && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-1 -z-10 rounded-lg bg-gray-200 shadow-sm transition-[transform,width] duration-300 ease-out motion-reduce:transition-none dark:bg-neutral-700"
                    style={{ width: box.width, transform: `translateX(${box.left}px)`, left: 0 }}
                />
            )}
            {children}
        </TabsPrimitive.List>
    )
})
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * TabsTrigger
 *
 * No background of its own any more - the sliding pill in `TabsList` is the active surface.
 * Only the colour transitions here, and it does so over the same 300ms the pill takes, so the
 * label brightens as the pill arrives under it rather than before or after.
 */
const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            `
      relative flex-1
      flex items-center justify-center gap-1.5
      py-2.5 rounded-lg
      text-center text-sm font-semibold
      cursor-pointer
      transition-colors duration-300
      text-gray-600 dark:text-gray-300

      hover:text-gray-900 dark:hover:text-white

      data-[state=active]:text-gray-900
      dark:data-[state=active]:text-white

      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-ring
      focus-visible:ring-offset-2

      disabled:pointer-events-none
      disabled:opacity-50
      [&>svg]:shrink-0
      `,
            className,
        )}
        {...props}
    >
        {children}
    </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * TabsContent
 *
 * Fades and lifts in on becoming active, so the panel arrives rather than blinking. Radix
 * unmounts the inactive panel by default, so there is no exit to animate - and adding one
 * would need `forceMount`, which would put every panel's content in the DOM at once. Not
 * worth it for a 150ms flourish on the way out.
 *
 * `slide-in-from-bottom-1` is safe here: nothing on this element sets a `translate` utility,
 * so there is no second translation for the keyframe to compose with. See dialog.tsx for what
 * happens when there is.
 *
 * Content styling still belongs in the page - this stays minimal.
 */
const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            `
      mt-2
      data-[state=active]:animate-in
      data-[state=active]:fade-in-0
      data-[state=active]:slide-in-from-bottom-1
      data-[state=active]:duration-300
      motion-reduce:animate-none
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-ring
      focus-visible:ring-offset-2
      `,
            className,
        )}
        {...props}
    />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
