export type JobStatus = "queued" | "transcribing" | "done" | "error";

export interface JobResult {
  transcript?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  audioPath: string;
  originalName: string;
  createdAt: number;
  error?: string;
  result: JobResult;
}

// In-memory store. Lives only as long as the Node process runs.
// Good enough for a local pet project — no DB needed.
const jobs = new Map<string, Job>();

export function createJob(id: string, audioPath: string, originalName: string): Job {
  const job: Job = {
    id,
    status: "queued",
    audioPath,
    originalName,
    createdAt: Date.now(),
    result: {},
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
  jobs.set(id, job);
}

export function updateJobResult(id: string, patch: Partial<JobResult>) {
  const job = jobs.get(id);
  if (!job) return;
  job.result = { ...job.result, ...patch };
  jobs.set(id, job);
}
