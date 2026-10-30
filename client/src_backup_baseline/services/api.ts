/**
 * Base HTTP API client for CampusOps
 * Uses relative /api endpoints proxied by Vite dev server
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message?: string;
    details?: any;
  };
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await response.json().catch(() => ({
    success: false,
    error: { code: 'PARSE_ERROR', message: `Server returned HTTP ${response.status}` },
  }));

  if (!response.ok && !json.error) {
    json.error = { code: `HTTP_${response.status}`, message: response.statusText };
  }

  return json;
}
