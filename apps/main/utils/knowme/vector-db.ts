/**
 * KnowMe Vector Database Utility - Cloudflare Vectorize
 *
 * Replaces Upstash Vector. The exported surface is unchanged on purpose, so no
 * call site had to move: `queryVectors`, `upsertVectorsBatch` and
 * `deleteNamespace` are still the three functions that matter (the rest are
 * re-exported by utils/knowme/index.ts but currently have no callers).
 *
 * ── Three Vectorize limits shaped this file ──────────────────────────────────
 *
 * 1. A vector ID is capped at 64 BYTES. The old ID was
 *    `${profileId}_${sourceType}_${sourceId}_${chunkIndex}`, which is ~66+ bytes
 *    for two cuids and a source type like GITHUB_REPO. See `generateVectorId`
 *    in helpers.ts - it now hashes.
 *
 * 2. An index allows 1,000 NAMESPACES. The Upstash design used one namespace per
 *    user, so a straight port would have capped KnowMe at 1,000 profiles - a
 *    ceiling nothing in the code would announce; writes past it just fail.
 *    So tenant isolation moved to a `profileId` METADATA filter, which has no
 *    such cap. The `namespace` argument is kept in every signature (it already
 *    WAS the profileId) so callers did not change, but it is now compiled into
 *    `filter: { profileId }` rather than a Vectorize namespace.
 *
 *    This makes the metadata index non-optional. Without it the filter matches
 *    nothing and every user sees an empty result set rather than an error:
 *        npx wrangler vectorize create-metadata-index shipithq-knowme \
 *            --property-name=profileId --type=string
 *
 * 3. Metadata is capped at 10KiB PER VECTOR, and Vectorize has no separate
 *    `data` field like Upstash did, so the chunk text has to live in metadata.
 *    `trimMetadata` enforces the cap; the full text is already in Postgres
 *    (`know_me_embedding.chunk_text`), so truncating here loses nothing.
 *
 * ── Writes are asynchronous ──────────────────────────────────────────────────
 * Upstash upserts were read-your-writes. Vectorize returns a `mutationId` and
 * applies the change behind it, so a query issued immediately after
 * `generateProfileEmbeddings` can legitimately return nothing. That is not a
 * bug to chase.
 */

import { db, knowMeEmbeddings } from "@repo/db";
import { eq } from "drizzle-orm";
import type { EmbeddingMetadata, VectorSearchResult } from "@/types/knowme";

// ── Configuration ───────────────────────────────────────────────────────────

export const VECTOR_CONFIG = {
	topK: 5,
	minScore: 0.5,
	maxResults: 10,
};

/**
 * Vectorize caps topK at 20 when metadata or values come back with the results,
 * which is every query this file makes. Asking for more is a 400, so clamp
 * rather than let a caller's number through.
 */
const MAX_TOP_K = 20;

/** Vectorize accepts 1,000 vectors per upsert on the binding, 5,000 over HTTP. */
const UPSERT_BATCH = 1000;

/** delete_by_ids takes the same shape; keep the batches identical. */
const DELETE_BATCH = 1000;

/** 10KiB per vector, with headroom for the non-text fields. */
const MAX_METADATA_BYTES = 9_000;

const INDEX_NAME = process.env.VECTORIZE_INDEX_NAME || "shipithq-knowme";

// ── Transport ───────────────────────────────────────────────────────────────
//
// Same two-transport shape as lib/workers/client.ts, and for the same reason:
// on Workers the binding is free and needs no credentials, but `next dev` has no
// Vectorize emulation, so local development has to go over the REST API.
//
// The choice is NOT "is there a binding" - see `isBindingUnavailable`. Local dev
// hands out a binding that exists and throws, so the transport is decided by
// what the first call does, not by what the environment appears to hold.

/** The subset of Vectorize's binding this file uses. */
interface VectorizeBinding {
	upsert: (vectors: VectorizeUpsertVector[]) => Promise<{ mutationId?: string }>;
	query: (
		vector: number[],
		options: {
			topK?: number;
			filter?: Record<string, unknown>;
			returnValues?: boolean;
			returnMetadata?: "none" | "indexed" | "all";
		},
	) => Promise<{ matches: VectorizeMatch[] }>;
	deleteByIds: (ids: string[]) => Promise<{ mutationId?: string }>;
	getByIds: (ids: string[]) => Promise<VectorizeMatch[]>;
	describe: () => Promise<{ dimensions?: number; vectorCount?: number }>;
}

interface VectorizeUpsertVector {
	id: string;
	values: number[];
	metadata?: Record<string, unknown>;
}

interface VectorizeMatch {
	id: string;
	score?: number;
	metadata?: Record<string, unknown>;
}

/**
 * The Vectorize binding, or null when not running on Workers.
 *
 * The import is lazy for the reason spelled out in lib/workers/client.ts:
 * importing `@opennextjs/cloudflare` at module scope makes local dev fail on a
 * module that can never resolve there.
 */
async function getBinding(): Promise<VectorizeBinding | null> {
	try {
		const { getCloudflareContext } = await import("@opennextjs/cloudflare");
		const ctx = await getCloudflareContext({ async: true });
		const env = ctx?.env as Record<string, unknown> | undefined;
		const binding = env?.VECTORIZE;
		// Duck-typed: the binding is a VectorizeIndex, not a class this bundle
		// holds a reference to.
		if (binding && typeof (binding as VectorizeBinding).query === "function") {
			return binding as VectorizeBinding;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Does this error mean "the binding cannot run here", rather than "Vectorize
 * said no"?
 *
 * `next dev` through opennext DOES expose a `VECTORIZE` binding - a local stub
 * that satisfies the duck-type in `getBinding` and then throws
 * `Binding VECTORIZE needs to be run remotely` on every call. So the REST
 * fallback below, and the paragraph in `.env.example` explaining its two
 * credentials, were unreachable code: the binding was always found, and always
 * failed. Both of the profile's embedding jobs died on exactly this string.
 *
 * The test is deliberately narrow. A genuine Vectorize rejection - a 400, an
 * unindexed metadata field, a dimension mismatch - must NOT be retried over
 * REST, or one real failure becomes two and the message the caller finally sees
 * is about the wrong transport.
 */
function isBindingUnavailable(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return /needs to be run remotely|not supported in local|no( |-)?local (support|emulation)/i.test(message);
}

/**
 * Run against the binding when there is one, and fall through to REST when that
 * binding turns out to be a local stub. One place, so every operation behaves
 * the same way rather than four call sites each remembering to.
 */
async function viaBinding<T>(
	onBinding: (binding: VectorizeBinding) => Promise<T>,
	onRest: () => Promise<T>,
): Promise<T> {
	const binding = await getBinding();
	if (!binding) return onRest();

	try {
		return await onBinding(binding);
	} catch (error: unknown) {
		if (isBindingUnavailable(error)) return onRest();
		throw error;
	}
}

function restConfig(): { accountId: string; token: string } {
	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
	const token = process.env.CLOUDFLARE_API_TOKEN;
	if (!accountId || !token) {
		// Names the two variables rather than repeating wrangler's message. The
		// caller reaching here has either no binding or one that cannot run
		// locally, and in both cases the fix is the same pair of credentials.
		throw new Error(
			"Vectorize is unreachable: the VECTORIZE binding is absent or cannot run here " +
				"(local `next dev` has no Vectorize emulation), and CLOUDFLARE_ACCOUNT_ID / " +
				"CLOUDFLARE_API_TOKEN are not set for the REST fallback. See .env.example.",
		);
	}
	return { accountId, token };
}

/**
 * One REST call.
 *
 * Reads the body as TEXT and only then parses it. The Upstash code called
 * `.json()` directly, so when the service answered with an empty body the only
 * thing that surfaced was `SyntaxError: Unexpected end of JSON input` at a
 * JSON.parse frame - which says nothing about which request failed or why. The
 * status line and the first part of the body are worth far more than the parse.
 */
async function rest<T>(
	path: string,
	init: { method: string; body?: string; contentType?: string },
): Promise<T> {
	const { accountId, token } = restConfig();
	const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/v2/indexes/${INDEX_NAME}${path}`;

	const res = await fetch(url, {
		method: init.method,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": init.contentType ?? "application/json",
		},
		body: init.body,
	});

	const raw = await res.text();

	if (!res.ok) {
		throw new Error(`Vectorize ${init.method} ${path} failed (${res.status}): ${raw.slice(0, 400) || "<empty body>"}`);
	}
	if (!raw) {
		throw new Error(`Vectorize ${init.method} ${path} returned ${res.status} with an empty body`);
	}

	let parsed: { success?: boolean; result?: T; errors?: unknown };
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error(`Vectorize ${init.method} ${path} returned a non-JSON body: ${raw.slice(0, 400)}`);
	}

	if (parsed.success === false) {
		throw new Error(`Vectorize ${init.method} ${path} reported failure: ${JSON.stringify(parsed.errors).slice(0, 400)}`);
	}

	return parsed.result as T;
}

// ── Metadata ────────────────────────────────────────────────────────────────

/**
 * Keep a vector's metadata under the 10KiB cap by shortening the one field that
 * can be arbitrarily long. Everything else is bounded by its own schema.
 */
function trimMetadata(metadata: EmbeddingMetadata): Record<string, unknown> {
	const out = { ...metadata } as Record<string, unknown>;
	const encoder = new TextEncoder();

	if (encoder.encode(JSON.stringify(out)).length <= MAX_METADATA_BYTES) return out;

	const text = typeof out.text === "string" ? out.text : "";
	if (!text) return out;

	// Budget = the cap minus everything that is not the text.
	const withoutText = encoder.encode(JSON.stringify({ ...out, text: "" })).length;
	const budget = MAX_METADATA_BYTES - withoutText;
	if (budget <= 0) {
		delete out.text;
		return out;
	}

	// Slice by BYTES, not characters: a multi-byte character counted as one
	// would put the payload back over the cap.
	const bytes = encoder.encode(text).slice(0, budget);
	out.text = new TextDecoder().decode(bytes).replace(/�+$/, "");
	return out;
}

/** Tenant scope. See note 2 at the top of this file. */
function scopeFilter(namespace: string, extra?: Record<string, unknown>): Record<string, unknown> {
	return { profileId: namespace, ...(extra ?? {}) };
}

// ── Writes ──────────────────────────────────────────────────────────────────

/** Upsert a single vector. */
export async function upsertVector(
	id: string,
	embedding: number[],
	metadata: EmbeddingMetadata,
	namespace: string,
): Promise<void> {
	await upsertVectorsBatch(
		[{ id, text: metadata.text ?? "", embedding, metadata: { ...metadata, profileId: namespace } }],
		namespace,
	);
}

/**
 * Upsert many vectors.
 *
 * `profileId` is forced onto every vector rather than trusted from the caller's
 * metadata: it is the ONLY thing separating one user's chunks from another's
 * now that namespaces are gone, so it must not be able to disagree with the
 * namespace the caller asked for.
 */
export async function upsertVectorsBatch(
	vectors: {
		id: string;
		text: string;
		embedding: number[];
		metadata: EmbeddingMetadata;
	}[],
	namespace: string,
): Promise<void> {
	if (vectors.length === 0) return;

	const prepared: VectorizeUpsertVector[] = vectors.map((v) => ({
		id: v.id,
		values: v.embedding,
		metadata: trimMetadata({ ...v.metadata, profileId: namespace, text: v.text || v.metadata.text }),
	}));

	try {
		for (let i = 0; i < prepared.length; i += UPSERT_BATCH) {
			const batch = prepared.slice(i, i + UPSERT_BATCH);
			await viaBinding(
				(binding) => binding.upsert(batch).then(() => undefined),
				// The REST endpoint takes NDJSON - one vector per line - not a JSON
				// array, and rejects `application/json` outright.
				() =>
					rest("/upsert", {
						method: "POST",
						contentType: "application/x-ndjson",
						body: batch.map((v) => JSON.stringify(v)).join("\n"),
					}).then(() => undefined),
			);
		}
	} catch (error: unknown) {
		console.error("Error upserting vectors batch:", error);
		throw new Error(
			`Failed to upsert vectors batch: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

// ── Reads ───────────────────────────────────────────────────────────────────

/** Query by similarity. The main search path for the chat route. */
export async function queryVectors(
	queryEmbedding: number[],
	namespace: string,
	options: {
		topK?: number;
		minScore?: number;
		filter?: Record<string, unknown>;
		includeMetadata?: boolean;
		includeVectors?: boolean;
	} = {},
): Promise<VectorSearchResult[]> {
	const {
		topK = VECTOR_CONFIG.topK,
		minScore = VECTOR_CONFIG.minScore,
		filter,
		includeMetadata = true,
		includeVectors = false,
	} = options;

	const effectiveTopK = Math.min(topK, MAX_TOP_K);
	const scoped = scopeFilter(namespace, filter);

	try {
		const matches = await viaBinding<VectorizeMatch[]>(
			async (binding) =>
				(
					await binding.query(queryEmbedding, {
						topK: effectiveTopK,
						filter: scoped,
						returnValues: includeVectors,
						returnMetadata: includeMetadata ? "all" : "none",
					})
				).matches,
			async () =>
				(
					await rest<{ matches: VectorizeMatch[] }>("/query", {
						method: "POST",
						body: JSON.stringify({
							vector: queryEmbedding,
							topK: effectiveTopK,
							filter: scoped,
							returnValues: includeVectors,
							returnMetadata: includeMetadata ? "all" : "none",
						}),
					})
				).matches,
		);

		return (matches ?? [])
			.filter((m) => (m.score ?? 0) >= minScore)
			.map((m) => ({
				id: m.id,
				score: m.score ?? 0,
				metadata: (m.metadata ?? {}) as Record<string, unknown>,
				text: ((m.metadata as unknown as EmbeddingMetadata)?.text || "") as string,
			}));
	} catch (error: unknown) {
		console.error("Error querying vectors:", error);
		throw new Error(
			`Failed to query vector database: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/** Fetch one vector by ID. */
export async function getVector(
	id: string,
	namespace: string,
): Promise<{ id: string; metadata: Record<string, unknown> } | null> {
	try {
		const found = await viaBinding<VectorizeMatch[]>(
			(binding) => binding.getByIds([id]),
			() =>
				rest<VectorizeMatch[]>("/get_by_ids", {
					method: "POST",
					body: JSON.stringify({ ids: [id] }),
				}),
		);

		const hit = (found ?? [])[0];
		if (!hit) return null;

		// get_by_ids cannot be filtered, so the tenant check happens here rather
		// than in the query: an ID guessed from another profile must not resolve.
		const metadata = (hit.metadata ?? {}) as Record<string, unknown>;
		if (metadata.profileId && metadata.profileId !== namespace) return null;

		return { id: hit.id, metadata };
	} catch (error: unknown) {
		console.error("Error fetching vector:", error);
		throw new Error("Failed to fetch vector");
	}
}

// ── Deletes ─────────────────────────────────────────────────────────────────

export async function deleteVector(id: string, namespace: string): Promise<void> {
	await deleteVectorsBatch([id], namespace);
}

export async function deleteVectorsBatch(ids: string[], _namespace: string): Promise<void> {
	if (ids.length === 0) return;

	try {
		for (let i = 0; i < ids.length; i += DELETE_BATCH) {
			const batch = ids.slice(i, i + DELETE_BATCH);
			await viaBinding(
				(binding) => binding.deleteByIds(batch).then(() => undefined),
				() =>
					rest("/delete_by_ids", {
						method: "POST",
						body: JSON.stringify({ ids: batch }),
					}).then(() => undefined),
			);
		}
	} catch (error: unknown) {
		console.error("Error deleting vectors batch:", error);
		throw new Error(
			`Failed to delete vectors batch: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Delete every vector belonging to one profile.
 *
 * Vectorize has NO delete-by-namespace and no delete-by-filter - `delete_by_ids`
 * is the only delete it offers. The IDs come from Postgres, which already
 * records one row per chunk in `know_me_embedding` with its `vector_id`.
 *
 * The consequence worth knowing: a vector whose Postgres row was already gone is
 * unreachable here and stays in the index forever. So the row must be deleted
 * AFTER this function has used it, never before.
 */
export async function deleteNamespace(namespace: string): Promise<void> {
	try {
		const rows = await db
			.select({ vectorId: knowMeEmbeddings.vectorId })
			.from(knowMeEmbeddings)
			.where(eq(knowMeEmbeddings.vectorNamespace, namespace));

		const ids = rows.map((r) => r.vectorId).filter(Boolean);
		if (ids.length === 0) return;

		await deleteVectorsBatch(ids, namespace);
	} catch (error: unknown) {
		console.error("Error deleting namespace:", error);
		throw new Error(
			`Failed to delete namespace: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

// ── Diagnostics ─────────────────────────────────────────────────────────────

/**
 * Per-profile counts.
 *
 * Vectorize's `describe()` reports the whole index, not a slice of it, so the
 * per-profile number comes from Postgres. The old Upstash version returned the
 * index-wide count under a per-namespace name, which was simply wrong.
 */
export async function getNamespaceStats(namespace: string): Promise<{
	vectorCount: number;
	pendingVectorCount: number;
}> {
	try {
		const rows = await db
			.select({ vectorId: knowMeEmbeddings.vectorId })
			.from(knowMeEmbeddings)
			.where(eq(knowMeEmbeddings.vectorNamespace, namespace));

		return { vectorCount: rows.length, pendingVectorCount: 0 };
	} catch (error: unknown) {
		console.error("Error getting namespace stats:", error);
		throw new Error("Failed to get namespace stats");
	}
}

export async function checkVectorDbConnection(): Promise<boolean> {
	try {
		await viaBinding(
			(binding) => binding.describe().then(() => undefined),
			() => rest("/info", { method: "GET" }).then(() => undefined),
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * All of a profile's vectors matching a metadata filter.
 *
 * NOTE: this reads from Postgres, not from Vectorize. Vectorize has no
 * filter-only query - every query needs a vector to sort by - and the previous
 * implementation faked one with `new Array(1024).fill(0)`. A zero vector has no
 * direction, so cosine similarity against it is undefined; the results were
 * arbitrary. Postgres holds the same chunks and can actually answer this.
 */
export async function queryByFilter(
	namespace: string,
	filter: Record<string, unknown>,
	options: { topK?: number; includeMetadata?: boolean } = {},
): Promise<VectorSearchResult[]> {
	const { topK = 100 } = options;

	try {
		const rows = await db
			.select({
				vectorId: knowMeEmbeddings.vectorId,
				chunkText: knowMeEmbeddings.chunkText,
				metadata: knowMeEmbeddings.metadata,
				sourceType: knowMeEmbeddings.sourceType,
				sourceId: knowMeEmbeddings.sourceId,
			})
			.from(knowMeEmbeddings)
			.where(eq(knowMeEmbeddings.vectorNamespace, namespace));

		const entries = Object.entries(filter);

		return rows
			.filter((row) => {
				// Annotated, not inferred: spreading a Record into an object
				// literal with known keys makes TS infer the literal shape and
				// drop the index signature, so `meta[key]` stops type-checking.
				const meta: Record<string, unknown> = {
					...((row.metadata ?? {}) as Record<string, unknown>),
					sourceType: row.sourceType,
					sourceId: row.sourceId,
				};
				return entries.every(([key, value]) => meta[key] === value);
			})
			.slice(0, topK)
			.map((row) => ({
				id: row.vectorId,
				// There is no similarity here because there was no query vector.
				// Reporting 0 is honest; reporting 1 would look like a perfect match.
				score: 0,
				metadata: (row.metadata ?? {}) as Record<string, unknown>,
				text: row.chunkText,
			}));
	} catch (error: unknown) {
		console.error("Error querying by filter:", error);
		throw new Error("Failed to query by filter");
	}
}
