# Fintrack / Celengin

Aplikasi keuangan pribadi. Dibuat pakai React, Express, SQLite, dan Electron. Data disimpan lokal di `finance.db`.

## Jalanin

Install Node.js yang mendukung Vite 8 (22.12+ atau 24+), lalu buka terminal di folder proyek:

```sh
npm ci
npm run app
```

Buat development lewat browser:

```sh
npm run dev
```

Buka alamat yang muncul di terminal Vite. Database dibuat otomatis saat server pertama kali jalan.

## Gmail (opsional)

Buat file `.env` di folder proyek kalau mau pakai sinkronisasi Gmail:

```env
GMAIL_USER=email@gmail.com
GMAIL_APP_PASS=app_password_gmail
```

Gunakan App Password Gmail. Jangan masukkan `.env` ke Git.

## Pindah device

1. Keluar dari aplikasi lewat menu tray, lalu hentikan server kalau masih berjalan.
2. ZIP folder proyek tanpa `node_modules/` dan `dist/`.
3. Sertakan `finance.db` dan `.env` untuk membawa data dan konfigurasi. Kalau masih ada `finance.db-wal` atau `finance.db-shm`, sertakan juga.
4. Ekstrak di device baru, install Node.js, lalu jalankan `npm ci` dan `npm run app`.

Simpan ZIP ini pribadi karena berisi data keuangan dan konfigurasi akun. Mengambil kode dari Git saja tidak membawa transaksi lama.

## Sebelum push

Commit kode, `package.json`, dan `package-lock.json`. Jangan commit `.env`, database, backup, `node_modules/`, atau `dist/`.

Pastikan `.gitignore` memuat:

```gitignore
node_modules/
dist/
.env
*.db
*.db-*
backups/
```

Cek `git status` sebelum commit supaya file pribadi tidak ikut.

Instalasi baru dimulai kosong, tanpa seed saldo, budget, atau target. Untuk membawa data lama, salin database terbaru sebelum menjalankan aplikasi.
