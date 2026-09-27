# 🧠 RAPID-MIND
### *Integrated Rapid Psychological Triage & Two-Tiered Disaster Mental Health Referral System*

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Standard](https://img.shields.io/badge/Standard-WHO_SRQ--20-0085ca?style=for-the-badge&logo=world-health-organization)](https://www.who.int/)

---

## 📌 Latar Belakang & Gambaran Umum

Bencana alam sering kali menyisakan luka psikologis mendalam bagi penyintas. Di lapangan, penanganan kesehatan jiwa sering kali terlambat karena relawan kesulitan mengidentifikasi gejala kegawatdaruratan psikiatri secara cepat, tidak adanya standardisasi instrumen skrining, dan terputusnya koordinasi antara posko pengungsian, fasilitas kesehatan (Faskes/PSC 119), serta pengambil kebijakan (BPBD dan Dinas Kesehatan).

**RAPID-MIND** adalah sistem penapisan (*triage*) kesehatan mental pascabencana terpadu yang memadukan protokol **Psychological First Aid (PFA)** pada fase akut (Hari 1–3) dan instrumen standar **WHO Self-Reporting Questionnaire (SRQ-20)** pada fase lanjutan (Hari 4–30). Dilengkapi fitur **Speech-to-Text (STT) bertenaga NLP**, **Auto-Lookup NIK**, tombol darurat **Always-On Floating Red Flag**, serta alur triase dua pintu (*Two-Tiered Triage*) yang langsung terintegrasi ke rumah sakit rujukan dan peta geospasial BPBD.

---

## 🚀 Fitur-Fitur Unggulan

### 1. 👥 Pembagian 3 Role (Role-Based Access Control)
* **Role 1: Relawan Lapangan (Mobile PWA UI)**
  * Input PFA Fase Akut (Hari 1–3) dengan panduan terstruktur *Look-Listen-Link*.
  * Wawancara terstandar SRQ-20 (Hari 4–30) jalur Verbal maupun Non-Verbal.
  * Tombol darurat melayang (*Always-On Floating Red Flag*) dengan *3 Verification Gates*.
* **Role 2: Tenaga Kesehatan / Faskes / PSC 119 (Tele-Emergency Dashboard)**
  * Notifikasi *real-time* panggilan darurat kasus **T0-Suspect** (berkedip merah).
  * Fitur simulasi panggilan **Tele-Emergency** ke relawan di posko untuk validasi visual 1–2 menit.
  * Keputusan triase dua pintu: **Konfirmasi Rujukan (T0-Confirmed)** (perintah penjemputan ambulans) atau **Downgrade Status (ke T1/T2)**.
* **Role 3: Admin Pengambil Kebijakan (BPBD & Dinas Kesehatan Command Center)**
  * **Interactive Geospatial Heatmap**: Peta sebaran risiko posko dengan kode warna terintegrasi (T0 Merah, T1 Oranye, T2 Kuning, T3 Hijau).
  * Filter fase penanganan (Semua Fase, Fase Akut Hari 1–3, Fase Lanjutan Hari 4–30).
  * Ekspor Laporan Agregat Wilayah (PDF/Excel) & Database Rekam Medis Longitudinal.
  * **Manajemen Pengguna Khusus Admin**: Otorisasi penambahan akun baru (Volunteer, Rumah Sakit, Admin).

### 2. 🔍 Auto-Lookup System (NIK / QR Code Gelang Posko)
* **Penyintas Baru (NIK Belum Terdaftar)**: Form registrasi kilat ➔ otomatis dialihkan ke **Menu PFA (Fase Akut: Hari 1–3)**.
* **Penyintas Lama (NIK Terdaftar)**: Menampilkan riwayat rekam medis PFA sebelumnya ➔ langsung diarahkan ke **Wawancara SRQ-20 (Fase Lanjutan: Hari 4–30)** tanpa input ulang data dasar.

### 3. 🚨 Always-On Persistent Floating Red Flag Emergency
* Tombol darurat melayang yang **selalu ada di setiap layar relawan (Screen 2 s.d. Screen 7)**.
* Memiliki **3 Verification Gates** (Ancaman bunuh diri/agresi, psikosis akut/unresponsive, kegawatan medis fisik).
* Seketika mengunci status **T0-Suspect** dan koordinat GPS posko, serta menyiagakan PSC 119 dan RS rujukan secara instan.

### 4. 🎙️ Dual-Path SRQ-20 dengan Speech-to-Text & Human-in-the-Loop
* **Dual-Path**: Pilihan wawancara **Verbal** (suara) atau **Non-Verbal** (untuk kasus mutisme/pembekuan syok).
* **20 Soal Resmi WHO SRQ-20** dilengkapi panduan edukasi relawan (*guided tooltip*) di setiap butir soal.
* **Speech-to-Text NLP Keyword Matching**: Secara cerdas mencentang keluhan otomatis saat penyintas bercerita, dengan kendali penuh (*human override*) relawan untuk menambah/mengurangi centang.
* **Evaluasi Hendaya Keberfungsian Hidup Harian** (pola tidur, makan, perawatan diri, fungsi sosial).

### 5. 🏷️ Klasifikasi Tingkat Risiko Otomatis
* **T0 — Emergency (Red Flag)**: Pemicu bahaya nyawa / butir 17 (suisida) bernilai YA ➔ Tindakan darurat PSC 119 & RS.
* **T1 — High Risk**: Skor SRQ-20 ≥ 11 atau hendaya fungsi berat ➔ Rujukan Spesialis Psikiatri / Psikolog Klinis.
* **T2 — Moderate Risk**: Skor SRQ-20 6–10 ➔ Pendampingan PFA berlanjut oleh *Resilience Coach* / Relawan.
* **T3 — Low Risk**: Skor SRQ-20 0–5 ➔ Edukasi kesehatan jiwa & partisipasi gotong royong komunitas.

---

## 🛠️ Arsitektur Teknologi

* **Frontend Framework**: React 19 + TypeScript + Vite
* **Styling**: TailwindCSS v4 + Lucide React Icons
* **Cloud Database**: Supabase (PostgreSQL) dengan Row Level Security (RLS)
* **Offline-First Resilience**: LocalStorage / IndexedDB dengan background synchronization saat online
* **Geospatial Mapping**: Leaflet & React-Leaflet (CartoDB Positron & OpenStreetMap)
* **Speech Recognition**: Web Speech API (dengan deteksi kata kunci NLP lokal dan simulasi audio)

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 atau lebih baru).

```bash
# 1. Clone repository
git clone https://github.com/Daff77/RAPID-MIND.git
cd RAPID-MIND

# 2. Install dependensi
npm install
```

RAPID-MIND mendukung 2 mode pengoperasian:

### Opsi A: Mode Cepat (Penyimpanan Lokal / Offline-First)
Tidak memerlukan setup database eksternal. Aplikasi langsung berjalan menggunakan penyimpanan lokal browser (*LocalStorage*):
```bash
npm run dev
```
Buka `http://localhost:5173` di browser. Header akan menampilkan badge **`💾 Lokal`**.

---

### Opsi B: Mode Cloud Database (Supabase PostgreSQL)
Untuk menyinkronkan data rekam medis penyintas dan log asesmen secara *real-time* ke cloud:

1. **Buat Project di Supabase (Gratis)**:
   * Kunjungi [supabase.com](https://supabase.com) dan buat project baru.
2. **Eksekusi Skrip Database**:
   * Buka menu **SQL Editor** pada dashboard Supabase Anda.
   * Salin seluruh isi berkas [`supabase_schema.sql`](supabase_schema.sql) ke editor, lalu klik **Run**.
   * Tabel `survivors` dan `assessments` beserta indeks dan aturan RLS akan langsung aktif.
3. **Konfigurasi Environment Variable (`.env`)**:
   * Salin berkas template `.env.example` menjadi `.env`:
     ```bash
     cp .env.example .env
     ```
   * Buka dashboard Supabase ➔ **Project Settings** ➔ **API**.
   * Salin **Project URL** dan **anon public key**, lalu masukkan ke file `.env`:
     ```env
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:5173`. Header aplikasi akan menampilkan badge hijau **`☁️ Supabase`**, menandakan seluruh data penyintas dan asesmen tersinkronisasi langsung ke cloud PostgreSQL.

> **💡 Catatan Resiliensi Lapangan (Offline-First)**:
> Meskipun menggunakan Supabase, jika relawan di lokasi bencana kehilangan koneksi internet (mode offline), data tetap tersimpan aman di antrean lokal (*offline queue*). Ketika koneksi pulih, cukup tekan tombol **Sync** untuk mengunggah otomatis semua data ke Supabase tanpa ada data yang hilang.

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
├── public/                 # Aset publik statis
├── src/
│   ├── assets/             # Gambar & ikon statis
│   ├── components/
│   │   ├── auth/           # Komponen proteksi autentikasi & unauthorized
│   │   ├── dashboard/      # Komponen Dashboard BPBD/Dinkes & User Management
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── KPICards.tsx
│   │   │   ├── PriorityRedPanel.tsx
│   │   │   ├── RecentAssessmentsTable.tsx
│   │   │   ├── TriageCharts.tsx
│   │   │   ├── TriageMap.tsx
│   │   │   └── UserManagementSection.tsx
│   │   └── volunteer/      # Komponen Aplikasi PWA Relawan
│   │       ├── AutoLookupHomeScreen.tsx     # Screen 2: NIK & QR Lookup
│   │       ├── FloatingRedFlagButton.tsx    # Persistent Red Flag Shortcut
│   │       ├── PFAMenuSection.tsx           # Screen 3: Menu PFA Look-Listen-Link
│   │       ├── SRQ20InterviewWizard.tsx     # Screen 5-7: Wawancara SRQ-20
│   │       ├── VerbalAssessment.tsx         # STT & Checklist Box
│   │       ├── QuickChecklist.tsx           # Checklist Observasi Singkat
│   │       ├── TriageResultCard.tsx         # Kartu Hasil Triase
│   │       └── VolunteerHistory.tsx         # Riwayat Rekam Medis
│   ├── context/
│   │   ├── AssessmentContext.tsx            # State manajemen asesmen & sinkronisasi
│   │   └── AuthContext.tsx                  # State manajemen autentikasi & RBAC
│   ├── data/
│   │   ├── mockAssessments.ts               # Dataset awal triase
│   │   ├── mockLocations.ts                 # Data posko & koordinat GPS
│   │   ├── mockSurvivors.ts                 # Registry penyintas untuk NIK lookup
│   │   ├── pfaProtocol.ts                   # Protokol Look-Listen-Link & fungsi
│   │   └── srq20Questions.ts                # 20 Soal resmi WHO SRQ-20 + panduan
│   ├── pages/
│   │   ├── DashboardPage.tsx                # Halaman Pusat Komando BPBD/Dinkes
│   │   ├── HospitalPage.tsx                 # Halaman Faskes / PSC 119 Tele-Emergency
│   │   ├── LoginPage.tsx                    # Halaman Universal SSO Login
│   │   └── VolunteerPage.tsx                # Halaman Utama Mobile PWA Relawan
│   ├── services/
│   │   ├── offlineStorage.ts                # Penyimpanan lokal offline-first
│   │   ├── speechRecognition.ts             # Web Speech Recognition API wrapper
│   │   ├── supabaseClient.ts                # Inisialisasi aman client Supabase
│   │   ├── supabaseService.ts               # Sinkronisasi cloud PostgreSQL Supabase
│   │   └── triageEngine.ts                  # Engine penilai skor SRQ-20 & tiering
│   ├── types/
│   │   ├── assessment.ts                    # Tipe data asesmen, PFA, SRQ-20, & penyintas
│   │   └── auth.ts                          # Tipe data pengguna & hak akses
│   ├── App.tsx                              # Pengarah rute aplikasi (Router)
│   └── main.tsx                             # Entry point aplikasi
├── .env.example                             # Template environment variable Supabase
├── supabase_schema.sql                      # DDL skrip database PostgreSQL Supabase
├── ALUR_SISTEM.md                           # Dokumen lengkap seluruh alur sistem
├── RencanaBaru.md                           # Dokumen spesifikasi acuan arsitektur
├── package.json
└── vite.config.ts
```

---

## 📖 Dokumentasi Lengkap Alur Sistem

Untuk penjelasan mendalam tentang diagram alur, tahapan dari Screen 1 s.d. Screen 7, dan mekanisme *Two-Tiered Triage*, silakan baca:
👉 [**PANDUAN LENGKAP ALUR SISTEM (ALUR_SISTEM.md)**](file:///c:/DaffaP/Project%20df/RAPID-MIND/ALUR_SISTEM.md)

---

