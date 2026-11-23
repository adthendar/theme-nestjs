export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
let refresh: Promise<Response> | undefined;
async function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  return fetch("/api/" + path, { ...init, headers, cache: "no-store" });
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await request(path, init);
  if (response.status === 401 && path !== "auth/login" && path !== "branding") {
    refresh ??= request("auth/refresh", { method: "POST" }).finally(() => {
      refresh = undefined;
    });
    if ((await refresh).ok) response = await request(path, init);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      data?.error?.message ?? "Permintaan gagal",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}
