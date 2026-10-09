import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { createJob } from "@/lib/jobStore";
import { runTranscription } from "@/lib/pipeline";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("audio") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const jobId = randomUUID();
  const ext = path.extname(file.name) || ".webm";
  const audioPath = path.join(UPLOAD_DIR, `${jobId}${ext}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(audioPath, buffer);

  createJob(jobId, audioPath, file.name);

  // Fire and forget — transcription runs in the background, updating the job store.
  // The frontend polls /api/status/[id]. Summary/questions/etc. are NOT run here —
  // the user opts into those separately via /api/enrich/[id], since running the
  // local LLM is the heaviest/most failure-prone part.
  runTranscription(jobId, audioPath);

  return NextResponse.json({ jobId });
}
