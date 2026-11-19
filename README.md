# LEGO OpenBot Agent

Markas & diorama rumah tropis 2 lantai bergaya **LEGO 3D** untuk memantau dan menghidupkan agent **OpenBot Desktop** secara real-time di browser.

Dibangun dengan **React + TypeScript + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`) + Tailwind CSS**, 100% geometri LEGO prosedural tanpa file model `.glb`/`.gltf`.

---

## Prasyarat

1. **Node.js `>= 22.5.0`** *(diperlukan untuk dukungan bawaan `node:sqlite` agar Auto-Sync OpenBot berjalan otomatis tanpa instalasi driver tambahan)*.
   Cek versi Node Anda:
   ```bash
   node -v
   ```
2. **OpenBot Desktop** sudah terpasang di komputer Anda (Windows / macOS / Linux).

---

## Cara Install & Menjalankan

Cukup **1 perintah** — Bridge & Auto-Sync OpenBot sudah tertanam langsung di dev server Vite (tidak perlu `.env`, tidak perlu token, dan tidak perlu terminal kedua):

```bash
# 1. Clone repository
git clone https://github.com/RajaskaJanuardani/lego-openbot-agent.git
cd lego-openbot-agent

# 2. Install dependencies
npm install

# 3. Jalankan aplikasi
npm run dev
```

Setelah itu buka **`http://localhost:5173`** di browser.

---

## Cara Kerja Otomatis (Zero-Config)

Begitu `http://localhost:5173` terbuka:
- **Deteksi Otomatis (`read-only`)**: Bridge mencari database lokal OpenBot (`openbot.db`) sesuai OS Anda:
  - **Windows**: `%APPDATA%\OpenBot\openbot.db`
  - **macOS**: `~/Library/Application Support/OpenBot/openbot.db`
  - **Linux**: `~/.config/OpenBot/openbot.db`
- **Sinkronisasi 1:1 Otomatis**:
  - Setiap agent yang Anda miliki di OpenBot Desktop **langsung muncul otomatis** sebagai karakter minifigure LEGO di dalam rumah 3D.
  - Membuat agent baru di OpenBot Desktop → karakter LEGO baru otomatis masuk ke rumah.
  - Menghapus agent di OpenBot Desktop → karakter otomatis keluar dari map.
  - Jika belum memiliki agent (`0` agent), rumah mulai dalam keadaan kosong sampai Anda membuat agent di OpenBot (atau menambah karakter manual via `+ Karakter Baru`).
- **Status Real-Time (`Working` / `Idle`)**:
  - Saat Anda mengirim pesan ke agent di OpenBot (atau routine berjalan), dalam `< 1 detik` karakter LEGO-nya berubah ke status **`Working`**, berjalan turun ke **Lantai 1 · Ruang Kerja**, duduk di meja komputer, dan mengetik sambil menampilkan potongan task.
  - Selesai membalas → karakter kembali **`Idle`** dan beraktivitas bebas di seluruh rumah & pantai.

---

## Konfigurasi Lewat Web

Klik pill **`OpenBot: Terhubung`** atau tombol **`Atur`** di pojok kiri atas untuk mengatur semuanya langsung dari browser:
- **Toggle Auto-Sync OpenBot Desktop** (ON/OFF) & tombol **Sync**.
- **Lokasi `openbot.db` custom** *(opsional, jika folder data OpenBot Anda berada di lokasi berbeda)*.
- **Edit Outfit** per agent (kustomisasi minifigure LEGO tersimpan otomatis di browser).
- **Tombol `Test` / `Idle`** per agent untuk menguji animasi kerja ke Ruang Kerja Lantai 1 secara instan.
- **Reset ke Awal** untuk mengembalikan semua pengaturan, outfit kustom, dan dekorasi ke kondisi awal.

---

## Fitur Utama

- **Rumah Tropis LEGO 2 Lantai + Mode Lantai**:
  - **Lantai 1**: Ruang Tamu (dengan TV animasi), Ruang Kerja Agent (6 meja komputer), Kamar Tamu, Kamar Mandi (shower kaca), Laundry, Lorong Tangga kayu 12 anak tangga, dan Teras Depan.
  - **Lantai 2**: Dapur, Kamar Tidur Kanopi, Kamar Rias (hammock & meja rias), Ruang Keluarga, Area Makan, Teras Kiri (engklek), dan Teras Kanan.
  - Mode **Lantai 1** menyembunyikan Lantai 2 penuh agar interior Lantai 1 terlihat jernih dan bisa langsung diklik.
- **Animasi Hidup Sesuai Aset + Obrolan AI**:
  - Pathfinding **A\*** multi-lantai & outdoor, ngobrol antar karakter, ambil minum di kulkas, masak di kompor, cuci piring/laundry, tidur di kasur (`Zzz…`), tiduran di hammock, nonton TV pakai remote, mandi shower, main engklek, bercermin, berjemur, dan berenang gaya bebas di laut.
- **Kamera Bebas & Minimap Interaktif**:
  - Drag kiri: putar 360° · Drag kanan / Shift+drag / `WASD` / panah: geser · `Q`/`E`: rotasi · Double-click lantai: fokus · Mode **Ikuti Karakter** · **Minimap** klik-untuk-pindah.
- **Character Creator**: Kustomisasi kepala, wajah, rambut, topi, baju, motif, bawahan, sepatu, postur, dan 6 slot aksesoris dengan preview 3D turntable (hingga 12 karakter).
- **Mode Bangun**: Ubah warna dinding & lantai (24 warna LEGO), katalog 29+ aset dekorasi snap grid + cek tabrakan AABB, Undo/Redo, Export/Import JSON.

---

## Troubleshooting

- **Status `OpenBot: 0 Agent` atau `openbot.db` tidak ditemukan**:
  1. Pastikan OpenBot Desktop sudah terpasang dan minimal pernah dibuka sekali.
  2. Klik tombol **`Atur`** di kiri atas, lalu isi path lengkap file `openbot.db` Anda dan klik **Simpan**.
- **Auto-Sync tidak jalan (`node:sqlite` tidak tersedia)**:
  Pastikan versi Node.js Anda minimal **`v22.5.0`** (disarankan Node.js 22 LTS / 24+).

---

## Opsi Lanjutan (Standalone Bridge / Build Production)

```bash
# Build production (TypeScript check + Vite bundle)
npm run build

# Preview hasil build (embedded bridge juga ikut aktif)
npm run preview
```

Jika ingin menjalankan Bridge secara terpisah di port `4310` (misalnya untuk integrasi webhook eksternal):

```bash
BRIDGE_TOKEN="ganti-dengan-token-anda" npm run bridge
VITE_BRIDGE_URL="http://localhost:4310" npm run dev
```
