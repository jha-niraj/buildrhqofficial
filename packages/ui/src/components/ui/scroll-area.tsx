"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
		/** Classes for the inner viewport - the element that actually scrolls.
		 *  Needed for max-height caps (`max-h-56` on a dropdown list), which have
		 *  no effect on the Root. Optional: omit it and nothing changes. */
		viewportClassName?: string
		/** Which axes get a visible scrollbar. Defaults to vertical only, which is what
		 *  every existing call site expects. Pass "both" for horizontally scrolling
		 *  content such as a wide code block or a table. */
		orientation?: "vertical" | "both"
	}
>(({ className, children, viewportClassName, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		ref={ref}
		className={cn("relative overflow-hidden", className)}
		{...props}
	>
		<ScrollAreaPrimitive.Viewport className={cn("h-full w-full rounded-[inherit]", viewportClassName)}>
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollBar />
		{/* Horizontal too, opt-in via `orientation`.
		    Radix's Viewport is `overflow: scroll` on BOTH axes with the native bars
		    hidden, so content that overflows sideways scrolls whether or not a bar is
		    rendered - and with no bar, nothing on screen says it can. That is worse than
		    a native scrollbar, because at least the native one is visible. Rendering both
		    means a consumer gets a bar on whichever axis actually overflows; Radix hides
		    the one that does not. */}
		{orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		orientation={orientation}
		className={cn(
			"flex touch-none select-none transition-colors",
			orientation === "vertical" &&
			"h-full w-2.5 border-l border-l-transparent p-[1px]",
			orientation === "horizontal" &&
			"h-2.5 flex-col border-t border-t-transparent p-[1px]",
			className
		)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
