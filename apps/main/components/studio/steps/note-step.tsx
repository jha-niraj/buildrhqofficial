"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
	StickyNote, Save, Check, Bold, Italic, Underline, List,
	ListOrdered, Code, Quote, Heading1, Heading2, Heading3,
	Link as LinkIcon, Undo, Redo, Sparkles
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { saveStep } from "@/actions/(main)/studios/studio.actions";
import { enhanceNoteWithAI } from "@/actions/(main)/studios/ai-generation.actions";
import toast from "@repo/ui/components/ui/sonner";
import type { StudioStep } from "@/types/studios";
import { cn } from "@repo/ui/lib/utils";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface NoteStepProps {
	step: StudioStep;
	studioId: string;
}

export function NoteStep({ step, studioId }: NoteStepProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [isSaved, setIsSaved] = useState(true);
	const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
	const [isEnhancing, setIsEnhancing] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				codeBlock: {
					HTMLAttributes: {
						class: "rounded-lg bg-neutral-900 text-neutral-100 p-4 font-mono text-sm my-4",
					},
				},
				blockquote: {
					HTMLAttributes: {
						class: "border-l-4 border-neutral-800 pl-4 py-1 my-4 italic text-neutral-600 dark:text-neutral-400",
					},
				},
			}),
			UnderlineExt,
			LinkExt.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-neutral-800 dark:text-neutral-100 underline cursor-pointer",
				},
			}),
			Placeholder.configure({
				placeholder: "Write your personal notes here...",
			}),
		],
		content: step.content || "",
		editorProps: {
			attributes: {
				class: "prose prose-neutral dark:prose-invert max-w-none min-h-[200px] focus:outline-none px-4 py-3 text-sm leading-relaxed",
			},
		},
		onUpdate: ({ editor: ed }) => {
			setIsSaved(false);

			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}

			const timeout = setTimeout(() => {
				handleSave(ed.getHTML());
			}, 2000);

			setSaveTimeout(timeout);
		},
	});

	useEffect(() => {
		return () => {
			if (saveTimeout) {
				clearTimeout(saveTimeout);
			}
		};
	}, [saveTimeout]);

	const handleSave = useCallback(async (content: string) => {
		if (content === step.content) return;

		setIsSaving(true);
		const result = await saveStep({
			studioId,
			stepId: step.id,
			type: "NOTE",
			content,
			metadata: { editorType: "rich" },
			source: "USER",
		});

		setIsSaving(false);

		if (result.success) {
			setIsSaved(true);
			setTimeout(() => setIsSaved(false), 2000);
		} else {
			toast.error(result.error || "Failed to save note");
		}
	}, [step.content, step.id, studioId]);

	const handleSetLink = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);

		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	const handleAIEnhance = useCallback(async () => {
		if (!editor) return;
		const content = editor.getText();
		if (!content.trim()) {
			toast.error("Write something first, then AI can enhance it");
			return;
		}

		setIsEnhancing(true);
		try {
			const result = await enhanceNoteWithAI(content);
			if (result.success && result.enhanced) {
				editor.commands.setContent(result.enhanced);
				setIsSaved(false);
				handleSave(result.enhanced);
				toast.success("Note enhanced by AI!");
			} else {
				toast.error(result.error || "Failed to enhance note");
			}
		} catch {
			toast.error("Failed to enhance note");
		}
		setIsEnhancing(false);
	}, [editor, handleSave]);

	if (!editor) {
		return (
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
				<div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/10 p-6 animate-pulse">
					<div className="h-[200px]" />
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="py-8"
		>
			<div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/10 overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-6 pt-5 pb-3">
					<div className="flex items-center gap-2">
						<StickyNote className="h-5 w-5 text-neutral-800 dark:text-neutral-100" />
						<span className="text-sm font-medium text-neutral-900 dark:text-neutral-800">
							Personal Note
						</span>
					</div>

					<div className="flex items-center gap-2">
						{isSaving && (
							<span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
								<Save className="h-3 w-3 animate-pulse" />
								Saving...
							</span>
						)}
						{isSaved && !isSaving && (
							<motion.span
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-xs text-neutral-800 dark:text-neutral-100 flex items-center gap-1"
							>
								<Check className="h-3 w-3" />
								Saved
							</motion.span>
						)}
						{!isSaved && !isSaving && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => handleSave(editor.getHTML())}
								className="h-7 text-xs"
							>
								<Save className="h-3 w-3 mr-1" />
								Save
							</Button>
						)}
					</div>
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-1 px-6 pb-3 flex-wrap border-b border-neutral-200 dark:border-neutral-800/30">
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBold().run()}
						active={editor.isActive("bold")}
						title="Bold"
					>
						<Bold className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleItalic().run()}
						active={editor.isActive("italic")}
						title="Italic"
					>
						<Italic className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						active={editor.isActive("underline")}
						title="Underline"
					>
						<Underline className="h-3.5 w-3.5" />
					</ToolbarButton>

					<div className="w-px h-5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
						active={editor.isActive("heading", { level: 1 })}
						title="Heading 1"
					>
						<Heading1 className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						active={editor.isActive("heading", { level: 2 })}
						title="Heading 2"
					>
						<Heading2 className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
						active={editor.isActive("heading", { level: 3 })}
						title="Heading 3"
					>
						<Heading3 className="h-3.5 w-3.5" />
					</ToolbarButton>

					<div className="w-px h-5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						active={editor.isActive("bulletList")}
						title="Bullet List"
					>
						<List className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						active={editor.isActive("orderedList")}
						title="Ordered List"
					>
						<ListOrdered className="h-3.5 w-3.5" />
					</ToolbarButton>

					<div className="w-px h-5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						active={editor.isActive("codeBlock")}
						title="Code Block"
					>
						<Code className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						active={editor.isActive("blockquote")}
						title="Blockquote"
					>
						<Quote className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={handleSetLink}
						active={editor.isActive("link")}
						title="Link"
					>
						<LinkIcon className="h-3.5 w-3.5" />
					</ToolbarButton>

					<div className="w-px h-5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

					<ToolbarButton
						onClick={() => editor.chain().focus().undo().run()}
						disabled={!editor.can().undo()}
						title="Undo"
					>
						<Undo className="h-3.5 w-3.5" />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().redo().run()}
						disabled={!editor.can().redo()}
						title="Redo"
					>
						<Redo className="h-3.5 w-3.5" />
					</ToolbarButton>

					<div className="w-px h-5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

					<button
						type="button"
						onClick={handleAIEnhance}
						disabled={isEnhancing}
						title="Enhance with AI"
						className={cn(
							"flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
							isEnhancing
								? "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-700 cursor-wait"
								: "bg-gradient-to-r from-neutral-100 to-pink-100 dark:from-neutral-800/40 dark:to-pink-900/40 text-neutral-700 dark:text-neutral-100 hover:from-neutral-200 hover:to-pink-200 dark:hover:from-neutral-800/60 dark:hover:to-pink-900/60"
						)}
					>
						{isEnhancing ? (
							<InlineLoader size="sm" />
						) : (
							<Sparkles className="h-3 w-3" />
						)}
						{isEnhancing ? "Enhancing..." : "AI Enhance"}
					</button>
				</div>

				{/* Editor */}
				<div className="bg-white dark:bg-neutral-900 mx-4 mb-4 mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800/30">
					<EditorContent editor={editor} />
				</div>

				<p className="text-xs text-neutral-500 dark:text-neutral-400 px-6 pb-4">
					💡 Tip: Use the toolbar above for formatting, or type markdown shortcuts like # for headings
				</p>
			</div>
		</motion.div>
	);
}

function ToolbarButton({
	children,
	onClick,
	active,
	disabled,
	title,
}: {
	children: React.ReactNode;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				"p-1.5 rounded-md transition-colors",
				active
					? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-800"
					: "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/30",
				disabled && "opacity-40 cursor-not-allowed"
			)}
		>
			{children}
		</button>
	);
}