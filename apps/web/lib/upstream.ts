export async function upstream(
  path: string,
  request: Request,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  for (const name of ["cookie", "content-type", "origin"]) {
    const value = request.headers.get(name);
    if (value && !headers.has(name)) headers.set(name, value);
  }
  return fetch(
    new URL(path, process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001"),
    {
      ...init,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    },
  );
}
