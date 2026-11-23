import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { Settings } from "@starter/shared";

test("admin masuk, menambah, mengubah, dan menghapus pengguna", async ({
  page,
  browser,
  baseURL,
}) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || !baseURL)
    throw new Error("Isi ADMIN_EMAIL dan ADMIN_PASSWORD lalu jalankan seed.");
  const testId = randomUUID().slice(0, 8);
  const name = "Tes Pengguna " + testId;
  const address = testId + "@example.test";
  const userPassword = "test-only-" + testId;
  const headers = { origin: baseURL };

  await page.goto("/users");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Work email").fill(email);
  const passwordField = page.locator("#password");
  await page.getByRole("button", { name: "Show password" }).focus();
  await page.keyboard.press("Space");
  await expect(passwordField).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(passwordField).toHaveAttribute("type", "password");
  await passwordField.fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
  await expect(page.getByText("Sample data", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mark as read: Approval requested" })
    .click();
  await expect(page.getByText("Read", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByText("Read", { exact: true })).toHaveCount(3);
  await page.keyboard.press("Escape");
  const nav = page.getByRole("navigation", {
    name: /Main navigation|Navigasi utama/,
  });
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(
    nav.getByRole("link", { name: /Overview|Ringkasan/ }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  const topbar = page.getByRole("banner", {
    name: /Panel toolbar|Bilah panel/,
  });
  await topbar.evaluate((element) => (element.dataset.testPersist = "yes"));
  await nav.evaluate((element) => (element.dataset.testPersist = "yes"));
  await nav.getByRole("link", { name: "Users" }).click();
  await expect(topbar.getByRole("heading", { name: "Pengguna" })).toBeVisible();
  await expect(topbar).toHaveAttribute("data-test-persist", "yes");
  await expect(nav).toHaveAttribute("data-test-persist", "yes");
  await expect(nav.getByRole("link", { name: "Pengguna" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const pageSize = page.getByRole("combobox", { name: "Baris per halaman" });
  await pageSize.click();
  const sizeRequest = page.waitForResponse(
    (response) =>
      response.url().includes("/api/users?") &&
      new URL(response.url()).searchParams.get("size") === "10",
  );
  await page.getByRole("option", { name: "10", exact: true }).click();
  expect((await sizeRequest).ok()).toBe(true);
  await expect(
    page.getByRole("button", { name: "Halaman pertama" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Tambah pengguna" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nama", { exact: true }).fill(name);
  await dialog.getByLabel("Email").fill(address);
  await dialog.getByLabel("Kata sandi", { exact: true }).fill(userPassword);
  await dialog.getByRole("button", { name: "Tampilkan kata sandi" }).click();
  await expect(dialog.locator("#user-password")).toHaveAttribute(
    "type",
    "text",
  );
  await dialog.getByRole("button", { name: "Sembunyikan kata sandi" }).click();
  await expect(dialog.locator("#user-password")).toHaveAttribute(
    "type",
    "password",
  );

  try {
    await dialog.getByRole("button", { name: "Simpan", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByLabel("Cari nama atau email").fill(address);
    await page.getByRole("combobox", { name: "Filter peran" }).click();
    await page.getByRole("option", { name: "Pengguna", exact: true }).click();
    await page.getByRole("combobox", { name: "Filter status" }).click();
    await page.getByRole("option", { name: "Aktif", exact: true }).click();

    await page
      .getByRole("button", { name: "Aksi untuk " + name, exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Ubah", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page
      .getByRole("button", { name: "Aksi untuk " + name, exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Ubah", exact: true }).click();
    await dialog.getByLabel("Nama", { exact: true }).fill(name + " Baru");
    await dialog.getByRole("button", { name: "Simpan", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: name + " Baru", exact: true }),
    ).toBeVisible();

    const member = await browser.newContext({ baseURL });
    try {
      const login = await member.request.post("/api/auth/login", {
        headers,
        data: { email: address, password: userPassword },
      });
      expect(login.ok()).toBe(true);
      const forbidden = await member.request.get("/api/users");
      expect(forbidden.status()).toBe(403);
      const memberPage = await member.newPage();
      await memberPage.goto("/settings");
      await expect(memberPage).toHaveURL(/\/403$/);
      await expect(
        memberPage.getByRole("heading", { name: "Access denied" }),
      ).toBeVisible();
      await expect(
        memberPage.getByRole("link", { name: "Pengaturan" }),
      ).toHaveCount(0);
      expect(
        (await member.request.post("/api/auth/refresh", { headers })).ok(),
      ).toBe(true);
    } finally {
      await member.close();
    }

    await page
      .getByRole("button", {
        name: "Aksi untuk " + name + " Baru",
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Hapus", exact: true }).click();
    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
    await page
      .getByRole("button", {
        name: "Aksi untuk " + name + " Baru",
        exact: true,
      })
      .click();
    await page.getByRole("menuitem", { name: "Hapus", exact: true }).click();
    await dialog.getByRole("button", { name: "Hapus akun" }).click();
    await expect(
      page.getByText(
        "Tidak ada pengguna yang cocok. Ubah pencarian atau filter.",
      ),
    ).toBeVisible();

    const settingsResponse = await page.request.get("/api/settings");
    expect(settingsResponse.ok()).toBe(true);
    const original: Settings = await settingsResponse.json();
    try {
      await nav.getByRole("link", { name: "Pengaturan" }).click();
      await expect(
        topbar.getByRole("heading", { name: "Pengaturan" }),
      ).toBeVisible();
      await expect(topbar).toHaveAttribute("data-test-persist", "yes");
      await expect(nav).toHaveAttribute("data-test-persist", "yes");
      await page.getByLabel("Nama aplikasi").fill("Panel Tes " + testId);
      await page.getByRole("button", { name: "Simpan pengaturan" }).click();
      await expect(page.getByRole("status")).toHaveText(
        "Pengaturan tersimpan.",
      );
      await expect(page).toHaveTitle("Panel Tes " + testId);
    } finally {
      await page.request.put("/api/settings", { headers, data: original });
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(
      page.getByRole("navigation", { name: /Main navigation|Navigasi utama/ }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: /Main navigation|Navigasi utama/ })
      .getByRole("link", { name: /Overview|Ringkasan/ })
      .click();
    await expect(
      page.getByRole("heading", { name: /Overview|Ringkasan/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);
    await expect(page.getByRole("button", { name: "Workflows" })).toBeVisible();
    await page.getByRole("button", { name: "Switch to Indonesian" }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const theme = page.getByRole("button", { name: /^Tema / });
    await expect(theme).toHaveAccessibleName(/^Tema /);
    if (!(await theme.getAttribute("aria-label"))?.startsWith("Tema Terang")) {
      if ((await theme.getAttribute("aria-label"))?.startsWith("Tema Sistem")) {
        await theme.click();
        await expect(theme).toHaveAccessibleName(/^Tema Gelap/);
      }
      await theme.click();
      await expect(theme).toHaveAccessibleName(/^Tema Terang/);
    }
    await theme.focus();
    await page.keyboard.press("Space");
    await expect(theme).toHaveAccessibleName(/^Tema Sistem/);
    await theme.click();
    await expect(theme).toHaveAccessibleName(/^Tema Gelap/);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await theme.click();
    await expect(theme).toHaveAccessibleName(/^Tema Terang/);
    await expect(page.locator("html")).toHaveClass(/light/);
    expect(
      await page.evaluate(() => localStorage.getItem("starter-theme-choice")),
    ).toBe("light");
  } finally {
    const response = await page.request.get(
      "/api/users?search=" + encodeURIComponent(address),
    );
    if (response.ok()) {
      const { items } = await response.json();
      for (const user of items)
        await page.request.delete("/api/users/" + user.id, { headers });
    }
  }
  await page.getByRole("button", { name: "Menu akun" }).click();
  await page.getByRole("menuitem", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
