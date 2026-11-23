import { upstream } from "@/lib/upstream";

const allowed =
  /^(?:auth\/(?:login|logout|refresh|me)|branding|settings|dashboard|users(?:\/[\w-]+(?:\/password)?)?|user-role-options|permissions|roles(?:\/[A-Z][A-Z0-9_]{0,39}(?:\/permissions)?)?)$/;
const bodyLimit = 16 * 1024;

async function forward(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  if (!allowed.test(route))
    return Response.json(
      { error: { status: 404, message: "Alamat tidak ditemukan" } },
      { status: 404 },
    );
  try {
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (req.body) {
      const buffer = new Uint8Array(bodyLimit);
      const reader = req.body.getReader();
      let size = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (size + chunk.value.length > bodyLimit) {
          void reader.cancel().catch(() => {});
          return Response.json(
            {
              error: {
                status: 413,
                message: "Ukuran permintaan melebihi batas",
              },
            },
            { status: 413 },
          );
        }
        buffer.set(chunk.value, size);
        size += chunk.value.length;
      }
      body = buffer.subarray(0, size);
    }
    const response = await upstream(
      "/" + route + new URL(req.url).search,
      req,
      { method: req.method, body },
    );
    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "retry-after", "x-ratelimit-reset"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie())
      headers.append("set-cookie", cookie);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json(
      { error: { status: 503, message: "Layanan sedang tidak tersedia" } },
      { status: 503 },
    );
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PATCH,
  forward as PUT,
  forward as DELETE,
};
