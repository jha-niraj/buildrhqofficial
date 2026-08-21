"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { cn } from "../../lib/utils"

function Collapsible({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
    return (
        <CollapsiblePrimitive.CollapsibleTrigger
            data-slot="collapsible-trigger"
            {...props}
        />
    )
}

/**
 * The content animates its height open and closed.
 *
 * `animate-collapsible-down` / `-up` come from tw-animate-css and interpolate against
 * `--radix-collapsible-content-height`, which Radix measures and sets. `overflow-hidden` is
 * required, not decorative: without it the children are painted outside the shrinking box
 * and the close reads as a jump rather than a collapse.
 *
 * A caller passing its own `className` keeps these - `cn` puts theirs last, and neither of
 * these utilities is one they are likely to be overriding.
 */
function CollapsibleContent({
    className,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
    return (
        <CollapsiblePrimitive.CollapsibleContent
            data-slot="collapsible-content"
            className={cn(
                "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
                className,
            )}
            {...props}
        />
    )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }