"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

const Accordion = AccordionPrimitive.Root

// Every default here is a light/dark PAIR. The previous defaults -
// `bg-gray-200` on the item and `text-black` on the trigger and content - had no
// dark counterpart, so in dark mode the surface stayed light grey while any
// caller-supplied `dark:text-white` turned the label white: white on light grey,
// measured at a contrast ratio of 1.24 across all eight FAQ questions on the
// marketing pricing page.
//
// Two call sites had already worked around it locally with `dark:bg-black`,
// which is the tell that this belonged at source. Those overrides still win
// (tailwind-merge keeps the caller's class), so they keep working unchanged.
const AccordionItem = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
	<AccordionPrimitive.Item
		ref={ref}
		className={cn("rounded-2xl bg-neutral-100 dark:bg-neutral-900", className)}
		{...props}
	/>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimitive.Header className="flex">
		<AccordionPrimitive.Trigger
			ref={ref}
			className={cn(
				"flex flex-1 items-center justify-between py-2 font-semibold transition-all",
				"text-neutral-900 dark:text-white",
				"[&[data-state=open]>svg]:rotate-180",
				className
			)}
			{...props}
		>
			{children}
			<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
		</AccordionPrimitive.Trigger>
	</AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
	React.ElementRef<typeof AccordionPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<AccordionPrimitive.Content
		ref={ref}
		className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		{...props}
	>
		<div className={cn("pb-4 pt-0 text-neutral-700 dark:text-neutral-300", className)}>{children}</div>
	</AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }