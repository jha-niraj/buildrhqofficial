import { neon, neonConfig, Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { drizzle as drizzlePool } from "drizzle-orm/neon-serverless"
import * as schema from "@repo/db/schema"

// Build a Drizzle client from the DO's env (NOT the top-level @repo/db client,
// which reads process.env at import time - undefined at worker init). Neon's
// HTTP driver runs fine inside a Cloudflare Worker / Durable Object.
export function createDb(databaseUrl: string) {
	const sql = neon(databaseUrl)
	return drizzle(sql, { schema })
}

export type DB = ReturnType<typeof createDb>

/**
 * Run a multi-statement write atomically.
 *
 * The neon-http client above has no transaction support - `db.transaction()`
 * throws at runtime and the surrounding catch turns it into a silent failure.
 * A WebSocket pool does support transactions, so anything that must be all-or-
 * nothing (a quiz and its questions; a plan and the rows that reference it)
 * goes through here instead.
 *
 * Created per call rather than cached: a Durable Object alarm is a long-lived
 * invocation and holding a pool open across it would keep a Postgres connection
 * checked out for the whole job, most of which is spent waiting on an LLM.
 */
export async function withTransaction<T>(
	databaseUrl: string,
	fn: (tx: Parameters<Parameters<ReturnType<typeof drizzlePool<typeof schema>>["transaction"]>[0]>[0]) => Promise<T>,
): Promise<T> {
	// Workers provide a global WebSocket; the driver needs to be pointed at it.
	if (typeof WebSocket !== "undefined") {
		neonConfig.webSocketConstructor = WebSocket
	}
	const pool = new Pool({ connectionString: databaseUrl })
	try {
		const tx = drizzlePool(pool, { schema })
		return await tx.transaction(fn)
	} finally {
		await pool.end().catch(() => {
			// Best-effort: a pool that fails to close must not fail the job.
		})
	}
}

export { schema }
