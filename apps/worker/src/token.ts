// Verify the HMAC-SHA256 worker token issued by the main app
// (packages: `issueWorkerToken`). Token = base64url(payloadJson).signature,
// where signature = base64url(HMAC-SHA256(payloadJson, WORKER_SECRET)).
// Uses Web Crypto (native in Workers) - no Node crypto dependency.

export interface WorkerTokenPayload {
	userId: string
	/**
	 * `start_job` for the generic dispatch route; `generate_project` and
	 * `generate_verification` for the two legacy aliases the uni app still uses.
	 */
	action: string
	jobId?: string
	iat: number
	exp: number
}

function b64urlToBytes(s: string): Uint8Array {
	const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=")
	const bin = atob(b64)
	const out = new Uint8Array(bin.length)
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
	return out
}

function bytesToB64url(bytes: ArrayBuffer): string {
	const b = new Uint8Array(bytes)
	let bin = ""
	for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]!)
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function verifyWorkerToken(token: string, secret: string): Promise<WorkerTokenPayload | null> {
	try {
		const [encodedPayload, signature] = token.split(".")
		if (!encodedPayload || !signature) return null

		const payloadJson = new TextDecoder().decode(b64urlToBytes(encodedPayload))

		const key = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		)
		const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson))
		const expected = bytesToB64url(sigBuf)
		if (expected !== signature) return null

		const payload = JSON.parse(payloadJson) as WorkerTokenPayload
		if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null
		return payload
	} catch {
		return null
	}
}
