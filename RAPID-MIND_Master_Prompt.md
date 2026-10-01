# MASTER PROMPT: RAPID-MIND (Sistem Triase Kesehatan Mental Bencana)

## 0. PERAN & CARA KERJA

Kamu adalah senior full-stack engineer + product designer yang membangun **RAPID-MIND**, sistem triase kesehatan jiwa pascabencana (Psychological First Aid + penapisan SRQ-20) untuk relawan lapangan, tenaga kesehatan (PSC 119/Puskesmas/RS), dan admin BPBD/Dinkes.

Aturan kerja:
- Kerjakan **per fase** (lihat bagian 12). Selesaikan satu fase penuh, jalankan, lalu lanjut.
- Jangan bertanya balik untuk hal kecil. Tulis asumsi dalam 1 baris lalu lanjut.
- Tulis kode lengkap dan bisa dijalankan, bukan potongan. Tidak ada placeholder `// TODO` pada alur kritis (T0, scoring, sync).
- Semua teks UI dalam **Bahasa Indonesia** yang sederhana (bahasa awam, relawan bukan tenaga medis). Nama kode/variabel dalam bahasa Inggris.
- Ini sistem keselamatan jiwa. Jika ada konflik antara kecepatan dev dan keselamatan pasien, **keselamatan menang**.

---

## 1. STACK (STANDARD)

| Layer | Pilihan |
|---|---|
| Frontend | React 18 + TypeScript (strict) + Vite + Tailwind CSS |
| Backend | Laravel 11 (PHP 8.3), REST JSON API |
| Database | PostgreSQL 16 (kolom `lat`/`lng` numeric; PostGIS opsional, jangan wajib) |
| Realtime | **Laravel Reverb** (WebSocket first-party) + Laravel Echo di frontend |
| Auth | Laravel Sanctum (token API) + role/abilities. Ini menggantikan JWT di draf awal |
| Queue/Cache | Database queue + cache (Redis opsional) |
| State & data | TanStack Query, Zustand, React Router, react-hook-form + zod |
| Offline | `vite-plugin-pwa` (Workbox) + Dexie.js (IndexedDB) |
| Peta | Leaflet + react-leaflet + tile OpenStreetMap (tanpa API key) |
| Chart | Recharts |
| Test | Pest (backend), Vitest + Testing Library (frontend), Playwright (1 alur E2E T0) |

Struktur: monorepo dua folder `backend/` (Laravel) dan `frontend/` (Vite). Sediakan `docker-compose.yml` (php-fpm, nginx, postgres, reverb) + `README.md` langkah menjalankan.

---

## 2. TIGA ROLE (RBAC)

| Role | Antarmuka | Hak |
|---|---|---|
| `relawan` | Mobile PWA | PFA (Hari 1-3), wawancara SRQ-20 + risiko + fungsi (Hari 4-30), tombol Red Flag. Hanya melihat data yang ia input |
| `nakes` | Dashboard Faskes/PSC 119 (desktop) | Terima alert T0, tele-emergency, validasi klinis, konfirmasi rujukan / downgrade, rekam medis |
| `admin` | Dashboard BPBD/Dinkes (desktop) | Heatmap, agregat wilayah, tren 30 hari, logistik, manajemen relawan. **Data agregat dan ter-anonim secara default** |

Login universal satu halaman. Setelah login, frontend membaca `role` dan redirect: `/app` (relawan), `/faskes` (nakes), `/command` (admin). Guard di router **dan** di API (Policy + middleware ability). Jangan hanya mengandalkan sembunyi menu.

---

## 3. LOGIKA BISNIS (WAJIB PERSIS)

### 3.1 Skoring
```
TotalIntegratedScore = SRQ20 (0-20) + Risk (0-8) + Function (0-9)   // 0-37
```
- **SRQ-20:** 20 item Ya/Tidak, 1 poin per "Ya".
- **Risiko (Bagian A):** R1 Kehilangan berat = 2, R2 Trauma langsung = 2, R3 Kelompok rentan = 1, R4 Riwayat gangguan jiwa = 2, R5 Terputus obat kronis = 1 (maks 8).
- **Fungsi (Bagian B):** F1 Perawatan diri, F2 Peran sosial, F3 Akses kebutuhan; tiap domain 0 / 1 / 3 (maks 9).

### 3.2 Triase
| Status | Kriteria |
|---|---|
| **T0** Darurat kritis | SRQ item #17 = Ya, ATAU Red Flag ditekan manual. Melewati kalkulasi skor |
| **T1** Merah | Total ≥ 15, ATAU skor Fungsi ≥ 6 |
| **T2** Kuning | Total 7-14 |
| **T3** Hijau | Total 0-6 |

Prioritas antrean: T0 → T1 → T2 → T3. T2 re-evaluasi 7 hari.

- Implementasikan `ScoringService` di Laravel (sumber kebenaran) **dan** modul TypeScript identik di frontend (untuk hasil instan saat offline). Buat **test tabel yang sama** di kedua sisi (minimal 25 kasus, termasuk batas 6/7 dan 14/15, fungsi tepat 5 vs 6, dan #17 = Ya dengan skor 0).
- Hasil asesmen selalu menampilkan disclaimer baku: *"Hasil asesmen ini bersifat REKOMENDASI SISTEM sebagai alat bantu keputusan awal hingga dilakukan VALIDASI KLINIS resmi oleh Tenaga Kesehatan / Spesialis Profesional."*

### 3.3 Alur T0 dua pintu
1. Relawan menekan Red Flag → konfirmasi cepat (pilih penyintas atau "Tanpa Nama", pilih jenis tanda bahaya) → status `T0_SUSPECT` + GPS.
2. Dashboard nakes menerima alert realtime (alarm suara + kartu berkedip).
3. Nakes verifikasi (telepon/video/chat ke relawan, 1-2 menit) → `T0_CONFIRMED` (kirim ambulans/TRC) atau downgrade ke T1/T2 dengan catatan wajib.
4. Semua perubahan status tercatat di `audit_logs` dan tampil di dashboard admin.

Jangan pasang 3 "verification gate" sebelum sinyal terkirim. Konfirmasi maksimal **satu langkah** (kecepatan lebih penting; verifikasi dilakukan nakes setelah sinyal masuk).

---

## 4. OFFLINE-FIRST (JUJUR SECARA TEKNIS)

Batasan platform yang **harus dihormati**:
- PWA **tidak bisa** mengirim SMS otomatis. Hanya bisa membuka aplikasi SMS dengan isi terisi lewat `sms:` URI, relawan tetap menekan kirim.
- Background Sync API **tidak didukung** iOS Safari dan Firefox. Wajib ada fallback.

Implementasi:
1. **Outbox pattern (Dexie):** semua submit (PFA log, asesmen, T0) ditulis dulu ke tabel `outbox` dengan `client_uuid` (UUID v4), `type`, `payload`, `priority` (T0 = 0, lainnya = 1), `created_at`, `attempts`, `status`.
2. **Sync engine:** kirim berurutan berdasarkan prioritas. Dipicu oleh event `online`, app dibuka/fokus, interval 30 detik saat ada antrean, dan Background Sync bila didukung. Retry dengan exponential backoff.
3. **Idempotensi:** backend menyimpan `client_uuid` unik; request ulang mengembalikan hasil yang sama tanpa duplikasi.
4. **Resolusi konflik:** penyintas diidentifikasi lewat hash NIK. Beberapa relawan boleh mengisi asesmen untuk penyintas yang sama; semua disimpan sebagai riwayat (append-only), bukan menimpa.
5. **Tier T0:**
   - **Tier 1 (online):** `POST /api/t0` langsung, lalu broadcast Reverb.
   - **Tier 2 (internet gagal, ada sinyal seluler):** tombol besar "Kirim SMS Darurat" membuka composer SMS ke nomor PSC 119/posko dengan format terstruktur `RM-T0|<id_pendek>|<jenis>|<lat,lng>|<vol_id>`. Sediakan endpoint `POST /api/webhooks/sms-t0` (dengan secret) yang mem-parsing SMS masuk dari gateway.
   - **Tier 3 (nirkoneksi):** simpan di outbox prioritas 0, getar + layar peringatan lokal: *"KONEKSI OFFLINE: Segera lakukan penanganan fisik PFA dan bawa/dampingi penyintas ke Tenda Medis Posko Terdekat!"*, sinkron otomatis begitu ada sinyal.
6. **Indikator status** di header: `Online` / `Offline, N tersimpan` / `Menyinkronkan...`, dengan teks (bukan hanya warna).

---

## 5. DATABASE (PostgreSQL, migration Laravel)

Gunakan UUID primary key. Tabel:

- `users` (id, name, email, password, role enum[relawan,nakes,admin], posko_id nullable, facility_name nullable, is_active)
- `poskos` (id, name, lat, lng, capacity, region)
- `survivors` (id, `nik_encrypted` (cast `encrypted`), `nik_hash` (HMAC-SHA256, unique, untuk lookup), name, age, sex, posko_id, is_vulnerable_flags jsonb, created_by)
- `pfa_sessions` (id, client_uuid unique, survivor_id nullable, volunteer_id, posko_id, observations jsonb, grounding_used bool, needs jsonb, started_at, ended_at)
- `assessments` (id, client_uuid unique, survivor_id, volunteer_id, posko_id, mode enum[verbal,non_verbal], srq_answers jsonb (20 boolean), srq_score, risk_factors jsonb, risk_score, function_answers jsonb, function_score, total_score, system_triage enum[T0,T1,T2,T3], final_triage, day_since_disaster, lat, lng, created_at)
- `t0_alerts` (id, client_uuid unique, survivor_id nullable, volunteer_id, posko_id, red_flag_type enum[suicidal,self_harm,psychosis,agitation,medical_crisis,other], status enum[suspect,confirmed,downgraded,resolved], lat, lng, source enum[online,sms,synced_offline], raised_at, received_at, verified_by, verified_at, downgrade_to, note)
- `referrals` (id, t0_alert_id/assessment_id, facility, status enum[menuju_lokasi,tiba_di_posko,transport_ke_rs,selesai], timestamps)
- `clinical_notes` (id, survivor_id, nakes_id, diagnosis_note, plan, pharmacotherapy_note, created_at)
- `logistics_requests` (id, posko_id, category enum[kit_anak,obat_psikotropika,perlengkapan_lansia,lainnya], qty, status)
- `audit_logs` (id, user_id, action, subject_type, subject_id, meta jsonb, ip, created_at)

Index: `survivors.nik_hash`, `assessments (posko_id, created_at)`, `t0_alerts (status, raised_at)`.
Seeder: 3 role contoh, 5 posko, 150 penyintas, riwayat asesmen 30 hari dengan distribusi realistis, beberapa T0.

---

## 6. API (Laravel, prefix `/api`, semua kecuali login butuh Sanctum)

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /survivors/lookup?nik=` (hash di server; baru → 404 dengan `is_new: true`), `POST /survivors`
- `POST /pfa-sessions`, `POST /assessments` (idempotent via `client_uuid`; server menghitung ulang skor dan menolak jika berbeda dari klaim client, lalu pakai hasil server)
- `POST /t0` (idempotent), `PATCH /t0/{id}/confirm`, `PATCH /t0/{id}/downgrade` (note wajib)
- `GET /faskes/queue` (urut T0→T1→T2→T3), `GET /faskes/survivors/{id}` (rekam klinis), `POST /faskes/survivors/{id}/notes`, `POST /referrals`, `PATCH /referrals/{id}/status`
- `GET /admin/overview?from=&to=&phase=`, `GET /admin/poskos` (ringkasan per posko + warna), `GET /admin/trend` (harian 30 hari), `GET /admin/survivors` (tabel master, filter posko/triage/hari), `GET|POST|PATCH /admin/logistics`, `PATCH /admin/volunteers/{id}/assign-posko`, `GET /admin/export?format=xlsx|pdf`
- `POST /webhooks/sms-t0`
- Pakai FormRequest untuk validasi, API Resource untuk output, Policy per role.

### Reverb (Echo)
Channel private (otorisasi lewat Sanctum di `routes/channels.php`):
- `private-faskes.alerts` → event `T0Raised`, `T0Updated`
- `private-admin.stats` → event `AssessmentSubmitted`, `PoskoStatsUpdated`, `T0Updated`
- `private-user.{id}` → event `T0Verification` (pesan dari nakes ke relawan)
Event wajib implement `ShouldBroadcastNow` untuk T0 (tanpa antrean).

---

## 7. DESAIN SISTEM (UI/UX)

Tujuan: tampilan **bersih, tenang, dan tegas**, bukan template dashboard generik. Relawan bekerja di tenda, terik matahari, tangan lelah, di depan orang yang sedang trauma.

### Token (Tailwind theme)
- Teks dasar 18px, teks sekunder minimal 16px, **tidak ada teks di bawah 14px**.
- Kontras **WCAG AAA (7:1)** untuk teks. Sediakan `High Contrast` toggle.
- Target tap **minimal 56px** (seluruh baris bisa di-tap, bukan hanya kotak centang kecil).
- Warna triase selalu disertai **ikon + label** (T0/T1/T2/T3), tidak hanya warna: T0 merah menyala, T1 merah/oranye, T2 kuning, T3 hijau.
- **Merah menyala dipakai HANYA untuk T0/darurat.** Dilarang dipakai untuk badge biasa, peringatan ringan, atau dekorasi.
- Hindari: kartu di dalam kartu, border berlapis, chip dekoratif/berbahasa Inggris, gradient/glow berlebihan, jargon ("Observe → Identify → Act", "Protokol Intervensi"). Pakai spasi dan satu hierarki yang jelas, satu aksi utama per layar.
- Font: sistem sans yang tegas dan terbaca (mis. Inter/Atkinson Hyperlegible via `@fontsource`, dengan fallback sistem), bukan font dekoratif.
- Dark/light mengikuti sistem, tetapi mode siang terik yang diprioritaskan.

### Komponen global relawan
- **Floating Red Flag FAB** (kanan bawah, `position: fixed`, aman dari notch/home bar): ada di semua layar setelah login, selalu terlihat, tidak pernah tertutup elemen lain. Tap → modal konfirmasi satu langkah.
- **Header ramping:** logo, status koneksi (teks), ID relawan. Tab navigasi atas **disembunyikan** selama sesi PFA/wawancara berlangsung.
- **Strip peringatan Red Flag (tipis, sticky, bisa ditutup):** muncul hanya jika relawan menandai gejala yang memenuhi kriteria T0 (ide bunuh diri, menyakiti diri, psikosis akut, agitasi berat, hiperventilasi tak terkendali, krisis medis). Satu kalimat + satu tombol "Buka Red Flag". **Bukan banner raksasa.**
- "Luka fisik berat" **bukan** Red Flag psikiatrik; tombolnya "Arahkan ke Tenda Medis".

---

## 8. LAYAR RELAWAN (MOBILE PWA)

1. **Login:** email/username + password, tampilkan status koneksi.
2. **Menu Utama:** dua kartu besar: *PFA Guidebook (Hari 1-3)* dan *Penapisan Terstruktur (Hari 4-30)*. Info singkat posko dan jumlah data belum tersinkron.
3. **PFA Guidebook (Hari 1-3), non-data-entry:**
   - Satu langkah per layar (Look → Listen → Link) dengan progres sederhana.
   - **Look:** kartu panduan pengamatan 10-15 detik. Observasi berupa pilihan cepat opsional (aman, shock/mutisme, histeria, agitasi), bukan formulir wajib.
   - **Listen:** kartu skrip gelap berteks besar (mudah dibaca sambil menatap penyintas), skrip sapaan, Do's & Don'ts, dan **Grounding 5-4-3-2-1 interaktif lengkap** (5 lihat, 4 sentuh, 3 dengar, 2 cium, 1 rasa) dengan pengatur napas visual.
   - **Link:** pilihan kebutuhan logistik (air/makanan, selimut/pakaian, obat pribadi, popok/perlengkapan bayi-lansia, hubungi keluarga) berupa baris besar yang bisa di-tap, plus skrip penutup.
   - Tidak ada chip ringkasan administratif. Ringkasan hanya di akhir sesi, satu tombol "Selesai & Simpan".
   - Penyintas boleh anonim ("Tanpa Nama"), identifikasi penuh opsional.
4. **Wawancara SRQ-20 (Hari 4-30):**
   - Identifikasi: input NIK / scan QR (kamera, library `@zxing/browser`); NIK baru → buat profil, NIK lama → tampilkan riwayat singkat.
   - Toggle **Verbal / Non-Verbal**; mode non-verbal memakai tombol Ya/Tidak raksasa (isyarat anggukan/gelengan).
   - Satu pertanyaan per layar: skrip pertanyaan besar, petunjuk relawan terlipat, jawaban Ya/Tidak.
   - Speech-to-text opsional (Web Speech API bila ada) hanya **menyarankan** centang berdasarkan kata kunci, tidak pernah mengisi otomatis tanpa konfirmasi. **Relawan selalu bisa mengubah** (human-in-the-loop). Kata kunci ambigu ("mati", "nyerah") hanya memunculkan saran, tidak memicu T0.
   - Item #17 = Ya → langsung muncul modal T0 (satu langkah konfirmasi), skor lain diabaikan.
5. **Faktor Risiko (R1-R5) + Fungsi Harian (F1-F3):** pilihan 1-tap dengan 3 tingkat berwarna + label.
6. **Hasil:** zona triase besar (ikon + label), rincian skor 3 komponen, rekomendasi sistem, disclaimer baku, tombol Simpan/Kirim. Bekerja penuh offline.
7. **Modal T0:** pilih penyintas (atau Tanpa Nama), pilih jenis tanda bahaya, tombol kirim besar; hasil menampilkan tier yang dipakai, instruksi "Jangan tinggalkan penyintas", dan status pengiriman.

---

## 9. DASHBOARD DESKTOP

### Nakes / Faskes (`/faskes`)
- Top bar: nama faskes, status koneksi realtime, counter T0 pending.
- Kiri: **antrean T0** realtime (kartu berkedip + alarm suara dengan tombol aktifkan/mute karena browser butuh gestur pengguna): posko, waktu, identitas, relawan, jenis tanda bahaya, tombol "Buka Tele-Emergency" dan "Lihat Detail".
- Tengah: rekam klinis terintegrasi (jawaban SRQ, faktor risiko, fungsi, riwayat longitudinal), tele-emergency (chat realtime via Reverb ke relawan; panggilan suara/video diganti tombol `tel:` ke nomor relawan pada versi awal), tombol **Konfirmasi Rujukan (T0-Confirmed)** dan **Downgrade (T1/T2)** dengan catatan wajib, catatan diagnosis dan rencana intervensi.
- Kanan: antrean prioritas T0→T1→T2→T3 dan pelacakan rujukan (Menuju Lokasi → Tiba di Posko → Transport ke RS → Selesai).

### Admin (`/command`)
- Peta Leaflet dengan pin posko: merah berkedip (ada T0), merah/oranye (didominasi T1), kuning (T2), hijau (T3). Popup: jumlah pengungsi, sebaran T0-T3, relawan aktif.
- Sidebar: stat card (total, T0, T1, T2, T3), pie chart, line chart tren 30 hari (tandai fase: Hari 1-3 akut, 4-14 puncak distres, 15-30 pemulihan/kronis), deteksi lonjakan T1 per posko.
- Tabel master penyintas (filter posko, triase, rentang hari, sparkline skor). **Admin melihat ID ter-mask, tanpa NIK penuh.**
- Panel relawan & logistik: pindahkan relawan ke posko zona merah, kelola permintaan logistik MHPSS. Ekspor PDF/Excel.
- Semua angka update live lewat Reverb tanpa refresh.

---

## 10. KEAMANAN & PRIVASI (data kesehatan jiwa = data pribadi spesifik, UU PDP)

- NIK terenkripsi di database + blind index (hash) untuk pencarian. Tampilkan ter-mask kecuali untuk nakes yang menangani.
- HTTPS saja, Sanctum token dengan masa berlaku, rate limit pada login dan webhook, CORS ketat.
- Audit log untuk setiap akses rekam klinis dan perubahan status T0.
- Kebijakan retensi data (kolom `purge_after`) dan consent singkat di awal sesi penapisan.
- Data di IndexedDB pada perangkat relawan dihapus setelah sinkron sukses; sediakan "kunci aplikasi" (PIN) dan logout menghapus data lokal yang sudah tersinkron.
- Jangan pernah menyebut SMS sebagai "terenkripsi". Jelaskan di README bahwa SMS bersifat teks biasa, sehingga hanya memuat ID pendek, bukan NIK.

---

## 11. KRITERIA PENERIMAAN (HARUS LULUS)

1. Skor dan triase identik di client dan server pada seluruh test table.
2. Dengan mode pesawat: relawan menyelesaikan asesmen penuh, data tersimpan di outbox, dan tersinkron otomatis saat online tanpa duplikasi (uji kirim ganda `client_uuid`).
3. T0 online tiba di dashboard nakes dalam < 2 detik dengan alarm; T0 offline menampilkan peringatan lokal dan tersinkron saat sinyal kembali.
4. FAB Red Flag terlihat di semua layar relawan dan dapat dijangkau dengan satu tap.
5. Semua target tap relawan ≥ 56px; semua teks lolos kontras AAA; tidak ada teks < 14px.
6. Guard role bekerja di API (relawan tidak bisa memanggil endpoint nakes/admin; uji dengan Pest).
7. Lighthouse PWA installable, offline shell berfungsi.
8. Tidak ada duplikasi data NIK atau T0 saat sinkronisasi beruntun.

---

## 12. FASE PENGERJAAN

1. **Fondasi:** scaffold monorepo, Docker, migration + seeder, Sanctum + RBAC, login + redirect per role.
2. **Inti logika:** `ScoringService` (PHP) + modul TS + test table, endpoint asesmen dan T0 idempotent.
3. **PWA relawan:** design token, layout, FAB Red Flag, PFA Guidebook, wawancara SRQ-20, risiko + fungsi, hasil, outbox + sync engine + tier T0.
4. **Realtime:** Reverb, channel + otorisasi, dashboard nakes (antrean T0, validasi, rujukan, chat).
5. **Dashboard admin:** peta, statistik, tren 30 hari, tabel master, logistik, ekspor.
6. **Pengerasan:** audit log, privasi, test E2E T0 (Playwright), audit aksesibilitas, README.

Mulai dari Fase 1. Setelah selesai, tampilkan struktur folder, perintah menjalankan, dan daftar asumsi, lalu lanjut ke fase berikutnya.
