'use client'

import { useMemo } from 'react'
import Quiz from '@/components/quiz'
import type { QuizQuestion, QuizResult } from '@/components/main/quiz'
import { submitSubGoalQuiz } from '@/actions/(main)/pathfinder/subgoals.action'

interface RawQuizQuestion {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
}

interface SubGoal {
    id: string
    title: string
    aiQuizQuestions: unknown
    quizCompleted: boolean
    quizScore: number | null
}

interface SubGoalQuizProps {
    subGoal: SubGoal
    onComplete: () => void
}

function transformToQuizQuestions(raw: RawQuizQuestion[]): QuizQuestion[] {
    return raw.map((q) => ({
        id: q.id,
        text: q.question,
        type: 'single' as const,
        options: q.options.map((opt, i) => ({
            id: `opt-${i}`,
            text: opt,
            isCorrect: i === q.correctAnswer,
        })),
        explanation: q.explanation,
        correctAnswer: q.correctAnswer,
    }))
}

export function SubGoalQuiz({ subGoal, onComplete }: SubGoalQuizProps) {
    const questions = useMemo(() => {
        const raw = (subGoal.aiQuizQuestions as RawQuizQuestion[]) || []
        return transformToQuizQuestions(raw)
    }, [subGoal.aiQuizQuestions])

    if (subGoal.quizCompleted && subGoal.quizScore !== null) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800/30 flex items-center justify-center mb-4">
                    <span className="text-2xl">🎉</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Quiz Completed!</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    You scored <span className="font-bold text-neutral-800 dark:text-neutral-200">{subGoal.quizScore}%</span> on this quiz.
                </p>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                No quiz questions available.
            </div>
        )
    }

    const handleComplete = async (results: QuizResult) => {
        const raw = (subGoal.aiQuizQuestions as RawQuizQuestion[]) || []
        const answerArray = results.answers.map((a) => {
            const q = raw.find((rq) => rq.id === a.questionId)
            let selectedIndex = 0
            if (q && typeof a.selectedAnswer === 'string') {
                const idx = q.options.findIndex((_, i) => `opt-${i}` === a.selectedAnswer)
                selectedIndex = idx >= 0 ? idx : 0
            }
            return { questionId: a.questionId, selectedAnswer: selectedIndex }
        })
        const response = await submitSubGoalQuiz(subGoal.id, answerArray)
        if (response.success) onComplete()
    }

    return (
        <Quiz
            quizId={`pathfinder-subgoal-${subGoal.id}`}
            questions={questions}
            title={subGoal.title}
            mode="practice"
            showTimer={false}
            immediateResults
            allowSkip={false}
            allowPrevious
            allowQuestionNavigation
            onComplete={handleComplete}
            showProgress
            showQuestionNavigator
        />
    )
}