"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
	FileQuestion, RotateCcw, Trophy, Loader2
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import Quiz, { type QuizQuestion, type QuizResult } from "@/components/main/quiz";
import type { StudioStep, QuizMetadata } from "@/types/studios";

interface QuizStepProps {
	step: StudioStep;
	quizData?: {
		id: string;
		title: string;
		questions: Array<{
			id: string;
			question: string;
			options: string[];
			correctAnswer: number;
			explanation?: string;
		}>;
	};
}

export function QuizStep({ step, quizData }: QuizStepProps) {
	const metadata = (step.metadata || {}) as Partial<QuizMetadata>;
	const [showResult, setShowResult] = useState(false);
	const [score, setScore] = useState(0);
	const [totalQuestions, setTotalQuestions] = useState(0);

	if (!quizData) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="py-8"
			>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Loader2 className="h-12 w-12 text-neutral-400 animate-spin mb-4" />
					<p className="text-neutral-600 dark:text-neutral-400">
						Loading quiz...
					</p>
				</div>
			</motion.div>
		);
	}

	// Transform to centralized quiz format
	const transformedQuestions: QuizQuestion[] = quizData.questions.map((q) => ({
		id: q.id,
		text: q.question,
		type: "single" as const,
		options: q.options.map((opt, idx) => ({
			id: idx.toString(),
			text: opt,
			isCorrect: idx === q.correctAnswer,
		})),
		explanation: q.explanation,
		correctAnswer: q.correctAnswer,
	}));

	const handleComplete = (result: QuizResult) => {
		setScore(result.correctCount);
		setTotalQuestions(result.totalQuestions);
		setShowResult(true);
	};

	const handleRestart = () => {
		setShowResult(false);
		setScore(0);
	};

	if (showResult) {
		const percentage = Math.round((score / totalQuestions) * 100);

		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="py-8"
			>
				<div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-pink-50 dark:from-neutral-900/20 dark:to-pink-950/20 p-8">
					<div className="text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", delay: 0.2 }}
							className={cn(
								"h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center",
								percentage >= 80
									? "bg-neutral-900"
									: percentage >= 50
										? "bg-neutral-900"
										: "bg-red-500"
							)}
						>
							<Trophy className="h-10 w-10 text-white" />
						</motion.div>

						<h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
							Quiz Complete!
						</h3>
						<p className="text-neutral-600 dark:text-neutral-400 mb-6">
							{metadata.topic}
						</p>

						<div className="flex items-center justify-center gap-8 mb-8">
							<div className="text-center">
								<p className="text-4xl font-bold text-neutral-800 dark:text-neutral-100">
									{score}
								</p>
								<p className="text-sm text-neutral-500 dark:text-neutral-400">Correct</p>
							</div>
							<div className="h-16 w-px bg-neutral-200 dark:bg-neutral-700" />
							<div className="text-center">
								<p className="text-4xl font-bold text-neutral-900 dark:text-white">
									{totalQuestions}
								</p>
								<p className="text-sm text-neutral-500 dark:text-neutral-400">Total</p>
							</div>
							<div className="h-16 w-px bg-neutral-200 dark:bg-neutral-700" />
							<div className="text-center">
								<p className="text-4xl font-bold text-neutral-900 dark:text-white">
									{percentage}%
								</p>
								<p className="text-sm text-neutral-500 dark:text-neutral-400">Score</p>
							</div>
						</div>

						<Button onClick={handleRestart} className="gap-2">
							<RotateCcw className="h-4 w-4" />
							Try Again
						</Button>
					</div>
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
			<div className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
				<div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/20 border-b border-neutral-100 dark:border-neutral-800/30">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-neutral-900 flex items-center justify-center">
							<FileQuestion className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-neutral-900 dark:text-white">
								{quizData.title}
							</h3>
							<p className="text-sm text-neutral-600 dark:text-neutral-400">
								{transformedQuestions.length} questions • {metadata.difficulty}
							</p>
						</div>
					</div>
				</div>
				<div className="p-6">
					<Quiz
						quizId={quizData.id}
						questions={transformedQuestions}
						title=""
						mode="practice"
						immediateResults={true}
						allowSkip={false}
						allowHints={false}
						allowFlag={false}
						allowPrevious={false}
						allowQuestionNavigation={false}
						showTimer={false}
						showProgress={true}
						showQuestionNavigator={false}
						onComplete={handleComplete}
					/>
				</div>
			</div>
		</motion.div>
	);
}
