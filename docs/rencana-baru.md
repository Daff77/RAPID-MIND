\[SCREEN 1: UNIVERSAL SSO LOGIN\]  
  │ (Autentikasi Single Sign-On berbasis Role: Relawan / Dinkes / BPBD)  
  ▼  
\[SCREEN 2: HOMESCREEN & IDENTITAS PENYINTAS\]  
  │── Input NIK / Scan QR Gelang Posko / Pencarian Nama  
  │  
  ├─► \[AUTO-LOOKUP SYSTEM\]:  
  │     ├── NIK Baru   ──► Sistem mengarahkan ke Menu PFA (Fase Akut)  
  │     └── NIK Ada    ──► Sistem menampilkan riwayat PFA & mengarahkan ke Wawancara SRQ-20  
  │  
  ├─────────────────────────────────────────────────────┐  
▼                                                                                                                                        ▼  
\[SCREEN 3: MENU PFA (FASE AKUT: HARI 1–3)\]                   \[SCREEN 5: MENU WAWANCARA SRQ-20 (HARI 4–30)\]  
  │                                                                                                                                      │  
  ├── 1\. Identitas & Lokasi Posko (Auto-Fill)                                                                   ├── 1\. Jalur Wawancara: Verbal / Non-Verbal (Mutisme)  
  ├── 2\. LOOK (Panduan Visual & Tanda Bahaya)                                                         ├── 2\. Lembar Pertanyaan SRQ-20 \+ Panduan Edukasi  
  ├── 3\. LISTEN (Panduan Dengar & Pertolongan)                                                        │      (Instruksi relawan agar korban tak salah tafsir)  
  └── 4\. LINK (Panduan Kebutuhan Dasar)                                                                    ├── 3\. Feature Voice Recording / Speech-to-Text  
  │                                                                                                                                      │      (Auto-checklist kata kunci \+ Control Relawan)  
  │                                                                                                                                      │  
  ▼                                                                                                                                    ▼  
\[SELESAI PFA\]                                                                                 \[SCREEN 6: PENILAIAN FAKTOR RISKO & FUNGSI\]  
  │                                                                                                                                      │  
  ▼                                                                                                                                    ▼  
\[DATA TERKIRIM & INTEGRASI DATA BASE\]                                   \[SCREEN 7: HASIL ASESMEN AUTOMATIS\]  
                                                                                                                                          │── T1: High Risk   (Rujukan Spesialis/Psikolog)  
                                                                                                                                          │── T2: Moderate Risk (Pendampingan PFA/Coach)  
                                                                                                                                          └── T3: Low Risk     (Edukasi & Komunitas)  
                                                                                                                                         │  
                                                                                                                                        ▼  
                                                                                                            \[DATA TERKIRIM & INTEGRASI DATABASE\]

════════════════════════════════════════════════════════════════════════════════════════  
🚨 \[ALWAYS-ON FLOATING SHORTCUT: RED FLAG EMERGENCY\] 🚨  
(Tombol Darurat Melayang yang SELALU BISA DITEKAN dari Screen 2 s.d. Screen 7\)  
════════════════════════════════════════════════════════════════════════════════════════  
  │  
  ├─► Ditekan Manual ATAU Terdeteksi Suisida, Psikosis Akut, Agitasi, Medis Akut  
  │  
  ▼  
\[SCREEN 4: ALERT & NOTIFIKASI RUJUKAN DARURAT (T0 \- EMERGENCY)\]  
  │  
  ▼  
\[NOTIFIKASI INSTAN TERKIRIM KE: Public Safety Center (PSC 119\) / Dinkes / RS Rujukan\]

### **INTEGRASI AKHIR DATA & DASHBOARD ADMIN** 

Seluruh hasil akhir dari Layar Relawan akan bermuara pada 2 jenis dashboard:

1. **Kasus Red Flag (T0 Emergency):** Mengirimkan **Notifikasi Peringatan Dini & Rincian Klinis** ke Dashboard Rumah Sakit / PSC 119 / Tenaga Medis Profesional untuk tindakan rujukan cepat darurat.  
2. **Kasus T1, T2, dan T3:** Terintegrasi secara otomatis ke **Dashboard Utama BPBD & Dinkes** dalam bentuk **Peta Geospasial Interaktif (*Geomap/Heatmap*)** dan statistik pemantauan perkembangan kesehatan mental penyintas hingga 30 hari.

### **Deskripsi Alur Operasional Sistem RAPID-MIND**

Sistem RAPID-MIND dirancang dengan alur kerja yang terintegrasi, adaptif, dan responsif untuk memfasilitasi penapisan kesehatan mental penyintas bencana secara aman dan terstruktur. Penjelasan rinci mengenai tahapan alur kerja antarmuka sistem adalah sebagai berikut:

#### **1\. Autentikasi Pengguna & Identifikasi Penyintas (Screen 1 & 2\)**

Pengoperasian diawali melalui **Universal SSO Login Portal (Screen 1\)** yang menerapkan sistem *Role-Based Access Control* (RBAC) untuk membedakan hak akses antara Relawan Lapangan dan Pengambil Kebijakan (BPBD/Dinkes).

Setelah masuk ke **Homescreen Relawan (Screen 2\)**, relawan melakukan identifikasi penyintas menggunakan NIK, pemindaian QR Code gelang posko, atau pencarian nama. Sistem secara otomatis menjalankan *Auto-Lookup System*:

* **Jika NIK Belum Terdaftar (Penyintas Baru):** Sistem langsung mengarahkan relawan untuk memulai pencatatan Fase Akut (Menu PFA).  
* **Jika NIK Sudah Terdaftar (Penyintas Lama):** Sistem secara otomatis menampilkan riwayat rekam medis PFA sebelumnya dan mengarahkan relawan ke Menu Wawancara SRQ-20 (Fase Lanjutan) tanpa perlu menginput ulang data dasar penyintas.

#### **2\. Penanganan Fase Akut: Hari 1–3 (Screen 3 & 4\)**

Pada 72 jam pertama pascabencana, penyintas diarahkan ke **Menu PFA (Screen 3\)** untuk menerima intervensi Pertolongan Pertama Psikologis (*Look-Listen-Link*). Relawan dipandu oleh antarmuka interaktif (*Guided UI*) untuk mengamati indikator bahaya (*Look*), mendengarkan keluhan emosional (*Listen*), dan menghubungkan kebutuhan dasar (*Link*).

Selama proses ini berlangsung, sistem dilengkapi **Persistent Floating Shortcut: Red Flag Emergency** yang selalu aktif melayang di layar (Screen 2–7). Jika relawan menemukan atau mengidentifikasi adanya indikator kegawatdaruratan psikiatri/medis (ideasi bunuh diri, psikosis akut, agitasi berat, atau cedera fisik akut):

* Relawan dapat menekan tombol darurat tersebut kapan saja, yang seketika memicu **Alert & Notifikasi Rujukan Darurat T0 (Screen 4\)**.  
* Informasi klinis penyintas langsung terkirim secara *real-time* ke **Public Safety Center (PSC 119), Dinas Kesehatan, dan Rumah Sakit Rujukan** untuk penanganan medis darurat.

#### **3\. Penapisan Terstruktur Fase Lanjutan: Hari 4–30 (Screen 5, 6, & 7\)**

Untuk penyintas tanpa tanda bahaya darurat, pemantauan dilanjutkan pada fase stabilisasi (Hari ke-4 hingga Hari ke-30) melalui **Menu Wawancara SRQ-20 (Screen 5\)**. Relawan dapat memilih mode wawancara Verbal atau Non-Verbal (jika penyintas mengalami mutisme/syok berat).

Guna menghindari bias tafsir, lembar pertanyaan SRQ-20 dilengkapi dengan petunjuk edukasi wawancara bagi relawan. Fitur *Speech-to-Text* secara cerdas merekam percakapan dan memberi tanda centang otomatis (*auto-checklist*) pada kata kunci berisiko, dengan kendali penuh (*manual control*) tetap berada di tangan relawan untuk menambah atau membatalkan centang.

Proses dilanjutkan dengan **Penilaian Faktor Risiko dan Fungsi Harian (Screen 6\)** sebelum sistem menghasilkan **Hasil Asesmen Otomatis (Screen 7\)** yang mengelompokkan risiko penyintas menjadi:

* **T1 (High Risk):** Membutuhkan konseling intensif dari psikolog/spesialis.  
* **T2 (Moderate Risk):** Membutuhkan pendampingan PFA berlanjut dari *Resilience Coach*/relawan terlatih.  
* **T3 (Low Risk):** Membutuhkan edukasi kesehatan jiwa dan aktivitas komunitas.

#### **4\. Integrasi Data Longitudinal & Dashboard Geospasial**

Seluruh data hasil asesmen (baik PFA maupun SRQ-20) tersimpan secara aman dalam **Database Longitudinal** berbasis ID Unik Penyintas untuk memantau perubahan kondisi mental hingga 30 hari.

Data ini terintegrasi langsung ke **Dashboard Admin (BPBD & Dinkes)** dalam bentuk visualisasi **Peta Geospasial Interaktif (*Geomap/Heatmap*)** dan statistik wilayah *real-time*. Hal ini memudahkan pengambil kebijakan untuk memetakan sebaran zona risiko, memantau tren distres masyarakat, serta mendistribusikan tenaga kesehatan jiwa secara presisi dan efisien di area bencana.

**PEMBAGIAN 3 ROLE (RBAC) RAPID-MIND**

**ROLE 1: RELAWAN (Aplikasi Mobile PWA)**

* Hak Akses: Input PFA (Hari 1-3), Wawancara SRQ-20 (Hari 4-30), dan Tombol Red Flag Emergency.  
* Tingkat Keputusan: Triage Awal atau Observasi Gejala Tampak di Lapangan.  
* Output Red Flag: Menghasilkan status "T0-Suspect" (Dugaan Darurat) dan Mengunci Lokasi GPS Posko.


**ROLE 2: TENAGA KESEHATAN & TRC (Dashboard Faskes / PSC 119\)**

* Hak Akses: Layar Tele-Emergency, Konfirmasi Status Rujukan, dan Rekam Medis Klinis Pasien.  
* Tingkat Keputusan: Validasi Diagnostik atau Triage Sekunder.  
* Akses & Aksi: Menerima notifikasi T0-Suspect, melakukan verifikasi cepat via telepon/video ke HP relawan atau menurunkan Tim Mobile, lalu mengubah status menjadi "T0-Confirmed Rujukan" atau menurunkan status ke T1/T2.




**ROLE 3: ADMIN & PENGAMBIL KEBIJAKAN (Dashboard BPBD / Dinkes)**

* Hak Akses: Peta Geospasial Interaktif (Heatmap), Laporan Agregat Wilayah, dan Manajemen Logistik/Relawan.  
* Tingkat Keputusan: Strategi Makro Penanganan Bencana.  
* Akses & Aksi: Memantau sebaran zona risiko, menambah personel relawan ke posko berdampak tinggi, dan mendistribusikan suplai obat/fasilitas medis.

**DESKRIPSI ALUR DUA PINTU (TWO-TIERED TRIAGE) UNTUK PENJELASAN KE JURI ATAU TEKNISI**

1. Relawan di posko menemukan penyintas yang menunjukkan tanda bahaya (seperti ideasi bunuh diri, psikosis, atau agitasi berat). Relawan menekan tombol Red Flag di aplikasi PWA.  
     
2. Sebelum sinyal terkirim, aplikasi menjalankan "3 Verification Gate" singkat untuk memastikan kondisi mendesak. Setelah dicentang, status pasien tersimpan sebagai "T0-Suspect" dan lokasi GPS posko langsung terkirim.  
     
3. Notifikasi darurat masuk ke Dashboard Role 2 (PSC 119 / Tim Reaksi Cepat Dinkes / Puskesmas Terdekat).  
     
4. Dokter atau Tenaga Kesehatan di Command Center melakukan validasi sekunder (Tele-Emergency) dengan menghubungi relawan di lapangan untuk konfirmasi visual selama 1-2 menit.  
     
5. Jika terkonfirmasi valid, status diubah menjadi "T0-Confirmed" dan unit evakuasi/ambulans baru diberangkatkan. Jika ternyata hanya respons histeria biasa tanpa bahaya darurat, status diturunkan oleh Nakes menjadi T1 atau T2.  
     
6. Seluruh pergerakan data ini terekam secara real-time di Dashboard Role 3 (BPBD dan Dinkes) untuk pemetaan peta geospasial (heatmap) dan pengambil kebijakan skala wilayah.

### **SPESIFIKASI TEKNIS & ARSITEKTUR IMPLEMENTASI RAPID-MIND**

1. PLATFORM & UI FRAMEWORK  
* Architecture: Progressive Web App (PWA) berbasis Mobile-First Responsive UI untuk Relawan, serta Desktop-Optimized Dashboard untuk Admin & Faskes.  
* Responsive Design: Dioptimalkan untuk perangkat mobile (relawan di lapangan) dan desktop/tablet layar lebar (command center).

  OFFLINE-FIRST CAPABILITY & DATA SYNC

* Local Storage Engine: Menggunakan Service Workers dan IndexedDB untuk menangani pencatatan data saat berada di area blank spot (tanpa koneksi internet).  
* Background Auto-Sync: Begitu perangkat relawan mendapatkan sinyal internet, Service Worker secara otomatis melakukan background sync untuk mengirimkan seluruh data antrean di IndexedDB ke server backend tanpa perlu refresh manual.  
* Data Collision Handling: Menggunakan timestamp dan Unique Patient ID berbasis NIK agar tidak terjadi duplikasi data saat sinkronisasi beruntun dari beberapa relawan.

  AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)

* Auth Protocol: Universal Single Sign-On (SSO) berbasis JWT (JSON Web Token).  
* System Routing: Setelah autentikasi berhasil, backend akan membaca role dari token JWT dan melakukan auto-redirect ke 3 antarmuka terpisah:  
  a. ROLE\_RELAWAN (Mobile PWA)  
  * Auto-redirect ke PWA Mobile UI.  
  * Akses fitur: Input PFA (Hari 1-3), Wawancara SRQ-20 (Hari 4-30), Auto-Lookup NIK, Speech-to-Text, dan Persistent Floating Red-Flag Shortcut.

  b. ROLE\_HEALTHCARE / FASKES (Dashboard Command Center & Tele-Emergency)

  * Auto-redirect ke Web Dashboard Faskes / PSC 119 / TRC Kesehatan.  
  * Akses fitur: Real-time Alert Notification (T0-Suspect), Tele-Emergency Verification, Validasi Diagnostik Sekunder, Rekam Medis Klinis Pasien, dan Konfirmasi Rujukan (T0-Confirmed / Downgrade T1/T2).

  c. ROLE\_ADMIN (Dashboard BPBD & Dinkes)

  * Auto-redirect ke Web Dashboard Monitoring & Analytics (Desktop UI).  
  * Akses fitur: Interactive Geospatial Heatmap, Real-time WebSockets Live Data Update, Agregat Statistik Wilayah, Pemantauan Longitudinal 30 Hari, dan Manajemen Logistik/Relawan.

#### **2\. Screen Flow & Logic (Mobile PWA Relawan)**

* **Screen 1: Universal Login Screen**  
  * Input Email/Username \+ Password universal.  
* **Screen 2: Homescreen & Identitas Penyintas (Auto-Lookup System)**  
  * Field Input: NIK / Scan QR Code / Nama \+ Tanggal Lahir.  
  * **Backend Logic:** Sistem melakukan query *lookup* ke database:  
    * **Jika NIK Baru:** Trigger form pendaftaran penyintas baru \$\\rightarrow\$ Direct ke **Screen 3 (Menu PFA)**.  
    * **Jika NIK Sudah Ada:** Fetch data riwayat PFA sebelumnya \$\\rightarrow\$ Direct ke **Screen 5 (Menu SRQ-20 Lanjutan)** untuk pemantauan longitudinal.  
* **Screen 3: Menu PFA (Fase Akut: Hari 1–3)**  
  * Wizard UI 3 Langkah (Guided Protocol):  
    * **LOOK:** Checklist visual tanda bahaya/kondisi fisik.  
    * **LISTEN:** Panduan dialog penenangan & pendengaran aktif.  
    * **LINK:** Checklist kebutuhan dasar (makanan, shelter, keluarga).  
* **Screen 4: Red-Flag Emergency Alert (Modal/Screen)**  
  * *Triggered* saat kasus Red Flag terjadi. Mengirimkan *payload* darurat ke server untuk notifikasi instan PSC 119/RS.  
* **Screen 5: Menu Wawancara SRQ-20 (Fase Lanjutan: Hari 4–30)**  
  * **Dual-Path Toggle:** Switcher antara \[Verbal\] dan \[Non-Verbal / Mutisme\].  
  * **Guided Instruction Tooltip:** Petunjuk bagi relawan di setiap nomor soal agar penyintas tidak salah tafsir.  
  * **Speech-to-Text (Voice Input) Feature:** Interaksi mikrofon yang merekam suara wawancara, menggunakan NLP sederhana untuk mendeteksi kata kunci berisiko dan memberikan **Auto-Checklist**.  
  * **CRITICAL REQUIREMENT:** *Human-in-the-Loop Control*. Relawan wajib memiliki akses *override* manual untuk menambah atau mengurai centang hasil *Speech-to-Text*.  
* **Screen 6: Evaluasi Faktor Risiko & Fungsi Harian**  
  * Checklist dampak trauma pada keberfungsian hidup sehari-hari.  
* **Screen 7: Result Screen (Auto-Calculated Integrated Triage Zone)**  
  * **Logic Engine:** Memproses skor total terintegrasi (0–37 poin: SRQ-20 [0–20] + Faktor Risiko [0–8] + Keberfungsian [0–9]):  
    * **T1 (High Risk):** Total Skor Integrasi >= 15 ATAU Skor Gangguan Keberfungsian F >= 6 (Rujukan Prioritas Spesialis/Psikolog).  
    * **T2 (Moderate Risk):** Total Skor Integrasi 7–14 (Pendampingan PFA Lanjutan & Konseling).  
    * **T3 (Low Risk):** Total Skor Integrasi 0–6 (Edukasi Kesehatan Jiwa & Dukungan Komunitas).  
    * **T0 (Emergency):** Terpicu langsung saat indikator suisida (Q17=Ya), psikosis akut, agitasi membahayakan, atau tombol Red Flag ditekan.

#### **3\. Persistent Global Component: "Floating Red-Flag Shortcut"**

* **UI Component:** Floating Action Button (FAB) berwarna merah menyala dengan ikon 🚨 Red Flag Emergency.  
* **Behavior:** **Wajib selalu melayang (*persistent*) di Layar 2 sampai Layar 7**.  
* **Trigger Logic:** Jika ditekan kapan pun (atau tercentang indikator Suisida/Psikosis/Agitasi/Kegawatan Medis), sistem langsung mengunci status pasien ke **T0 (Emergency)** tanpa memperhitungkan skor SRQ-20, dan memicu **Screen 4 (Alert Rujukan)**.


#### **4\. Dashboard Web Admin (BPBD / Dinkes / Faskes)**

**DASHBOARD ROLE 2: TENAGA KESEHATAN / FASKES / PSC 119 (Tampilan Clinical & Action-Oriented)**

Tujuan UI: Berfokus pada penanganan cepat kasus gawat darurat (T0 Red Flag), validasi klinis, dan manajemen rujukan medis.

Layout Main Components:

* Top Bar: Header nama Faskes/Unit PSC 119, Indikator Status Koneksi Real-time, dan Counter Alert (Jumlah T0 Pending).  
* Panel Kiri (Emergency Queue & Notification List):  
  * Daftar kartu panggilan darurat (T0-Suspect) yang masuk secara real-time via WebSockets.  
  * Kartu T0 berkedip merah (pulsing alert) dengan info: Nama Posko, Waktu Input, NIK Penyintas, dan Gejala Red Flag yang Dicentang Relawan.  
  * Tombol aksi cepat di setiap kartu: "Buka Tele-Emergency" dan "Lihat Detail Klinis".  
* Panel Tengah (Patient Clinical Detail & Validation Workspace):  
  * Rekam Medis Singkat Penyintas: Riwayat PFA, catatan relawan, dan indikator Red Flag.  
  * Fitur Tele-Emergency Modal: Jendela panggilan suara/video atau obrolan cepat terintegrasi ke HP relawan untuk verifikasi visual kondisi penyintas.  
  * Action Button Area (Tombol Eksekusi Validasi):  
    * Tombol Hijau: "Konfirmasi Rujukan (T0-Confirmed)" \-\> Otomatis mengirim perintah penjemputan ke unit ambulans/PSC 119\.  
    * Tombol Kuning: "Downgrade Status (Ke T1 High Risk atau T2 Moderate)" \-\> Jika hasil verifikasi menunjukkan penyintas tidak dalam bahaya nyawa/psikosis darurat.  
* Panel Kanan (Active Referral & Transport Tracking):  
  * Status pengiriman ambulans/tim mobile ke posko (Menuju Lokasi \-\> Tiba di Posko \-\> Dalam Perjalanan ke RS \-\> Selesai).

  **DASHBOARD ROLE 3: ADMIN BPBD / DINKES (Tampilan Analytical & Geospatial Command Center)**

Tujuan UI: Berfokus pada pemantauan makro, peta sebaran risiko geospasial, statistik wilayah, dan pengawasan longitudinal 30 hari.

Layout Main Components:

* Top Bar: Title Command Center BPBD/Dinkes, Global Date/Time Filter (Fase Akut Hari 1-3 vs Lanjutan Hari 4-30), dan Tombol Ekspor Laporan PDF/Excel.  
* Area Utama / Center Stage (Interactive Geospatial Heatmap):  
  * Map View (OpenStreetMap/Mapbox) yang menampilkan titik-titik posko pengungsian.  
  * Visual Markers (Pin Lokasi Posko) dengan kode warna terintegrasi:  
    * Merah Kedip: Posko memiliki kasus T0 (Emergency).  
    * Orange: Posko didominasi penyintas T1 (High Risk).  
    * Kuning: Posko didominasi penyintas T2 (Moderate Risk).  
    * Hijau: Posko dalam kondisi stabil T3 (Low Risk).  
  * Pop-up Interaktif: Jika pin posko diklik, muncul ringkasan: Jumlah Pengungsi, Sebaran T0/T1/T2/T3, dan Jumlah Relawan Aktif.  
* Sidebar Kiri (Macro Analytics & Executive Metrics):  
  * Stat Cards (Angka Utama): Total Penyintas Terdata, Jumlah Kasus T0, Total T1, Total T2, dan Total T3.  
  * Chart 1 (Pie Chart): Persentase sebaran tingkat risiko kesehatan mental wilayah.  
  * Chart 2 (Line Graph): Tren Fluktuasi Distres Mental Penyintas (Pemantauan Longitudinal Hari ke-1 hingga Hari ke-30).  
* Panel Bawah / Drawer (Longitudinal Patient Data Table):  
  * Tabel Master Data Seluruh Penyintas berbasis Unique Patient ID / NIK.  
  * Fitur Search & Filter: Filter berdasarkan Nama Posko, Status Risiko (T0-T3), dan Rentang Hari Penanganan.  
  * Kolom History Progress: Menampilkan grafik mini (sparkline) perkembangan skor SRQ-20 penyintas dari waktu ke waktu untuk memantau risiko PTSD/Depresi kronis.  
* Panel Right Sidebar (Resource & Volunteer Management):  
  * List Relawan Aktif di setiap posko dan fitur alokasi/pemindahan relawan ke posko berdampak tinggi (Zona Merah/Orange).

### **RINGKASAN 5 PILAR ARSITEKTUR SISTEM RAPID-MIND**

1. **System Architecture & PWA Offline-First:** Penerapan Service Worker dan IndexedDB untuk menjamin fungsionalitas aplikasi di area *blank spot* serta Background Auto-Sync saat koneksi internet pulih.
2. **Universal Single Sign-On (SSO) & Role-Based Access Control (RBAC):** Struktur otentikasi JWT yang memisahkan hak akses antarmuka Relawan (Mobile PWA) dan Pengambil Kebijakan (Desktop Dashboard).
3. **Dual-Path Triage Algorithmic Framework:**
   * **Phase 1 (Acute Phase Hari 1–3):** Intervensi PFA Look-Listen-Link terpandu, penapisan Red-Flag Safety Gate (T0 - Emergency), dan panduan observasi non-data-entry.
   * **Phase 2 (Longitudinal Evaluation Hari 4–30):** Wawancara SRQ-20 terpandu (Jalur Verbal & Non-Verbal), integrasi faktor risiko & fungsi (0–37 poin) untuk klasifikasi T1 (High Risk), T2 (Moderate), dan T3 (Low Risk).
4. **Feature Innovations:** Integrasi Speech-to-Text (Voice Input) untuk deteksi kata kunci berisiko dengan kendali penuh relawan (*Human-in-the-Loop*), serta antarmuka berdaya kontras tinggi yang ramah kondisi lapangan.
5. **Data Integration & Geospasial Dashboard:** Pembuatan Unique Patient ID untuk pemantauan longitudinal hingga 30 hari dan visualisasi Heatmap interaktif bagi BPBD/Dinkes.   

