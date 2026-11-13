const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    field?: string | null;
  };
}

export class JobsApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "JobsApiError";
  }
}

export interface JobCreateResult {
  job_id: string;
  access_token: string;
  status: JobStatus;
  converter_id: string;
  expires_at: string;
}

export interface JobDetail {
  job_id: string;
  converter_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
  input_files: Array<{
    stored_name: string;
    original_name: string;
    size_bytes: number;
    content_type?: string | null;
  }>;
  output_files: Array<{
    stored_name: string;
    original_name: string;
    size_bytes: number;
    content_type?: string | null;
  }>;
  settings: Record<string, unknown>;
  error_code?: string | null;
  error_message?: string | null;
}

async function parseError(response: Response): Promise<JobsApiError> {
  let code = "request_failed";
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as ApiErrorBody;
    code = body.error?.code ?? code;
    message = body.error?.message ?? message;
  } catch {
    /* ignore */
  }
  return new JobsApiError(message, code, response.status);
}

export async function createJob(
  converterId: string,
  files: File[],
  options?: { settings?: Record<string, unknown>; signal?: AbortSignal },
): Promise<JobCreateResult> {
  const form = new FormData();
  form.append("converter_id", converterId);
  for (const file of files) {
    form.append("files", file);
  }
  if (options?.settings) {
    form.append("settings", JSON.stringify(options.settings));
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/v1/jobs`, {
      method: "POST",
      body: form,
      signal: options?.signal,
    });
  } catch {
    throw new JobsApiError("Network error while creating the job.", "network_error");
  }

  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<JobCreateResult>;
}

export async function getJob(jobId: string, accessToken: string): Promise<JobDetail> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/v1/jobs/${jobId}`, {
      headers: {
        Accept: "application/json",
        "X-Job-Access-Token": accessToken,
      },
      cache: "no-store",
    });
  } catch {
    throw new JobsApiError("Network error while loading the job.", "network_error");
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<JobDetail>;
}

export interface PdfInspectResult {
  page_count: number;
  encrypted: boolean;
}

export async function inspectPdfForJpg(file: File): Promise<PdfInspectResult> {
  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/v1/tools/pdf-to-jpg/inspect`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new JobsApiError("Network error while inspecting the PDF.", "network_error");
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<PdfInspectResult>;
}

export async function downloadJobOutput(
  jobId: string,
  accessToken: string,
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/v1/jobs/${jobId}/download`, {
      headers: { "X-Job-Access-Token": accessToken },
    });
  } catch {
    throw new JobsApiError("Network error while downloading output.", "network_error");
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.blob();
}
