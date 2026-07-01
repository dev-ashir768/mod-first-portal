const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Frontend (public) API credentials — used for /frontend/* endpoints instead of Bearer token
const FRONTEND_API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY!;
const FRONTEND_API_PASSWORD = process.env.NEXT_PUBLIC_FRONTEND_API_PASSWORD!;

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  frontend?: boolean; // use x-api-key / x-api-password instead of Bearer
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  { method = "GET", body, token, frontend = false }: RequestOptions = {}
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData) headers["Content-Type"] = "application/json";

  if (frontend) {
    headers["x-api-key"] = FRONTEND_API_KEY;
    headers["x-api-password"] = FRONTEND_API_PASSWORD;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/${path.replace(/^\//, "")}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new ApiError(
      res.status,
      data.message ?? `Request failed: ${res.status}`,
      data.payload
    );
  }

  return data as T;
}
