const messages = {
  403: {
    en: ["Access denied", "Your account does not have access to this page."],
    id: [
      "Akses ditolak",
      "Akun Anda tidak memiliki izin untuk membuka halaman ini.",
    ],
  },
  404: {
    en: ["Page not found", "Check the address or return to the dashboard."],
    id: ["Halaman tidak ditemukan", "Periksa alamat atau kembali ke dasbor."],
  },
  500: {
    en: [
      "Something went wrong",
      "The application could not complete your request.",
    ],
    id: ["Terjadi gangguan", "Aplikasi gagal memproses permintaan Anda."],
  },
  505: {
    en: [
      "HTTP version not supported",
      "Use a client that supports the server’s HTTP version.",
    ],
    id: [
      "Versi HTTP tidak didukung",
      "Gunakan klien yang mendukung versi HTTP server.",
    ],
  },
} as const;

export type ErrorStatus = keyof typeof messages;
export function errorMessages(status: ErrorStatus, locale: "en" | "id") {
  return messages[status][locale];
}

export function errorResponse(request: Request, status: ErrorStatus) {
  const locale =
    new URL(request.url).searchParams.get("lang") === "id" ? "id" : "en";
  const [title, description] = errorMessages(status, locale);
  const home = locale === "en" ? "Back to dashboard" : "Kembali ke dasbor";
  const switchLanguage = locale === "en" ? "Bahasa Indonesia" : "English";
  return new Response(
    `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${status} · ${title}</title>
<style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:light-dark(#eef2f1,#131a19);color:light-dark(#121b19,#eff6f4)}
main{box-sizing:border-box;width:min(32rem,calc(100% - 2rem));padding:2rem;border:1px solid light-dark(#d5e0dd,#384542);border-radius:2rem;background:light-dark(white,#1d2826)}
code{font-size:1rem;color:light-dark(#00776c,#6bddd0)}h1{margin:.55rem 0}p{line-height:1.5}
nav{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;margin-top:1.5rem}a{color:inherit}a:first-child{border-radius:1rem;background:light-dark(#182421,#bcf1e3);color:light-dark(white,#182421);padding:.6rem 1rem;text-decoration:none}
</style>
</head>
<body><main><code>${status}</code><h1>${title}</h1><p>${description}</p><nav>
<a href="/dashboard">${home}</a><a href="?lang=${locale === "en" ? "id" : "en"}">${switchLanguage}</a>
</nav></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
