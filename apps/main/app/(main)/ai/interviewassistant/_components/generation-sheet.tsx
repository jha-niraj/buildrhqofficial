"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
	Sheet, SheetContent, SheetHeader, SheetTitle 
} from "@repo/ui/components/ui/sheet"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { 
	Card, CardContent, CardHeader, CardTitle 
} from "@repo/ui/components/ui/card"
import { Slider } from "@repo/ui/components/ui/slider"
import { Switch } from "@repo/ui/components/ui/switch"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import {
	Sparkles, Code, CreditCard, Zap, Calculator, AlertCircle, 
	Lightbulb, Brain, Users, GraduationCap, Play, X, Globe, Lock
} from "lucide-react"

interface GenerationSheetProps {
	open: boolean
	onClose: () => void
	onConfirm: (includeAnswers: boolean, includePractice: boolean, counts: QuestionCounts, makePublic?: boolean) => void
	userCredits: number
}

interface QuestionCounts {
	technical: number
	behavioral: number
	coding: number
}

export function GenerationSheet({ open, onClose, onConfirm, userCredits }: GenerationSheetProps) {
	const [includeAnswers, setIncludeAnswers] = useState(false)
	const [includePractice, setIncludePractice] = useState(false)
	const [makePublic, setMakePublic] = useState(false)
	const [counts, setCounts] = useState<QuestionCounts>({
		technical: 8,
		behavioral: 8,
		coding: 3
	})

	// Credit calculation based on new pricing model
	const calculateCredits = () => {
		const totalQuestions = counts.technical + counts.behavioral + counts.coding

		// Reduced cost calculation:
		// - 1 credit per 2 questions for generation (much more affordable)
		// - 1 additional credit per 2 questions if answers are included
		// - 1 additional credit per 2 questions if practice is included
		// - 50% discount for public generations
		const baseCredits = Math.ceil(totalQuestions / 2)
		const answerCredits = includeAnswers ? Math.ceil(totalQuestions / 2) : 0
		const practiceCredits = includePractice ? Math.ceil(totalQuestions / 2) : 0
		const subtotalCredits = baseCredits + answerCredits + practiceCredits

		// Apply public discount (50% off)
		return makePublic ? Math.ceil(subtotalCredits / 2) : subtotalCredits
	}

	const totalCredits = calculateCredits()
	const canAfford = userCredits >= totalCredits
	const totalQuestions = counts.technical + counts.behavioral + counts.coding

	// Calculate original cost for comparison
	const originalCost = Math.ceil(totalQuestions / 2) + 
		(includeAnswers ? Math.ceil(totalQuestions / 2) : 0) + 
		(includePractice ? Math.ceil(totalQuestions / 2) : 0)

	const handleConfirm = () => {
		if (canAfford) {
			onConfirm(includeAnswers, includePractice, counts, makePublic)
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
		<Sheet open={open} onOpenChange={onClose}>
			<SheetContent
				className="w-full h-full sm:w-[80vw] md:w-[55vw] sm:max-w-[80vw] p-6 overflow-y-auto"
				style={{ maxWidth: '90vw' }}
			>
				<SheetHeader className="pb-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-lg">
								<Sparkles className="h-6 w-6 text-white" />
							</div>
							<div>
								<SheetTitle className="text-2xl font-bold text-slate-900 dark:text-white">
									Customize Your Interview
								</SheetTitle>
								<p className="text-slate-600 dark:text-slate-400 mt-1">
									Choose questions, answers, and practice options
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
				</SheetHeader>
				<div className="space-y-8">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
							Question Categories
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{
								questionTypes.map((questionType) => (
									<motion.div
										key={questionType.type}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 }}
									>
										<Card className={`${questionType.bgColor} ${questionType.borderColor} p-2 border-2 shadow-lg hover:shadow-xl transition-all`}>
											<CardHeader className="pb-4">
												<CardTitle className="flex items-center justify-start gap-3">
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
								))
							}
						</div>
					</div>
					<Separator />
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
											<h3 className="text-lg text-left font-bold text-slate-900 dark:text-white">
												Include Expert Answers
											</h3>
											<p className="text-slate-600 text-left dark:text-slate-400 text-sm">
												Get comprehensive answers, explanations, and tips for each question
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Badge className="bg-neutral-100 hover:text-white text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100">
											+{Math.ceil(totalQuestions / 2)} credits
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
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<Card className="bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border-neutral-200 dark:border-neutral-800 shadow-lg">
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl shadow-lg">
											<GraduationCap className="h-6 w-6 text-white" />
										</div>
										<div>
											<h3 className="text-lg text-left font-bold text-slate-900 dark:text-white">
												Enable Practice Mode
											</h3>
											<p className="text-slate-600 text-left dark:text-slate-400 text-sm">
												Practice answering with voice/text input and get AI feedback
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Badge className="bg-neutral-100 hover:text-white text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100">
											+{Math.ceil(totalQuestions / 2)} credits
										</Badge>
										<Switch
											checked={includePractice}
											onCheckedChange={setIncludePractice}
											className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-neutral-900 data-[state=checked]:to-neutral-800"
										/>
									</div>
								</div>
								{
									includePractice && (
										<div className="mt-4 p-4 bg-neutral-100/50 dark:bg-neutral-800/10 rounded-lg">
											<div className="flex items-center gap-2 mb-2">
												<Play className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
												<span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
													Practice Features Included:
												</span>
											</div>
											<ul className="text-sm text-left text-neutral-700 dark:text-neutral-100 space-y-1">
												<li>• Voice recording and transcription</li>
												<li>• AI-powered answer evaluation</li>
												<li>• Detailed feedback and improvement suggestions</li>
												<li>• Comparison with expert answers</li>
											</ul>
										</div>
									)
								}
							</CardContent>
						</Card>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
					>
						<Card className="bg-gradient-to-r from-neutral-50 to-neutral-50 dark:from-neutral-800/20 dark:to-neutral-800/20 border-neutral-200 dark:border-neutral-800 shadow-lg">
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="p-3 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl shadow-lg">
											{makePublic ? <Globe className="h-6 w-6 text-white" /> : <Lock className="h-6 w-6 text-white" />}
										</div>
										<div>
											<h3 className="text-lg text-left font-bold text-slate-900 dark:text-white">
												{makePublic ? 'Share Publicly' : 'Keep Private'}
											</h3>
											<p className="text-slate-600 text-left dark:text-slate-400 text-sm">
												{makePublic 
													? 'Make your plan available for purchase by others at 50% cost' 
													: 'Keep your plan private for personal use only'
												}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										{makePublic && originalCost > totalCredits && (
											<Badge className="bg-neutral-100 hover:text-white text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100">
												50% OFF
											</Badge>
										)}
										<Switch
											checked={makePublic}
											onCheckedChange={setMakePublic}
											className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-neutral-900 data-[state=checked]:to-neutral-800"
										/>
									</div>
								</div>
								{makePublic && (
									<div className="mt-4 p-4 bg-neutral-100/50 dark:bg-neutral-800/10 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<Globe className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
											<span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
												Public Plan Benefits:
											</span>
										</div>
										<ul className="text-sm text-left text-neutral-700 dark:text-neutral-100 space-y-1">
											<li>• 50% cost reduction for creation</li>
											<li>• Help other developers in their interview prep</li>
											<li>• Build your reputation in the community</li>
											<li>• Others can purchase and create private copies</li>
										</ul>
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
					<Separator />
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
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
										className={`text-lg px-4 py-2 ${canAfford
											? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100'
											: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
											}`}
									>
										<CreditCard className="h-4 w-4 mr-2" />
										{totalCredits} Credits
									</Badge>
								</div>
								<div className="space-y-3">
									{makePublic && originalCost > totalCredits && (
										<div className="flex justify-between items-center text-sm">
											<span className="text-slate-600 dark:text-slate-400 line-through">
												Original cost
											</span>
											<span className="font-medium text-slate-500 dark:text-slate-500 line-through">
												{originalCost} credits
											</span>
										</div>
									)}
									<div className="flex justify-between items-center text-sm">
										<span className="text-slate-600 dark:text-slate-400">
											{totalQuestions} questions{makePublic ? ' (public - 50% off)' : ' (2 per credit)'}
										</span>
										<span className={`font-medium ${makePublic && originalCost > totalCredits ? 'text-neutral-800 dark:text-neutral-100' : 'text-slate-900 dark:text-white'}`}>
											{Math.ceil(totalQuestions / 2)}{makePublic ? ` → ${Math.ceil(Math.ceil(totalQuestions / 2) / 2)}` : ''} credits
										</span>
									</div>
									{
										includeAnswers && (
											<div className="flex justify-between items-center text-sm">
												<span className="text-slate-600 dark:text-slate-400">
													Expert answers (2 per credit)
												</span>
												<span className="font-medium text-slate-900 dark:text-white">
													{Math.ceil(totalQuestions / 2)} credits
												</span>
											</div>
										)
									}
									{
										includePractice && (
											<div className="flex justify-between items-center text-sm">
												<span className="text-slate-600 dark:text-slate-400">
													Practice evaluations (2 per credit)
												</span>
												<span className="font-medium text-slate-900 dark:text-white">
													{Math.ceil(totalQuestions / 2)} credits
												</span>
											</div>
										)
									}

									<Separator />

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
										<span className={`font-bold ${canAfford
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
					{
						!canAfford && (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.5 }}
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
													You need {totalCredits - userCredits} more credits to generate with these options.
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						)
					}
					<div className="flex gap-4 pt-4 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 -mx-6 px-6 py-4">
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
							className={`flex-1 h-12 font-bold ${canAfford
								? 'bg-gradient-to-r from-neutral-800 via-neutral-800 to-neutral-800 hover:from-neutral-700 hover:via-neutral-700 hover:to-neutral-700 shadow-lg hover:shadow-xl'
								: 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
								} transition-all`}
						>
							<Zap className="mr-2 h-5 w-5" />
							Generate {totalQuestions} Questions
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)
} 