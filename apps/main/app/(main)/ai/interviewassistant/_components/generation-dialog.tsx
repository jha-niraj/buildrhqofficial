"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { 
    Card, CardContent, CardHeader, CardTitle 
} from "@repo/ui/components/ui/card"
import { Slider } from "@repo/ui/components/ui/slider"
import { Switch } from "@repo/ui/components/ui/switch"
import { Label } from "@repo/ui/components/ui/label"
import { 
    Sparkles, Code, CreditCard, Zap, Calculator, AlertCircle,
    Lightbulb, Brain, Users
} from "lucide-react"

interface GenerationDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (includeAnswers: boolean, counts: QuestionCounts) => void
    userCredits: number
}

interface QuestionCounts {
    technical: number
    behavioral: number
    coding: number
}

export function GenerationDialog({ open, onClose, onConfirm, userCredits }: GenerationDialogProps) {
    const [includeAnswers, setIncludeAnswers] = useState(false)
    const [counts, setCounts] = useState<QuestionCounts>({
        technical: 8,
        behavioral: 8,
        coding: 3
    })

    // Credit calculation based on Sarvam API pricing
    const calculateCredits = () => {
        const totalQuestions = counts.technical + counts.behavioral + counts.coding
        
        // Base cost calculation:
        // - 1 credit per question for generation
        // - 2 additional credits per question if answers are included
        const baseCredits = totalQuestions
        const answerCredits = includeAnswers ? totalQuestions * 2 : 0
        
        return baseCredits + answerCredits
    }

    const totalCredits = calculateCredits()
    const canAfford = userCredits >= totalCredits
    const totalQuestions = counts.technical + counts.behavioral + counts.coding

    const handleConfirm = () => {
        if (canAfford) {
            onConfirm(includeAnswers, counts)
        }
    }

    const questionTypes = [
        {
            type: 'technical',
            icon: Brain,
            title: 'Technical Questions',
            description: 'Role-specific technical knowledge',
            color: 'from-neutral-900 to-neutral-800',
            bgColor: 'bg-neutral-50 dark:bg-neutral-800/20',
            borderColor: 'border-neutral-200 dark:border-neutral-800',
            min: 3,
            max: 15,
            value: counts.technical
        },
        {
            type: 'behavioral',
            icon: Users,
            title: 'Behavioral Questions',
            description: 'Soft skills and cultural fit',
            color: 'from-neutral-900 to-neutral-800',
            bgColor: 'bg-neutral-50 dark:bg-neutral-800/20',
            borderColor: 'border-neutral-200 dark:border-neutral-800',
            min: 3,
            max: 15,
            value: counts.behavioral
        },
        {
            type: 'coding',
            icon: Code,
            title: 'Coding Challenges',
            description: 'Algorithm and problem solving',
            color: 'from-neutral-900 to-neutral-800',
            bgColor: 'bg-neutral-50 dark:bg-neutral-800/20',
            borderColor: 'border-neutral-200 dark:border-neutral-800',
            min: 1,
            max: 8,
            value: counts.coding
        }
    ]

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                                Customize Your Interview Questions
                            </DialogTitle>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Choose how many questions you want for each category
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-8">
                    {/* Question Count Selection */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {questionTypes.map((questionType) => (
                            <motion.div
                                key={questionType.type}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className={`${questionType.bgColor} ${questionType.borderColor} border-2 shadow-lg hover:shadow-xl transition-all`}>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3">
                                            <div className={`p-2 bg-gradient-to-br ${questionType.color} rounded-lg shadow-lg`}>
                                                <questionType.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {questionType.title}
                                                </div>
                                                <div className="text-sm font-normal text-slate-600 dark:text-slate-400">
                                                    {questionType.description}
                                                </div>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Questions: {questionType.value}
                                            </Label>
                                            <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                                                {questionType.min}-{questionType.max}
                                            </Badge>
                                        </div>
                                        <Slider
                                            value={[questionType.value]}
                                            onValueChange={(value) => 
                                                setCounts(prev => ({
                                                    ...prev,
                                                    [questionType.type]: value[0]
                                                }))
                                            }
                                            min={questionType.min}
                                            max={questionType.max}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span>{questionType.min}</span>
                                            <span>{questionType.max}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Include Answers Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border-neutral-200 dark:border-neutral-800 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl shadow-lg">
                                            <Lightbulb className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Include Detailed Answers
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                Get comprehensive answers, explanations, and tips for each question
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100">
                                            +{totalQuestions * 2} credits
                                        </Badge>
                        <Switch
                            checked={includeAnswers}
                            onCheckedChange={setIncludeAnswers}
                                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-neutral-900 data-[state=checked]:to-neutral-800"
                        />
                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Cost Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 border-slate-200 dark:border-slate-700 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg shadow-lg">
                                            <Calculator className="h-5 w-5 text-white" />
                            </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Cost Summary
                                        </h3>
                        </div>
                                    <Badge 
                                        className={`text-lg px-4 py-2 ${
                                            canAfford 
                                                ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100' 
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}
                                    >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {totalCredits} Credits
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {totalQuestions} questions × 1 credit
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {totalQuestions} credits
                                        </span>
                                    </div>
                                    
                                    {includeAnswers && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {totalQuestions} answers × 2 credits
                                            </span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {totalQuestions * 2} credits
                                            </span>
                            </div>
                        )}

                                    <hr className="border-slate-200 dark:border-slate-600" />
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            Your Credits
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {userCredits} credits
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            After Generation
                                        </span>
                                        <span className={`font-bold ${
                                            canAfford 
                                                ? 'text-neutral-800 dark:text-neutral-100' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {userCredits - totalCredits} credits
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Warning for insufficient credits */}
                    {!canAfford && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <h4 className="font-semibold text-red-800 dark:text-red-300">
                                                Insufficient Credits
                                            </h4>
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                You need {totalCredits - userCredits} more credits to generate these questions.
                                            </p>
                            </div>
                        </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-12 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!canAfford}
                            className={`flex-1 h-12 font-bold ${
                                canAfford
                                    ? 'bg-gradient-to-r from-neutral-800 via-neutral-800 to-neutral-800 hover:from-neutral-700 hover:via-neutral-700 hover:to-neutral-700 shadow-lg hover:shadow-xl'
                                    : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
                            } transition-all`}
                        >
                            <Zap className="mr-2 h-5 w-5" />
                            Generate {totalQuestions} Questions
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 