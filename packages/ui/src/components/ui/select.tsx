"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

/**
 * SelectTrigger
 * Matches Tabs visual language
 */
const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			`
      flex h-11 w-full items-center justify-between cursor-pointer
      rounded-xl border
      bg-white dark:bg-neutral-900
      border-neutral-200 dark:border-neutral-700
      px-3 text-sm font-medium
      text-neutral-700 dark:text-neutral-200

      transition-colors
      hover:bg-neutral-50 dark:hover:bg-neutral-800

      focus:outline-none
      focus:ring-2
      focus:ring-ring
      focus:ring-offset-2

      disabled:cursor-not-allowed
      disabled:opacity-50
      [&>span]:line-clamp-1
      `,
			className
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Scroll buttons
 */
const SelectScrollUpButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollUpButton
		ref={ref}
		className={cn(
			"flex items-center justify-center py-1 text-neutral-500 dark:text-neutral-400",
			className
		)}
		{...props}
	>
		<ChevronUp className="h-4 w-4" />
	</SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName =
	SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollDownButton
		ref={ref}
		className={cn(
			"flex items-center justify-center py-1 text-neutral-500 dark:text-neutral-400",
			className
		)}
		{...props}
	>
		<ChevronDown className="h-4 w-4" />
	</SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName

/**
 * SelectContent
 * Matches Tabs container feel
 */
const SelectContent = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			ref={ref}
			position={position}
			className={cn(
				`
        z-50 max-h-96 overflow-hidden
        rounded-xl border
        bg-white dark:bg-neutral-900
        border-neutral-200 dark:border-neutral-700
        shadow-xl
        `,
				// Open/close animation, matching dropdown-menu and popover. This was the one
				// overlay in the set with none at all - it just appeared.
				//
				// Safe to combine with the `translate-y-1` offset below, even though Tailwind
				// v4 compiles that to the standalone `translate` property while the keyframe
				// animates `transform` (the pairing that broke DialogContent - see the note in
				// dialog.tsx). It is fine HERE because the offset is 4px, not a -50% centring:
				// the two compose to a slide that starts 4px shallower than written and still
				// ENDS exactly where the offset puts it. Nothing lands in the wrong place.
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				position === "popper" &&
				"data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
				className
			)}
			{...props}
		>
			<SelectScrollUpButton />
			{/* `sh-thin-scroll` rather than a nested ScrollArea - see the note beside that
				class in globals.css. Select manages this viewport itself, and putting a
				second scroll container inside it breaks keyboard scroll-into-view. */}
			<SelectPrimitive.Viewport
				className={cn(
					"sh-thin-scroll p-1",
					position === "popper" &&
					"min-w-[var(--radix-select-trigger-width)]"
				)}
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollDownButton />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

/**
 * SelectLabel
 */
const SelectLabel = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={cn(
			"px-2 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400",
			className
		)}
		{...props}
	/>
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

/**
 * SelectItem
 * Clean active + hover states (Tabs-like)
 */
const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			`
      relative flex w-full cursor-pointer select-none items-center
      rounded-lg py-2 pl-8 pr-2 text-sm
      text-neutral-700 dark:text-neutral-200

      focus:bg-neutral-100 dark:focus:bg-neutral-800
      data-[state=checked]:bg-neutral-200
      dark:data-[state=checked]:bg-neutral-700

      data-[disabled]:pointer-events-none
      data-[disabled]:opacity-50
      `,
			className
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-4 w-4 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<Check className="h-4 w-4 text-neutral-900 dark:text-white" />
			</SelectPrimitive.ItemIndicator>
		</span>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

/**
 * Separator
 */
const SelectSeparator = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator
		ref={ref}
		className={cn(
			"my-1 h-px bg-neutral-200 dark:bg-neutral-700",
			className
		)}
		{...props}
	/>
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
}