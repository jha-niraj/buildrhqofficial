"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	Layers, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, 
	XCircle, Trophy 
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import type { StudioStep, FlashcardMetadata } from "@/types/studios";

interface FlashcardStepProps {
	step: StudioStep;
}

interface FlashcardData {
	front: string;
	back: string;
	hint?: string;
}

export function FlashcardStep({ step }: FlashcardStepProps) {
	const metadata = (step.metadata || {}) as Partial<FlashcardMetadata>;
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
	const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());
	const [showResults, setShowResults] = useState(false);

	// Parse flashcard data from step content (stored as JSON)
	let cards: FlashcardData[] = [];
	try {
		if (step.content) {
			cards = JSON.parse(step.content);
		}
	} catch {
		// Cards not available
	}

	if (cards.length === 0) {
		return (
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
				<div className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-10 w-10 rounded-xl bg-neutral-900 flex items-center justify-center">
							<Layers className="h-5 w-5 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-neutral-900 dark:text-white">
								Flashcard Deck
							</h3>
							<p className="text-sm text-neutral-600 dark:text-neutral-400">
								{metadata.topic} • {metadata.cardCount || 0} cards
							</p>
						</div>
					</div>
					<div className="text-center py-8 text-neutral-500">
						No flashcards available yet.
					</div>
				</div>
			</motion.div>
		);
	}

	const currentCard = cards[currentIndex];
	const progress = ((knownCards.size + reviewCards.size) / cards.length) * 100;

	if (showResults) {
		const knownCount = knownCards.size;
		const reviewCount = reviewCards.size;
		const percentage = Math.round((knownCount / cards.length) * 100);

		return (
			<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8">
				<div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-50 dark:from-neutral-900/20 dark:to-neutral-900/20 p-8">
					<div className="text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", delay: 0.2 }}
							className="h-20 w-20 rounded-full bg-neutral-900 mx-auto mb-6 flex items-center justify-center"
						>
							<Trophy className="h-10 w-10 text-white" />
						</motion.div>
						<h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
							Study Complete!
						</h3>
						<p className="text-neutral-600 dark:text-neutral-400 mb-6">
							{metadata.topic}
						</p>
						<div className="flex items-center justify-center gap-8 mb-8">
							<div className="text-center">
								<p className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">{knownCount}</p>
								<p className="text-sm text-neutral-500">Known</p>
							</div>
							<div className="h-12 w-px bg-neutral-200 dark:bg-neutral-700" />
							<div className="text-center">
								<p className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">{reviewCount}</p>
								<p className="text-sm text-neutral-500">Review</p>
							</div>
							<div className="h-12 w-px bg-neutral-200 dark:bg-neutral-700" />
							<div className="text-center">
								<p className="text-3xl font-bold text-neutral-900 dark:text-white">{percentage}%</p>
								<p className="text-sm text-neutral-500">Score</p>
							</div>
						</div>
						<Button
							onClick={() => {
								setShowResults(false);
								setCurrentIndex(0);
								setIsFlipped(false);
								setKnownCards(new Set());
								setReviewCards(new Set());
							}}
							className="gap-2"
						>
							<RotateCcw className="h-4 w-4" />
							Study Again
						</Button>
					</div>
				</div>
			</motion.div>
		);
	}

	const handleKnow = () => {
		setKnownCards(prev => new Set(prev).add(currentIndex));
		goNext();
	};

	const handleReview = () => {
		setReviewCards(prev => new Set(prev).add(currentIndex));
		goNext();
	};

	const goNext = () => {
		setIsFlipped(false);
		if (currentIndex < cards.length - 1) {
			setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
		} else {
			setTimeout(() => setShowResults(true), 200);
		}
	};

	const goPrev = () => {
		if (currentIndex > 0) {
			setIsFlipped(false);
			setCurrentIndex(currentIndex - 1);
		}
	};

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
			<div className="rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800">
				<div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center">
							<Layers className="h-4 w-4 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
								{metadata.topic || "Flashcards"}
							</h3>
							<p className="text-xs text-neutral-500">
								Card {currentIndex + 1} of {cards.length}
							</p>
						</div>
					</div>
					<div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
						<motion.div
							className="h-full bg-gradient-to-r from-neutral-800 to-neutral-800 rounded-full"
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
						/>
					</div>
				</div>
				<div className="p-6 flex flex-col items-center">
					<div
						className="w-full max-w-lg aspect-[3/2] cursor-pointer perspective-1000"
						onClick={() => setIsFlipped(!isFlipped)}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={`${currentIndex}-${isFlipped}`}
								initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
								animate={{ rotateY: 0, opacity: 1 }}
								exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
								transition={{ duration: 0.3 }}
								className={`w-full h-full rounded-2xl flex items-center justify-center p-8 text-center ${isFlipped
									? "bg-gradient-to-br from-neutral-100 to-neutral-100 dark:from-neutral-900/30 dark:to-neutral-900/30"
									: "bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900"
									}`}
							>
								<div>
									<p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">
										{isFlipped ? "Answer" : "Question"}
									</p>
									<p className="text-lg font-medium text-neutral-900 dark:text-white">
										{currentCard && (isFlipped ? currentCard.back : currentCard.front)}
									</p>
									{
									!isFlipped && (
										<p className="text-xs text-neutral-400 mt-4">Click to flip</p>
									)
									}
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
					<div className="flex items-center gap-3 mt-6">
						<Button
							variant="ghost"
							size="sm"
							onClick={goPrev}
							disabled={currentIndex === 0}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>

						{
						isFlipped && (
							<>
								<Button
									size="sm"
									variant="outline"
									className="gap-2 border-neutral-800 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-100"
									onClick={handleReview}
								>
									<XCircle className="h-4 w-4" />
									Review Again
								</Button>
								<Button
									size="sm"
									className="gap-2 bg-neutral-800 hover:bg-neutral-700"
									onClick={handleKnow}
								>
									<CheckCircle className="h-4 w-4" />
									I Know It
								</Button>
							</>
						)
						}

						<Button
							variant="ghost"
							size="sm"
							onClick={goNext}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}