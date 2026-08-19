import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// Talking to the background job worker (apps/worker).
//
// Same shape as apps/main's client, and deliberately a copy rather than a shared
// package: it is thirty lines, it has one consumer here, and the alternative is
// a new workspace package whose only job is to hold a fetch wrapper.
//
// On Cloudflare this goes over the WORKER service binding, so the request never
// leaves Cloudflare's network and the worker does not have to be publicly
// reachable. Locally there is no binding (`next dev` is not a Worker), so it
// falls back to WORKER_URL / WORKER_API_URL.
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceBinding {
    fetch: (request: Request) => Promise<Response>;
}

async function getBinding(): Promise<ServiceBinding | null> {
    try {
        // Imported lazily: `next dev` does not run inside a Worker, and importing
        // this at module scope makes local development fail on a module that can
        // never resolve there.
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const ctx = await getCloudflareContext({ async: true });
        const binding = (ctx?.env as Record<string, unknown> | undefined)?.WORKER;
        if (binding && typeof (binding as ServiceBinding).fetch === "function") {
            return binding as ServiceBinding;
        }
        return null;
    } catch {
        return null;
    }
}

export async function callWorker(
    path: string,
    init: { method?: string; token: string; body?: unknown },
): Promise<Response> {
    const request = (url: string) =>
        new Request(url, {
            method: init.method ?? "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${init.token}`,
            },
            ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
        });

    const binding = await getBinding();
    if (binding) {
        // Over a service binding the hostname is ignored by Cloudflare, but a
        // valid absolute URL is still needed to construct the Request.
        return binding.fetch(request(`https://shipithq-worker${path}`));
    }
    const base = process.env.WORKER_URL || process.env.WORKER_API_URL || "http://localhost:8787";
    return fetch(request(`${base}${path}`));
}
