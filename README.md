# LEGO OpenBot Agent (`openbot-lego`)

Markas & diorama rumah tropis 2 lantai bergaya **LEGO 3D** untuk memantau dan menghidupkan agent **OpenBot Desktop** secara real-time di browser.

Dibangun dengan **React + TypeScript + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`) + Tailwind CSS**, 100% geometri LEGO prosedural tanpa file model `.glb`/`.gltf`.

---

## Prasyarat

1. **Node.js `>= 22.5.0`** *(diperlukan untuk dukungan bawaan `node:sqlite` agar Auto-Sync OpenBot berjalan otomatis)*.
   ```bash
   node -v
   ```
2. **OpenBot Desktop** sudah terpasang di komputer Anda (Windows / macOS / Linux).

---

## Cara Install & Menjalankan (CLI)

### Cara 1 — Install Global *(Rekomendasi)*
Install sekali saja, lalu jalankan dari terminal mana pun cukup 1 perintah:

```bash
npm install -g openbot-lego
openbot-lego
```

### Cara 2 — Langsung Jalan Tanpa Install (`npx`)
```bash
npx openbot-lego
```

> Begitu dijalankan, `openbot-lego` otomatis mendeteksi database lokal **OpenBot Desktop** (read-only), menjalankan server lokal, dan langsung membuka browser ke **`http://localhost:4310`**.

---

## Perintah CLI

```bash
openbot-lego                  # Jalankan Markas 3D & otomatis buka browser
openbot-lego --port 8080      # Jalankan di port custom
openbot-lego --no-open        # Jalankan tanpa membuka browser otomatis
openbot-lego status           # Lihat daftar agent OpenBot & status (Working/Idle) di terminal
openbot-lego doctor           # Cek versi Node.js & koneksi openbot.db
openbot-lego reset            # Reset konfigurasi & cache lokal (~/.openbot-lego)
openbot-lego --help           # Tampilkan bantuan lengkap
```

---

## Cara Kerja Otomatis (Zero-Config)

- **Deteksi Otomatis (`read-only`)**: mencari `openbot.db` sesuai OS Anda:
  - **Windows**: `%APPDATA%\OpenBot\openbot.db`
  - **macOS**: `~/Library/Application Support/OpenBot/openbot.db`
  - **Linux**: `~/.config/OpenBot/openbot.db`
- **Sinkronisasi 1:1 Otomatis**:
  - Setiap agent yang Anda miliki di OpenBot Desktop **langsung muncul otomatis** sebagai minifigure LEGO di dalam rumah 3D.
  - Membuat agent baru di OpenBot Desktop → minifigure baru otomatis masuk ke rumah.
  - Menghapus agent di OpenBot Desktop → karakter otomatis keluar dari map.
  - Jika belum memiliki agent (`0` agent), rumah mulai dalam keadaan kosong sampai Anda membuat agent di OpenBot (atau menambah karakter manual via `+ Karakter Baru`).
- **Status Real-Time (`Working` / `Idle`)**:
  - Saat agent memproses pesan / menjalankan *tool* / *routine*, dalam `< 1 detik` karakter LEGO-nya berubah ke **`Working`**, berjalan turun ke **Lantai 1 · Ruang Kerja**, duduk di meja komputer, dan mengetik sambil menampilkan potongan task.
  - Selesai membalas → karakter kembali **`Idle`** dan beraktivitas bebas di seluruh rumah & pantai.

---

## Konfigurasi Lewat Web

Klik pill **`OpenBot: Terhubung`** atau tombol **`Atur`** di pojok kiri atas untuk mengatur semuanya dari browser:
- **Toggle Auto-Sync OpenBot Desktop** (ON/OFF) & tombol **Sync**.
- **Lokasi `openbot.db` custom** *(opsional, jika folder data OpenBot berada di lokasi berbeda)*.
- **Edit Outfit** per agent (kustomisasi minifigure LEGO tersimpan otomatis).
- **Tombol `Test` / `Idle`** per agent untuk tes animasi kerja ke Ruang Kerja Lantai 1 secara instan.
- **Reset ke Awal** untuk mengembalikan semua pengaturan, outfit kustom, dan dekorasi ke awal.

---

## Fitur Utama

- **Rumah Tropis LEGO 2 Lantai + Mode Lantai**:
  - **Lantai 1**: Ruang Tamu (dengan TV animasi), Ruang Kerja Agent (6 meja komputer), Kamar Tamu, Kamar Mandi (shower kaca), Laundry, Lorong Tangga kayu 12 anak tangga, dan Teras Depan.
  - **Lantai 2**: Dapur, Kamar Tidur Kanopi, Kamar Rias (hammock & meja rias), Ruang Keluarga, Area Makan, Teras Kiri (engklek), dan Teras Kanan.
  - Mode **Lantai 1** menyembunyikan Lantai 2 penuh agar interior Lantai 1 jernih dan bisa langsung diklik.
- **Animasi Hidup Sesuai Aset + Obrolan AI**:
  - Pathfinding **A\*** multi-lantai & outdoor, ngobrol antar karakter, ambil minum di kulkas, masak di kompor, cuci piring/laundry, tidur di kasur (`Zzz…`), tiduran di hammock, nonton TV pakai remote, mandi shower, main engklek, bercermin, berjemur, dan berenang gaya bebas di laut.
- **Kamera Bebas & Minimap Interaktif**:
  - Drag kiri: putar 360° · Drag kanan / Shift+drag / `WASD` / panah: geser · `Q`/`E`: rotasi · Double-click lantai: fokus · Mode **Ikuti Karakter** · **Minimap** klik-untuk-pindah.
- **Character Creator & Mode Bangun**: Kustomisasi minifigure modular dengan preview 3D (hingga 12 karakter) serta Mode Bangun dengan 24 warna LEGO, 29+ aset dekorasi snap grid, Undo/Redo, dan Export/Import JSON.

---

## Development (Dari Source)

```bash
git clone https://github.com/RajaskaJanuardani/lego-openbot-agent.git
cd lego-openbot-agent
npm install
npm run dev
```

Build production + CLI executable:
```bash
npm run build
```

---

## Lisensi

[MIT](./LICENSE)
