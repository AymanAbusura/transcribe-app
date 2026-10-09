import { updateJob, updateJobResult } from "./jobStore";
import { transcribeAudio } from "./transcribe";
import fs from "fs/promises";

export async function runTranscription(jobId: string, audioPath: string) {
  try {
    updateJob(jobId, { status: "transcribing" });
    const { text: transcript } = await transcribeAudio(audioPath);
    updateJobResult(jobId, { transcript });
    updateJob(jobId, { status: "done" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(jobId, { status: "error", error: message });
  } finally {
    // Clean up the uploaded audio file to avoid filling up disk
    fs.unlink(audioPath).catch(() => {});
  }
}
