"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    RadioGroup, RadioGroupItem
} from "@repo/ui/components/ui/radio-group";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Button } from "@repo/ui/components/ui/button";
import { Label } from "@repo/ui/components/ui/label";
import { Progress } from "@repo/ui/components/ui/progress";
import { Badge } from "@repo/ui/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle
} from "@repo/ui/components/ui/dialog";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@repo/ui/components/ui/tooltip";
import {
    Timer, ChevronLeft, ChevronRight, AlertCircle, Flag, AlertTriangle, Clock, Lightbulb, CheckCircle, XCircle, SkipForward, RotateCcw
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import CodeEditor from "./code-editor";
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

// ==================== TYPES ====================

export interface QuizOption {
    id: string;
    text: string;
    isCorrect?: boolean;
}

export interface QuizQuestion {
    id: string;
    text: string;
    type: "single" | "multiple";
    options: QuizOption[];
    explanation?: string;
    hint?: string;
    category?: string;
    difficulty?: "EASY" | "MEDIUM" | "INTERMEDIATE" | "HARD";
    points?: number;
    codeSnippet?: string;
    codeLanguage?: string;
    correctAnswer?: number; // For index-based answer
}

export interface QuizSubmitResult {
    isCorrect: boolean;
    correctAnswer?: string | number;
    explanation?: string;
}

export interface QuizProps {
    // Basic props
    quizId: string;
    questions: QuizQuestion[];
    title?: string;

    // Timer props
    timeLimit?: number; // in seconds
    showTimer?: boolean;

    // Behavior props
    mode?: "practice" | "exam" | "assessment";
    immediateResults?: boolean; // Show results after each question
    allowSkip?: boolean;
    allowHints?: boolean;
    allowFlag?: boolean;
    allowPrevious?: boolean;
    allowQuestionNavigation?: boolean;
    autoSubmitOnTimeUp?: boolean;

    // Callbacks
    onAnswerSubmit?: (questionId: string, answer: string | string[], timeTaken: number) => Promise<QuizSubmitResult | void>;
    onComplete: (results: QuizResult) => void;
    onExit?: () => void;
    onTimerUpdate?: (timeSpent: number) => void;

    // UI props
    showProgress?: boolean;
    showQuestionNavigator?: boolean;
    className?: string;
}

export interface QuizAnswer {
    questionId: string;
    selectedAnswer: string | string[];
    isCorrect?: boolean;
    timeTaken: number;
}

export interface QuizResult {
    quizId: string;
    answers: QuizAnswer[];
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
    totalTimeTaken: number;
    flaggedQuestions: string[];
}

// Difficulty colors
const DIFFICULTY_COLORS = {
    EASY: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100",
    MEDIUM: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100",
    INTERMEDIATE: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100",
    HARD: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100",
};

// ==================== COMPONENT ====================

export default function Quiz({
    quizId,
    questions,
    title = "Quiz",
    timeLimit,
    showTimer = true,
    mode = "practice",
    immediateResults = false,
    allowSkip = true,
    allowHints = true,
    allowFlag = true,
    allowPrevious = true,
    allowQuestionNavigation = true,
    autoSubmitOnTimeUp = true,
    onAnswerSubmit,
    onComplete,
    onExit,
    onTimerUpdate,
    showProgress = true,
    showQuestionNavigator = true,
    className,
}: QuizProps) {
    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [usedHints, setUsedHints] = useState<Set<string>>(new Set());
    const [showHint, setShowHint] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<QuizSubmitResult | null>(null);

    const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
    const [questionResults, setQuestionResults] = useState<Record<string, boolean>>({});

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const answeredCount = answeredQuestions.size;

    // Initialize and load saved state
    useEffect(() => {
        if (!questions.length) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const savedData = localStorage.getItem(`quiz-${quizId}`);

        if (savedData) {
            try {
                const { answers: savedAnswers, flagged, timeSpent: savedTimeSpent, startTime, answered, results } = JSON.parse(savedData);
                setAnswers(savedAnswers || {});
                setFlaggedQuestions(new Set(flagged || []));
                setAnsweredQuestions(new Set(answered || []));
                setQuestionResults(results || {});

                if (savedTimeSpent && startTime && timeLimit) {
                    const currentTime = Date.now();
                    const additionalTime = Math.floor((currentTime - startTime) / 1000);
                    const totalTimeSpent = savedTimeSpent + additionalTime;
                    setTimeSpent(totalTimeSpent);
                    setTimeRemaining(Math.max(0, timeLimit - totalTimeSpent));
                    startTimeRef.current = currentTime - (totalTimeSpent * 1000);
                } else {
                    startTimeRef.current = Date.now();
                    if (timeLimit) setTimeRemaining(timeLimit);
                }
            } catch (error) {
                console.error("Failed to load saved data:", error);
                startTimeRef.current = Date.now();
                if (timeLimit) setTimeRemaining(timeLimit);
            }
        } else {
            startTimeRef.current = Date.now();
            if (timeLimit) setTimeRemaining(timeLimit);
        }
        setIsLoading(false);
    }, [questions, quizId, timeLimit]);

    // Save to localStorage
    const saveToLocalStorage = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            const currentTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            localStorage.setItem(`quiz-${quizId}`, JSON.stringify({
                answers,
                flagged: Array.from(flaggedQuestions),
                timeSpent: currentTimeSpent,
                startTime: Date.now(),
                answered: Array.from(answeredQuestions),
                results: questionResults,
            }));

            if (onTimerUpdate) {
                onTimerUpdate(currentTimeSpent);
            }
        }, 500);
    }, [answers, flaggedQuestions, quizId, onTimerUpdate, answeredQuestions, questionResults]);

    useEffect(() => {
        saveToLocalStorage();
    }, [answers, flaggedQuestions, saveToLocalStorage]);

    // Timer
    useEffect(() => {
        if (!showTimer || !timeLimit) return;

        timerRef.current = setInterval(() => {
            const currentTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setTimeSpent(currentTimeSpent);
            setTimeRemaining(Math.max(0, timeLimit - currentTimeSpent));

            if (currentTimeSpent >= timeLimit && autoSubmitOnTimeUp) {
                handleCompleteQuiz();
            }
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLimit, showTimer, autoSubmitOnTimeUp]);

    // Reset question timer when question changes
    useEffect(() => {
        setQuestionStartTime(Date.now());
        setShowResult(false);
        setLastResult(null);
        setShowHint(false);
    }, [currentIndex]);

    // Format time
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    // Handle single choice change - auto-submit and advance on answer selection
    const handleSingleChoiceChange = async (value: string) => {
        const qId = currentQuestion?.id || "";
        setAnswers(prev => ({ ...prev, [qId]: value }));

        if (showResult) return;

        if (onAnswerSubmit && !isSubmitting) {
            setIsSubmitting(true);
            const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
            try {
                const result = await onAnswerSubmit(qId, value, timeTaken);
                setAnsweredQuestions(prev => new Set(prev).add(qId));
                if (result && immediateResults) {
                    setLastResult(result);
                    setQuestionResults(prev => ({ ...prev, [qId]: result.isCorrect }));
                    setShowResult(true);
                } else {
                    handleNext();
                }
            } catch (err) {
                console.error("Error submitting answer:", err);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // No API callback: just advance to next question (answer already stored)
            setAnsweredQuestions(prev => new Set(prev).add(qId));
            handleNext();
        }
    };

    // Handle multiple choice change
    const handleMultipleChoiceChange = (optionId: string, checked: boolean) => {
        setAnswers(prev => {
            const currentAnswers = Array.isArray(prev[currentQuestion?.id || ""])
                ? [...(prev[currentQuestion?.id || ""] as string[])]
                : [];
            if (checked) {
                if (!currentAnswers.includes(optionId)) {
                    currentAnswers.push(optionId);
                }
            } else {
                const index = currentAnswers.indexOf(optionId);
                if (index !== -1) {
                    currentAnswers.splice(index, 1);
                }
            }
            return {
                ...prev,
                [currentQuestion?.id || ""]: currentAnswers,
            };
        });
    };

    // Flag question
    const handleFlagQuestion = () => {
        if (!allowFlag) return;
        setFlaggedQuestions(prev => {
            const next = new Set(prev);
            const questionId = currentQuestion?.id || "";
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    // Show hint
    const toggleHint = () => {
        if (!allowHints || !currentQuestion?.hint) return;
        setShowHint(prev => !prev);
        setUsedHints(prev => new Set(prev).add(currentQuestion?.id || ""));
    };

    // Submit answer for current question
    const handleSubmitAnswer = async () => {
        if (isSubmitting) return;

        const questionId = currentQuestion?.id || "";
        const answer = answers[questionId];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) return;

        setIsSubmitting(true);
        const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

        try {
            let result: QuizSubmitResult | void = undefined;

            if (onAnswerSubmit) {
                result = await onAnswerSubmit(questionId, answer, timeTaken);
            }

            setAnsweredQuestions(prev => new Set(prev).add(questionId));

            if (result && immediateResults) {
                setLastResult(result);
                setQuestionResults(prev => ({ ...prev, [questionId]: result!.isCorrect }));
                setShowResult(true);
            } else {
                handleNext();
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Skip question
    const handleSkip = () => {
        if (!allowSkip) return;
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestion?.id || ""));
        handleNext();
    };

    // Navigation
    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleCompleteQuiz();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0 && (allowPrevious || mode === "practice")) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleQuestionSelect = (index: number) => {
        if (allowQuestionNavigation || mode === "practice") {
            setCurrentIndex(index);
        }
    };

    // Complete quiz
    const handleCompleteQuiz = useCallback(() => {
        const totalTimeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        const finalAnswers: QuizAnswer[] = questions.map(q => ({
            questionId: q.id,
            selectedAnswer: answers[q.id] || (q.type === "multiple" ? [] : ""),
            isCorrect: questionResults[q.id],
            timeTaken: 0, // We track total time, not per question
        }));

        const correctAnswers = Object.values(questionResults).filter(Boolean).length;
        const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

        const result: QuizResult = {
            quizId,
            answers: finalAnswers,
            correctCount: correctAnswers,
            totalQuestions: questions.length,
            scorePercentage,
            totalTimeTaken,
            flaggedQuestions: Array.from(flaggedQuestions),
        };

        localStorage.removeItem(`quiz-${quizId}`);
        onComplete(result);
    }, [answers, flaggedQuestions, onComplete, questionResults, questions, quizId]);

    // Submit confirmation
    const handleSubmitConfirm = () => {
        setShowConfirmDialog(false);
        handleCompleteQuiz();
    };

    // Check if question is answered
    const isQuestionAnswered = (questionId: string) => {
        return answeredQuestions.has(questionId);
    };

    // Get current answer
    const getCurrentAnswer = () => {
        return answers[currentQuestion?.id || ""];
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <InlineLoader size="lg" />
            </div>
        );
    }

    // No questions state
    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No questions available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
                        {
                            currentQuestion.difficulty && (
                                <Badge className={DIFFICULTY_COLORS[currentQuestion.difficulty]}>
                                    {currentQuestion.difficulty}
                                </Badge>
                            )
                        }
                    </div>
                    <div className="flex items-center gap-4">
                        {
                            showTimer && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Time Spent: {formatTime(timeSpent)}</span>
                                </div>
                            )
                        }
                        {
                            showTimer && timeLimit && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Timer className="h-4 w-4" />
                                    <span className={timeRemaining < 300 ? "text-red-500 font-medium" : ""}>
                                        {formatTime(timeRemaining)} remaining
                                    </span>
                                </div>
                            )
                        }
                        {
                            onExit && (
                                <Button variant="ghost" size="sm" onClick={() => setShowLeaveDialog(true)}>
                                    Exit
                                </Button>
                            )
                        }
                    </div>
                </div>
                {
                    showProgress && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Question {currentIndex + 1} of {questions.length}</span>
                                <span>{answeredCount} answered</span>
                            </div>
                            <Progress value={progress} className="w-full h-2" />
                        </div>
                    )
                }
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                {currentIndex + 1}
                            </span>
                            <h3 className="text-lg font-medium text-foreground leading-relaxed">
                                {currentQuestion.text}
                            </h3>
                            {
                                currentQuestion.category && (
                                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                                        {currentQuestion.category}
                                    </span>
                                )
                            }
                            {
                                currentQuestion.points && (
                                    <span className="text-xs text-muted-foreground">
                                        {currentQuestion.points} points
                                    </span>
                                )
                            }
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {
                            allowFlag && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleFlagQuestion}
                                                className={cn(
                                                    flaggedQuestions.has(currentQuestion.id) && "text-neutral-900 dark:text-neutral-100"
                                                )}
                                            >
                                                <Flag className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Flag for review</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }
                        {
                            allowHints && currentQuestion.hint && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={toggleHint}
                                                className={cn(
                                                    usedHints.has(currentQuestion.id) && "text-neutral-900 dark:text-neutral-100"
                                                )}
                                            >
                                                <Lightbulb className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Show hint</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }
                    </div>
                </div>
                {
                    currentQuestion.codeSnippet && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                            <CodeEditor
                                code={currentQuestion.codeSnippet}
                                language={currentQuestion.codeLanguage || "javascript"}
                                readOnly={true}
                                showLanguageSelector={false}
                                showCopyButton={true}
                                showRunButton={false}
                                height="auto"
                            />
                        </div>
                    )
                }
                <AnimatePresence>
                    {
                        showHint && currentQuestion.hint && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                            >
                                <p className="text-sm text-neutral-800 dark:text-neutral-200">
                                    <strong>Hint:</strong> {currentQuestion.hint}
                                </p>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
                <div className="space-y-3">
                    {
                        currentQuestion.type === "single" ? (
                            <RadioGroup
                                value={getCurrentAnswer() as string || ""}
                                onValueChange={handleSingleChoiceChange}
                                disabled={showResult}
                            >
                                {
                                    currentQuestion.options.map((option, index) => {
                                        const letter = String.fromCharCode(65 + index);
                                        const isSelected = getCurrentAnswer() === option.id;
                                        const isCorrect = showResult && lastResult?.correctAnswer === option.id;
                                        const isWrong = showResult && isSelected && !lastResult?.isCorrect;

                                        return (
                                            <motion.div
                                                key={option.id}
                                                whileHover={{ scale: showResult ? 1 : 1.01 }}
                                                whileTap={{ scale: showResult ? 1 : 0.99 }}
                                                onClick={() => !showResult && handleSingleChoiceChange(option.id)}
                                                className={cn(
                                                    "flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer",
                                                    !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-accent",
                                                    !showResult && isSelected && "border-primary bg-primary/10",
                                                    isCorrect && "border-neutral-900 bg-neutral-50 dark:bg-neutral-800/20",
                                                    isWrong && "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                )}
                                            >
                                                <RadioGroupItem value={option.id} id={option.id} disabled={showResult} />
                                                <span className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                                    !showResult && !isSelected && "bg-muted",
                                                    !showResult && isSelected && "bg-primary text-primary-foreground",
                                                    isCorrect && "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
                                                    isWrong && "bg-red-500 text-white"
                                                )}>
                                                    {
                                                        showResult ? (
                                                            isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                                isWrong ? <XCircle className="w-5 h-5" /> : letter
                                                        ) : letter
                                                    }
                                                </span>
                                                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                                    {option.text}
                                                </Label>
                                            </motion.div>
                                        );
                                    })
                                }
                            </RadioGroup>
                        ) : (
                            <div className="space-y-3">
                                {
                                    currentQuestion.options.map((option, index) => {
                                        const letter = String.fromCharCode(65 + index);
                                        const currentAnswerArray = Array.isArray(getCurrentAnswer()) ? getCurrentAnswer() as string[] : [];
                                        const isSelected = currentAnswerArray.includes(option.id);
                                        const isCorrect = showResult && option.isCorrect;
                                        const isWrong = showResult && isSelected && !option.isCorrect;

                                        return (
                                            <motion.div
                                                key={option.id}
                                                whileHover={{ scale: showResult ? 1 : 1.01 }}
                                                whileTap={{ scale: showResult ? 1 : 0.99 }}
                                                onClick={() => !showResult && handleMultipleChoiceChange(option.id, !isSelected)}
                                                className={cn(
                                                    "flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors cursor-pointer",
                                                    !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-accent",
                                                    !showResult && isSelected && "border-primary bg-primary/10",
                                                    isCorrect && "border-neutral-900 bg-neutral-50 dark:bg-neutral-800/20",
                                                    isWrong && "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                )}
                                            >
                                                <Checkbox
                                                    id={option.id}
                                                    checked={isSelected}
                                                    onCheckedChange={(checked: boolean) => handleMultipleChoiceChange(option.id, checked)}
                                                    disabled={showResult}
                                                />
                                                <span className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                                    !showResult && !isSelected && "bg-muted",
                                                    !showResult && isSelected && "bg-primary text-primary-foreground",
                                                    isCorrect && "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
                                                    isWrong && "bg-red-500 text-white"
                                                )}>
                                                    {
                                                        showResult ? (
                                                            isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                                isWrong ? <XCircle className="w-5 h-5" /> : letter
                                                        ) : letter
                                                    }
                                                </span>
                                                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                                    {option.text}
                                                </Label>
                                            </motion.div>
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                </div>
                <AnimatePresence>
                    {
                        showResult && lastResult?.explanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={cn(
                                    "mt-4 p-4 rounded-lg border",
                                    lastResult.isCorrect
                                        ? "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-200 dark:border-neutral-800"
                                        : "bg-neutral-50 dark:bg-neutral-800/20 border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <p className="text-sm font-medium mb-1">
                                    {lastResult.isCorrect ? "🎉 Correct!" : "📚 Explanation"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {lastResult.explanation}
                                </p>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0 || (!allowPrevious && mode !== "practice")}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        {
                            allowSkip && !showResult && !isQuestionAnswered(currentQuestion.id) && (
                                <Button variant="ghost" onClick={handleSkip}>
                                    <SkipForward className="h-4 w-4 mr-2" />
                                    Skip
                                </Button>
                            )
                        }
                        {
                            !showResult ? (
                                currentIndex === questions.length - 1 ? (
                                    // Last question: single "Submit Quiz" button that saves answer and triggers completion
                                    <Button
                                        variant="default"
                                        className="bg-neutral-800 hover:bg-neutral-700"
                                        disabled={
                                            isSubmitting ||
                                            !getCurrentAnswer() ||
                                            (Array.isArray(getCurrentAnswer()) && (getCurrentAnswer() as string[]).length === 0)
                                        }
                                        onClick={async () => {
                                            await handleSubmitAnswer();
                                            setShowConfirmDialog(true);
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <InlineLoader size="sm" className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Quiz"
                                        )}
                                    </Button>
                                ) : (
                                    // Not last question: normal "Submit Answer" button
                                    <Button
                                        onClick={handleSubmitAnswer}
                                        disabled={
                                            isSubmitting ||
                                            !getCurrentAnswer() ||
                                            (Array.isArray(getCurrentAnswer()) && (getCurrentAnswer() as string[]).length === 0)
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <InlineLoader size="sm" className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Answer"
                                        )}
                                    </Button>
                                )
                            ) : (
                                <Button onClick={handleNext}>
                                    {
                                        currentIndex < questions.length - 1 ? (
                                            <>
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </>
                                        ) : (
                                            "Complete Quiz"
                                        )
                                    }
                                </Button>
                            )
                        }
                </div>
            </div>

            {/* Question Navigator Dots */}
            {
                showQuestionNavigator && (
                    <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        {
                            questions.map((q, idx) => {
                                const isAnswered = isQuestionAnswered(q.id);
                                const isCurrent = idx === currentIndex;
                                const isFlagged = flaggedQuestions.has(q.id);
                                const isCorrectResult = questionResults[q.id];

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => handleQuestionSelect(idx)}
                                        disabled={!allowQuestionNavigation && mode !== "practice"}
                                        className={cn(
                                            "w-8 h-8 rounded-full text-xs font-medium transition-all relative",
                                            !isAnswered && !isCurrent && "bg-muted hover:bg-muted/80",
                                            isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                                            isAnswered && isCorrectResult && "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
                                            isAnswered && !isCorrectResult && isCorrectResult !== undefined && "bg-red-500 text-white",
                                            isAnswered && isCorrectResult === undefined && "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900",
                                            (!allowQuestionNavigation && mode !== "practice") && "cursor-default"
                                        )}
                                    >
                                        {idx + 1}
                                        {
                                            isFlagged && (
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-neutral-900 rounded-full" />
                                            )
                                        }
                                    </button>
                                );
                            })
                        }
                    </div>
                )
            }

            {/* Submit Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Quiz?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit your quiz? You have answered {answeredCount} out of {questions.length} questions.
                            {
                                answeredCount < questions.length && (
                                    <span className="block mt-2 text-neutral-800 dark:text-neutral-200">
                                        You still have {questions.length - answeredCount} unanswered questions.
                                    </span>
                                )
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Continue Quiz
                        </Button>
                        <Button onClick={handleSubmitConfirm} className="bg-neutral-800 hover:bg-neutral-700">
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave Confirmation Dialog */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-neutral-900 dark:text-neutral-100" />
                            Leave Quiz?
                        </DialogTitle>
                        <DialogDescription>
                            Your progress will be saved and you can continue later. Time spent: {formatTime(timeSpent)}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
                            Stay
                        </Button>
                        <Button
                            onClick={() => {
                                setShowLeaveDialog(false);
                                saveToLocalStorage();
                                onExit?.();
                            }}
                            variant="destructive"
                        >
                            Save & Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
