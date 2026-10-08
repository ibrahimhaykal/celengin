# Celengin (Fintrack)

Celengin adalah aplikasi keuangan pribadi untuk mencatat pemasukan, pengeluaran, dan transfer antar dompet. Saldo, anggaran bulanan, jadwal pembayaran, dan target tabungan bisa dipantau dari satu dashboard.

## Privacy first

Data keuangan disimpan di database SQLite lokal pada perangkat pengguna. Celengin tidak mengunggah database ke server milik pengembang dan tidak membutuhkan akun Celengin. Pengguna mengelola data, konfigurasi akun, serta backup sendiri.

Dashboard menggunakan server lokal di perangkat, tanpa server pusat untuk menyimpan data keuangan. Pencatatan manual dapat digunakan tanpa koneksi internet.

Sinkronisasi Gmail dan pembaruan harga aset menghubungi layanan eksternal saat digunakan: Gmail, CoinGecko, Indodax, dan Pasardana. Email diproses di perangkat pengguna; permintaan harga aset tidak mengirim saldo atau jumlah kepemilikan. Konfigurasi Gmail disimpan dalam file `.env` lokal, sehingga file ini dan backup database perlu disimpan secara pribadi.

## Fitur

- Dompet dengan saldo yang bisa dikelola sendiri.
- Catatan transaksi dan rekap bulanan.
- Rencana pemasukan, pengeluaran, dan anggaran per kategori.
- Jadwal transaksi rutin dan target tabungan.
- Sinkronisasi notifikasi transaksi Gmail yang didukung parser aplikasi.
- Dompet aset dengan pembaruan harga, tema terang/gelap, dan opsi menyembunyikan saldo.
- Backup database harian otomatis, dengan 14 snapshot terbaru disimpan.

## Aset yang didukung

| Jenis | Pilihan | Cara menghitung saldo |
| --- | --- | --- |
| Dompet manual | Uang tunai, rekening bank, e-wallet, deposito, atau aset lain yang dicatat sendiri | Saldo Rupiah diisi pengguna dan berubah mengikuti transaksi |
| Crypto | Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB (BNB), XRP (XRP), Dogecoin (DOGE), Tether (USDT) | Jumlah koin × harga dalam Rupiah |
| Reksa dana | Pasar Uang (RDPU), Pendapatan Tetap, Saham, Campuran, dan Terproteksi | Jumlah unit × NAB per unit dari produk yang dipilih |

Harga crypto diambil dari CoinGecko, dengan Indodax sebagai sumber cadangan. Aplikasi mencoba memperbarui harga setiap 5 menit. Perubahan harga 24 jam ditampilkan bila tersedia dari sumber data.

Produk reksa dana dicari berdasarkan nama melalui data Pasardana. Daftarnya mengikuti produk yang dikembalikan sumber tersebut dan memiliki NAB positif; nama produk tidak ditanam sebagai daftar tetap di aplikasi. Informasi produk mencakup manajer investasi, jenis, status syariah, NAB, dan tanggal NAB. Aplikasi mengecek pembaruan setiap 5 menit, tetapi NAB mengikuti tanggal data dari Pasardana, bukan harga pasar setiap saat.

Untuk mengaktifkan perhitungan harga pada dompet, buka **Atur harga live**, pilih **Crypto** atau **Reksa dana**, pilih aset/produk, lalu masukkan jumlah koin/unit atau nilai Rupiah. Nilai Rupiah dikonversi menjadi jumlah unit memakai harga saat pengaturan disimpan; pembaruan berikutnya mengikuti jumlah unit tersebut.

Jika koneksi atau sumber harga gagal, saldo mempertahankan nilai terakhir. Saham individual, ETF, emas, dan kurs valuta asing belum memiliki sumber harga otomatis; nilainya bisa dicatat lewat dompet manual. Celengin mencatat kepemilikan dan nilainya, tanpa menjalankan pembelian atau penjualan aset.

## Install di Windows

Unduh `Celengin-Setup-1.0.0-x64.exe` dari [Releases](https://github.com/ibrahimhaykal/fin-track/releases), jika sudah tersedia. Jalankan installer, lalu buka Celengin dari shortcut. Versi installer tidak memerlukan Node.js.

Instalasi baru dimulai kosong, tanpa contoh saldo atau data pribadi.

## Cara pakai

1. Tambahkan dompet dan isi saldo awal.
2. Atur rencana pemasukan dan pengeluaran serta budget kategori.
3. Catat pemasukan, pengeluaran, atau transfer dengan memilih dompet terkait.
4. Tambahkan jadwal rutin dan target tabungan bila diperlukan.
5. Pantau saldo, sisa budget, dan rekap bulanan dari dashboard.

Menutup jendela menyembunyikan aplikasi ke system tray. Untuk menghentikan aplikasi, pilih **Keluar** dari menu tray. Menu tray juga menyediakan pilihan untuk membuka aplikasi otomatis saat Windows menyala.

## Data dan backup

Pada versi installer, pilih **Buka folder data** dari menu tray untuk menemukan database `finance.db`, konfigurasi `.env`, dan folder `backups`. Pada versi source, data disimpan di folder proyek secara default.

Untuk memindahkan data ke perangkat lain:

1. Hentikan aplikasi dan server di perangkat asal.
2. Salin `finance.db`, `.env` jika digunakan, serta `finance.db-wal` dan `finance.db-shm` jika masih ada.
3. Install dan buka aplikasi di perangkat tujuan untuk membuat folder data, lalu pilih **Buka folder data** dan **Keluar**.
4. Letakkan file yang disalin di folder data tujuan sebelum membuka aplikasi kembali. Simpan salinan database tujuan terlebih dahulu jika sudah berisi data.

File ini berisi data pribadi. Simpan backup secara pribadi dan jangan unggah ke repository atau release. Folder data versi installer tidak dihapus saat uninstall.

## Sinkronisasi Gmail (opsional)

Buat `.env` di folder data aplikasi:

```env
GMAIL_USER=email@gmail.com
GMAIL_APP_PASS=app_password_gmail
SYNC_START_DATE=2026-10-01
```

Gunakan App Password Gmail dan ubah `SYNC_START_DATE` sesuai tanggal mulai pencatatan. Restart aplikasi setelah konfigurasi diubah, lalu gunakan tombol sinkronisasi Gmail di dashboard. Periksa hasilnya melalui log sinkronisasi; aplikasi hanya memproses format notifikasi yang dikenali.

## Email yang dibaca pada versi 1.0.0

Sinkronisasi menggunakan Gmail yang dikonfigurasi pengguna. Dukungan saat ini mengikuti format notifikasi berikut; belum mencakup semua bank atau semua email transaksi.

| Pengirim/layanan | Format yang dikenali |
| --- | --- |
| Jago | Notifikasi dari `noreply@jago.com`: uang masuk, pembayaran/transfer keluar, perpindahan kantong, tarik tunai, serta refund, cashback, atau bunga dengan nominal dan pola yang dikenali |
| BCA | Email **Internet Transaction Journal / Jurnal Transaksi** myBCA: pembayaran dan transfer keluar. Transfer ke rekening sendiri dikenali jika nama pemilik dan penerima sesuai. Belum mendukung notifikasi uang masuk BCA secara umum |
| Pintu | Email dari `support@pintu.co.id` tentang deposit atau penarikan Rupiah. Dicatat sebagai perpindahan dana antar dompet, bukan pembelian/penjualan crypto |
| GoPay | Email dengan pola **Riwayat Tagihan GoPay / Tagihan GoPay**, sebagai pengeluaran |
| Steam | Email pembelian/pembayaran dengan pola Steam yang dikenali dan nominal Rupiah |
| Itemku | Email pembelian dengan pola Itemku yang dikenali dan nominal Rupiah |

Batasan versi ini:

- Memeriksa **Inbox dan Spam**, masing-masing maksimal **50 email terbaru yang cocok dengan filter pencarian**. Folder lain dan kandidat yang lebih lama belum diproses.
- Hanya memproses email sejak `SYNC_START_DATE`; jika tidak diatur, tanggal mulainya `2026-10-01`.
- Parser umum mencari nominal `Rp` atau `IDR`, dengan minimum Rp1.000. Tidak mengonversi mata uang asing otomatis.
- Email promosi/newsletter dan format yang tidak dikenali dilewati. Filter promosi juga bisa melewatkan notifikasi transaksi jika isinya memuat kata atau header yang dianggap newsletter.
- Email yang sudah tercatat tidak diproses ulang. Ada pemeriksaan salinan forward dan penggabungan beberapa pasangan email transfer, tetapi hasil tetap perlu diperiksa lewat log.
- Pencocokan dompet mengikuti nama/tipe dompet. Transfer yang belum terhubung ke dompet perlu dihubungkan sebelum saldo dipindahkan.

Perluasan lintas bank dan daftar pemeriksaan untuk format baru belum tersedia pada versi ini.

## Menjalankan source

Stack: React, Vite, Tailwind CSS, Express, SQLite (`better-sqlite3`), dan Electron.

Gunakan Node.js 22.12+ atau 24+.

```sh
git clone https://github.com/ibrahimhaykal/fin-track.git
cd fin-track
npm ci
npm run app
```

Untuk development lewat browser:

```sh
npm run dev
```

Buka alamat Vite yang muncul di terminal. API berjalan di loopback pada port 5000; aplikasi desktop menggunakan port 5123.

## Build installer

Jalankan di Windows untuk membuat installer 64-bit:

```sh
npm ci
npm run release:win
```

Hasil build ada di `release/Celengin-Setup-1.0.0-x64.exe`. Database, backup, dan `.env` tidak disertakan dalam installer.

Struktur utama:

- `src/`: dashboard React.
- `server.js`: API dan skema database.
- `electron/`: jendela desktop, tray, dan aset ikon.

Commit source dan `package-lock.json`. `.gitignore` mengecualikan dependency, hasil build, database, backup, serta konfigurasi pribadi.
