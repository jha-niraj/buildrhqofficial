"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "../../lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/ui/dialog"
import {
	Command,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@repo/ui/components/ui/command"

export interface CommandPaletteItem {
	id: string
	label: string
	description?: string
	icon?: React.ComponentType<{ className?: string }>
	keywords?: string[]
	shortcut?: string
	onSelect: () => void
}

export interface CommandPaletteGroup {
	heading?: string
	items: CommandPaletteItem[]
}

interface CommandPaletteProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	groups: CommandPaletteGroup[]
	placeholder?: string
	emptyMessage?: string
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
	<kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground">
		{children}
	</kbd>
)

/**
 * A cmdk-powered command palette in a centered dialog. cmdk handles the fuzzy
 * filtering and full keyboard model for free: Up/Down move the selection, Enter
 * fires the selected item's onSelect, and Esc closes the dialog.
 */
export function CommandPalette({
	open,
	onOpenChange,
	groups,
	placeholder = "Search pages, and features...",
	emptyMessage = "No results found.",
}: CommandPaletteProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="overflow-hidden p-0 shadow-2xl sm:max-w-[640px] [&>button]:hidden"
				onOpenAutoFocus={(e) => {
					// Let cmdk's input take focus instead of the first focusable node.
					e.preventDefault()
				}}
			>
				<DialogTitle className="sr-only">Search</DialogTitle>
				<Command
					className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
					loop
				>
					<div className="flex items-center border-b px-3">
						<Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
						<CommandPrimitive.Input
							placeholder={placeholder}
							className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
						/>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="ml-2 shrink-0 cursor-pointer rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
						>
							Esc
						</button>
					</div>
					<CommandList className="max-h-[min(420px,60vh)] overflow-y-auto overflow-x-hidden px-2 py-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
						<CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
							{emptyMessage}
						</CommandEmpty>
						{groups.map((group, gi) => (
							<CommandGroup key={group.heading ?? gi} heading={group.heading}>
								{group.items.map((item) => (
									<CommandItem
										key={item.id}
										value={`${item.label} ${(item.keywords ?? []).join(" ")}`}
										onSelect={() => {
											onOpenChange(false)
											item.onSelect()
										}}
										className="cursor-pointer gap-2.5 rounded-lg px-3 py-2.5 data-[selected=true]:bg-accent"
									>
										{item.icon && <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
										<span className="flex-1 truncate">
											{item.label}
											{item.description && (
												<span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
											)}
										</span>
										{item.shortcut && (
											<span className="ml-auto text-xs tracking-widest text-muted-foreground">{item.shortcut}</span>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
					<div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<Kbd>&uarr;</Kbd>
							<Kbd>&darr;</Kbd>
							to navigate
						</span>
						<span className="flex items-center gap-1.5">
							<Kbd>&crarr;</Kbd>
							to select
						</span>
						<span className="ml-auto flex items-center gap-1.5">
							<Kbd>esc</Kbd>
							to close
						</span>
					</div>
				</Command>
			</DialogContent>
		</Dialog>
	)
}

/**
 * The sidebar entry point: a button styled like a search input. Clicking it
 * opens the command palette. Shows a mac/win-aware shortcut hint when expanded,
 * or just the icon when the sidebar is collapsed.
 */
export function SidebarSearchButton({
	onClick,
	collapsed = false,
	placeholder = "Quick search...",
	className,
}: {
	onClick: () => void
	collapsed?: boolean
	placeholder?: string
	className?: string
}) {
	const [isMac, setIsMac] = React.useState(true)
	React.useEffect(() => {
		setIsMac(/Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent))
	}, [])

	if (collapsed) {
		return (
			<button
				type="button"
				onClick={onClick}
				title="Search"
				aria-label="Open search"
				className={cn(
					"flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition-colors hover:text-foreground",
					className,
				)}
			>
				<Search className="h-4 w-4" />
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Open search"
			className={cn(
				"group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			<Search className="h-3.5 w-3.5 shrink-0" />
			{/* `truncate`, because `collapsed` flips the instant the toggle is clicked while
			    the rail's width animates over 300ms. For those 300ms this expanded button is
			    laid out inside a 90px container, and without a nowrap the placeholder wrapped
			    onto two lines and the whole header jumped. Truncating means it clips and
			    slides into view instead - no timing logic, nothing to keep in sync. */}
			<span className="flex-1 truncate text-left">{placeholder}</span>
			<kbd className="pointer-events-none hidden shrink-0 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-sans text-[11px] font-medium text-muted-foreground sm:inline-flex">
				{isMac ? "⌘" : "Ctrl"}K
			</kbd>
		</button>
	)
}

/**
 * Registers a global Cmd/Ctrl+K listener that toggles the palette open.
 */
export function useCommandPaletteShortcut(setOpen: (updater: (v: boolean) => boolean) => void) {
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((v) => !v)
			}
		}
		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [setOpen])
}
