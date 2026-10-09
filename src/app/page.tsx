"use client";

import { useState, useRef, useEffect } from "react";

type Status = "idle" | "uploading" | "queued" | "transcribing" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setTranscript("");
    setStatus("uploading");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
      const data = await res.json();
      setJobId(data.jobId);
      setStatus("queued");
      startPolling(data.jobId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/status/${id}`);
      const data = await res.json();

      if (data.error && !data.status) {
        setError(data.error);
        setStatus("error");
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }

      setStatus(data.status);
      setTranscript(data.result?.transcript || "");

      if (data.status === "done" || data.status === "error") {
        if (data.error) setError(data.error);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 1500);
  }

  function download(format: "txt" | "docx") {
    if (!jobId) return;
    window.location.href = `/api/download/${jobId}?format=${format}`;
  }

  const isProcessing = ["uploading", "queued", "transcribing"].includes(status);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Audio Transcriber</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Upload audio, get a transcript, download it.
          </p>
        </header>

        <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm mb-2 text-neutral-300">Audio file</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-neutral-800 file:text-neutral-100 hover:file:bg-neutral-700"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="w-full bg-white text-neutral-900 font-medium rounded-md py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-200 transition"
          >
            {isProcessing ? `${status}…` : "Transcribe"}
          </button>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </section>

        {(isProcessing || transcript) && (
          <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <StatusDot status={status} />
              <span className="capitalize">{status}</span>
            </div>

            {transcript && (
              <>
                <div className="text-sm whitespace-pre-wrap text-neutral-200 max-h-96 overflow-y-auto leading-relaxed">
                  {transcript}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => download("txt")}
                    className="text-sm bg-neutral-800 hover:bg-neutral-700 rounded-md px-4 py-2"
                  >
                    Download .txt
                  </button>
                  <button
                    onClick={() => download("docx")}
                    className="text-sm bg-neutral-800 hover:bg-neutral-700 rounded-md px-4 py-2"
                  >
                    Download .docx
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "done"
      ? "bg-green-500"
      : status === "error"
      ? "bg-red-500"
      : "bg-yellow-500 animate-pulse";
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}
