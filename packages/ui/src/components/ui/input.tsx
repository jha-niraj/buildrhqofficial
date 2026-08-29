import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
	return (
		<input
			ref={ref}
			type={type}
			className={cn(
				`
					flex h-11 w-full
					rounded-xl border
					bg-white dark:bg-neutral-900
					border-neutral-200 dark:border-neutral-700
					px-3 text-sm

					text-neutral-900 dark:text-neutral-100
					placeholder:text-neutral-400 dark:placeholder:text-neutral-500

					transition-colors
					hover:bg-neutral-50 dark:hover:bg-neutral-800

					focus:outline-none
					focus:ring-2
					focus:ring-ring
					focus:ring-offset-2

					disabled:cursor-not-allowed
					disabled:opacity-50
        		`,
				className
			)}
			{...props}
		/>
	)
})
Input.displayName = "Input"

export { Input }