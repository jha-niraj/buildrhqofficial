'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@repo/ui/components/ui/sheet'
import { Button } from '@repo/ui/components/ui/button'
import { Label } from '@repo/ui/components/ui/label'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Checkbox } from '@repo/ui/components/ui/checkbox'
import {
    Star, AlertCircle, CheckCircle, MessageSquare
} from 'lucide-react'
import toast from '@repo/ui/components/ui/sonner'
import { submitReview } from '@/actions/(main)/mockvoice/review.action'
import { InlineLoader } from "@repo/ui/components/ui/inline-loader"

interface ReviewSheetProps {
    isOpen: boolean
    onClose: () => void
    sessionId: string
    existingRating?: number | null
}

const ISSUE_OPTIONS = [
    { value: 'AUDIO_QUALITY', label: 'Audio Quality Issues' },
    { value: 'AI_RESPONSES', label: 'AI Gave Inappropriate Responses' },
    { value: 'TECHNICAL_ERROR', label: 'Technical Errors/Bugs' },
    { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
    { value: 'OTHER', label: 'Other Issues' }
]

export function ReviewSheet({ isOpen, onClose, sessionId, existingRating }: ReviewSheetProps) {
    const router = useRouter()
    const [rating, setRating] = useState<number>(existingRating || 0)
    const [hoveredRating, setHoveredRating] = useState<number>(0)
    const [feedback, setFeedback] = useState('')
    const [selectedIssues, setSelectedIssues] = useState<string[]>([])
    const [issueDetails, setIssueDetails] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<'rating' | 'success'>('rating')

    const handleIssueToggle = (issueValue: string) => {
        if (selectedIssues.includes(issueValue)) {
            setSelectedIssues(selectedIssues.filter(i => i !== issueValue))
        } else {
            setSelectedIssues([...selectedIssues, issueValue])
        }
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await submitReview({
                sessionId,
                rating,
                feedback: feedback.trim() || undefined,
                issues: selectedIssues.length > 0 ? selectedIssues : undefined,
                issueDetails: issueDetails.trim() || undefined
            })

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit review')
            }

            setStep('success')
            toast.success('Thank you for your feedback!')

            // Close after 2 seconds and refresh
            setTimeout(() => {
                onClose()
                setStep('rating')
                setRating(0)
                setFeedback('')
                setSelectedIssues([])
                setIssueDetails('')
                router.refresh()
            }, 2000)
        } catch (error) {
            console.error('Error submitting review:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to submit review')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                <AnimatePresence mode="wait">
                    {
                        step === 'rating' ? (
                            <motion.div
                                key="rating"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="flex items-center gap-2 text-2xl">
                                        <MessageSquare className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
                                        How was your experience?
                                    </SheetTitle>
                                    <SheetDescription>
                                        Your feedback helps us improve mock interviews for everyone
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">
                                            Rate this mock interview *
                                        </Label>
                                        <div className="flex gap-2 items-center">
                                            {
                                                [1, 2, 3, 4, 5].map((star) => (
                                                    <motion.button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoveredRating(star)}
                                                        onMouseLeave={() => setHoveredRating(0)}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star
                                                            className={`w-10 h-10 transition-colors ${star <= (hoveredRating || rating)
                                                                ? 'fill-neutral-800 dark:fill-neutral-200 text-neutral-800 dark:text-neutral-200'
                                                                : 'text-neutral-600 dark:text-neutral-700'
                                                                }`}
                                                        />
                                                    </motion.button>
                                                ))
                                            }
                                            {
                                                rating > 0 && (
                                                    <span className="ml-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                                                        {rating === 1 && 'Poor'}
                                                        {rating === 2 && 'Fair'}
                                                        {rating === 3 && 'Good'}
                                                        {rating === 4 && 'Very Good'}
                                                        {rating === 5 && 'Excellent'}
                                                    </span>
                                                )
                                            }
                                        </div>
                                    </div>

                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

                                    <div className="space-y-3">
                                        <Label htmlFor="feedback" className="text-base font-semibold">
                                            Additional Comments (Optional)
                                        </Label>
                                        <Textarea
                                            id="feedback"
                                            placeholder="Share your thoughts about the interview experience, AI responses, questions quality, etc..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                    </div>

                                    {
                                        rating > 0 && rating <= 3 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-200 dark:border-neutral-800/30 rounded-lg">
                                                    <AlertCircle className="w-5 h-5 text-neutral-800 dark:text-neutral-200 flex-shrink-0" />
                                                    <p className="text-sm text-neutral-700 dark:text-neutral-100">
                                                        We&apos;re sorry to hear that. Help us improve by selecting any issues you encountered:
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )
                                    }
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">
                                            Did you encounter any issues?
                                        </Label>
                                        <div className="space-y-3">
                                            {
                                                ISSUE_OPTIONS.map((issue) => (
                                                    <div key={issue.value} className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={issue.value}
                                                            checked={selectedIssues.includes(issue.value)}
                                                            onCheckedChange={() => handleIssueToggle(issue.value)}
                                                        />
                                                        <Label
                                                            htmlFor={issue.value}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {issue.label}
                                                        </Label>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    {
                                        selectedIssues.includes('OTHER') && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-3"
                                            >
                                                <Label htmlFor="issue-details" className="text-base font-semibold">
                                                    Please describe the issue
                                                </Label>
                                                <Textarea
                                                    id="issue-details"
                                                    placeholder="Provide details about the issue you encountered..."
                                                    value={issueDetails}
                                                    onChange={(e) => setIssueDetails(e.target.value)}
                                                    className="min-h-[80px]"
                                                />
                                            </motion.div>
                                        )
                                    }

                                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={rating === 0 || isSubmitting}
                                            className="w-full bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100"
                                            size="lg"
                                        >
                                            {
                                                isSubmitting ? (
                                                    <>
                                                        <InlineLoader size="sm" className="mr-2" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Submit Review
                                                    </>
                                                )
                                            }
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <CheckCircle className="w-20 h-20 text-neutral-800 dark:text-neutral-200 mb-6" />
                                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
                                    Thank You!
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-sm">
                                    Your feedback has been submitted successfully. We appreciate your input!
                                </p>
                            </motion.div>
                        )
                    }
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    )
}