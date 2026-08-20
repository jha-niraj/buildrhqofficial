"use server"

import {
	db,
	jobInterviewAssistant,
	codeEvaluation,
	questionAnswer,
	userQuestionResponse,
	interviewPlanPurchase,
	users,
	creditTransactions,
    withTransaction
} from '@repo/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import Exa from "exa-js";
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { trackActivity } from '@/actions/(main)/user/activity.action';
// Import ElevenLabs speech utility
import {
	quickTranscribeWithElevenLabs,
	detailedTranscribeWithElevenLabs, isElevenLabsConfigured
} from '@/lib/elevenlabs-speech';
// Import organized prompts
import {
	getInterviewGenerationPrompt, getCodeEvaluationPrompt, getCodingAnswerPrompt,
	getGeneralAnswerPrompt, getTechnicalResponseEvaluationPrompt,
	getBehavioralResponseEvaluationPrompt,
	type InterviewGenerationParams, type CodeEvaluationParams,
	type AnswerGenerationParams, type UserResponseEvaluationParams
} from '@/lib/prompts/jobinterviewprompts';

let _exa: Exa | null = null
const exa = new Proxy({} as Exa, {
    get(_, prop) {
        if (!_exa) _exa = new Exa(process.env.EXA_API_KEY!)
        return Reflect.get(_exa, prop)
    }
})

// Helper function to generate search hash
function generateSearchHash(position: string, jobDescription: string, companyUrl: string): string {
	const input = `${position}:${jobDescription}:${companyUrl}`;
	return crypto.createHash('md5').update(input).digest('hex');
}

// Helper function to generate slug
function generateSlug(position: string): string {
	const slug = position
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
	return `${slug}-${nanoid(6)}`; // Add 6 character unique ID
}

// Types and Interfaces
interface CompanyInfo extends Record<string, any> {
	title: string;
	content: string;
	url: string;
	image: string;
	publishedDate: string;
}

interface TechnicalQuestion {
	question: string;
	answer?: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	category: string;
}

interface BehavioralQuestion {
	question: string;
	answer?: string;
	tips?: string;
}

interface CodingQuestion {
	question: string;
	hints?: string[];
	testCases?: Array<{
		input: string;
		output: string;
		explanation: string;
	}>;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	questionType?: 'DSA' | 'Development';
}

export interface InterviewQuestions extends Record<string, any> {
	technicalQuestions: TechnicalQuestion[];
	behavioralQuestions: BehavioralQuestion[];
	codingQuestions: CodingQuestion[];
}

interface ExaResult {
	results: {
		title: string;
		text: string;
		url: string;
		image: string;
		publishedDate: string;
	}[];
}


// Function to fetch company info using Exa
async function fetchCompanyInfo(url: string): Promise<CompanyInfo | null> {
	try {
		const companyDomain = url.replace(/^https?:\/\//, '').split('/')[0]?.replace('www.', '') || '';

		const result = (await exa.getContents(
			[companyDomain],
			{
				text: true
			}
		)) as unknown as ExaResult;

		if (result?.results?.[0]) {
			const companyData = result.results[0];
			return {
				title: companyData.title || '',
				content: companyData.text || '',
				url: companyData.url || '',
				image: companyData.image || '',
				publishedDate: companyData.publishedDate || new Date().toISOString()
			};
		}

		return null;
	} catch (error) {
		console.error('Error fetching company info:', error);
		return null;
	}
}

// Function to clean and parse JSON response
function cleanAndParseJSON(jsonString: string): any {
	try {
		// First try direct parsing
		return JSON.parse(jsonString);
	} catch {
		console.log('Direct parsing failed, attempting to clean JSON...');

		// Remove any markdown code block markers and clean whitespace
		const cleaned = jsonString
			.replace(/```json\s*/g, '')
			.replace(/```\s*/g, '')
			.replace(/^\s+|\s+$/g, '')
			.replace(/\\n/g, ' ')  // Replace newlines with spaces
			.replace(/\\r/g, ' ')  // Replace carriage returns with spaces
			.replace(/\n/g, ' ')   // Replace actual newlines with spaces
			.replace(/\r/g, ' ')   // Replace actual carriage returns with spaces
			.replace(/\t/g, ' ')   // Replace tabs with spaces
			.replace(/\s+/g, ' '); // Collapse multiple spaces

		try {
			// Try parsing the cleaned version
			return JSON.parse(cleaned);
		} catch {
			console.log('Markdown cleaning failed, attempting to fix JSON structure...');

			try {
				// Find the actual JSON content
				const jsonStart = cleaned.indexOf('{');
				const jsonEnd = cleaned.lastIndexOf('}');

				if (jsonStart === -1 || jsonEnd === -1) {
					throw new Error('No valid JSON object found');
				}

				let content = cleaned.slice(jsonStart, jsonEnd + 1);

				// Fix common JSON issues
				content = content
					.replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
					.replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
					.replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
					.replace(/:\s*"([^"]*)"(\s*[,}])/g, ':"$1"$2') // Ensure proper string value formatting
					.replace(/:\s*"([^"]*)$/g, ':"$1"') // Fix unclosed quotes at end
					.replace(/([^\\])"([^"]*)":/g, '$1"$2":') // Fix improperly escaped quotes in keys
					.replace(/([^\\])"([^"]*)"(\s*[,}])/g, '$1"$2"$3') // Fix improperly escaped quotes in values
					.replace(/\\/g, '\\\\') // Escape backslashes
					.replace(/"\s+"/g, '" "') // Fix spaces between strings
					.replace(/(?<!\\)"/g, '\\"'); // Escape unescaped quotes

				// Try parsing the fixed content
				return JSON.parse(content);
			} catch {
				console.log('JSON structure fix failed, attempting to extract evaluation...');

				// Try to extract evaluation components
				const scoreMatch = cleaned.match(/["']score["']\s*:\s*(\d+)/);
				const feedbackMatch = cleaned.match(/["']feedback["']\s*:\s*["']([^"']*)["']/);
				const strengthsMatch = cleaned.match(/["']strengths["']\s*:\s*\[(.*?)\]/);
				const improvementsMatch = cleaned.match(/["']improvements["']\s*:\s*\[(.*?)\]/);

				if (scoreMatch && feedbackMatch) {
					const evaluation = {
						score: parseInt(scoreMatch[1] || '0'),
						feedback: feedbackMatch[1],
						strengths: [] as string[],
						improvements: [] as string[],
						comparedToExpert: {
							similarities: [] as string[],
							missingPoints: [] as string[]
						}
					};

					// Parse arrays if available
					if (strengthsMatch) {
						evaluation.strengths = strengthsMatch[1]?.split(',') || []
							.map((s: string) => s.trim().replace(/^["']|["']$/g, ''))
							.filter((s: string) => s);
					}

					if (improvementsMatch) {
						evaluation.improvements = improvementsMatch[1]?.split(',') || []
							.map((s: string) => s.trim().replace(/^["']|["']$/g, ''))
							.filter((s: string) => s);
					}

					return evaluation;
				}

				throw new Error('Failed to parse or reconstruct evaluation content');
			}
		}
	}
}

// Function to clean and parse simple JSON responses (for individual answers)
function cleanAndParseSimpleJSON(jsonString: string): any {
	try {
		// First try direct parsing
		return JSON.parse(jsonString);
	} catch {
		console.log('Direct parsing failed, attempting to clean JSON...');

		try {
			// Remove markdown code block markers, extra text, and whitespace
			const cleaned = jsonString
				.replace(/```json\s*/gi, '') // Remove opening json code blocks
				.replace(/```\s*/g, '') // Remove closing code blocks
				.replace(/^[^{]*/, '') // Remove any text before first {
				.replace(/[^}]*$/, '') // Remove any text after last }
				.replace(/^\s+/, '') // Remove leading whitespace
				.replace(/\s+$/, ''); // Remove trailing whitespace

			// Try parsing the cleaned version
			return JSON.parse(cleaned);
		} catch {
			console.log('Markdown cleaning failed, attempting to extract JSON object...');

			// Find the first { and last } to extract just the JSON object
			const firstBrace = jsonString.indexOf('{');
			const lastBrace = jsonString.lastIndexOf('}');

			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				const extractedJson = jsonString.substring(firstBrace, lastBrace + 1);
				try {
					return JSON.parse(extractedJson);
				} catch {
					console.log('JSON extraction failed, attempting to fix common issues...');

					// Fix common JSON issues - more aggressive cleaning
					const fixedJson = extractedJson
						.replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
						.replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
						.replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
						.replace(/\\n/g, '\\\\n') // Properly escape newlines
						.replace(/\\r/g, '\\\\r') // Properly escape carriage returns
						.replace(/\\t/g, '\\\\t') // Properly escape tabs
						.replace(/\n/g, '\\n') // Escape actual newlines
						.replace(/\r/g, '\\r') // Escape actual carriage returns
						.replace(/\t/g, '\\t') // Escape actual tabs
						.replace(/\\/g, '\\\\') // Escape backslashes
						.replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes
						.replace(/^"/, '\\"') // Escape leading quote
						.replace(/"$/, '\\"'); // Escape trailing quote

					try {
						return JSON.parse(fixedJson);
					} catch {
						// Last resort: try to extract JSON using regex
						const jsonMatch = jsonString.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
						if (jsonMatch) {
							return JSON.parse(jsonMatch[0]);
						}

						// If all parsing attempts fail, create a fallback response
						console.log('All parsing attempts failed, creating fallback response...');
						return createFallbackResponse(jsonString);
					}
				}
			}

			// If we can't find JSON structure, create fallback
			console.log('Could not extract JSON structure, creating fallback response...');
			return createFallbackResponse(jsonString);
		}
	}
}

// Helper function to create a fallback response when JSON parsing fails
function createFallbackResponse(rawText: string): any {
	// Try to extract code blocks from the response
	const codeBlockMatch = rawText.match(/```(\w+)?\s*\n([\s\S]*?)\n```/);
	let solution = '';

	if (codeBlockMatch) {
		solution = codeBlockMatch[2] || '';
	} else {
		// Try to extract from nested JSON structure first
		const nestedJsonMatch = rawText.match(/"solution":\s*"([^"]*?)"/);
		if (nestedJsonMatch) {
			let extractedSolution = nestedJsonMatch[1];

			// Clean up the extracted solution - handle nested JSON
			extractedSolution = extractedSolution || '';
			extractedSolution = extractedSolution.replace(/\\n/g, '\n')
			extractedSolution = extractedSolution.replace(/\\"/g, '"')
			extractedSolution = extractedSolution.replace(/\\\\/g, '\\')
			extractedSolution = extractedSolution.replace(/\\t/g, '\t')
			extractedSolution = extractedSolution.replace(/\\r/g, '\r');

			// If the extracted solution contains more JSON, try to parse it
			if (extractedSolution.includes('"solution":')) {
				try {
					const innerJsonMatch = extractedSolution.match(/"solution":\s*"([^"]*?)"/);
					if (innerJsonMatch) {
						solution = innerJsonMatch[1] || '';
						solution = solution.replace(/\\n/g, '\n')
							.replace(/\\"/g, '"')
						solution = solution.replace(/\\\\/g, '\\')
						solution = solution.replace(/\\t/g, '\t')
						solution = solution.replace(/\\r/g, '\r');
					} else {
						solution = extractedSolution;
					}
				} catch {
					solution = extractedSolution;
				}
			} else {
				solution = extractedSolution;
			}
		} else {
			// Try to extract code from the raw text by looking for common patterns
			const reactPattern = /import React[\s\S]*?return \([\s\S]*?<\/div>/;
			const functionPattern = /function\s+\w+\s*\([\s\S]*?return[\s\S]*?}/;
			const constPattern = /const\s+\w+\s*=\s*\([\s\S]*?return[\s\S]*?}/;

			if (reactPattern.test(rawText)) {
				const match = rawText.match(reactPattern);
				solution = match ? match[0] : rawText.substring(0, 1000);
			} else if (functionPattern.test(rawText)) {
				const match = rawText.match(functionPattern);
				solution = match ? match[0] : rawText.substring(0, 1000);
			} else if (constPattern.test(rawText)) {
				const match = rawText.match(constPattern);
				solution = match ? match[0] : rawText.substring(0, 1000);
			} else {
				// Try to find any code-like content
				const codeLikeMatch = rawText.match(/(?:function|const|import|export|class)\s+[\s\S]*?}/);
				if (codeLikeMatch) {
					solution = codeLikeMatch[0];
				} else {
					// Last resort: take first 1000 characters that look like code
					solution = rawText.substring(0, 1000);
				}
			}
		}
	}

	// Clean up the solution
	solution = solution.trim();

	return {
		solution: solution,
		explanation: "AI response parsing failed. Here's the extracted solution from the raw response.",
		approach: "Unable to parse structured response - using extracted code",
		timeComplexity: "Unknown",
		spaceComplexity: "Unknown",
		keyPoints: ["Response parsing failed", "Please try again", "Check the extracted solution above"]
	};
}

// Function to generate interview questions using Sarvam AI
async function generateInterviewQuestions(
	position: string,
	jobDescription: string,
	resumeText: string | null,
	companyInfo: CompanyInfo | null,
	includeAnswers: boolean,
	counts: { technical: number; behavioral: number; coding: number } = { technical: 8, behavioral: 8, coding: 3 }
): Promise<InterviewQuestions | null> {
	try {
		// Use organized prompt
		const promptParams: InterviewGenerationParams = {
			position,
			jobDescription,
			resumeText,
			companyTitle: companyInfo?.title || null,
			includeAnswers,
			counts
		};

		const prompt = getInterviewGenerationPrompt(promptParams);

		console.log('Sending request to Sarvam AI...');
		console.log('Request parameters:', {
			position,
			includeAnswers,
			counts,
			promptLength: prompt.length
		});

		const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${process.env.SARVAM_API_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				messages: [{ role: "user", content: prompt }],
				model: "sarvam-m",
				max_tokens: includeAnswers ? 8000 : 2500,
				temperature: 0.7,
				top_p: 0.9
			}),
		});

		console.log('Sarvam AI response status:', response.status);

		if (!response.ok) {
			throw new Error(`Sarvam AI API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('Response data keys:', Object.keys(data));

		if (!data.choices?.[0]?.message?.content) {
			throw new Error('Invalid response structure from Sarvam AI');
		}

		const content = data.choices[0].message.content;
		console.log('Content length:', content.length);
		console.log('Content preview:', content.substring(0, 200) + '...');

		try {
			const parsedContent = cleanAndParseJSON(content);
			console.log('Successfully parsed content structure:', {
				technicalQuestions: parsedContent.technicalQuestions?.length || 0,
				behavioralQuestions: parsedContent.behavioralQuestions?.length || 0,
				codingQuestions: parsedContent.codingQuestions?.length || 0
			});

			// Validate the structure and content
			if (!parsedContent.technicalQuestions || !Array.isArray(parsedContent.technicalQuestions)) {
				throw new Error('Missing or invalid technical questions array');
			}
			if (!parsedContent.behavioralQuestions || !Array.isArray(parsedContent.behavioralQuestions)) {
				throw new Error('Missing or invalid behavioral questions array');
			}
			if (!parsedContent.codingQuestions || !Array.isArray(parsedContent.codingQuestions)) {
				throw new Error('Missing or invalid coding questions array');
			}

			// Validate question counts
			if (parsedContent.technicalQuestions.length < counts.technical) {
				console.warn(`Expected ${counts.technical} technical questions, got ${parsedContent.technicalQuestions.length}`);
			}
			if (parsedContent.behavioralQuestions.length < counts.behavioral) {
				console.warn(`Expected ${counts.behavioral} behavioral questions, got ${parsedContent.behavioralQuestions.length}`);
			}
			if (parsedContent.codingQuestions.length < counts.coding) {
				console.warn(`Expected ${counts.coding} coding questions, got ${parsedContent.codingQuestions.length}`);
			}

			return parsedContent;
		} catch (error: unknown) {
			const parseError = error as Error;
			console.error('Error parsing Sarvam response:', parseError);
			console.error('Raw content:', content);

			// Try to salvage partial content
			try {
				const partialContent = cleanAndParseJSON(content);
				if (partialContent.technicalQuestions?.length ||
					partialContent.behavioralQuestions?.length ||
					partialContent.codingQuestions?.length) {
					console.log('Returning partial content');
					return partialContent;
				}
			} catch {
				console.error('Failed to salvage partial content');
			}

			throw new Error(`Failed to parse Sarvam AI response: ${parseError.message}`);
		}
	} catch (error) {
		console.error('Error generating interview questions:', error);
		return null;
	}
}

interface GenerateJobInterviewResponse {
	success: boolean;
	data?: InterviewQuestions;
	error?: string;
	cached?: boolean;
}

export async function generateJobInterviewQuestions(
	position: string,
	jobDescription: string,
	companyUrl: string,
	includeAnswers: boolean = false,
	includePractice: boolean = false,
	makePublic: boolean = false,
	counts: { technical: number; behavioral: number; coding: number } = { technical: 8, behavioral: 8, coding: 3 }
): Promise<GenerateJobInterviewResponse> {
	try {
		console.log('Starting interview question generation:', { position, jobDescription, companyUrl, includeAnswers, includePractice, makePublic, counts });
		const session = await getSession(headers())

		if (!session) {
			throw new Error('User not found');
		}

		// Get user's resume text and check credits
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: { resumeText: true, credits: true },
		});

		if (!user) {
			throw new Error('User not found');
		}

		console.log('User credits:', user.credits);

		// Calculate required credits based on new pricing model with public/private consideration
		const totalQuestions = counts.technical + counts.behavioral + counts.coding;
		const baseCredits = Math.ceil(totalQuestions / 2); // 1 credit per 2 questions
		const answerCredits = includeAnswers ? Math.ceil(totalQuestions / 2) : 0; // 1 additional credit per 2 questions if answers included
		const practiceCredits = includePractice ? Math.ceil(totalQuestions / 2) : 0; // 1 additional credit per 2 questions if practice included
		const subtotalCredits = baseCredits + answerCredits + practiceCredits;
		// Halve the cost for public generations (similar to study plan)
		const requiredCredits = makePublic ? Math.ceil(subtotalCredits / 2) : subtotalCredits;

		if ((user.credits ?? 0) < requiredCredits) {
			throw new Error('Insufficient credits');
		}

		// Fetch company info
		const companyInfo = await fetchCompanyInfo(companyUrl);
		console.log('Fetched company info:', companyInfo);

		// Generate interview questions with specified counts
		const questions = await generateInterviewQuestions(
			position,
			jobDescription,
			user.resumeText ?? null,
			companyInfo,
			includeAnswers,
			counts
		);

		console.log('Generated questions:', questions);

		if (!questions) {
			throw new Error('Failed to generate interview questions');
		}

		// Generate a unique slug
		const slug = generateSlug(position);

		// Save to database and handle credits in a transaction
		const result = await withTransaction(async (tx) => {
			// Deduct credits
			// Guarded in SQL, not by the balance read above: two concurrent requests
			// both pass a read-then-write check and both debit. Zero rows updated means
			// the balance moved under us, and throwing rolls the transaction back.
			const debited = await tx.update(users)
				.set({ credits: sql`${users.credits} - ${requiredCredits}` })
				.where(and(eq(users.id, session.user.id), sql`${users.credits} >= ${requiredCredits}`))
				.returning({ credits: users.credits });
			if (debited.length === 0) throw new Error("Insufficient credits");

			console.log('Credits deducted:', requiredCredits);

			// Create credit transaction
			await tx.insert(creditTransactions).values({
				userId: session.user.id,
				amount: -requiredCredits,
				type: 'SPEND',
				currency: 'INR',
				description: `Generated interview questions for ${position}${includeAnswers ? ' with answers' : ''}${includePractice ? ' with practice mode' : ''} (${totalQuestions} questions)`,
			});

			// Save interview data with question counts, practice option, and public/private settings
			const [savedInterview] = await tx.insert(jobInterviewAssistant).values({
				userId: session.user.id,
				position,
				jobDescription,
				companyUrl,
				includeAnswers,
				includePractice,
				technicalCount: counts.technical,
				behavioralCount: counts.behavioral,
				codingCount: counts.coding,
				searchHash: generateSearchHash(position, jobDescription, companyUrl),
				companyInfo: companyInfo ?? undefined,
				generatedContent: questions,
				slug,
				// Public/Private fields
				isPublic: makePublic,
				publicCost: makePublic ? Math.ceil(subtotalCredits * 0.5) : undefined,
				creditsCost: subtotalCredits, // Store the original (private) cost
				description: `A comprehensive interview preparation for ${position} position with ${totalQuestions} questions${includeAnswers ? ' (with answers)' : ''}${includePractice ? ' (with practice mode)' : ''}`,
				tags: [position.toLowerCase(), companyUrl ? new URL(companyUrl).hostname.replace('www.', '') : ''].filter(Boolean),
			}).returning();

			console.log('Saved interview data');
			return savedInterview;
		});

		console.log('Transaction completed successfully');

		// Track activity for job interview generation
		await trackActivity({
			type: 'AI_TOOL_USED' as any,
			title: "Job Interview Assistant",
			description: `Generated interview questions for ${position} position (${totalQuestions} questions)`,
			xpEarned: 15,
			creditsEarned: 0,
			timeSpent: 2,
			metadata: {
				position,
				totalQuestions,
				includeAnswers,
				includePractice,
				creditsSpent: requiredCredits
			}
		});

		return {
			success: true,
			data: {
				...(result!.generatedContent as InterviewQuestions),
				slug: result!.slug,
				id: result!.id,
				position: result!.position,
				createdAt: result!.createdAt,
				includeAnswers: result!.includeAnswers,
				includePractice: result!.includePractice
			},
		};
	} catch (error) {
		console.error('Error in generateJobInterviewQuestions:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function getAllGenerations() {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not found');
		}

		const generations = await db.query.jobInterviewAssistant.findMany({
			where: eq(jobInterviewAssistant.userId, session.user.id),
			orderBy: [desc(jobInterviewAssistant.createdAt)],
		});

		return {
			success: true,
			data: generations
		};
	} catch (error) {
		console.error('Error in getAllGenerations:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function getRecentGenerations(limit: number = 3) {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not found');
		}

		const generations = await db.query.jobInterviewAssistant.findMany({
			where: eq(jobInterviewAssistant.userId, session.user.id),
			orderBy: [desc(jobInterviewAssistant.createdAt)],
			limit,
		});

		return {
			success: true,
			data: generations
		};
	} catch (error) {
		console.error('Error in getRecentGenerations:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function getGenerationBySlug(slug: string) {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not found');
		}

		const generation = await db.query.jobInterviewAssistant.findFirst({
			where: and(
				eq(jobInterviewAssistant.slug, slug),
				eq(jobInterviewAssistant.userId, session.user.id)
			),
		});

		if (!generation) {
			throw new Error('Generation not found');
		}

		return {
			success: true,
			data: generation
		};
	} catch (error) {
		console.error('Error in getGenerationById:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function evaluateCode(
	questionText: string,
	userCode: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Code Evaluation Started ===');
		console.log('Question:', questionText.substring(0, 100) + '...');
		console.log('Language:', language);
		console.log('Interview ID:', interviewId);
		console.log('User Code Length:', userCode.length);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			console.log('Authentication failed - no session');
			throw new Error('User not authenticated');
		}
		console.log('User authenticated:', session.user.id);

		// Remove credit checking - credits are charged upfront
		console.log('Using prepaid credits from interview generation');

		// Use organized prompt
		const promptParams: CodeEvaluationParams = {
			questionText,
			userCode,
			language
		};

		const evaluationPrompt = getCodeEvaluationPrompt(promptParams);

		console.log('Calling Sarvam AI for evaluation...');

		// Call Sarvam AI for evaluation
		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [
					{
						role: 'user',
						content: evaluationPrompt
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			})
		});

		console.log('Sarvam AI response status:', response.status);

		if (!response.ok) {
			console.log('Sarvam AI API error:', response.status);
			throw new Error(`Sarvam AI API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sarvam AI response keys:', Object.keys(data));

		const evaluationText = data.choices?.[0]?.message?.content;

		if (!evaluationText) {
			console.log('No evaluation content received from AI');
			throw new Error('No evaluation received from AI');
		}

		console.log('Evaluation text length:', evaluationText.length);
		console.log('Evaluation preview:', evaluationText.substring(0, 200) + '...');

		// Parse the evaluation JSON
		let evaluation;
		try {
			evaluation = cleanAndParseJSON(evaluationText);
			console.log('Successfully parsed evaluation JSON');
			console.log('Evaluation score:', evaluation.score);
		} catch (error) {
			console.error('Failed to parse evaluation JSON:', error);
			console.error('Raw evaluation text:', evaluationText);
			throw new Error('Invalid evaluation format received');
		}

		// Validate evaluation structure
		if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 100 || !evaluation.feedback || typeof evaluation.feedback !== 'string' || evaluation.feedback.trim().length === 0) {
			console.log('Incomplete evaluation structure:', {
				hasValidScore: typeof evaluation.score === 'number' && evaluation.score >= 0 && evaluation.score <= 100,
				hasValidFeedback: !!evaluation.feedback && typeof evaluation.feedback === 'string' && evaluation.feedback.trim().length > 0,
				actualScore: evaluation.score,
				actualFeedback: evaluation.feedback
			});
			throw new Error('Incomplete evaluation received');
		}

		console.log('Saving evaluation to database...');

		// Save evaluation to database without credit deduction
		const [result] = await db.insert(codeEvaluation).values({
			interviewId,
			questionText,
			userCode,
			language,
			evaluation,
			score: evaluation.score,
			feedback: evaluation.feedback,
			strengths: evaluation.strengths || [],
			improvements: evaluation.improvements || [],
		}).returning();
		console.log('Code evaluation saved with ID:', result!.id);

		console.log('=== Code Evaluation Completed Successfully ===');

		return {
			success: true,
			data: {
				id: result!.id,
				score: result!.score,
				feedback: result!.feedback,
				strengths: result!.strengths,
				improvements: result!.improvements,
				evaluation: result!.evaluation
			}
		};

	} catch (error) {
		console.error('=== Code Evaluation Error ===');
		console.error('Error details:', error);
		console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function generateQuestionAnswer(
	questionText: string,
	questionType: 'technical' | 'behavioral' | 'coding',
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Generating Individual Answer ===');
		console.log('Question type:', questionType);
		console.log('Interview ID:', interviewId);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		// Remove credit checking - credits are charged upfront
		console.log('Using prepaid credits from interview generation');

		const promptParams: AnswerGenerationParams = {
			questionText,
			questionType
		};

		const prompt = questionType === 'coding'
			? getCodingAnswerPrompt(promptParams)
			: getGeneralAnswerPrompt(promptParams);

		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3,
				max_tokens: 1500
			})
		});

		if (!response.ok) {
			throw new Error(`AI API error: ${response.status}`);
		}

		const data = await response.json();
		const answerText = data.choices?.[0]?.message?.content;

		if (!answerText) {
			throw new Error('No answer received from AI');
		}

		console.log('Raw AI response:', answerText.substring(0, 200) + '...');

		let parsedAnswer;
		try {
			parsedAnswer = cleanAndParseSimpleJSON(answerText);
			console.log('Successfully parsed coding answer:', Object.keys(parsedAnswer));

			// Validate the structure for coding answers
			if (!parsedAnswer.solution || !parsedAnswer.explanation) {
				console.warn('Missing required fields, using fallback response');
				parsedAnswer = createFallbackResponse(answerText);
			}

		} catch (error) {
			console.error('Failed to parse AI response:', error);
			console.error('Full response was:', answerText);
			console.log('Using fallback response due to parsing error');
			parsedAnswer = createFallbackResponse(answerText);
		}

		// Save to database without credit deduction
		const [result] = await db.insert(questionAnswer).values({
			interviewId,
			questionText,
			questionType,
			answer: parsedAnswer,
		}).returning();

		return {
			success: true,
			data: {
				id: result!.id,
				answer: result!.answer,
				questionType: result!.questionType
			}
		};

	} catch (error) {
		console.error('Error generating answer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function getQuestionAnswer(
	questionText: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const existingAnswer = await db.query.questionAnswer.findFirst({
			where: and(
				eq(questionAnswer.questionText, questionText),
				eq(questionAnswer.interviewId, interviewId)
			),
		});

		return {
			success: true,
			data: existingAnswer
		};

	} catch (error) {
		console.error('Error getting question answer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// New function to transcribe voice to text with intelligent routing
// Uses Sarvam AI for short audio (<30s estimated) and ElevenLabs for longer audio (>=30s)
export async function transcribeVoiceToText(
	audioFile: File
): Promise<{ success: boolean; data?: { transcript: string; language?: string }; error?: string }> {
	try {
		console.log('=== Smart Voice Transcription Started ===');
		console.log('Audio file details:', {
			name: audioFile.name,
			size: audioFile.size,
			type: audioFile.type,
			sizeInMB: (audioFile.size / (1024 * 1024)).toFixed(2)
		});

		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		// Estimate audio duration based on file size
		const fileSizeKB = audioFile.size / 1024;
		let durationThresholdKB = 500; // Default threshold for 30 seconds

		// Adjust threshold based on file type
		if (audioFile.type.includes('wav') || audioFile.type.includes('audio/wav')) {
			durationThresholdKB = 700; // WAV files are larger (higher quality)
		} else if (audioFile.type.includes('mp3') || audioFile.type.includes('audio/mp3')) {
			durationThresholdKB = 500; // MP3 compressed
		} else if (audioFile.type.includes('webm') || audioFile.type.includes('audio/webm')) {
			durationThresholdKB = 250; // WebM highly compressed
		} else if (audioFile.type.includes('ogg') || audioFile.type.includes('audio/ogg')) {
			durationThresholdKB = 400; // OGG compressed
		}

		const estimatedDuration = (fileSizeKB / durationThresholdKB) * 30; // Rough estimation in seconds
		const shouldUseSarvam = fileSizeKB < durationThresholdKB;

		console.log('Audio Analysis:', {
			fileSizeKB: fileSizeKB.toFixed(1),
			durationThresholdKB,
			estimatedDurationSeconds: estimatedDuration.toFixed(1),
			recommendedService: shouldUseSarvam ? 'Sarvam AI (cheaper)' : 'ElevenLabs (better for long audio)'
		});

		// Route based on estimated duration
		if (shouldUseSarvam) {
			console.log('Using Sarvam AI for short audio (cost-effective)...');

			// Use Sarvam API for shorter audio files
			const formData = new FormData();
			formData.append('file', audioFile);
			formData.append('model', 'saarika:v2.5');
			formData.append('language_code', 'en-IN');

			try {
				const response = await fetch('https://api.sarvam.ai/speech-to-text', {
					method: 'POST',
					headers: {
						'api-subscription-key': process.env.SARVAM_API_KEY!,
					},
					body: formData
				});

				console.log('Sarvam Speech-to-Text response status:', response.status);

				if (response.ok) {
					const data = await response.json();
					console.log('Sarvam transcription successful');
					console.log('Transcript length:', data.transcript?.length || 0);

					if (data.transcript && data.transcript.trim().length > 0) {
						return {
							success: true,
							data: {
								transcript: data.transcript.trim(),
								language: data.language_code || 'en'
							}
						};
					}
				} else {
					console.log('Sarvam failed, falling back to ElevenLabs...');
				}
			} catch (sarvamError) {
				console.log('Sarvam exception, falling back to ElevenLabs...');
				console.log('Sarvam error:', sarvamError);
			}
		}

		// Use ElevenLabs for longer audio or if Sarvam fails
		if (isElevenLabsConfigured()) {
			console.log('Using ElevenLabs for longer/complex audio (advanced features)...');

			try {
				// Use different ElevenLabs settings based on estimated duration
				let elevenLabsResult;

				if (estimatedDuration > 60) {
					// For very long audio, use detailed transcription with full features
					console.log('Using detailed transcription for long audio...');
					elevenLabsResult = await detailedTranscribeWithElevenLabs(audioFile);
				} else {
					// For medium-length audio, use quick transcription
					console.log('Using quick transcription for medium audio...');
					elevenLabsResult = await quickTranscribeWithElevenLabs(audioFile);
				}

				if (elevenLabsResult.success && elevenLabsResult.data) {
					console.log('ElevenLabs transcription successful');
					console.log('Transcript length:', elevenLabsResult.data.transcript.length);
					console.log('Language detected:', elevenLabsResult.data.language_code);

					return {
						success: true,
						data: {
							transcript: elevenLabsResult.data.transcript,
							language: elevenLabsResult.data.language_code
						}
					};
				} else {
					console.log('ElevenLabs failed:', elevenLabsResult.error);
				}
			} catch (elevenLabsError) {
				console.log('ElevenLabs exception:', elevenLabsError);
			}
		} else {
			console.log('ElevenLabs not configured');
		}

		// If both fail, return appropriate error
		const errorMessage = shouldUseSarvam
			? 'Audio transcription failed. Please try recording a clear, shorter response (under 30 seconds).'
			: 'Audio transcription failed. Please try recording a clear response or check your internet connection.';

		console.log('All transcription methods failed');
		return {
			success: false,
			error: errorMessage
		};

	} catch (error) {
		console.error('=== Smart Voice Transcription Error ===');
		console.error('Error details:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Audio transcription failed. Please try again.'
		};
	}
}

// Function to evaluate user's answer to technical/behavioral questions
export async function evaluateUserQuestionResponse(
	questionText: string,
	userAnswer: string,
	questionType: 'technical' | 'behavioral',
	questionIndex: number,
	interviewId: string,
	answerMethod: 'text' | 'voice' = 'text'
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const session = await getSession(headers())
		if (!session) {
			throw new Error('User not found')
		}

		console.log('Evaluating user response:', { questionText, userAnswer, questionType, questionIndex, interviewId, answerMethod })

		// Get the expert answer for comparison
		const generation = await db.query.jobInterviewAssistant.findFirst({
			where: eq(jobInterviewAssistant.id, interviewId),
			columns: { generatedContent: true },
		});

		if (!generation) {
			throw new Error('Interview generation not found')
		}

		const generatedContent = generation.generatedContent as any
		let expertAnswer = ''

		if (questionType === 'technical') {
			expertAnswer = generatedContent.technicalQuestions?.[questionIndex]?.answer || ''
		} else {
			expertAnswer = generatedContent.behavioralQuestions?.[questionIndex]?.answer || ''
		}

		// Create evaluation prompt using extracted functions
		const evaluationPromptParams: UserResponseEvaluationParams = {
			questionText,
			userAnswer,
			questionType,
			expertAnswer
		};

		const evaluationPrompt = questionType === 'technical'
			? getTechnicalResponseEvaluationPrompt(evaluationPromptParams)
			: getBehavioralResponseEvaluationPrompt(evaluationPromptParams);

		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [
					{
						role: 'system',
						content: 'You are a strict technical interviewer. Be thorough and critical in your evaluation. Respond ONLY with valid JSON objects, no markdown or additional text.'
					},
					{
						role: 'user',
						content: evaluationPrompt
					}
				],
				temperature: 0.2, // Lower temperature for more consistent, stricter evaluation
				max_tokens: 2000,
				response_format: { type: "json_object" } // Request JSON response format
			})
		})

		if (!response.ok) {
			throw new Error(`Sarvam API error: ${response.status}`)
		}

		const data = await response.json()
		const evaluationText = data.choices[0]?.message?.content

		if (!evaluationText) {
			throw new Error('No evaluation received from AI')
		}

		// Parse the JSON response with validation
		let evaluation
		try {
			evaluation = cleanAndParseJSON(evaluationText)

			// Validate evaluation structure
			if (!evaluation.score || typeof evaluation.score !== 'number' ||
				evaluation.score < 0 || evaluation.score > 100 ||
				!evaluation.feedback || typeof evaluation.feedback !== 'string' ||
				!Array.isArray(evaluation.strengths) || !Array.isArray(evaluation.improvements) ||
				!evaluation.comparedToExpert || typeof evaluation.comparedToExpert !== 'object') {
				throw new Error('Invalid evaluation structure')
			}

			// Ensure score components add up correctly
			if (questionType === 'technical') {
				const totalScore = (evaluation.technicalAccuracy?.score || 0) +
					(evaluation.implementationUnderstanding?.score || 0) +
					(evaluation.bestPractices?.score || 0) +
					(evaluation.communication?.score || 0)

				if (Math.abs(totalScore - evaluation.score) > 1) { // Allow 1 point difference for rounding
					evaluation.score = totalScore // Correct the total score
				}
			} else {
				const totalScore = (evaluation.starAnalysis?.situation?.score || 0) +
					(evaluation.starAnalysis?.task?.score || 0) +
					(evaluation.starAnalysis?.action?.score || 0) +
					(evaluation.starAnalysis?.result?.score || 0) +
					(evaluation.specificity?.score || 0) +
					(evaluation.relevance?.score || 0) +
					(evaluation.professionalism?.score || 0)

				if (Math.abs(totalScore - evaluation.score) > 1) { // Allow 1 point difference for rounding
					evaluation.score = totalScore // Correct the total score
				}
			}
		} catch (parseError) {
			console.error('Failed to parse evaluation:', parseError)
			throw new Error('Invalid evaluation format received')
		}

		// Save the evaluation to database
		const [savedResponse] = await db.insert(userQuestionResponse).values({
			interviewId,
			questionText,
			questionType,
			questionIndex,
			userAnswer,
			answerMethod,
			score: evaluation.score,
			feedback: evaluation.feedback,
			strengths: evaluation.strengths || [],
			improvements: evaluation.improvements || [],
			comparedToExpert: evaluation.comparedToExpert || {},
			evaluationDetails: evaluation // Save full evaluation details
		}).returning();

		return {
			success: true,
			data: savedResponse
		}

	} catch (error) {
		console.error('Error evaluating user response:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to evaluate response'
		}
	}
}

// Function to get user's response for a specific question
export async function getUserQuestionResponse(
	interviewId: string,
	questionType: 'technical' | 'behavioral',
	questionIndex: number
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const userResp = await db.query.userQuestionResponse.findFirst({
			where: and(
				eq(userQuestionResponse.interviewId, interviewId),
				eq(userQuestionResponse.questionType, questionType),
				eq(userQuestionResponse.questionIndex, questionIndex)
			),
		});

		return {
			success: true,
			data: userResp
		};

	} catch (error) {
		console.error('Error getting user question response:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Function to get all user responses for an interview
export async function getAllUserQuestionResponses(
	interviewId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const userResponses = await db.query.userQuestionResponse.findMany({
			where: eq(userQuestionResponse.interviewId, interviewId),
			orderBy: [
				userQuestionResponse.questionType,
				userQuestionResponse.questionIndex,
			],
		});

		return {
			success: true,
			data: userResponses
		};

	} catch (error) {
		console.error('Error getting all user question responses:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Function to generate coding question answer in specific language
export async function generateCodingQuestionAnswer(
	questionText: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Generating Coding Answer in Language ===');
		console.log('Question:', questionText.substring(0, 100) + '...');
		console.log('Language:', language);
		console.log('Interview ID:', interviewId);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		// Use Sarvam AI to generate the coding answer in the specific language
		const prompt = `You are an expert programming instructor. Generate a complete solution for this coding problem in ${language}.

PROBLEM:
${questionText}

CRITICAL: You MUST respond with ONLY a valid JSON object. No additional text, no markdown, no code blocks, no explanations outside the JSON.

Generate a JSON response with EXACTLY this structure:
{
	"solution": "// Complete working code solution in ${language}",
	"explanation": "Clear explanation of the approach and logic",
	"approach": "Step-by-step approach description",
	"timeComplexity": "Time complexity analysis (e.g., O(n))",
	"spaceComplexity": "Space complexity analysis (e.g., O(1))",
	"keyPoints": ["Key insight 1", "Key insight 2", "Key insight 3"]
}

Requirements:
- Provide a complete, working solution in ${language}
- Include proper comments in the code
- Explain the algorithm clearly
- Provide complexity analysis
- Make sure the code follows best practices for ${language}
- The solution should be efficient and optimized

${questionText.toLowerCase().includes('react') || questionText.toLowerCase().includes('component') ? 'IMPORTANT: For React/UI questions, use functional components with hooks (useState, useEffect, etc.) NOT class-based components.' : ''}

CRITICAL JSON FORMATTING RULES:
1. Start your response with { and end with }
2. All property names must be in double quotes
3. All string values must be in double quotes and properly escaped
4. Use actual newlines in the "solution" field - the code editor will handle formatting
5. No trailing commas in arrays or objects
6. No markdown code blocks (no \`\`\`json or \`\`\`)
7. No text before or after the JSON object
8. The "solution" field must contain ONLY the code, no extra formatting or escape sequences
9. Write clean, readable code that can be directly copied and used

IMPORTANT: Your response must be VALID JSON only. Start with { and end with }. No extra text before or after. No markdown code blocks like \`\`\`json. Just pure JSON.`;

		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3,
				max_tokens: 2500
			})
		});

		if (!response.ok) {
			throw new Error(`AI API error: ${response.status}`);
		}

		const data = await response.json();
		const answerText = data.choices?.[0]?.message?.content;

		if (!answerText) {
			throw new Error('No answer received from AI');
		}

		console.log('Raw AI response:', answerText.substring(0, 200) + '...');

		let parsedAnswer;
		try {
			parsedAnswer = cleanAndParseSimpleJSON(answerText);
			console.log('Successfully parsed coding answer:', Object.keys(parsedAnswer));

			// Validate the structure for coding answers
			if (!parsedAnswer.solution || !parsedAnswer.explanation) {
				console.warn('Missing required fields, using fallback response');
				parsedAnswer = createFallbackResponse(answerText);
			}

		} catch (error) {
			console.error('Failed to parse AI response:', error);
			console.error('Full response was:', answerText);
			console.log('Using fallback response due to parsing error');
			parsedAnswer = createFallbackResponse(answerText);
		}

		// Save to database with language field
		const [result] = await db.insert(questionAnswer).values({
			interviewId,
			questionText,
			questionType: 'coding',
			language,
			answer: parsedAnswer,
		}).returning();

		return {
			success: true,
			data: {
				id: result!.id,
				answer: result!.answer,
				questionType: result!.questionType,
				language: language
			}
		};

	} catch (error) {
		console.error('Error generating coding answer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Function to get coding question answer for specific language
export async function getCodingQuestionAnswer(
	questionText: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const existingAnswer = await db.query.questionAnswer.findFirst({
			where: and(
				eq(questionAnswer.questionText, questionText),
				eq(questionAnswer.language, language),
				eq(questionAnswer.interviewId, interviewId)
			),
		});

		return {
			success: true,
			data: existingAnswer
		};

	} catch (error) {
		console.error('Error getting coding question answer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Run code evaluation without storing in database (for "Run" button)
export async function runCodeEvaluation(
	questionText: string,
	userCode: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Code Run Evaluation Started (No DB Storage) ===');
		console.log('Question:', questionText.substring(0, 100) + '...');
		console.log('Language:', language);
		console.log('Interview ID:', interviewId);
		console.log('User Code Length:', userCode.length);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			console.log('Authentication failed - no session');
			throw new Error('User not authenticated');
		}
		console.log('User authenticated:', session.user.id);

		// Use organized prompt
		const promptParams: CodeEvaluationParams = {
			questionText,
			userCode,
			language
		};

		const evaluationPrompt = getCodeEvaluationPrompt(promptParams);

		console.log('Calling Sarvam AI for evaluation...');

		// Call Sarvam AI for evaluation
		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [
					{
						role: 'user',
						content: evaluationPrompt
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			})
		});

		console.log('Sarvam AI response status:', response.status);

		if (!response.ok) {
			console.log('Sarvam AI API error:', response.status);
			throw new Error(`Sarvam AI API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sarvam AI response keys:', Object.keys(data));

		const evaluationText = data.choices?.[0]?.message?.content;

		if (!evaluationText) {
			console.log('No evaluation content received from AI');
			throw new Error('No evaluation received from AI');
		}

		console.log('Evaluation text length:', evaluationText.length);
		console.log('Evaluation preview:', evaluationText.substring(0, 200) + '...');

		// Parse the evaluation JSON
		let evaluation;
		try {
			evaluation = cleanAndParseJSON(evaluationText);
			console.log('Successfully parsed evaluation JSON');
			console.log('Evaluation score:', evaluation.score);
		} catch (error) {
			console.error('Failed to parse evaluation JSON:', error);
			console.error('Raw evaluation text:', evaluationText);
			throw new Error('Invalid evaluation format received');
		}

		// Validate evaluation structure
		if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 100 || !evaluation.feedback || typeof evaluation.feedback !== 'string' || evaluation.feedback.trim().length === 0) {
			console.log('Incomplete evaluation structure:', {
				hasValidScore: typeof evaluation.score === 'number' && evaluation.score >= 0 && evaluation.score <= 100,
				hasValidFeedback: !!evaluation.feedback && typeof evaluation.feedback === 'string' && evaluation.feedback.trim().length > 0,
				actualScore: evaluation.score,
				actualFeedback: evaluation.feedback
			});
			throw new Error('Incomplete evaluation received');
		}

		console.log('=== Code Run Evaluation Completed Successfully (No DB Storage) ===');

		return {
			success: true,
			data: {
				score: evaluation.score,
				feedback: evaluation.feedback,
				strengths: evaluation.strengths || [],
				improvements: evaluation.improvements || [],
				evaluation: evaluation
			}
		};

	} catch (error) {
		console.error('=== Code Run Evaluation Error ===');
		console.error('Error details:', error);
		console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Submit code evaluation with database storage (for "Submit" button)
export async function submitCodeEvaluation(
	questionText: string,
	userCode: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Code Submit Evaluation Started (With DB Storage) ===');
		console.log('Question:', questionText.substring(0, 100) + '...');
		console.log('Language:', language);
		console.log('Interview ID:', interviewId);
		console.log('User Code Length:', userCode.length);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			console.log('Authentication failed - no session');
			throw new Error('User not authenticated');
		}
		console.log('User authenticated:', session.user.id);

		// Use organized prompt
		const promptParams: CodeEvaluationParams = {
			questionText,
			userCode,
			language
		};

		const evaluationPrompt = getCodeEvaluationPrompt(promptParams);

		console.log('Calling Sarvam AI for evaluation...');

		// Call Sarvam AI for evaluation
		const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'sarvam-m',
				messages: [
					{
						role: 'user',
						content: evaluationPrompt
					}
				],
				temperature: 0.3,
				max_tokens: 2000
			})
		});

		console.log('Sarvam AI response status:', response.status);

		if (!response.ok) {
			console.log('Sarvam AI API error:', response.status);
			throw new Error(`Sarvam AI API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('Sarvam AI response keys:', Object.keys(data));

		const evaluationText = data.choices?.[0]?.message?.content;

		if (!evaluationText) {
			console.log('No evaluation content received from AI');
			throw new Error('No evaluation received from AI');
		}

		console.log('Evaluation text length:', evaluationText.length);
		console.log('Evaluation preview:', evaluationText.substring(0, 200) + '...');

		// Parse the evaluation JSON
		let evaluation;
		try {
			evaluation = cleanAndParseJSON(evaluationText);
			console.log('Successfully parsed evaluation JSON');
			console.log('Evaluation score:', evaluation.score);
		} catch (error) {
			console.error('Failed to parse evaluation JSON:', error);
			console.error('Raw evaluation text:', evaluationText);
			throw new Error('Invalid evaluation format received');
		}

		// Validate evaluation structure
		if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 100 || !evaluation.feedback || typeof evaluation.feedback !== 'string' || evaluation.feedback.trim().length === 0) {
			console.log('Incomplete evaluation structure:', {
				hasValidScore: typeof evaluation.score === 'number' && evaluation.score >= 0 && evaluation.score <= 100,
				hasValidFeedback: !!evaluation.feedback && typeof evaluation.feedback === 'string' && evaluation.feedback.trim().length > 0,
				actualScore: evaluation.score,
				actualFeedback: evaluation.feedback
			});
			throw new Error('Incomplete evaluation received');
		}

		console.log('Saving submission to database...');

		// Save evaluation to database with isSubmitted = true
		const [result] = await db.insert(codeEvaluation).values({
			interviewId,
			questionText,
			userCode,
			language,
			evaluation,
			score: evaluation.score,
			feedback: evaluation.feedback,
			strengths: evaluation.strengths || [],
			improvements: evaluation.improvements || [],
			isSubmitted: true,
		}).returning();
		console.log('Code submission saved with ID:', result!.id);

		console.log('=== Code Submit Evaluation Completed Successfully ===');

		return {
			success: true,
			data: {
				id: result!.id,
				score: result!.score,
				feedback: result!.feedback,
				strengths: result!.strengths,
				improvements: result!.improvements,
				evaluation: result!.evaluation,
				isSubmitted: result!.isSubmitted,
				createdAt: result!.createdAt
			}
		};

	} catch (error) {
		console.error('=== Code Submit Evaluation Error ===');
		console.error('Error details:', error);
		console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Get previous submissions for a specific question and language
export async function getPreviousSubmissions(
	questionText: string,
	language: string,
	interviewId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
	try {
		console.log('=== Getting Previous Submissions ===');
		console.log('Question:', questionText.substring(0, 50) + '...');
		console.log('Language:', language);
		console.log('Interview ID:', interviewId);

		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		const submissions = await db.query.codeEvaluation.findMany({
			where: and(
				eq(codeEvaluation.interviewId, interviewId),
				eq(codeEvaluation.questionText, questionText),
				eq(codeEvaluation.language, language),
				eq(codeEvaluation.isSubmitted, true)
			),
			orderBy: [desc(codeEvaluation.createdAt)],
			columns: {
				id: true,
				userCode: true,
				score: true,
				feedback: true,
				strengths: true,
				improvements: true,
				evaluation: true,
				createdAt: true,
				isSubmitted: true,
			},
		});

		console.log('Found', submissions.length, 'previous submissions');

		return {
			success: true,
			data: submissions
		};

	} catch (error) {
		console.error('=== Get Previous Submissions Error ===');
		console.error('Error details:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Get public interview plans
export async function getPublicInterviewPlans(limit: number = 10) {
	try {
		const publicPlans = await db.query.jobInterviewAssistant.findMany({
			where: eq(jobInterviewAssistant.isPublic, true),
			with: {
				user: {
					columns: { name: true },
				},
			},
			orderBy: [desc(jobInterviewAssistant.purchaseCount), desc(jobInterviewAssistant.createdAt)],
			limit,
			columns: {
				id: true,
				position: true,
				description: true,
				publicCost: true,
				creditsCost: true,
				technicalCount: true,
				behavioralCount: true,
				codingCount: true,
				includeAnswers: true,
				includePractice: true,
				purchaseCount: true,
				viewCount: true,
				rating: true,
				tags: true,
				slug: true,
				createdAt: true,
			},
		});

		return {
			success: true,
			data: publicPlans.map((plan: any) => ({
				id: plan.id,
				position: plan.position,
				description: plan.description,
				cost: plan.publicCost || 0,
				originalCost: plan.creditsCost,
				technicalCount: plan.technicalCount,
				behavioralCount: plan.behavioralCount,
				codingCount: plan.codingCount,
				includeAnswers: plan.includeAnswers,
				includePractice: plan.includePractice,
				purchaseCount: plan.purchaseCount,
				viewCount: plan.viewCount,
				rating: plan.rating || 4.8,
				tags: plan.tags,
				slug: plan.slug,
				createdAt: plan.createdAt,
				creator: plan.user?.name || 'Anonymous'
			}))
		};
	} catch (error) {
		console.error('Error getting public interview plans:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Get user's own interview plans with pagination and filters
export async function getUserInterviewPlans({
	page = 1,
	limit = 30,
	search = '',
	visibility = 'all' // 'all', 'public', 'private'
}: {
	page?: number;
	limit?: number;
	search?: string;
	visibility?: 'all' | 'public' | 'private';
} = {}) {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		// Build where conditions
		const conditions = [eq(jobInterviewAssistant.userId, session.user.id)];

		// Add visibility filter
		if (visibility === 'public') {
			conditions.push(eq(jobInterviewAssistant.isPublic, true));
		} else if (visibility === 'private') {
			conditions.push(eq(jobInterviewAssistant.isPublic, false));
		}

		// Add search filter
		if (search.trim()) {
			const { ilike } = await import('drizzle-orm');
			conditions.push(ilike(jobInterviewAssistant.position, `%${search.trim()}%`));
		}

		const whereClause = and(...conditions);

		// Calculate pagination
		const skip = (page - 1) * limit;

		// Get total count for pagination
		const countRows = await db
			.select({ count: sql<number>`count(*)` })
			.from(jobInterviewAssistant)
			.where(whereClause);
		const totalCount = Number(countRows[0]?.count ?? 0);

		// Get plans with pagination
		const plans = await db.query.jobInterviewAssistant.findMany({
			where: whereClause,
			orderBy: [desc(jobInterviewAssistant.createdAt)],
			offset: skip,
			limit,
			columns: {
				id: true,
				position: true,
				description: true,
				isPublic: true,
				publicCost: true,
				creditsCost: true,
				technicalCount: true,
				behavioralCount: true,
				codingCount: true,
				includeAnswers: true,
				includePractice: true,
				purchaseCount: true,
				viewCount: true,
				rating: true,
				tags: true,
				slug: true,
				createdAt: true,
			},
		});

		const total = totalCount;
		const totalPages = Math.ceil(total / limit);
		const hasNext = page < totalPages;
		const hasPrev = page > 1;

		return {
			success: true,
			data: {
				plans: plans.map((plan: any) => ({
					id: plan.id,
					position: plan.position,
					description: plan.description,
					isPublic: plan.isPublic,
					cost: plan.isPublic ? (plan.publicCost || 0) : (plan.creditsCost || 0),
					originalCost: plan.creditsCost,
					technicalCount: plan.technicalCount,
					behavioralCount: plan.behavioralCount,
					codingCount: plan.codingCount,
					includeAnswers: plan.includeAnswers,
					includePractice: plan.includePractice,
					purchaseCount: plan.purchaseCount,
					viewCount: plan.viewCount,
					rating: plan.rating || 4.8,
					tags: plan.tags,
					slug: plan.slug,
					createdAt: plan.createdAt,
					creator: 'You' // Always 'You' for user's own plans
				})),
				pagination: {
					currentPage: page,
					totalPages,
					totalCount: total,
					hasNext,
					hasPrev,
					limit
				}
			}
		};
	} catch (error) {
		console.error('Error getting user interview plans:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// Purchase a public interview plan
export async function purchaseInterviewPlan(planId: string) {
	try {
		const session = await getSession(headers())
		if (!session?.user?.id) {
			throw new Error('User not authenticated');
		}

		// Get the public plan
		const publicPlan = await db.query.jobInterviewAssistant.findFirst({
			where: and(
				eq(jobInterviewAssistant.id, planId),
				eq(jobInterviewAssistant.isPublic, true)
			),
		});

		if (!publicPlan) {
			throw new Error('Public plan not found');
		}

		if (publicPlan.userId === session.user.id) {
			throw new Error('You cannot purchase your own plan');
		}

		const cost = publicPlan.publicCost || 0;

		// Check if user has enough credits
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: { credits: true },
		});

		if (!user || (user.credits ?? 0) < cost) {
			throw new Error(`Insufficient credits. Need ${cost} credits.`);
		}

		// Generate new slug for the purchased plan
		const newSlug = generateSlug(publicPlan.position);

		const result = await withTransaction(async (tx) => {
			// Deduct credits from buyer
			// Guarded in SQL, not by the balance read above: two concurrent requests
			// both pass a read-then-write check and both debit. Zero rows updated means
			// the balance moved under us, and throwing rolls the transaction back.
			const debitedBuyer = await tx.update(users)
				.set({ credits: sql`${users.credits} - ${cost}` })
				.where(and(eq(users.id, session.user.id), sql`${users.credits} >= ${cost}`))
				.returning({ credits: users.credits });
			if (debitedBuyer.length === 0) throw new Error("Insufficient credits");

			// Create credit transaction
			await tx.insert(creditTransactions).values({
				userId: session.user.id,
				amount: -cost,
				type: 'SPEND',
				currency: 'INR',
				description: `Purchased interview plan: ${publicPlan.position}`,
			});

			// Create new interview plan for the buyer
			const [newPlan] = await tx.insert(jobInterviewAssistant).values({
				userId: session.user.id,
				position: publicPlan.position,
				jobDescription: publicPlan.jobDescription,
				companyUrl: publicPlan.companyUrl,
				companyInfo: publicPlan.companyInfo ?? undefined,
				generatedContent: publicPlan.generatedContent,
				includeAnswers: publicPlan.includeAnswers,
				includePractice: publicPlan.includePractice,
				technicalCount: publicPlan.technicalCount,
				behavioralCount: publicPlan.behavioralCount,
				codingCount: publicPlan.codingCount,
				isPublic: false, // Purchased plans are private
				creditsCost: cost, // Store the purchase cost
				description: `${publicPlan.description} (Purchased)`,
				tags: publicPlan.tags,
				slug: newSlug,
			}).returning();

			// Create purchase record
			await tx.insert(interviewPlanPurchase).values({
				buyerId: session.user.id,
				interviewPlanId: planId,
				cost,
				newInterviewPlanId: newPlan!.id,
			});

			// Update purchase count on original plan
			await tx.update(jobInterviewAssistant)
				.set({ purchaseCount: sql`${jobInterviewAssistant.purchaseCount} + 1` })
				.where(eq(jobInterviewAssistant.id, planId));

			return newPlan!;
		});

		return {
			success: true,
			data: {
				slug: result.slug,
				id: result.id,
				position: result.position
			}
		};
	} catch (error) {
		console.error('Error purchasing interview plan:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
