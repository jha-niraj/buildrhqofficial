import * as React from "react"

import { cn } from "../../lib/utils"

const Card = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"bg-white dark:bg-neutral-900 shadow-2xl rounded-xl flex flex-col justify-between h-full text-card-foreground p-4",
			className
		)}
		{...props}
	/>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-1", className)}
		{...props}
	/>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			// LEFT aligned. This carried `text-center`, and because it is the shared Card
			// every title in the app was centred - which is why "Connected Accounts" sat in
			// the middle of the settings page while the card above it looked fine (that one
			// happened to override it).
			//
			// A centred heading over left-aligned body text is a mismatch you notice without
			// being able to name, and it is wrong for a form in particular: the eye returns
			// to the left edge for every field, so the heading should start there too.
			// Cards that genuinely want centring pass `text-center` themselves.
			"text-2xl font-semibold leading-none tracking-tight",
			className
		)}
		{...props}
	/>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	// Same as CardTitle: `text-center` was baked in here too, so every label, value and
	// helper line in every card inherited it. On a settings form that put labels over the
	// middle of their own inputs.
	<div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
