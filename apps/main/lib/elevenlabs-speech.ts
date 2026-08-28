import { elevenLabsKey } from "@/utils/elevenlabs/conversations"
const ELEVENLABS_API = "https://api.elevenlabs.io/v1"

export interface ElevenLabsTranscriptionResult {
	success: boolean;
	data?: {
		transcript: string;
		language_code: string;
		language_probability: number;
		words?: Array<{
			text: string;
			start: number;
			end: number;
			type: string;
			speaker_id?: string;
			logprob?: number;
		}>;
	};
	error?: string;
}

export interface ElevenLabsTranscriptionOptions {
	language_code?: string | null;
	tag_audio_events?: boolean;
	num_speakers?: number | null;
	timestamps_granularity?: 'none' | 'word' | 'character';
	diarize?: boolean;
	diarization_threshold?: number | null;
	temperature?: number | null;
	seed?: number | null;
}

export async function transcribeWithElevenLabs(
	audioFile: File,
	options: ElevenLabsTranscriptionOptions = {}
): Promise<ElevenLabsTranscriptionResult> {
	try {
		// Reads ELEVENLABS_API_KEY first, falling back to ELEVENLABS_AI_KEY. Only
		// the former is ever set, so reading only the latter - as this did - meant
		// transcription reported "not configured" permanently.
		const apiKey = elevenLabsKey()
		if (!apiKey) {
			return { success: false, error: "ELEVENLABS_API_KEY is not configured" }
		}

		const maxSize = 1024 * 1024 * 1024
		if (audioFile.size > maxSize) {
			throw new Error(`File size (${(audioFile.size / (1024 * 1024 * 1024)).toFixed(2)}GB) exceeds the 1GB limit`)
		}

		const formData = new FormData()
		formData.append("file", audioFile)
		formData.append("model_id", "scribe_v1")
		if (options.language_code) formData.append("language_code", options.language_code)
		if (options.tag_audio_events !== undefined) formData.append("tag_audio_events", String(options.tag_audio_events))
		if (options.num_speakers) formData.append("num_speakers", String(options.num_speakers))
		if (options.timestamps_granularity) formData.append("timestamps_granularity", options.timestamps_granularity)
		if (options.diarize !== undefined) formData.append("diarize", String(options.diarize))
		if (options.diarization_threshold) formData.append("diarization_threshold", String(options.diarization_threshold))
		if (options.temperature !== null && options.temperature !== undefined) formData.append("temperature", String(options.temperature))
		if (options.seed !== null && options.seed !== undefined) formData.append("seed", String(options.seed))

		const startTime = Date.now()
		const response = await fetch(`${ELEVENLABS_API}/speech-to-text`, {
			method: "POST",
			headers: { "xi-api-key": apiKey },
			body: formData,
		})

		if (!response.ok) {
			const err = await response.text()
			throw new Error(`ElevenLabs API error ${response.status}: ${err}`)
		}

		interface APIResponse {
			text?: string
			language_code?: string
			language_probability?: number
			words?: Array<{
				text?: string; start?: number; end?: number
				type?: string; speaker_id?: string; logprob?: number
			}>
		}
		const data = await response.json() as APIResponse
		const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)
		console.log(`ElevenLabs transcription completed in ${processingTime}s`)

		if (!data.text?.trim()) {
			throw new Error("No transcript text received from ElevenLabs")
		}

		return {
			success: true,
			data: {
				transcript: data.text.trim(),
				language_code: data.language_code || "en",
				language_probability: data.language_probability || 0,
				words: data.words?.map(w => ({
					text: w.text || "",
					start: w.start || 0,
					end: w.end || 0,
					type: w.type || "word",
					speaker_id: w.speaker_id,
					logprob: w.logprob,
				})) || [],
			},
		}
	} catch (error) {
		console.error("ElevenLabs transcription error:", error)
		let errorMessage = "ElevenLabs transcription failed"
		if (error instanceof Error) {
			errorMessage = error.message
			if (errorMessage.includes("1GB")) errorMessage = "Audio file is too large (max 1GB)."
			else if (errorMessage.includes("format") || errorMessage.includes("unsupported")) errorMessage = "Unsupported audio format."
			else if (errorMessage.includes("quota") || errorMessage.includes("limit")) errorMessage = "API quota exceeded. Please try again later."
		}
		return { success: false, error: errorMessage }
	}
}

export async function quickTranscribeWithElevenLabs(audioFile: File): Promise<ElevenLabsTranscriptionResult> {
	return transcribeWithElevenLabs(audioFile, {
		timestamps_granularity: "none",
		tag_audio_events: false,
		diarize: false,
		temperature: 0,
	})
}

export async function detailedTranscribeWithElevenLabs(
	audioFile: File,
	numSpeakers?: number
): Promise<ElevenLabsTranscriptionResult> {
	return transcribeWithElevenLabs(audioFile, {
		timestamps_granularity: "word",
		tag_audio_events: true,
		diarize: numSpeakers ? numSpeakers > 1 : false,
		num_speakers: numSpeakers || null,
		diarization_threshold: 0.22,
	})
}

export function isElevenLabsConfigured(): boolean {
	return !!elevenLabsKey()?.trim()
}

export function getElevenLabsInfo() {
	return {
		name: "ElevenLabs Speech-to-Text",
		maxFileSize: "1GB",
		supportedFormats: "All major audio and video formats",
		features: ["Speaker diarization", "Word-level timestamps", "Audio event tagging", "Multi-language support"],
		configured: isElevenLabsConfigured(),
	}
}
