# Panel administrasi

Starter Next.js App Router, NestJS, Prisma dan MySQL. Kode skema Zod dan tipe respons dibagi lewat `packages/shared`.

## Jalankan lokal

Perlu Node.js 24, pnpm 11.11.0, dan Docker Compose. Di PowerShell yang memblokir skrip, gunakan `pnpm.cmd`.

1. Salin `.env.example` ke `.env`. Isi password MySQL, secret JWT minimal 32 karakter, alamat email admin, dan password admin minimal 12 karakter. Sesuaikan password yang sudah di-URL-encode di `DATABASE_URL`.
2. Jalankan perintah berikut dari root.

```sh
pnpm install --frozen-lockfile
docker compose up -d --wait mysql
pnpm build
pnpm --filter @starter/api migrate
pnpm --filter @starter/api seed
pnpm dev
```

Buka [panel](http://localhost:3000/login). API lokal menyediakan [health](http://localhost:3001/health) dan [Swagger](http://localhost:3001/docs). Seed membuat admin hanya bila belum ada admin aktif.

Untuk menjalankan seluruh stack lewat Compose setelah mengisi `.env`:

```sh
docker compose up -d --build --wait
docker compose run --rm -e ADMIN_NAME -e ADMIN_EMAIL -e ADMIN_PASSWORD api pnpm --filter @starter/api seed
```

Ekspor ketiga variabel admin dari `.env` ke shell sebelum perintah seed Compose. Password MySQL yang mengandung karakter khusus perlu `MYSQL_PASSWORD_URL_ENCODED` untuk Compose. Untuk deployment, set `APP_ENV=production`, isi `WEB_ORIGIN` dengan origin HTTPS publik, lalu terminasi TLS pada reverse proxy. API hanya tersedia di jaringan internal Compose.

## Migrasi dan tes

```sh
pnpm --filter @starter/api migrate
pnpm --filter @starter/web exec playwright install chromium
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tes unit dan HTTP API berjalan tanpa MySQL dengan lapisan penyimpanan tes. Playwright menjalankan API dan Next.js di port 3401 dan 3400, menggunakan MySQL lokal yang telah dimigrasi dan di-seed. Jalankan suite browser terhadap basis data development atau tes.

## Dens UI

SPA dokumentasi menggunakan registry shadcn pada `https://dendense.github.io/dens-ui/r/{name}.json`. Dokumentasi menjalankan `npx shadcn@latest init`, lalu `npx shadcn@latest add https://dendense.github.io/dens-ui/r/theme.json` dan menambahkan komponen lewat URL item. Workspace sudah mengatur alias `@dens`. Contoh penambahan komponen:

```sh
cd apps/web
pnpm dlx shadcn@latest add @dens/tooltip
```

Katalog registry yang diperiksa berisi theme, utils, alert, avatar, badge, button, card, chart, checkbox, dialog, divider, dropdown-menu, footer, input, kbd, label, music-player, navbar, post-card, progress, radio-group, select, separator, sidebar, skeleton, slider, switch, table, tabs, textarea, tooltip, dan video-player.

Kode komponen diambil langsung dari JSON registry, dengan deklarasi client untuk App Router. Tema v0.2.0 diimpor sesudah Tailwind. Mars Green `#008c8d` adalah warna merek, `--primary` adalah warna semantik untuk teks dan aksi, dan `--highlight` mengikuti oranye Hermès `#ff8a00` pada tema terang serta `#ff9a1f` pada tema gelap. Warna permukaan, status, garis, fokus, radius, elevasi, Figtree, dan angka JetBrains Mono berasal dari tema. `next-themes` menerapkan kelas `.dark` untuk mode gelap dan mengikuti sistem bila dipilih.

## Keputusan

- Versi yang dipasang adalah Next.js 16.4.6, NestJS 12.6.0, Prisma 7.10.1, dan Tailwind CSS 4.3.5. Prisma memakai rilis stabil 7 karena tag `latest` mengarah ke kandidat rilis 8 saat dicek. TanStack Table memakai v8.
- Next.js meneruskan permintaan API ke NestJS dari origin yang sama. NestJS memvalidasi origin untuk mutasi. Cookie memakai HttpOnly dan SameSite=Lax, serta Secure ketika production. Proxy memeriksa sesi dan API selalu memeriksa otorisasi. Branding publik hanya berisi nama, deskripsi, logo, dan tema.
- Prisma menggunakan adapter MariaDB untuk koneksi MySQL. Perubahan yang dapat mengurangi jumlah admin aktif diserialkan lewat kunci baris pengaturan. Status dan peran sesi diverifikasi dari basis data.
- Port host MySQL 3307 menghindari benturan port 3306. Port internal MySQL tetap 3306. Aplikasi berjalan sebagai proses lokal atau di Compose.
- Design Read memakai ENERGY 1, RHYTHM 2, MOTION 1. Layout mengikuti struktur kerja blok dasbor Dens UI lewat navigasi, topbar, area analisis dominan, dan ringkasan samping. Tabel serta formulir menjadi fokus halaman masing-masing. Garis pemisah, warna aktif, dan angka tabular menghubungkan halaman. Oranye menonjolkan satu tindakan atau label asal data. Ikon menunjukkan tujuan navigasi atau aksi. Panel vertikal pada gambar tidak digunakan.
