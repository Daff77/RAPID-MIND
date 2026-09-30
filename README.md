# 🧠 RAPID-MIND
### *Integrated Rapid Psychological Triage & Two-Tiered Disaster Mental Health Referral System*

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Reverb](https://img.shields.io/badge/Laravel-Reverb_WebSockets-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com/docs/reverb)
[![Standard](https://img.shields.io/badge/Standard-WHO_SRQ--20-0085ca?style=for-the-badge&logo=world-health-organization)](https://www.who.int/)

---

## 📌 Latar Belakang & Gambaran Umum

Bencana alam sering kali menyisakan luka psikologis mendalam bagi penyintas. Di lapangan, penanganan kesehatan jiwa sering kali terlambat karena relawan kesulitan mengidentifikasi gejala kegawatdaruratan psikiatri secara cepat, tidak adanya standardisasi instrumen skrining, dan terputusnya koordinasi antara posko pengungsian, fasilitas kesehatan (Faskes/PSC 119), serta pengambil kebijakan (BPBD dan Dinas Kesehatan).

**RAPID-MIND** adalah sistem penapisan (*triage*) kesehatan mental pascabencana terpadu yang memadukan protokol **Psychological First Aid (PFA)** pada fase akut (Hari 1–3) dan instrumen standar **WHO Self-Reporting Questionnaire (SRQ-20)** pada fase lanjutan (Hari 4–30). Dilengkapi fitur **Speech-to-Text (STT) bertenaga NLP**, **Auto-Lookup NIK**, tombol darurat **Always-On Floating Red Flag**, serta alur triase dua pintu (*Two-Tiered Triage*) yang langsung terintegrasi ke rumah sakit rujukan dan pusat komando geospasial BPBD/Dinkes.

Aplikasi telah dimigrasikan dari arsitektur BaaS Supabase ke **Backend Mandiri Berstandar Enterprise berbasis Laravel 13, Sanctum, Reverb WebSockets, dan PostgreSQL/PostGIS**. Dokumentasi teknis lengkap tersedia di [`MIGRATION.md`](MIGRATION.md).

---

## 🚀 Fitur-Fitur Unggulan

### 1. 👥 Pembagian 3 Role (Role-Based Access Control)
* **Role 1: Relawan Lapangan (Mobile PWA UI)**
  * Input PFA Fase Akut (Hari 1–3) dengan panduan terstruktur *Look-Listen-Link*.
  * Wawancara terstandar SRQ-20 (Hari 4–30) jalur Verbal maupun Non-Verbal.
  * Tombol darurat melayang (*Always-On Floating Red Flag*) dengan *3 Verification Gates*.
* **Role 2: Tenaga Kesehatan / Faskes / PSC 119 (Tele-Emergency Dashboard)**
  * Notifikasi *real-time* panggilan darurat kasus **T0-Suspect** via Laravel Reverb WebSockets.
  * Fitur simulasi panggilan **Tele-Emergency** ke relawan di posko untuk validasi visual 1–2 menit.
  * Keputusan triase dua pintu: **Konfirmasi Rujukan (T0-Confirmed)** (perintah armada PSC 119 & alokasi bed) atau **Downgrade Status (ke T1/T2)**.
* **Role 3: Admin Pengambil Kebijakan (BPBD & Dinas Kesehatan Command Center)**
  * **Interactive Geospatial Heatmap**: Peta sebaran risiko posko dengan kode warna terintegrasi (T0 Merah, T1 Oranye, T2 Kuning, T3 Hijau).
  * Filter fase penanganan (Semua Fase, Fase Akut Hari 1–3, Fase Lanjutan Hari 4–30).
  * Ekspor Laporan Agregat Wilayah (PDF/Excel) & Database Rekam Medis Longitudinal (30 Hari).
  * **Manajemen Pengguna Khusus Admin**: Otorisasi penambahan akun baru (Volunteer, Rumah Sakit, Admin).

### 2. 🔍 Auto-Lookup System (NIK / QR Code Gelang Posko)
* **Penyintas Baru (NIK Belum Terdaftar)**: Form registrasi kilat ➔ otomatis dialihkan ke **Menu PFA (Fase Akut: Hari 1–3)**.
* **Penyintas Lama (NIK Terdaftar)**: Menampilkan riwayat rekam medis PFA sebelumnya ➔ langsung diarahkan ke **Wawancara SRQ-20 (Fase Lanjutan: Hari 4–30)** tanpa input ulang data dasar.

### 3. 🚨 Always-On Persistent Floating Red Flag Emergency
* Tombol darurat melayang yang **selalu ada di setiap layar relawan**.
* Memiliki **3 Verification Gates** (Ancaman bunuh diri/agresi, psikosis akut/unresponsive, kegawatan medis fisik).
* Seketika mengunci status **T0-Suspect** dan koordinat GPS posko, serta menyiagakan PSC 119 dan RS rujukan secara instan.

### 4. 🎙️ Dual-Path SRQ-20 dengan Speech-to-Text & Human-in-the-Loop
* **Dual-Path**: Pilihan wawancara **Verbal** (suara) atau **Non-Verbal** (untuk kasus mutisme/pembekuan syok).
* **20 Soal Resmi WHO SRQ-20** dilengkapi panduan edukasi relawan (*guided tooltip*) di setiap butir soal.
* **Speech-to-Text NLP Keyword Matching**: Secara cerdas mencentang keluhan otomatis saat penyintas bercerita, dengan kendali penuh (*human override*) relawan untuk menambah/mengurangi centang.
* **Evaluasi Hendaya Keberfungsian Hidup Harian** (pola tidur, makan, perawatan diri, fungsi sosial).

### 5. 🏷️ Mesin Triase Otoritatif Server (Authoritative Triage Engine)
Perhitungan triase divalidasi otoritatif oleh server (`TriageService`):
* **T0 — Emergency Override**: Pemicu bahaya nyawa / butir 17 (suisida) bernilai YA ➔ Seketika terkunci ke status **T0-Suspect** (Bypassing Score Engine).
* **T1 — High Risk (Zona Merah)**: Total Skor $\ge 15$ atau hendaya fungsional berat ➔ Rujukan Spesialis Psikiatri / Psikolog Klinis.
* **T2 — Moderate Risk (Zona Kuning)**: Total Skor 7–14 ➔ Pendampingan PFA berlanjut oleh *Resilience Coach* / Relawan.
* **T3 — Low Risk (Zona Hijau)**: Total Skor 0–6 ➔ Edukasi kesehatan jiwa & partisipasi gotong royong komunitas.

*Catatan Etik & Medis Baku:*
> *"Hasil asesmen ini bersifat REKOMENDASI SISTEM sebagai alat bantu keputusan awal hingga dilakukan VALIDASI KLINIS resmi oleh Tenaga Kesehatan / Spesialis Profesional."*

---

## 🛠️ Arsitektur Teknologi

### Frontend:
* **Framework**: React 19 + TypeScript + Vite
* **Styling**: TailwindCSS v4 + Lucide React Icons
* **State Management**: Zustand + Context API
* **Client Storage (Offline-First)**: Dexie.js (IndexedDB)
* **Geospatial Mapping**: Leaflet & React-Leaflet
* **Realtime Client**: Laravel Echo + Pusher-JS

### Backend:
* **Framework**: Laravel 13 (PHP 8.3+)
* **Authentication**: Laravel Sanctum (Bearer Token)
* **Realtime WebSockets**: Laravel Reverb (`ws://localhost:8080`)
* **Database**: PostgreSQL / PostGIS (atau SQLite lokal)
* **Cache & Queues**: Redis

---

## 💻 Panduan Menjalankan Aplikasi Secara Lokal

### 1. Backend Laravel
```bash
cd backend

# 1. Pasang dependensi
composer install

# 2. Setup database & jalankan seeder
php artisan migrate:fresh --seed

# 3. Jalankan server REST API
php artisan serve --port=8000

# 4. Di terminal terpisah, jalankan WebSocket Reverb
php artisan reverb:start --port=8080
```

### 2. Frontend React
```bash
# Di direktori root proyek
npm install
npm run dev
```
Buka browser pada `http://localhost:5173`.

---

## 🔑 Akun Demo Bawaan (1-Click Demo Pass)

Pada halaman Sign In, tersedia tombol akses instan 1 klik untuk masing-masing peran:

| Peran (Role) | Username | Password | Deskripsi Tugas |
| :--- | :--- | :--- | :--- |
| **Relawan Lapangan** | `volunteer` | `volunteer123` | Skrining lapangan, PFA Hari 1–3, Wawancara SRQ-20 |
| **Rumah Sakit / PSC 119** | `rumahsakit` | `rumahsakit123` | Validasi Tele-Emergency, Rujukan T0, Manajemen Bed RS |
| **Admin BPBD / Dinkes** | `admin` | `admin123` | Peta Geospasial Wilayah, Analitik Makro, Manajemen User |

---

## 📂 Struktur Direktori Proyek

```text
RAPID-MIND/
├── backend/                                # Backend Laravel 13
│   ├── app/
│   │   ├── Events/                        # Realtime Reverb Broadcast Events
│   │   ├── Http/Controllers/Api/          # REST API Controllers (Thin Domain Controllers)
│   │   ├── Models/                        # Eloquent Models (User, Survivor, Assessment, EmergencyAlert, DisasterPost)
│   │   └── Services/                      # TriageService, EmergencyService, SyncService
│   ├── database/migrations/               # Skema Migrasi Database
│   ├── database/seeders/                  # Seeder Demo Kedaruratan & Posko
│   ├── routes/api.php                     # Rute API RESTful Terstruktur
│   └── tests/Feature/                     # Pengujian Fitur Otomatis
├── public/                                # Aset publik statis
├── src/
│   ├── components/
│   │   ├── dashboard/                     # BPBD/Dinkes Command Center & User Management
│   │   └── volunteer/                     # Aplikasi PWA Relawan Lapangan
│   ├── context/
│   │   ├── AssessmentContext.tsx          # Real-time Reverb listener & sync state
│   │   └── AuthContext.tsx                # Sanctum auth integration & RBAC
│   ├── lib/
│   │   ├── api.ts                         # Client API sentral & HTTP Interceptor
│   │   ├── echo.ts                        # Laravel Echo Reverb WebSockets Client
│   │   └── db.ts                          # Dexie.js IndexedDB High-Capacity Storage
│   ├── services/
│   │   ├── authService.ts                 # Layanan autentikasi Sanctum
│   │   ├── patientService.ts              # Layanan data penyintas & NIK lookup
│   │   ├── assessmentService.ts           # Layanan asesmen & kalkulasi triase
│   │   ├── emergencyService.ts            # Layanan Two-Tiered T0 & Tele-Emergency
│   │   └── syncService.ts                 # Layanan sinkronisasi batch idempoten
│   ├── pages/                             # DashboardPage, HospitalPage, LoginPage, VolunteerPage
│   └── types/                             # TypeScript Types
├── MIGRATION.md                           # Dokumentasi lengkap proses migrasi Supabase -> Laravel
├── ALUR_SISTEM.md                         # Panduan alur operasional sistem
└── package.json
```

---

## 📖 Dokumentasi Lengkap Alur & Migrasi

* 👉 [**DOKUMEN MIGRASI TEKNIS (MIGRATION.md)**](file:///c:/DaffaP/Project%20df/RAPID-MIND/MIGRATION.md)
* 👉 [**PANDUAN LENGKAP ALUR SISTEM (ALUR_SISTEM.md)**](file:///c:/DaffaP/Project%20df/RAPID-MIND/ALUR_SISTEM.md)
