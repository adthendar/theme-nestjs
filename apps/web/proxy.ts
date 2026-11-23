import { NextRequest, NextResponse } from "next/server";
import { routePermissions, type SessionUser } from "@starter/shared";
import { upstream } from "@/lib/upstream";
export async function proxy(req: NextRequest) {
  const login = new URL("/login", req.url);
  if (!req.cookies.has("access") && !req.cookies.has("refresh"))
    return NextResponse.redirect(login);
  try {
    let me = await upstream("/auth/me", req);
    const rotated: string[] = [];
    let requestHeaders: Headers | undefined;
    if (me.status === 401 && req.cookies.has("refresh")) {
      const refresh = await upstream("/auth/refresh", req, {
        method: "POST",
        headers: { origin: req.nextUrl.origin },
      });
      if (refresh.ok) {
        rotated.push(...refresh.headers.getSetCookie());
        const cookie = rotated.map((value) => value.split(";")[0]).join("; ");
        requestHeaders = new Headers(req.headers);
        requestHeaders.set("cookie", cookie);
        me = await upstream("/auth/me", req, { headers: { cookie } });
      }
    }
    if (me.status === 401) return NextResponse.redirect(login);
    if (!me.ok) return NextResponse.next();
    const user: SessionUser = await me.json();
    const permission =
      routePermissions[req.nextUrl.pathname as keyof typeof routePermissions];
    const response =
      permission && !user.permissions.includes(permission)
        ? NextResponse.redirect(new URL("/403", req.url))
        : NextResponse.next(
            requestHeaders
              ? { request: { headers: requestHeaders } }
              : undefined,
          );
    for (const cookie of rotated) response.headers.append("set-cookie", cookie);
    return response;
  } catch {
    return NextResponse.next();
  }
}
export const config = {
  matcher: ["/dashboard", "/users", "/roles", "/permissions", "/settings"],
};
