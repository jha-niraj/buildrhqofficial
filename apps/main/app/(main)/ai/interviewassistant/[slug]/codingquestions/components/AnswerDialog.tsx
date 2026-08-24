"use client"

import {
	Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import {
	Code2, BookOpen, Clock, Zap
} from "lucide-react"

interface AnswerContent {
	solution: string;
	explanation?: string;
	approach?: string;
	keyPoints?: string[];
	timeComplexity?: string;
	spaceComplexity?: string;
}

interface AnswerObject {
	answer?: AnswerContent;
}

interface AnswerDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	answer: AnswerObject | null
	language: string
	onMoveToEditor: () => void
}

export default function AnswerDialog({
	open,
	onOpenChange,
	answer,
	language,
	onMoveToEditor
}: AnswerDialogProps) {
	if (!answer?.answer) return null;

	const handleMoveToEditor = () => {
		onMoveToEditor();
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80dvh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
						Expert Solution
						<Badge variant="outline" className="ml-2">
							{language.charAt(0).toUpperCase() + language.slice(1)}
						</Badge>
					</DialogTitle>
					<DialogDescription>
						Here&apos;s the optimal solution with detailed explanation
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-6">
					{
						answer.answer?.explanation && (
							<div className="p-4 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
								<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-800 mb-2 flex items-center gap-2">
									<BookOpen className="h-4 w-4" />
									Explanation
								</h4>
								<p className="text-sm text-neutral-800 dark:text-neutral-700 whitespace-pre-wrap">
									{answer.answer.explanation}
								</p>
							</div>
						)
					}
					{
						answer.answer?.solution && (
							<div className="border rounded-lg overflow-hidden">
								<div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b flex items-center justify-between">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code2 className="h-4 w-4" />
										Solution Code
									</h4>
									<Button
										onClick={handleMoveToEditor}
										size="sm"
										variant="outline"
										className="text-xs h-7"
									>
										<Code2 className="h-3 w-3 mr-1" />
										Move to Editor
									</Button>
								</div>
								<div className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
									<pre className="text-sm font-mono whitespace-pre-wrap">
										<code>{answer.answer.solution}</code>
									</pre>
								</div>
							</div>
						)
					}
					{
						answer.answer?.approach && (
							<div className="p-4 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
								<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-800 mb-2 flex items-center gap-2">
									<Zap className="h-4 w-4" />
									Approach
								</h4>
								<p className="text-sm text-neutral-800 dark:text-neutral-700 whitespace-pre-wrap">
									{answer.answer.approach}
								</p>
							</div>
						)
					}
					{
						answer.answer?.keyPoints && answer.answer.keyPoints.length > 0 && (
							<div className="p-4 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
								<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-800 mb-2">
									Key Points
								</h4>
								<ul className="text-sm text-neutral-800 dark:text-neutral-700 space-y-1">
									{
										answer.answer.keyPoints.map((point: string, index: number) => (
											<li key={index}>• {point}</li>
										))
									}
								</ul>
							</div>
						)
					}
					{
						(answer.answer?.timeComplexity || answer.answer?.spaceComplexity) && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{
									answer.answer?.timeComplexity && (
										<div className="p-3 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
											<h5 className="text-sm font-semibold text-neutral-900 dark:text-neutral-800 mb-1 flex items-center gap-2">
												<Clock className="h-4 w-4" />
												Time Complexity
											</h5>
											<p className="text-sm text-neutral-800 dark:text-neutral-700">{answer.answer.timeComplexity}</p>
										</div>
									)
								}
								{
									answer.answer?.spaceComplexity && (
										<div className="p-3 bg-neutral-50 dark:bg-neutral-800/20 rounded-lg border border-neutral-200 dark:border-neutral-800">
											<h5 className="text-sm font-semibold text-neutral-900 dark:text-neutral-800 mb-1 flex items-center gap-2">
												<Zap className="h-4 w-4" />
												Space Complexity
											</h5>
											<p className="text-sm text-neutral-800 dark:text-neutral-700">{answer.answer.spaceComplexity}</p>
										</div>
									)
								}
							</div>
						)
					}
				</div>
			</DialogContent>
		</Dialog>
	)
}
