'use server'

import { getSession } from '@repo/auth'
import { headers } from 'next/headers'
import { callExecutorWorker } from '@/lib/workers/client'
import { isAbortError, toErrorMessage } from '@/lib/errors'

// ─────────────────────────────────────────────────────────────────────────────
// Running user code.
//
// This is the one worker call in the product that is NOT a background job: the
// code-execution worker owns a Cloudflare Container (a real Linux sandbox with
// node/tsx/python3/gcc/g++/jdk), runs the submission, and answers on the same
// request. A five-second program does not want an alarm, a job row and a poll
// loop between the user pressing Run and seeing output.
//
// In production it is reached over the CODE_EXECUTOR service binding, so the
// request never leaves Cloudflare's network and the executor does not have to be
// publicly reachable. Locally it falls back to NEXT_PUBLIC_WORKER_URL.
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c'

export interface TestCase {
    input: string
    expectedOutput: string
    description?: string
}

export interface TestCaseResult {
    passed: boolean
    input: string
    expectedOutput: string
    actualOutput: string
    description?: string
}

export interface ExecuteCodeResult {
    success: boolean
    stdout?: string
    stderr?: string
    exitCode?: number
    executionTimeMs?: number
    testResults?: TestCaseResult[]
    allTestsPassed?: boolean
    error?: string
}

/** Wall-clock ceiling on the app side. The container enforces its own too. */
const EXECUTION_TIMEOUT_MS = 15_000

export async function executeCode(
    code: string,
    language: SupportedLanguage,
    testCases?: TestCase[]
): Promise<ExecuteCodeResult> {
    const session = await getSession(headers())
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized. Please sign in to run code.' }
    }

    const secret = process.env.WORKER_SECRET
    if (!secret) {
        return { success: false, error: 'Code execution is not configured.' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS)

    try {
        const response = await callExecutorWorker('/api/v1/execute', {
            token: secret,
            body: { code, language, testCases: testCases || [] },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            return {
                success: false,
                error: `Code execution service returned ${response.status}: ${errorText}`,
            }
        }

        const data = (await response.json()) as Record<string, unknown>

        const result: ExecuteCodeResult = {
            success: (data.success as boolean) ?? true,
            stdout: (data.stdout as string) ?? '',
            stderr: (data.stderr as string) ?? '',
            exitCode: (data.exitCode as number) ?? 0,
            executionTimeMs: (data.executionTimeMs as number) ?? (data.execution_time_ms as number) ?? 0,
        }

        if (data.testResults || data.test_results) {
            const rawResults = (data.testResults ?? data.test_results ?? []) as Array<Record<string, unknown>>
            result.testResults = rawResults.map((r) => ({
                passed: Boolean(r.passed),
                input: String(r.input ?? ''),
                expectedOutput: String(r.expectedOutput ?? r.expected_output ?? ''),
                actualOutput: String(r.actualOutput ?? r.actual_output ?? ''),
                description: r.description ? String(r.description) : undefined,
            }))
            result.allTestsPassed =
                (data.allTestsPassed as boolean) ??
                (data.all_tests_passed as boolean) ??
                result.testResults.every((t) => t.passed)
        }

        return result
    } catch (err: unknown) {
        clearTimeout(timeoutId)

        if (isAbortError(err)) {
            return { success: false, error: 'Code execution timed out after 15 seconds.' }
        }

        console.error('[executeCode] failed:', toErrorMessage(err))
        return { success: false, error: 'Code execution service unavailable' }
    }
}
