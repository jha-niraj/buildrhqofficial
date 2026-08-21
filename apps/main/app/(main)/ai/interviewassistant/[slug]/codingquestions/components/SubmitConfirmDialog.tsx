"use client"

import {
	Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, Code2 } from "lucide-react"

interface SubmitConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isSubmitting: boolean
	code: string
	language: string
	problemTitle: string
}

export default function SubmitConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	isSubmitting,
	code,
	language,
	problemTitle
}: SubmitConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Code2 className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
						Confirm Code Submission
					</DialogTitle>
					<DialogDescription>
						You are about to submit your solution for: <strong>{problemTitle}</strong>
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<AlertTriangle className="h-5 w-5 text-neutral-800 dark:text-neutral-100 flex-shrink-0 mt-0.5" />
							<div className="text-sm">
								<p className="font-medium text-neutral-800 dark:text-neutral-700 mb-1">
									Important Notes:
								</p>
								<ul className="text-neutral-700 dark:text-neutral-100 space-y-1">
									<li>• Your solution will be evaluated and stored in your submission history</li>
									<li>• You can submit multiple times - only your best score will be shown</li>
									<li>• The evaluation will check correctness, efficiency, and code quality</li>
								</ul>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-sm">Your Code Preview</h4>
							<span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
								{language.charAt(0).toUpperCase() + language.slice(1)}
							</span>
						</div>
						<div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3 max-h-48 overflow-y-auto">
							<pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
								{code.length > 500 ? code.substring(0, 500) + "\n... (code truncated)" : code}
							</pre>
						</div>
					</div>
				</div>
				<DialogFooter className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={isSubmitting}
						className="bg-neutral-800 hover:bg-neutral-700 text-white"
					>
						{
							isSubmitting ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Submitting...
								</>
							) : (
								<>
									<Code2 className="h-4 w-4 mr-2" />
									Yes, Submit Solution
								</>
							)
						}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}