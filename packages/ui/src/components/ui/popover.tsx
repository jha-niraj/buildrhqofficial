"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * ── `portal={false}` when this popover lives inside a Dialog ──
 *
 * Radix Dialog wraps its content in `react-remove-scroll` with `shards: [contentRef]` and
 * without `noIsolation`. That library's wheel handler is explicit: for an event whose target
 * is outside the lock AND outside every shard, `shouldStop = !noIsolation`, and it calls
 * `preventDefault()`.
 *
 * A portalled popover renders to `document.body`, which is outside both. So the list inside
 * it paints a scrollbar, reports the right `scrollHeight`, responds to the keyboard - and
 * ignores the wheel completely, because the wheel event is being cancelled before it reaches
 * the element. That is the whole bug behind "the dropdown has a scrollbar but will not
 * scroll", and no amount of `overflow-auto` on the list can fix it.
 *
 * Rendering in place puts the content inside the dialog's subtree, so it falls within the
 * shard and scrolls. The cost is that it is no longer immune to an ancestor's clipping, which
 * is why this is opt-in rather than the default: every popover outside a dialog is better off
 * portalled.
 */
const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { portal?: boolean }
>(({ className, align = "center", sideOffset = 4, portal = true, ...props }, ref) => {
	const content = (
		<PopoverPrimitive.Content
			ref={ref}
			align={align}
			sideOffset={sideOffset}
			className={cn(
				"z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
				className
			)}
			{...props}
		/>
	)

	return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
