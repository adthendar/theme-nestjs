# Delivery Gate Anti-Slop

Mode **during**. Arah antarmuka berasal dari DESIGN.md dan struktur blok Dashboard Dens UI.

## Hard Gate

| Aturan | Hasil | Bukti                                                                                                                                                                    |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-02   | PASS  | Pemindaian teks antarmuka aplikasi menemukan nol em dash.                                                                                                                |
| R-03   | PASS  | Playwright membuka navigasi pada viewport 375 piksel dan mengukur lebar dokumen tetap 375 piksel. Tabel memakai wadah gulir sendiri.                                     |
| R-17   | PASS  | Angka dasbor berasal dari `dashboard.mock.ts` dengan label Data contoh pada halaman.                                                                                     |
| R-18   | PASS  | Konten layar berasal dari skema pengguna, pengaturan, dan seri contoh.                                                                                                   |
| R-23   | PASS  | Identitas visual berasal dari token Dens UI dan URL logo yang diatur admin. Navigasi mengikuti tiga rute panel yang diminta.                                             |
| R-24   | PASS  | Playwright membuka Dasbor, Pengguna, dan Pengaturan lewat navigasi.                                                                                                      |
| R-25   | PASS  | Perhitungan sembilan pasangan token teks utama menghasilkan minimum 5,23:1 pada tema terang dan 5,00:1 pada tema gelap.                                                  |
| R-26   | PASS  | Kontrol utama memanggil mutasi, memilih filter, mengganti tema, membuka navigasi, atau menutup dialog.                                                                   |
| R-27   | PASS  | Halaman memakai status memuat, alert dengan pemulihan, dan pesan eksplisit saat data kosong. Playwright menguji hasil pencarian kosong setelah hapus.                    |
| R-28   | PASS  | Lingkup konten terdiri dari login, dasbor, pengelolaan pengguna, dan pengaturan.                                                                                         |
| R-32   | PASS  | Status fokus terlihat lewat token ring. Playwright membuka pemilih tema dengan Space dan menutup dialog dengan Escape. Dialog memulihkan fokus ke pemicu atau pencarian. |
| R-33   | PASS  | Kode fitur dan gaya tersimpan di sumber TypeScript dan CSS. CSS Dens diimpor melalui stylesheet global.                                                                  |
| R-34   | PASS  | Playwright mengganti tema Gelap dan Terang pada browser dan memverifikasi kelas HTML. Mode Sistem mengikuti preferensi perangkat.                                        |
| R-35   | PASS  | Build Next.js dan alur browser terhadap API dan MySQL lulus. Cakupan meliputi autentikasi, CRUD, filter, navigasi, pengaturan, dan tema.                                 |
| R-36   | PASS  | UI menyajikan identitas, data aplikasi, dan contoh yang diberi label.                                                                                                    |
| R-37   | PASS  | DESIGN.md menetapkan panel internal padat, sidebar kiri, dan palet Dens UI sebelum implementasi.                                                                         |
| R-38   | PASS  | Satu file mock memasok contoh dasbor. Tabel pengguna berasal dari basis data.                                                                                            |
| R-39   | PASS  | Dokumen memakai bahasa Indonesia, judul, landmark, label formulir, dan nama aksesibel. Kontrol menggunakan elemen native atau primitif Radix dari Dens UI.               |
| R-40   | PASS  | Logo yang dikonfigurasi berukuran eksplisit 28 × 28, font dilayani bersama aplikasi, dan skeleton menyisakan ruang saat memuat.                                          |

## Purpose-Gate

| Aturan | Hasil | Bukti                                                                                           |
| ------ | ----- | ----------------------------------------------------------------------------------------------- |
| R-01   | PASS  | Warna bidang dan garis token memisahkan navigasi, panel data, dan formulir.                     |
| R-04   | PASS  | Ikon menunjukkan tujuan navigasi, buka atau tutup sidebar, dan keluar.                          |
| R-06   | PASS  | Figtree memberi teks administrasi yang mudah dipindai. JetBrains Mono mengatur angka ringkasan. |
| R-07   | PASS  | Garis pada chart membantu membaca skala. Bidang dasar memakai token permukaan.                  |
| R-08   | PASS  | Navigasi pagination memakai label tindakan dan angka halaman.                                   |
| R-09   | PASS  | Badge menunjukkan asal data contoh dan status akun.                                             |
| R-10   | PASS  | Sidebar, topbar, dan formulir memakai permukaan solid bertoken.                                 |
| R-12   | PASS  | Elevasi Dens menandai lapisan panel dan dialog sesuai perannya.                                 |
| R-13   | PASS  | Ring fokus menunjukkan posisi keyboard.                                                         |
| R-14   | PASS  | Grafik mengambil ruang utama, sedangkan angka status dirangkum di samping.                      |
| R-19   | PASS  | Gerak dibatasi ke umpan balik kontrol dan pemuatan. CSS mengikuti prefers-reduced-motion.       |
| R-22   | PASS  | Grafik menunjukkan seri waktu. Logo tampil bila admin mengisi URL.                              |

## Liveliness

| Pemeriksaan | Hasil | Bukti                                                                             |
| ----------- | ----- | --------------------------------------------------------------------------------- |
| Dials       | PASS  | ENERGY 1, RHYTHM 2, MOTION 1 tercatat dalam README.                               |
| Konsistensi | PASS  | Grafik lebar, tabel penuh, dan formulir terbatas mengikuti kebutuhan tiap layar.  |
| Fokus       | PASS  | Tiap layar berfokus pada formulir masuk, grafik, tabel, atau formulir pengaturan. |
| Ruang       | PASS  | Spasi dan garis memisahkan header, filter, data, dan tindakan.                    |
| Aksen       | PASS  | Oranye menandai aksi utama atau asal data pada dasbor.                            |
| Identitas   | PASS  | Aksen Mars Green, garis pemisah, dan angka tabular berulang di antarmuka.         |
| Design Read | PASS  | Keputusan desain merujuk DESIGN.md, palet resmi, dan tata letak blok Dashboard.   |

## Craftsmanship dan Quality Locks

| Aturan | Hasil | Bukti                                                                                              |
| ------ | ----- | -------------------------------------------------------------------------------------------------- |
| C-1    | PASS  | Dens UI menentukan tema, dan tata letak menempatkan tugas utama sebagai fokus layar.               |
| C-2    | PASS  | Alur utama, perpindahan tema, dan navigasi lolos tes browser.                                      |
| C-3    | PASS  | Setiap halaman memenuhi satu tugas administrasi yang diminta.                                      |
| C-4    | PASS  | Alur browser mencakup desktop, ponsel, keyboard, serta tema terang dan gelap.                      |
| C-5    | PASS  | Data operasional berasal dari MySQL dan data mock diberi penanda.                                  |
| R-05   | PASS  | Struktur grafik dan ringkasan, tabel, serta formulir mengikuti fungsi masing-masing.               |
| R-11   | PASS  | Bidang panel, dialog, tabel, dan kontrol memakai radius Dens yang berbeda.                         |
| R-15   | PASS  | Label seperti Tambah pengguna dan Simpan pengaturan menyebut hasil tindakan.                       |
| R-16   | PASS  | UI memakai istilah kerja sehari-hari dalam Bahasa Indonesia.                                       |
| R-20   | PASS  | Identitas tetap terbaca melalui palet Dens, struktur padat, dan ritme garis.                       |
| R-21   | PASS  | Tersedia tema Terang, Gelap, dan Sistem.                                                           |
| R-29   | PASS  | Variabel warna aplikasi berasal dari CSS tema Dens UI.                                             |
| R-30   | PASS  | Referensi komposisi berasal dari blok Dens UI publik dan diterapkan pada fitur admin yang diminta. |
| R-31   | PASS  | Keputusan mengenai aksen, ikon, hierarki data, tipografi, dan struktur ditulis di README.          |
