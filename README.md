# Audio Transcriber (Whisper only)

Next.js app that transcribes uploaded audio to text using Groq's hosted Whisper API
(free tier). No local Python, no Ollama, no database — just upload, get a transcript,
download it as .txt or .docx.

## Architecture

```
Upload (browser) → /api/transcribe → saves file temporarily, creates in-memory job,
                                       runs transcription in background
                                          │
                                          ▼
                              Groq hosted Whisper API
                                          │
                                          ▼
                                     transcript

Frontend polls /api/status/[id] every 1.5s until status = "done", then shows the
transcript and lets you download .txt / .docx via /api/download/[id].
```

No database — job state lives in an in-memory `Map` (`src/lib/jobStore.ts`). Job
history is lost on server restart. Uploaded audio is deleted right after transcription.

## Setup

1. Get a free API key at https://console.groq.com
2. ```bash
   cd transcribe-app
   npm install
   cp .env.local.example .env.local
   # edit .env.local: paste your GROQ_API_KEY
   ```
3. ```bash
   npm run dev
   ```
4. Open http://localhost:3000, upload an audio file, hit Transcribe.

## Deploying for free

Since transcription now runs via a hosted API (no local Python/Whisper subprocess),
this app is a plain Next.js app and can deploy to any standard free host:

- **Vercel** (easiest, made by the Next.js team) — free tier, connect your GitHub repo,
  set `GROQ_API_KEY` in the project's environment variables, deploy.
- **Netlify** — similar free tier, also supports Next.js out of the box.
- **Render** — free tier for web services, works fine for a Next.js app.

Steps for Vercel (typical path):
1. Push this project to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Add environment variable `GROQ_API_KEY` (and `GROQ_WHISPER_MODEL` if you want to
   override the default) in the project settings
4. Deploy

One thing to know: in-memory job storage (`jobStore.ts`) resets on every serverless
cold start/redeploy on platforms like Vercel — fine for quick testing, but jobs won't
persist reliably in production. If you want persistence, you'd add a small database
(e.g. a free Postgres on Supabase or Neon) later.

## Project structure

```
src/
  app/
    page.tsx                    # frontend: upload, polling, transcript view, downloads
    api/
      transcribe/route.ts       # POST: save audio, start transcription
      status/[id]/route.ts      # GET: poll job status/result
      download/[id]/route.ts    # GET: generate .txt or .docx on the fly
  lib/
    jobStore.ts                 # in-memory job Map (no DB)
    transcribe.ts                # calls Groq's hosted Whisper API
    pipeline.ts                  # orchestrates the transcription job
uploads/                        # temp storage for uploaded audio (auto-cleaned)
```
