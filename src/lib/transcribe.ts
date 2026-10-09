// Uses Groq's hosted Whisper API instead of a local faster-whisper subprocess.
// Free tier, same GROQ_API_KEY as the LLM calls in llm.ts.
// Docs: https://console.groq.com/docs/speech-to-text
const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

export interface TranscriptionResult {
  text: string;
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const fs = await import("fs");
  const path = await import("path");

  const fileBuffer = fs.readFileSync(audioPath);
  const blob = new Blob([fileBuffer]);

  const formData = new FormData();
  formData.append("file", blob, path.basename(audioPath));
  formData.append("model", GROQ_WHISPER_MODEL);

  const res = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Groq transcription failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return { text: (data.text || "").trim() };
}
