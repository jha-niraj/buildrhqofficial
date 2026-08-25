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

/**
 * The plain `RequestInit` both transports are built from.
 *
 * Separate from `buildRequest` because the HTTP path MUST NOT be handed a `Request` object -
 * see the note on `callWorker`.
 */
function buildInit(init: CallInit): RequestInit {
    return {
        method: init.method ?? "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${init.token}`,
        },
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    };
}

/** A `Request`, for the service-binding path, which takes one by contract. */
function buildRequest(url: string, init: CallInit): Request {
    return new Request(url, buildInit(init));
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

    // ── (url, init), NEVER fetch(new Request(...)) ──
    //
    // This line used to be `fetch(buildRequest(...))`, and it broke EVERY background job in
    // local development - resume tailoring, resume structuring, project generation - with:
    //
    //     Failed to parse URL from [object Request]
    //
    // `next dev` polyfills the global `Request` with its own class, so the object built here
    // is not the `Request` undici's `fetch` recognises. undici falls back to treating a
    // non-Request input as a URL, calls `String()` on it, gets "[object Request]", and fails
    // to parse that. The request never reaches the network, so the message names a URL
    // problem for what is really a realm mismatch - which is why it read as unexplainable.
    //
    // Passing the url and the init separately has no realm to get wrong. The binding path
    // above still builds a `Request` because a Fetcher's contract requires one, and there
    // the constructor and the consumer are the same realm by construction.
    return fetch(`${base}${path}`, buildInit(init));
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
    if (binding) {
        return binding.fetch(buildRequest(`https://shipithq-shipitworker${path}`, init));
    }
    // Same realm hazard as `callWorker` - url and init, not a Request. The signal only
    // applies here; over a binding the executor enforces its own timeout in the container.
    return fetch(`${process.env.NEXT_PUBLIC_WORKER_URL ?? ""}${path}`, {
        ...buildInit(init),
        ...(init.signal ? { signal: init.signal } : {}),
    });
}

/** Which transport a call would use - for diagnostics and startup logging. */
export async function workerTransport(): Promise<"service-binding" | "http"> {
    return (await getBinding("WORKER", "GENERATION_WORKER")) ? "service-binding" : "http";
}
