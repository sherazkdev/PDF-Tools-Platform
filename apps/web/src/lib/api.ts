import { siteConfig } from "@/lib/site";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export interface ApiHealth {
  status: string;
  service: string;
  environment: string;
  version: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchApiHealth(): Promise<ApiHealth> {
  const url = `${apiBase()}/api/v1/health`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Cannot reach the conversion API. Start the FastAPI server (${apiBase()}).`,
    );
  }

  if (!response.ok) {
    throw new ApiError(`API health check failed (${response.status})`, response.status);
  }

  return response.json() as Promise<ApiHealth>;
}

export async function fetchApiHealthServer(): Promise<ApiHealth> {
  return fetchApiHealth();
}

export function apiDocsUrl(): string {
  return `${apiBase()}/docs`;
}

export { apiBase, siteConfig };
