import assert from "node:assert/strict";
import { test } from "node:test";
import { JwtService } from "@nestjs/jwt";
import { NestFactory } from "@nestjs/core";
import { hash } from "argon2";
import { accessPermissions } from "@starter/shared";
import { AppModule, configure } from "./app.js";
import { AuthService } from "./auth.js";
import { Database } from "./database.js";
import { UsersService } from "./users.js";
test("auth rejects inactive accounts even with the correct password", async () => {
  const passwordHash = await hash("test-only-password");
  const db = {
    user: { findUnique: async () => ({ passwordHash, isActive: false }) },
  } as unknown as Database;
  await assert.rejects(
    new AuthService(db, new JwtService()).login(
      "test@example.com",
      "test-only-password",
    ),
    /Email atau kata sandi salah/,
  );
});
const createdAt = new Date("2026-11-23T00:00:00Z");
const adminRecord = {
  id: "admin",
  name: "Admin",
  email: "admin@example.com",
  isActive: true,
  createdAt,
  updatedAt: createdAt,
  roles: [
    {
      role: {
        code: "ADMIN",
        name: "Administrator",
        permissions: accessPermissions.map(({ code }) => ({
          permissionCode: code,
        })),
      },
    },
  ],
};
test("users service prevents removal of the last active admin", async () => {
  const tx = {
    $queryRaw: async () => [],
    user: { findUnique: async () => adminRecord },
    userRole: { count: async () => 1 },
  };
  const db = {
    $transaction: async (action: (db: typeof tx) => unknown) => action(tx),
  } as unknown as Database;
  await assert.rejects(
    new UsersService(db).remove("admin", "admin"),
    /Setidaknya satu admin/,
  );
});
test("HTTP login sets both cookies and /auth/me returns a safe profile", async () => {
  process.env.DATABASE_URL ??= "mysql://unused:unused@127.0.0.1/unused";
  process.env.JWT_SECRET ??= "test-only-secret-at-least-32-characters";
  const origin =
    process.env.WEB_ORIGIN?.split(",")[0] ?? "http://localhost:3000";
  const password = "test-only-password";
  const user = adminRecord;
  let authenticatedUser = user;
  const passwordHash = await hash(password);
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  const db = app.get(Database);
  Object.defineProperties(db, {
    $transaction: {
      value: async (fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: async () => [{ passwordHash, isActive: true }],
          session: { create: async () => ({}) },
        }),
    },
    user: { value: { findUnique: async () => ({ ...user, passwordHash }) } },
    session: {
      value: {
        create: async () => ({}),
        findFirst: async () => ({ user: authenticatedUser }),
      },
    },
  });
  await configure(app);
  await app.listen(0, "127.0.0.1");
  try {
    const url = await app.getUrl();
    const response = await fetch(url + "/auth/login", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password }),
    });
    assert.equal(response.status, 200);
    const cookies = response.headers.getSetCookie();
    assert.equal(cookies.length, 2);
    assert.ok(
      cookies.every(
        (value) => value.includes("HttpOnly") && value.includes("SameSite=Lax"),
      ),
    );
    const me = await fetch(url + "/auth/me", {
      headers: {
        cookie: cookies.map((value) => value.split(";")[0]).join("; "),
      },
    });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: true,
      role: "ADMIN",
      roles: [{ code: "ADMIN", name: "Administrator" }],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      permissions: accessPermissions.map(({ code }) => code),
    });
    const headers = {
      cookie: cookies.map((value) => value.split(";")[0]).join("; "),
    };
    authenticatedUser = {
      ...user,
      roles: [
        {
          role: {
            code: "USER",
            name: "User",
            permissions: [{ permissionCode: "dashboard.read" }],
          },
        },
        {
          role: {
            code: "READER",
            name: "Reader",
            permissions: [{ permissionCode: "roles.read" }],
          },
        },
      ],
    };
    assert.equal((await fetch(url + "/dashboard", { headers })).status, 200);
    assert.equal((await fetch(url + "/settings", { headers })).status, 403);
    assert.equal((await fetch(url + "/users", { headers })).status, 403);
    assert.equal((await fetch(url + "/permissions", { headers })).status, 403);
  } finally {
    await app.close();
  }
});
