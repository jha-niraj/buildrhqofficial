import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// Talking to the two Cloudflare workers.
//
//   WORKER          apps/worker        background jobs (Durable Object + Alarm)
//   CODE_EXECUTOR   apps/shipitworker  running user code inside a Container
//
// In production this app and both workers run on Cloudflare, so they are wired
// together with SERVICE BINDINGS (declared in apps/main/wrangler.jsonc) rather
// than public fetches to workers.dev:
//
//   - the request never leaves Cloudflare's network - no DNS, no TLS handshake,
//     no public hop, and no egress
//   - there is no URL to keep in sync across preview/staging/production
//   - neither worker has to be publicly reachable at all
//
// Locally there is no binding, because `next dev` is not running inside a
// Worker. So each call falls back to an HTTP fetch at the matching *_URL.
//
// Both paths speak the same protocol - a `Request` in, a `Response` out - so
// callers do not branch. That is the whole reason this file exists: without it
// every call site would need its own binding-or-fetch conditional, and they
// would drift.
// ─────────────────────────────────────────────────────────────────────────────

/** The subset of a Cloudflare service binding this app uses. */
interface ServiceBinding {
    fetch: (request: Request) => Promise<Response>;
}

/**
 * A binding by name, or null when not running on Workers.
 *
 * `getCloudflareContext` is imported lazily: `next dev` does not run inside a
 * Worker and importing it eagerly at module scope makes local development fail
 * on a module that can never resolve there.
 */
async function getBinding(...names: string[]): Promise<ServiceBinding | null> {
    try {
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const ctx = await getCloudflareContext({ async: true });
        const env = ctx?.env as Record<string, unknown> | undefined;
        for (const name of names) {
            const binding = env?.[name];
            // Duck-typed rather than instanceof: the binding is a Fetcher, not a
            // class this bundle has a reference to.
            if (binding && typeof (binding as ServiceBinding).fetch === "function") {
                return binding as ServiceBinding;
            }
        }
        return null;
    } catch {
        // Not on Workers (local dev, or a build-time import). Fall back to HTTP.
        return null;
    }
}

interface CallInit {
    method?: string;
    /** Signed HMAC job token, or the shared secret for the executor. */
    token: string;
    body?: unknown;
}

function buildRequest(url: string, init: CallInit): Request {
    return new Request(url, {
        method: init.method ?? "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${init.token}`,
        },
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
}

/**
 * Call the background job worker (apps/worker).
 *
 * `path` is worker-relative, e.g. `/api/v1/jobs`.
 *
 * Over a service binding the hostname is ignored by Cloudflare but a valid
 * absolute URL is still required to construct the `Request`, hence the
 * placeholder origin.
 */
export async function callWorker(path: string, init: CallInit): Promise<Response> {
    // GENERATION_WORKER is the binding's former name, accepted so a deploy of
    // this app against an older wrangler.jsonc still finds the worker.
    const binding = await getBinding("WORKER", "GENERATION_WORKER");
    if (binding) {
        return binding.fetch(buildRequest(`https://shipithq-worker${path}`, init));
    }
    const base =
        process.env.WORKER_URL ||
        process.env.GENERATION_WORKER_URL ||
        process.env.WORKER_API_URL ||
        "http://localhost:8787";
    return fetch(buildRequest(`${base}${path}`, init));
}

/**
 * Call the code-execution worker (apps/shipitworker).
 *
 * Kept separate from `callWorker` because it is a genuinely different service:
 * it owns a Cloudflare Container, it authenticates with the shared secret rather
 * than a per-job signed token, and it is synchronous - code runs and the result
 * comes back on the same request. Nothing there belongs on an alarm.
 */
export async function callExecutorWorker(path: string, init: CallInit & { signal?: AbortSignal }): Promise<Response> {
    const binding = await getBinding("CODE_EXECUTOR");
    const request = buildRequest(
        binding ? `https://shipithq-shipitworker${path}` : `${process.env.NEXT_PUBLIC_WORKER_URL ?? ""}${path}`,
        init,
    );
    if (binding) return binding.fetch(request);
    // The signal only applies to the HTTP path; over a binding the executor
    // worker enforces its own timeout inside the container.
    return fetch(request, init.signal ? { signal: init.signal } : undefined);
}

/** Which transport a call would use - for diagnostics and startup logging. */
export async function workerTransport(): Promise<"service-binding" | "http"> {
    return (await getBinding("WORKER", "GENERATION_WORKER")) ? "service-binding" : "http";
}
