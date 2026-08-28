"use client";

import { useState, useEffect } from "react";
import {
	FileText, FileQuestion, Code, Image as ImageIcon, Video, FileCode, 
	Rocket, Mic, StickyNote, Layers, Send, ChevronDown, 
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { 
	generateExplanation, generateQuiz, generateFlashcards,
	generateVideos, generateDocuments
} from "@/actions/(main)/studios/ai-generation.actions";
import { saveStep } from "@/actions/(main)/studios/studio.actions";
import toast from "@repo/ui/components/ui/sonner";
import type { StudioStepType, StudioStep } from "@/types/studios";
import { useStudioStore } from "@/app/store/studioStore";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface AIInputPanelProps {
	studioId: string;
	onContentAdded?: () => void;
	/** External prompt from text selection - will be pre-filled as EXPLANATION */
	externalPrompt?: string | null;
	/** Callback when external prompt has been consumed */
	onExternalPromptConsumed?: () => void;
}

interface ContentTypeOption {
	type: StudioStepType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	description: string;
	category: "basic" | "interactive" | "resource";
	comingSoon?: boolean;
}

const CONTENT_TYPES: ContentTypeOption[] = [
	{
		type: "EXPLANATION",
		label: "Explanation",
		icon: FileText,
		description: "AI-generated detailed explanation",
		category: "basic",
	},
	{
		type: "QUIZ",
		label: "Quiz",
		icon: FileQuestion,
		description: "Test your knowledge",
		category: "interactive",
	},
	{
		type: "CODE",
		label: "Code",
		icon: Code,
		description: "Add a code block to write and run code",
		category: "interactive",
	},
	{
		type: "NOTE",
		label: "Note",
		icon: StickyNote,
		description: "Write personal notes",
		category: "basic",
	},
	{
		type: "FLASHCARD",
		label: "Flashcards",
		icon: Layers,
		description: "AI-generated flashcards for review",
		category: "interactive",
	},
	{
		type: "IMAGE",
		label: "Image",
		icon: ImageIcon,
		description: "AI-generated image",
		category: "resource",
		comingSoon: true,
	},
	{
		type: "VIDEO",
		label: "Video",
		icon: Video,
		description: "YouTube resource",
		category: "resource",
		comingSoon: true,
	},
	{
		type: "DOCUMENT",
		label: "Document",
		icon: FileCode,
		description: "External resource",
		category: "resource",
		comingSoon: true,
	},
	{
		type: "PROJECT",
		label: "Project",
		icon: Rocket,
		description: "Project suggestions",
		category: "interactive",
		comingSoon: true,
	},
	{
		type: "MOCK_INTERVIEW",
		label: "Interview",
		icon: Mic,
		description: "Mock interview practice",
		category: "interactive",
		comingSoon: true,
	},
];

export function AIInputPanel({ studioId, onContentAdded, externalPrompt, onExternalPromptConsumed }: AIInputPanelProps) {
	const [selectedType, setSelectedType] = useState<StudioStepType>("EXPLANATION");
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	// Zustand store actions
	const addStep = useStudioStore((s) => s.addStep);
	const addPendingStep = useStudioStore((s) => s.addPendingStep);
	const removePendingStep = useStudioStore((s) => s.removePendingStep);
	const updatePendingStep = useStudioStore((s) => s.updatePendingStep);
	const storeExternalPrompt = useStudioStore((s) => s.externalPrompt);
	const setStoreExternalPrompt = useStudioStore((s) => s.setExternalPrompt);

	// Handle external prompt from text selection (prop-based)
	useEffect(() => {
		if (externalPrompt) {
			setSelectedType("EXPLANATION");
			setPrompt(externalPrompt);
			onExternalPromptConsumed?.();
		}
	}, [externalPrompt, onExternalPromptConsumed]);

	// Handle external prompt from store
	useEffect(() => {
		if (storeExternalPrompt) {
			setSelectedType("EXPLANATION");
			setPrompt(storeExternalPrompt);
			setStoreExternalPrompt(null);
		}
	}, [storeExternalPrompt, setStoreExternalPrompt]);

	const selectedOption = CONTENT_TYPES.find((t) => t.type === selectedType);

	const handleAddCodeOrNote = async () => {
		if (selectedType !== "CODE" && selectedType !== "NOTE") return;
		if (isGenerating) return;

		setIsGenerating(true);
		const pendingId = `pending_${Date.now()}`;
		addPendingStep({
			id: pendingId,
			type: selectedType,
			prompt: selectedType === "CODE" ? "Adding code block..." : "Adding note...",
			status: "generating",
			createdAt: new Date(),
		});

		try {
			const result = await saveStep({
				studioId,
				type: selectedType,
				content: selectedType === "NOTE" ? "" : "",
				metadata:
					selectedType === "NOTE"
						? { editorType: "rich" }
						: { language: "javascript", problemTitle: prompt.trim() || "Code block" },
				source: "USER",
			});

			if (result.success && result.step) {
				removePendingStep(pendingId);
				addStep(result.step);
				toast.success(selectedType === "NOTE" ? "Note added!" : "Code block added!");
				setPrompt("");
				onContentAdded?.();
			} else {
				updatePendingStep(pendingId, {
					status: "error",
					errorMessage: result.error || "Failed to add",
				});
				setTimeout(() => removePendingStep(pendingId), 3000);
				toast.error(result.error || "Failed to add");
			}
		} catch (error) {
			console.error("Add error:", error);
			updatePendingStep(pendingId, {
				status: "error",
				errorMessage: "An error occurred",
			});
			setTimeout(() => removePendingStep(pendingId), 3000);
			toast.error("An error occurred");
		}
		setIsGenerating(false);
	};

	const handleGenerate = async () => {
		const option = CONTENT_TYPES.find((t) => t.type === selectedType);
		if (option?.comingSoon) {
			toast.info("This feature is coming soon!");
			return;
		}

		// For Code and Note: allow adding without prompt (adds empty step directly)
		if ((selectedType === "CODE" || selectedType === "NOTE") && !prompt.trim()) {
			await handleAddCodeOrNote();
			return;
		}

		if (!prompt.trim() || isGenerating) return;

		setIsGenerating(true);

		// Add a pending step to the store for real-time skeleton display
		const pendingId = `pending_${Date.now()}`;
		addPendingStep({
			id: pendingId,
			type: selectedType,
			prompt: prompt.trim(),
			status: "generating",
			createdAt: new Date(),
		});

		try {
			let result: { success: boolean; step?: StudioStep; error?: string };

			switch (selectedType) {
				case "EXPLANATION":
					result = await generateExplanation(studioId, prompt);
					break;

				case "QUIZ":
					result = await generateQuiz(studioId, prompt);
					break;

				case "NOTE": {
					result = await saveStep({
						studioId,
						type: "NOTE",
						content: prompt.trim(),
						metadata: { editorType: "rich" },
						source: "USER",
					});
					break;
				}

				case "CODE": {
					result = await saveStep({
						studioId,
						type: "CODE",
						content: "",
						metadata: { language: "javascript", problemTitle: prompt.trim() },
						source: "USER",
					});
					break;
				}

				case "FLASHCARD": {
					result = await generateFlashcards(studioId, prompt);
					break;
				}

				case "VIDEO": {
					result = await generateVideos(studioId, prompt.trim());
					break;
				}

				case "DOCUMENT": {
					result = await generateDocuments(studioId, prompt.trim());
					break;
				}

				default:
					toast.info("This content type is not yet implemented");
					removePendingStep(pendingId);
					setIsGenerating(false);
					return;
			}

			if (result.success && result.step) {
				removePendingStep(pendingId);
				addStep(result.step);
				toast.success(
					selectedType === "NOTE" ? "Note added!" :
					selectedType === "CODE" ? "Code block added!" :
					"Content generated successfully!"
				);
				setPrompt("");
				onContentAdded?.();
			} else {
				updatePendingStep(pendingId, {
					status: "error",
					errorMessage: result.error || "Failed to generate content",
				});
				setTimeout(() => removePendingStep(pendingId), 3000);
				toast.error(result.error || "Failed to generate content");
			}
		} catch (error) {
			console.error("Generation error:", error);
			updatePendingStep(pendingId, {
				status: "error",
				errorMessage: "An error occurred while generating content",
			});
			setTimeout(() => removePendingStep(pendingId), 3000);
			toast.error("An error occurred while generating content");
		}

		setIsGenerating(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleGenerate();
		}
	};

	return (
		// ONE ROW. This panel used to stack a "What would you like to add?"
		// label, a wrapping grid of type buttons, a "More options" toggle, a
		// 60-120px textarea and a hint line - about 200px of permanent chrome in
		// a pane whose entire job is showing the content ABOVE it.
		//
		// The type buttons became a dropdown because they are a single-choice
		// control that is already showing its answer: the trigger names the
		// selected type, so the four (or eleven) buttons were spending a whole
		// row to display state one label could carry. The per-type hint moved
		// into the dropdown items, where it is read while CHOOSING rather than
		// after the choice is already made.
		<div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
			<div className="flex w-full items-end gap-2 px-3 py-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-9 shrink-0 cursor-pointer gap-1.5 px-2.5"
							disabled={isGenerating}
						>
							{selectedOption ? (
								<selectedOption.icon className="h-3.5 w-3.5" />
							) : null}
							<span className="text-xs font-medium">{selectedOption?.label ?? "Type"}</span>
							<ChevronDown className="h-3 w-3 opacity-60" />
						</Button>
					</DropdownMenuTrigger>
					{/* Bounded and scrolled: the list is eleven entries today and
					    grows whenever a type is added, so it must not be allowed
					    to run off the top of a short pane. */}
					<DropdownMenuContent align="start" side="top" className="w-64 p-0">
						<ScrollArea reflow className="max-h-72 min-w-0">
							<div className="p-1">
								{CONTENT_TYPES.map((option) => {
									const Icon = option.icon;
									const isSelected = selectedType === option.type;
									return (
										<button
											key={option.type}
											type="button"
											onClick={() => setSelectedType(option.type)}
											disabled={option.comingSoon}
											className={cn(
												"flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
												isSelected
													? "bg-neutral-100 dark:bg-neutral-800"
													: "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
												option.comingSoon
													? "cursor-not-allowed opacity-50"
													: "cursor-pointer"
											)}
										>
											<Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900 dark:text-neutral-100" />
											<span className="min-w-0 flex-1">
												<span className="flex items-center gap-1.5">
													<span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
														{option.label}
													</span>
													{option.comingSoon && (
														<span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100">
															Soon
														</span>
													)}
												</span>
												<span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
													{option.description}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="relative min-w-0 flex-1">
					<Textarea
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							selectedType === "EXPLANATION"
								? "e.g., Explain JavaScript closures with examples"
								: selectedType === "QUIZ"
									? "e.g., Create a quiz on React hooks"
									: selectedType === "NOTE"
										? "Optional: Add a title or leave empty for a blank note"
										: selectedType === "CODE"
											? "Optional: Name your code block or leave empty"
											: selectedType === "FLASHCARD"
												? "e.g., Generate flashcards on JavaScript array methods"
												: selectedType === "VIDEO"
													? "e.g., React hooks tutorial videos"
													: selectedType === "DOCUMENT"
														? "e.g., TypeScript official documentation"
														: `Ask AI to generate ${selectedOption?.label.toLowerCase()}...`
						}
						rows={1}
						className="max-h-24 min-h-[36px] resize-none rounded-lg border-neutral-200 py-2 pr-3 text-sm focus:border-neutral-900 dark:border-neutral-800 dark:focus:border-neutral-200"
						disabled={isGenerating}
					/>
				</div>

				<Button
					onClick={handleGenerate}
					disabled={
						isGenerating ||
						(!prompt.trim() && selectedType !== "CODE" && selectedType !== "NOTE")
					}
					size="icon"
					className="h-9 w-9 shrink-0 cursor-pointer rounded-lg bg-gradient-to-r from-neutral-800 to-pink-600 hover:from-neutral-700 hover:to-pink-700"
				>
					{isGenerating ? (
						<InlineLoader size="sm" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
