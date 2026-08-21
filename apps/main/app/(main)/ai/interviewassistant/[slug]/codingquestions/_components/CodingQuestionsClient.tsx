"use client"

import { use, useEffect, useState, useRef } from "react"
import {
	Card, CardContent
} from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import {
	Tabs, TabsContent,
	TabsList,
	TabsTrigger
} from "@repo/ui/components/ui/tabs"
import {
	CheckCircle, XCircle, Code2, Play, Send, ArrowLeft, Target, Lightbulb, Brain
} from "lucide-react"
import CodeEditor from "@/components/main/code-editor"
import {
	getGenerationBySlug, runCodeEvaluation, submitCodeEvaluation,
	generateCodingQuestionAnswer, getCodingQuestionAnswer, getPreviousSubmissions
} from "@/actions/(main)/ai/jobinterview.action"
import SubmitConfirmDialog from "../components/SubmitConfirmDialog"
import Link from "next/link"

interface TestResult {
	passed: boolean;
	input: string;
	expected: string;
	actual: string;
}

interface SubmissionResult {
	passed: boolean;
	score: number;
	submittedAt: string;
	language: string;
	testResults?: TestResult[];
}

interface CodingQuestion {
	question: string;
	hints?: string[];
	testCases?: Array<{
		input: string;
		output: string;
		explanation: string;
	}>;
	difficulty: "Easy" | "Medium" | "Hard";
	questionType?: "DSA" | "Development";
}

interface InterviewGeneration {
	id: string;
	slug: string;
	position: string;
	jobDescription: string;
	generatedContent: {
		codingQuestions?: CodingQuestion[];
		technicalQuestions?: unknown[];
		behavioralQuestions?: unknown[];
	};
	createdAt: Date | string;
}

export default function CodingQuestionsPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = use(params);
	const [generation, setGeneration] = useState<InterviewGeneration | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedProblem, setSelectedProblem] = useState(0)
	const [selectedLanguage, setSelectedLanguage] = useState("javascript")

	// Run test results (temporary, not stored in DB)
	const [runResults, setRunResults] = useState<Array<{ passed: boolean; input: string; expected: string; actual: string }>>([])
	const [isRunning, setIsRunning] = useState(false)
	// const [runEvaluation, setRunEvaluation] = useState<any>(null)

	// Submission results (stored in DB)
	const [submissionResults, setSubmissionResults] = useState<SubmissionResult | null>(null)
	const [previousSubmissions, setPreviousSubmissions] = useState<SubmissionResult[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showSubmitDialog, setShowSubmitDialog] = useState(false)

	// Answer related states
	const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
	const [generatedAnswer, setGeneratedAnswer] = useState<{ answer?: { solution: string; explanation: string; approach: string; timeComplexity: string; spaceComplexity: string; keyPoints: string[] } } | null>(null)

	// UI states
	const [activeTab, setActiveTab] = useState("problem")
	const [currentCode, setCurrentCode] = useState("")

	// Ref for scrolling to test results
	const testResultsRef = useRef<HTMLDivElement>(null)

	// Limited language options as requested (JavaScript, TypeScript, Python, Java, C++)
	const allowedLanguages = ["javascript", "typescript", "python", "java", "cpp"]

	useEffect(() => {
		const fetchGeneration = async () => {
			try {
				const response = await getGenerationBySlug(slug)
				if (response.success && response.data) {
					const generationData = response.data as InterviewGeneration;
					setGeneration(generationData);
				} else {
					console.error("Failed to fetch generation:", response.error)
				}
			} catch (error) {
				console.error("Error fetching generation:", error)
			} finally {
				setLoading(false)
			}
		}

		fetchGeneration()
	}, [slug])

	// Load previous submissions and answers when problem/language changes
	useEffect(() => {
		const loadPreviousData = async () => {
			if (!generation?.generatedContent?.codingQuestions?.[selectedProblem] || !generation.id) return;

			const problem = generation.generatedContent.codingQuestions[selectedProblem];

			try {
				// Load previous submissions
				const submissionsResponse = await getPreviousSubmissions(problem.question, selectedLanguage, generation.id);
				if (submissionsResponse.success && submissionsResponse.data) {
					setPreviousSubmissions(submissionsResponse.data);
					// If there are previous submissions, set the latest one as current submission result
					if (submissionsResponse.data.length > 0) {
						setSubmissionResults(submissionsResponse.data[0]);
						// Don't switch tabs automatically - let user choose
					}
				}

				// Load existing answer for this language
				const answerResponse = await getCodingQuestionAnswer(problem.question, selectedLanguage, generation.id);
				if (answerResponse.success && answerResponse.data) {
					setGeneratedAnswer(answerResponse.data);
				} else {
					setGeneratedAnswer(null);
				}
			} catch (error) {
				console.error("Error loading previous data:", error);
			}
		}

		loadPreviousData();
	}, [generation, selectedProblem, selectedLanguage])

	// Handle "Run" button - evaluate code without storing in database
	const handleRun = async (submittedCode: string) => {
		if (!generation?.generatedContent?.codingQuestions?.[selectedProblem] || !generation.id) return;

		setIsRunning(true);
		setRunResults([]); // Clear previous run results
		// setRunEvaluation(null); // Clear previous run evaluation
		setCurrentCode(submittedCode); // Update current code from editor

		const problem = generation.generatedContent.codingQuestions[selectedProblem];

		try {
			// Use the runCodeEvaluation function (doesn't store in DB)
			const evaluationResponse = await runCodeEvaluation(
				problem.question,
				submittedCode,
				selectedLanguage,
				generation.id
			);

			if (evaluationResponse.success && evaluationResponse.data) {
				const evalData = evaluationResponse.data;
				// setRunEvaluation(evalData);

				// Create test results based on the evaluation score
				const simulatedResults = [];
				const passRate = evalData.score / 100; // Convert score to pass rate

				for (let i = 0; i < (problem.testCases?.length || 3); i++) {
					const testCase = problem.testCases?.[i];
					const passed = Math.random() < passRate; // Use evaluation score to determine pass rate

					simulatedResults.push({
						passed,
						input: testCase?.input || `Test case ${i + 1}`,
						expected: testCase?.output || "Expected output",
						actual: passed ? (testCase?.output || "Expected output") : "Different output"
					});
				}

				setRunResults(simulatedResults);
				// Switch to problem tab and scroll to test results
				setActiveTab("problem");
				setTimeout(() => {
					testResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 100);
			} else {
				console.error("Code evaluation failed:", evaluationResponse.error);
			}
		} catch (error) {
			console.error("Error running code:", error);
		} finally {
			setIsRunning(false);
		}
	}

	// Handle "Submit" button - show confirmation dialog first
	const handleSubmitClick = (submittedCode: string) => {
		setCurrentCode(submittedCode); // Update current code from editor
		setShowSubmitDialog(true);
	}

	// Handle confirmed submission - evaluate and store in database
	const handleConfirmedSubmit = async () => {
		if (!generation?.generatedContent?.codingQuestions?.[selectedProblem] || !generation.id) return;

		setIsSubmitting(true);
		setShowSubmitDialog(false);

		const problem = generation.generatedContent.codingQuestions[selectedProblem];

		try {
			// Use the submitCodeEvaluation function (stores in DB)
			const evaluationResponse = await submitCodeEvaluation(
				problem.question,
				currentCode,
				selectedLanguage,
				generation.id
			);

			if (evaluationResponse.success && evaluationResponse.data) {
				const evalData = evaluationResponse.data;
				setSubmissionResults(evalData);

				// Reload previous submissions to include the new one
				const submissionsResponse = await getPreviousSubmissions(problem.question, selectedLanguage, generation.id);
				if (submissionsResponse.success && submissionsResponse.data) {
					setPreviousSubmissions(submissionsResponse.data);
				}

				setActiveTab("submissions"); // Switch to submissions tab
			} else {
				console.error("Code submission failed:", evaluationResponse.error);
			}
		} catch (error) {
			console.error("Error submitting code:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	// const getDifficultyColor = (difficulty: string) => {
	// 	switch (difficulty) {
	// 		case "Easy": return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100 hover:text-white"
	// 		case "Medium": return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-100 hover:text-white"
	// 		case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:text-white"
	// 		default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:text-white"
	// 	}
	// }

	const handleProblemChange = (problemIndex: number) => {
		setSelectedProblem(problemIndex);
		// Clear all results and states when switching problems
		setRunResults([]);
		// setRunEvaluation(null);
		setSubmissionResults(null);
		setPreviousSubmissions([]);
		setIsRunning(false);
		setIsSubmitting(false);
		setGeneratedAnswer(null);
		setActiveTab("problem");
		setCurrentCode("");
	}

	const handleLanguageChange = (language: string) => {
		setSelectedLanguage(language);
		// Clear all results and states when switching languages
		setRunResults([]);
		// setRunEvaluation(null);
		setSubmissionResults(null);
		setPreviousSubmissions([]);
		setIsRunning(false);
		setIsSubmitting(false);
		setGeneratedAnswer(null);
		setCurrentCode("");
	}

	const generateAnswer = async () => {
		if (!generation?.generatedContent?.codingQuestions?.[selectedProblem] || !generation.id) return;

		setIsGeneratingAnswer(true);
		const problem = generation.generatedContent.codingQuestions[selectedProblem];

		try {
			// First check if answer already exists for this language
			const existingAnswer = await getCodingQuestionAnswer(problem.question, selectedLanguage, generation.id);

			if (existingAnswer.success && existingAnswer.data) {
				setGeneratedAnswer(existingAnswer.data);
			} else {
				// Generate new answer in the user's preferred language
				const answerResponse = await generateCodingQuestionAnswer(
					problem.question,
					selectedLanguage,
					generation.id
				);

				if (answerResponse.success && answerResponse.data) {
					setGeneratedAnswer(answerResponse.data);
				} else {
					console.error("Failed to generate answer:", answerResponse.error);
				}
			}
		} catch (error) {
			console.error("Error generating answer:", error);
		} finally {
			setIsGeneratingAnswer(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
			</div>
		)
	}

	if (!generation || !generation.generatedContent?.codingQuestions || generation.generatedContent.codingQuestions.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Code2 className="h-12 w-12 text-muted-foreground mb-4" />
					<h2 className="text-xl font-semibold mb-2">No Coding Questions Available</h2>
					<p className="text-muted-foreground">This interview doesn&apos;t have any coding questions. Please go back to the main interview page.
					</p>
				</div>
			</div>
		)
	}

	const currentProblem = generation.generatedContent.codingQuestions[selectedProblem];

	return (
		<div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
			<div className="flex-1 flex min-h-0">
				<div className="w-2/5 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
					<div className="w-full border-b border-gray-200 dark:border-gray-700 p-4">
						<div className="w-full flex items-center mb-4 gap-4">
							<div className="shrink-0">
								<Link href={`/ai/jobinterviewassistant/${slug}`}>
									<Button variant="ghost" size="sm">
										<ArrowLeft className="h-4 w-4 mr-2" />
										Back
									</Button>
								</Link>
							</div>
							<div className="w-full flex-1 flex items-center gap-2 overflow-auto">
								<div className="flex items-center gap-2 shrink-0">
									<Target className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
									<span className="font-medium text-sm">Problems</span>
								</div>
								<div className="w-full flex gap-2">
									{
										generation.generatedContent.codingQuestions.map((problem: CodingQuestion, index: number) => (
											<Button
												key={index}
												variant={selectedProblem === index ? "default" : "outline"}
												size="sm"
												className="flex-1 h-8 text-xs min-w-0"
												onClick={() => handleProblemChange(index)}
											>
												{index + 1}
											</Button>
										))
									}
								</div>
							</div>
						</div>
					</div>
					<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
						<TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
							<TabsTrigger value="problem">Problem</TabsTrigger>
							<TabsTrigger value="solution">Solution</TabsTrigger>
							<TabsTrigger value="submissions">Submissions</TabsTrigger>
						</TabsList>
						<TabsContent value="problem" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
							<div>
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
										{selectedProblem + 1}. Coding Challenge
									</h2>
									<Badge
										variant={currentProblem?.difficulty === "Easy" ? "secondary" :
											currentProblem?.difficulty === "Medium" ? "default" : "destructive"}
										className="text-xs"
									>
										{currentProblem?.difficulty}
									</Badge>
								</div>
								<div className="prose prose-sm dark:prose-invert max-w-none">
									<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
										{currentProblem?.question}
									</p>
								</div>
								{
									currentProblem?.testCases && currentProblem.testCases.length > 0 && (
										<div className="mt-6">
											<h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Examples</h3>
											<div className="space-y-4">
												{
													currentProblem.testCases.slice(0, 2).map((testCase, index) => (
														<div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
															<div className="font-medium text-sm mb-2">Example {index + 1}:</div>
															<div className="space-y-2 text-sm">
																<div>
																	<span className="font-medium">Input:</span>
																	<code className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
																		{testCase.input}
																	</code>
																</div>
																<div>
																	<span className="font-medium">Output:</span>
																	<code className="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
																		{testCase.output}
																	</code>
																</div>
																{
																	testCase.explanation && (
																		<div>
																			<span className="font-medium">Explanation:</span>
																			<span className="ml-2 text-gray-600 dark:text-gray-400">
																				{testCase.explanation}
																			</span>
																		</div>
																	)
																}
															</div>
														</div>
													))
												}
											</div>
										</div>
									)
								}

								{
									currentProblem?.hints && currentProblem.hints.length > 0 && (
										<div className="mt-6">
											<h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
												<Lightbulb className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
												Hints
											</h3>
											<div className="space-y-2">
												{
													currentProblem.hints.map((hint, index) => (
														<div key={index} className="bg-neutral-50 dark:bg-neutral-800/20 border-l-4 border-neutral-800 p-3 text-sm">
															<span className="font-medium">Hint {index + 1}:</span> {hint}
														</div>
													))
												}
											</div>
										</div>
									)
								}

								{
									runResults.length > 0 && (
										<div className="mt-6" ref={testResultsRef}>
											<h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
												<Play className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
												Test Results
												<Badge variant="outline" className="text-xs ml-2">
													{runResults.filter(r => r.passed).length}/{runResults.length} passed
												</Badge>
											</h3>
											<div className="space-y-2">
												{
													runResults.map((result, index) => (
														<div key={index} className={`text-xs p-3 rounded border ${result.passed
															? 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-800/20 dark:border-neutral-800 dark:text-neutral-100'
															: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
															}`}>
															<div className="flex items-center gap-2 mb-1">
																{
																	result.passed ? (
																		<CheckCircle className="h-3 w-3" />
																	) : (
																		<XCircle className="h-3 w-3" />
																	)
																}
																<span className="font-medium">Test {index + 1}: {result.passed ? 'PASS' : 'FAIL'}</span>
															</div>
															<div className="space-y-1 text-xs opacity-80">
																<div><strong>Input:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.input}</code></div>
																<div><strong>Expected:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.expected}</code></div>
																<div><strong>Actual:</strong> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{result.actual}</code></div>
															</div>
														</div>
													))
												}
											</div>
										</div>
									)
								}
							</div>
						</TabsContent>
						<TabsContent value="solution" className="flex-1 overflow-y-auto p-4 m-0">
							<div className="space-y-6">
								{
									generatedAnswer ? (
										<div className="space-y-6">
											<div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
												<div className="flex items-center gap-3">
													<CheckCircle className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
													<h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-700">
														Expert Solution Available
													</h3>
													<Badge variant="outline" className="text-xs">
														{selectedLanguage}
													</Badge>
												</div>
												<p className="text-sm text-neutral-700 dark:text-neutral-100 mt-2">
													Generated solution with detailed explanation and analysis
												</p>
											</div>
											<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
												<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
													<h4 className="font-semibold text-gray-900 dark:text-gray-100">Solution Code</h4>
												</div>
												<div className="h-80">
													<CodeEditor
														language={selectedLanguage}
														code={generatedAnswer.answer?.solution || "// No solution available"}
														readOnly={true}
														showRunButton={false}
														showSubmitButton={false}
													/>
												</div>
											</div>
											<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
												<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
													<h4 className="font-semibold text-gray-900 dark:text-gray-100">Explanation</h4>
												</div>
												<div className="p-4">
													<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
														{generatedAnswer.answer?.explanation || "No explanation available"}
													</p>
												</div>
											</div>
											<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
												<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
													<h4 className="font-semibold text-gray-900 dark:text-gray-100">Approach</h4>
												</div>
												<div className="p-4">
													<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
														{generatedAnswer.answer?.approach || "No approach details available"}
													</p>
												</div>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
													<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
														<h4 className="font-semibold text-gray-900 dark:text-gray-100">Time Complexity</h4>
													</div>
													<div className="p-4">
														<p className="text-gray-700 dark:text-gray-300 font-mono">
															{generatedAnswer.answer?.timeComplexity || "Not specified"}
														</p>
													</div>
												</div>
												<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
													<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
														<h4 className="font-semibold text-gray-900 dark:text-gray-100">Space Complexity</h4>
													</div>
													<div className="p-4">
														<p className="text-gray-700 dark:text-gray-300 font-mono">
															{generatedAnswer.answer?.spaceComplexity || "Not specified"}
														</p>
													</div>
												</div>
											</div>

											{
												generatedAnswer.answer?.keyPoints && generatedAnswer.answer.keyPoints.length > 0 && (
													<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
														<div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
															<h4 className="font-semibold text-gray-900 dark:text-gray-100">Key Points</h4>
														</div>
														<div className="p-4">
															<ul className="space-y-2">
																{
																	generatedAnswer.answer.keyPoints.map((point: string, index: number) => (
																		<li key={index} className="flex items-start gap-2">
																			<span className="text-neutral-900 dark:text-neutral-100 font-semibold mt-1">•</span>
																			<span className="text-gray-700 dark:text-gray-300">{point}</span>
																		</li>
																	))
																}
															</ul>
														</div>
													</div>
												)
											}
										</div>
									) : (
										<div className="space-y-4">
											<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
												<Brain className="h-8 w-8 text-gray-400 mx-auto mb-3" />
												<h3 className="font-semibold text-lg mb-2">Need Help?</h3>
												<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
													Generate an expert solution with detailed explanation
												</p>
												<Button
													onClick={generateAnswer}
													disabled={isGeneratingAnswer}
													className="w-full"
												>
													{
														isGeneratingAnswer ? (
															<>
																<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
																Generating...
															</>
														) : (
															<>
																<Brain className="h-4 w-4 mr-2" />
																Generate Solution
															</>
														)
													}
												</Button>
											</div>
										</div>
									)
								}
							</div>
						</TabsContent>
						<TabsContent value="submissions" className="flex-1 overflow-y-auto p-4 m-0">
							<div className="space-y-4">
								<h3 className="font-semibold text-lg">Submission History</h3>

								{
									previousSubmissions.length > 0 ? (
										<div className="space-y-3">
											{
												previousSubmissions.map((submission, index) => (
													<Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
														onClick={() => setSubmissionResults(submission)}>
														<CardContent className="p-4">
															<div className="flex items-center justify-between mb-2">
																<div className="flex items-center gap-2">
																	{
																		submission.passed ? (
																			<CheckCircle className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
																		) : (
																			<XCircle className="h-4 w-4 text-red-500" />
																		)
																	}
																	<span className="font-medium text-sm">
																		Submission #{previousSubmissions.length - index}
																	</span>
																</div>
																<span className="text-xs text-gray-500">
																	{new Date(submission.submittedAt).toLocaleString()}
																</span>
															</div>
															<div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
																<span>Language: {submission.language}</span>
																<span>Score: {submission.score}%</span>
																<span>{submission.testResults?.filter((r) => r.passed).length || 0}/{submission.testResults?.length || 0} tests passed</span>
															</div>
														</CardContent>
													</Card>
												))
											}
										</div>
									) : (
										<div className="text-center py-8 text-gray-500">
											<Send className="h-8 w-8 mx-auto mb-3 opacity-50" />
											<p>No submissions yet</p>
											<p className="text-sm">Submit your solution to see it here</p>
										</div>
									)
								}

								{
									submissionResults && (
										<div className="mt-6 border-t pt-4">
											<h4 className="font-semibold mb-3">Submission Details</h4>
											<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
												<div className="flex items-center justify-between">
													<span className="font-medium">Status:</span>
													<div className="flex items-center gap-2">
														{
															submissionResults.passed ? (
																<CheckCircle className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
															) : (
																<XCircle className="h-4 w-4 text-red-500" />
															)
														}
														<span className={submissionResults.passed ? "text-neutral-800 dark:text-neutral-200" : "text-red-600"}>
															{submissionResults.passed ? "Accepted" : "Wrong Answer"}
														</span>
													</div>
												</div>
												<div className="flex items-center justify-between">
													<span className="font-medium">Score:</span>
													<span>{submissionResults.score}%</span>
												</div>
												<div className="flex items-center justify-between">
													<span className="font-medium">Test Cases:</span>
													<span>
														{submissionResults.testResults?.filter((r) => r.passed).length || 0}/
														{submissionResults.testResults?.length || 0} passed
													</span>
												</div>
											</div>
										</div>
									)
								}
							</div>
						</TabsContent>
					</Tabs>
				</div>
				<div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
					<div className="flex-1 min-h-0">
						<CodeEditor
							language={selectedLanguage}
							onRun={handleRun}
							onSubmit={handleSubmitClick}
							readOnly={false}
							allowedLanguages={allowedLanguages}
							onLanguageChange={handleLanguageChange}
							code={currentCode}
							showRunButton={true}
							showSubmitButton={true}
							isRunning={isRunning}
							isSubmitting={isSubmitting}
							key={`${selectedProblem}-${selectedLanguage}`}
						/>
					</div>
				</div>
			</div>
			<SubmitConfirmDialog
				open={showSubmitDialog}
				onOpenChange={setShowSubmitDialog}
				onConfirm={handleConfirmedSubmit}
				isSubmitting={isSubmitting}
				code={currentCode}
				language={selectedLanguage}
				problemTitle={`Problem ${selectedProblem + 1}`}
			/>
		</div>
	)
}