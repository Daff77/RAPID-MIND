# DOKUMEN MIGRASI ARSITEKTUR: SUPABASE KE LARAVEL 13
## RAPID-MIND — Emergency Psychological Triage System

---

## 1. Ringkasan Eksekutif
Dokumen ini merangkum proses dan spesifikasi teknis migrasi arsitektur backend sistem **RAPID-MIND** dari **Supabase (BaaS)** ke backend mandiri **Laravel 13** berbasis **PHP 8.3+**, **PostgreSQL / PostGIS**, **Laravel Sanctum**, **Laravel Reverb**, dan **Redis**, dengan tetap mempertahankan keutuhan antarmuka pengguna (UI/UX), alur kerja klinis, sistem scoring otoritatif server, IndexedDB offline-first (Dexie.js), dan protokol kedaruratan *Two-Tiered Triage* (T0-Suspect -> Tele-Emergency -> T0-Confirmed / Downgraded).

---

## 2. Perbandingan Arsitektur

### Arsitektur Lama (Supabase BaaS)
```
React PWA (Vite + Tailwind CSS)
  │
  ├─► @supabase/supabase-js (Client SDK langsung di frontend)
  │     ├── Supabase Auth (GoTrue JWT)
  │     ├── PostgREST Direct Table Queries (survivors, assessments)
  │     └── Supabase Realtime (WebSockets channel)
  │
  └─► LocalStorage + IndexedDB (Fallback offline darurat)
```
*Kelemahan Arsitektur Lama:*
* Logika triase otoritatif tersebar atau bergantung pada client-side calculation.
* Ketergantungan erat komponen frontend terhadap SDK vendor `@supabase/supabase-js`.
* Kurangnya kontrol atas alur verifikasi medis terintegrasi (*Two-Tiered Triage state machine*).

### Arsitektur Baru (Laravel 13 Enterprise Backend)
```
React 19 PWA (Vite + Tailwind CSS v4 + Zustand + Dexie.js)
  │
  ├─► Clean Service Layer (src/services/*)
  │     ├── authService.ts, patientService.ts, assessmentService.ts
  │     ├── emergencyService.ts, syncService.ts, adminService.ts
  │     └── Centralized HTTP Client (src/lib/api.ts with Bearer Token)
  │
  ├─► REST API (Laravel 13 on PHP 8.3+)
  │     ├── Laravel Sanctum (Stateful / Token Bearer Authentication)
  │     ├── TriageService (Authoritative Scoring: 0-37, T0 Override)
  │     ├── EmergencyService (Two-Tiered State Machine & Audit Trail)
  │     └── SyncService (Idempotent UUID Batch Sync)
  │
  ├─► Realtime Layer (Laravel Echo + Pusher-JS via Laravel Reverb ws://:8080)
  │     ├── Channel: `emergencies`
  │     ├── Event: `.emergency.created` (T0-Suspect alert to PSC 119)
  │     ├── Event: `.emergency.confirmed` (T0-Confirmed bed assignment)
  │     └── Event: `.emergency.downgraded` (Downgrade to T1/T2)
  │
  ├─► Persistence Layer (PostgreSQL / PostGIS & Redis)
  │
  └─► Client Offline Engine (Dexie.js / IndexedDB)
        ├── Tabel: assessments, offlineQueue, survivors, emergencyAlerts
        └── Auto-sync & SMS Fallback Gateway saat blank spot total
```

---

## 3. Pemetaan Database (Database Schema Mapping)

| Supabase Entity | Laravel Model | Tabel Laravel | Keterangan & Peningkatan |
|---|---|---|---|
| `auth.users` | `User` | `users` | Terintegrasi Laravel Sanctum, field `badge_number`, `assigned_post`, `assigned_hospital`, `phone`, `role`. |
| `survivors` | `Survivor` | `survivors` | Primary Key `id` (e.g. `RM-2026-000001` / `VCT-001`), `nik`, `posko`, `current_phase`, `triage_tier`. |
| `assessments` | `Assessment` | `assessments` | Primary Key `record_id` (e.g. `ASM-2026-000001`), foreign key `victim_id`, `client_event_id` untuk deduplikasi idempoten. |
| *(Tersirat di context)* | `EmergencyAlert` | `emergency_alerts` | Tabel khusus Two-Tiered Triage (`T0-Suspect`, `T0-Confirmed`, `Downgraded`), koordinat GPS (`gps_lat`, `gps_lng`), `tele_notes`, `assigned_bed`. |
| `MOCK_LOCATIONS` | `DisasterPost` | `disaster_posts` | Master data posko bencana A-D, koordinat spasial, kapasitas, dan penanggung jawab medis. |

---

## 4. Pemetaan API Endpoints (REST API Mapping)

### Autentikasi & Pengguna (`/api/auth/*`)
* `POST /api/auth/login`: Autentikasi username/email dan password, menerbitkan token Sanctum.
* `POST /api/auth/quick-login`: Fast login untuk demonstrasi dan tanggap darurat lapangan.
* `GET  /api/auth/me`: Mengambil profil pengguna terautentikasi dan hak akses.
* `POST /api/auth/logout`: Revoke Sanctum bearer token.
* `GET  /api/auth/users`: Daftar pengguna sistem (Role 3: Admin BPBD/Dinkes).
* `POST /api/auth/users`: Registrasi personel relawan/medis baru.
* `DELETE /api/auth/users/{id}`: Hapus akses pengguna.
* `PATCH /api/auth/users/{id}/post`: Mutasi/penugasan posko relawan lapangan.

### Penyintas Lapangan (`/api/survivors/*`)
* `GET   /api/survivors`: Daftar seluruh penyintas terdata (filter berdasarkan posko).
* `GET   /api/survivors/search?q={query}`: Pencarian instan berdasarkan NIK, Nama, atau No. ID.
* `GET   /api/survivors/{id}`: Detail profil penyintas dan riwayat penapisan.
* `POST  /api/survivors`: Registrasi profil penyintas baru.
* `PATCH /api/survivors/{id}/nik`: Pembaruan NIK resmi hasil konfirmasi Dukcapil.

### Asesmen & Triase Otoritatif (`/api/assessments/*`)
* `GET  /api/assessments`: Registry log asesmen triase (filter tier T0-T3, posko, fase).
* `POST /api/assessments`: Input asesmen triase. Backend bertindak sebagai **authoritative scoring engine** (menghitung SRQ-20, Faktor Risiko, Skor Fungsional, dan mengevaluasi Red Flag override).
* `POST /api/assessments/sync`: Idempotent batch sync untuk antrean offline dari Dexie.js dengan validasi `client_event_id`.
* `GET  /api/assessments/{recordId}`: Detail asesmen, transkrip wawancara, dan butir SRQ-20.

### Kedaruratan & Two-Tiered Triage (`/api/emergency/*`)
* `GET  /api/emergency`: Antrean kasus gawat darurat (prioritas T0-Suspect di urutan teratas).
* `POST /api/emergency`: Pemicu sinyal kedaruratan Red Flag manual oleh relawan lapangan.
* `POST /api/emergency/{id}/confirm`: Verifikasi Tele-Emergency dokter Faskes/PSC 119 -> status berubah menjadi **T0-Confirmed** (alokasi bed & perintah armada).
* `POST /api/emergency/{id}/downgrade`: Keputusan klinis dokter menurunkan status ke **T1** atau **T2**.

### Pusat Komando Admin & Geospasial (`/api/admin/*`)
* `GET /api/admin/stats`: Agregat metrik KPI, distribusi zona (Hijau, Kuning, Merah), proporsi T0-T3, dan beban posko.
* `GET /api/admin/longitudinal`: Tren perkembangan trauma penyintas selama 30 hari.
* `GET /api/admin/posts`: Data spasial posko bencana, kapasitas, dan okupansi.

---

## 5. Mesin Triase Otoritatif (Authoritative Triage Engine)
Aturan klinis dipusatkan di `backend/app/Services/TriageService.php`:
* **Rentang Total Skor Integrasi**: 0 – 37 poin
  * SRQ-20: 0 – 20 poin
  * Faktor Risiko: 0 – 8 poin
  * Skor Gangguan Fungsional: 0 – 9 poin
* **Kategori Triase**:
  * **T0 (Emergency Override)**: Red Flag aktif (ideasi bunuh diri butir 17, psikosis akut, amuk/agitasi berat, atau krisis somatik) seketika mengunci status ke **T0-Suspect** tanpa menunggu perhitungan skor lainnya.
  * **T1 (High Risk / Red Zone)**: Total Skor $\ge 15$ atau hendaya fungsional berat (Domain F1/F2/F3 bernilai 3).
  * **T2 (Moderate Risk / Yellow Zone)**: Total Skor 7 – 14.
  * **T3 (Low Risk / Green Zone)**: Total Skor 0 – 6.

*Catatan Etik & Medis:*
Sistem secara konsisten menyematkan disclaimer klinis:
> *"Hasil asesmen ini bersifat REKOMENDASI SISTEM sebagai alat bantu keputusan awal hingga dilakukan VALIDASI KLINIS resmi oleh Tenaga Kesehatan / Spesialis Profesional."*

---

## 6. Arsitektur Offline-First & Sinkronisasi Idempoten
* **Penyimpanan Klien**: Dexie.js (wrapper IndexedDB performa tinggi) menggantikan ketergantungan localStorage yang terbatas pada 5MB.
* **Mekanisme Idempoten**: Setiap rekaman offline disematkan `clientEventId` (UUID client-side).
* **Penanganan Konflik**: Backend memeriksa `client_event_id` dan `record_id`. Jika rekaman sudah tercatat sebelumnya di database PostgreSQL, rekaman dilewati (*skipped*) tanpa menimbulkan duplikasi data.
* **Kejujuran Status Kedaruratan (Offline T0)**: Antarmuka secara gamblang membedakan:
  * Online: *"Terkirim instan ke Faskes & PSC 119 via WebSockets"*
  * Offline: *"Tersimpan aman di memori lokal (IndexedDB) — Siagakan SMS Gateway / Radio HT"*

---

## 7. Variabel Lingkungan (Environment Variables)

### Frontend (`.env`)
```ini
# Laravel 13 Sanctum REST API
VITE_API_URL=http://localhost:8000/api

# Laravel Reverb WebSockets
VITE_REVERB_APP_KEY=xuna8ve8pqoywwdienos
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

### Backend (`backend/.env`)
```ini
APP_NAME=RAPID-MIND
APP_ENV=local
APP_KEY=base64:3f0eWp6K5M9lUvBvQfS1dJk4Ym3R2P9oLaXvC+0=
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql # atau sqlite untuk testing lokal
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=rapidmind
DB_USERNAME=postgres
DB_PASSWORD=secret

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=522027
REVERB_APP_KEY=xuna8ve8pqoywwdienos
REVERB_APP_SECRET=be3ml937skcq7f8hpyj9
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME="http"
```

---

## 8. Panduan Menjalankan Sistem Secara Lokal

### 1. Menjalankan Backend Laravel
```bash
cd backend

# Pastikan dependency terpasang
composer install

# Jalankan migrasi dan seeder awal
php artisan migrate:fresh --seed

# Jalankan server API
php artisan serve --port=8000

# Di terminal terpisah, jalankan WebSocket server Reverb
php artisan reverb:start --port=8080
```

### 2. Menjalankan Frontend React
```bash
# Di direktori root proyek
npm install
npm run dev
```
Akses aplikasi melalui browser: `http://localhost:5173`.

### 3. Akun Pengguna Demo
* **Volunteer (Relawan Lapangan)**:
  * Username: `volunteer` | Password: `volunteer123`
* **Healthcare (Faskes / PSC 119 / RSUD)**:
  * Username: `rumahsakit` | Password: `rumahsakit123`
* **Admin (BPBD / Dinkes Command Center)**:
  * Username: `admin` | Password: `admin123`

---

## 9. Verifikasi & Pengujian
Seluruh alur telah divalidasi dengan pengujian otomatis:
1. **PHPUnit / Pest Backend**: `php artisan test` -> 7 tests passed, 24 assertions.
2. **Frontend TypeCheck & Build**: `npm run build` -> 0 errors, build production terkompilasi optimal.
3. **Frontend Linting**: `npm run lint` -> 0 errors.
4. **Verifikasi Alur Klinis**: `npx tsx src/tests/verifyTriageFlow.ts` -> 100% assertions passed.
5. **Verifikasi Role 3 (Admin Command Center)**: `npx tsx src/tests/verifyRole3Redesign.ts` -> 100% passed.
