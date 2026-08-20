"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getBackgroundJobStatus } from "@/actions/(main)/workers/jobs.action"

// ─────────────────────────────────────────────────────────────────────────────
// One polling hook for every background job.
//
// Six flows need exactly this and the first of them hand-rolled it: a bare
// setInterval with no backoff, no abort on unmount and no terminal-state stop,
// which keeps hitting the server after the component is gone and after the job
// can no longer change.
//
// Behaviour worth knowing:
//   - polls fast at first (jobs that fail, fail early) then backs off, so a
//     ninety-second generation is not ninety requests
//   - stops on the first terminal status, permanently
//   - stops on unmount, and ignores a response that arrives after it
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_POLL_MS = 1_000
const MAX_POLL_MS = 5_000
const BACKOFF = 1.4

/**
 * Wall-clock ceiling on following a job.
 *
 * Needed because "the job reaches a terminal status" is NOT guaranteed. The
 * worker's status writes are best-effort by design - `writeStatus` in
 * `apps/worker/src/jobs/base.ts` swallows its errors so a failed progress write
 * can never abort a run the user paid for. The consequence is that a job can
 * genuinely finish while the row still says `active`, and a poller with no
 * deadline then spins forever behind a spinner the user cannot dismiss.
 *
 * Ten minutes is past the slowest job in the product (the 90s Assistants poll,
 * plus two retries) with room to spare.
 */
const DEADLINE_MS = 10 * 60 * 1000

/**
 * How many consecutive failed reads to tolerate before giving up.
 *
 * A read failing once is a blip worth ignoring - the job is running on the worker
 * regardless. Failing this many times in a row is a signed-out session or a dead
 * database, and continuing to poll just hides it.
 */
const MAX_CONSECUTIVE_READ_FAILURES = 8

export interface BackgroundJobState<TResult> {
    status: "idle" | "waiting" | "active" | "completed" | "failed"
    progress: number
    phaseLabel?: string
    result?: TResult
    error?: string
    /** True once the job will never change again. */
    done: boolean
}

const IDLE: BackgroundJobState<never> = { status: "idle", progress: 0, done: false }

/**
 * Poll `jobId` until it finishes.
 *
 * Pass `null` to stay idle - that is the normal state before the user has
 * started anything, and it means the caller does not need a conditional hook.
 */
export function useBackgroundJob<TResult = Record<string, unknown>>(
    jobId: string | null,
    options: { onCompleted?: (result: TResult) => void; onFailed?: (error: string) => void } = {},
): BackgroundJobState<TResult> {
    const [state, setState] = useState<BackgroundJobState<TResult>>(IDLE as BackgroundJobState<TResult>)

    // Held in refs so a caller can pass inline callbacks without restarting the
    // poll on every render.
    const onCompleted = useRef(options.onCompleted)
    const onFailed = useRef(options.onFailed)
    onCompleted.current = options.onCompleted
    onFailed.current = options.onFailed

    useEffect(() => {
        if (!jobId) {
            setState(IDLE as BackgroundJobState<TResult>)
            return
        }

        let cancelled = false
        let timer: ReturnType<typeof setTimeout> | undefined
        let delay = FIRST_POLL_MS
        let failures = 0
        const deadline = Date.now() + DEADLINE_MS

        setState({ status: "waiting", progress: 0, done: false })

        const giveUp = (error: string) => {
            setState((prev) => ({ ...prev, status: "failed", done: true, error }))
            onFailed.current?.(error)
        }

        const poll = async () => {
            if (Date.now() > deadline) {
                giveUp("This is taking longer than expected. It may still finish - check back in a few minutes.")
                return
            }

            const res = await getBackgroundJobStatus<TResult>(jobId)
            if (cancelled) return

            if (!res.success) {
                // A transient read failure is not a failed job. Keep polling;
                // the job itself is running on the worker regardless - but stop
                // eventually, or a signed-out session polls silently forever.
                if (++failures >= MAX_CONSECUTIVE_READ_FAILURES) {
                    giveUp(res.error ?? "Lost track of this job. Please refresh.")
                    return
                }
                timer = setTimeout(poll, delay)
                delay = Math.min(delay * BACKOFF, MAX_POLL_MS)
                return
            }
            failures = 0

            const status = (res.status ?? "waiting") as BackgroundJobState<TResult>["status"]
            setState({
                status,
                progress: res.progress ?? 0,
                phaseLabel: res.phaseLabel,
                result: res.result,
                error: res.error,
                done: Boolean(res.done),
            })

            if (res.done) {
                if (status === "completed") onCompleted.current?.(res.result as TResult)
                else onFailed.current?.(res.error ?? "The job failed")
                return
            }

            timer = setTimeout(poll, delay)
            delay = Math.min(delay * BACKOFF, MAX_POLL_MS)
        }

        timer = setTimeout(poll, FIRST_POLL_MS)

        return () => {
            cancelled = true
            if (timer) clearTimeout(timer)
        }
    }, [jobId])

    return state
}

/**
 * The same poll as a promise, for callers that are already inside an async
 * handler and just want to await the outcome (`await runJob(...)`).
 *
 * Returns rather than throws on failure: every call site here renders the error
 * instead of propagating it.
 */
export async function awaitBackgroundJob<TResult = Record<string, unknown>>(
    jobId: string,
    onProgress?: (progress: number, phaseLabel?: string) => void,
    signal?: AbortSignal,
): Promise<{ ok: true; result: TResult } | { ok: false; error: string }> {
    let delay = FIRST_POLL_MS
    let failures = 0
    const deadline = Date.now() + DEADLINE_MS

    for (;;) {
        if (signal?.aborted) return { ok: false, error: "Cancelled" }
        await new Promise((r) => setTimeout(r, delay))
        delay = Math.min(delay * BACKOFF, MAX_POLL_MS)

        if (Date.now() > deadline) {
            return {
                ok: false,
                error: "This is taking longer than expected. It may still finish - check back in a few minutes.",
            }
        }

        const res = await getBackgroundJobStatus<TResult>(jobId)
        if (signal?.aborted) return { ok: false, error: "Cancelled" }

        if (!res.success) {
            // A transient read failure is not a failed job. Keep going, but not
            // forever - see MAX_CONSECUTIVE_READ_FAILURES.
            if (++failures >= MAX_CONSECUTIVE_READ_FAILURES) {
                return { ok: false, error: res.error ?? "Lost track of this job. Please refresh." }
            }
            continue
        }
        failures = 0

        onProgress?.(res.progress ?? 0, res.phaseLabel)

        if (res.done) {
            return res.status === "completed"
                ? { ok: true, result: res.result as TResult }
                : { ok: false, error: res.error ?? "The job failed" }
        }
    }
}
