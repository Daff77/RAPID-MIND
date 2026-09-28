\[ LOG IN \]  
   │  
   ▼  
\[ MENU UTAMA \] ───► (1) PFA GUIDEBOOK (Hari 1-3) ──► Interactive Cards & Grounding  
   │  
   └───► (2) WAWANCAARA SRQ-20 (Hari 4-30)  
              │  
              ├──► Mode Selection: \[ Verbal \] / \[ Non-Verbal \]  
              ├──► Input NIK / Scan QR / Data Diri Pasien  
              ├──► Kuesioner SRQ-20 (20 Pertanyaan)  
              ├──► Penilaian Faktor Risiko (Checklist A: 5 Indikator)  
              ├──► Penilaian Fungsi Harian (Checklist B: 3 Domain)  
              │  
              ▼  
         \[ KALKULASI SKOR INTEGRASI OTOMATIS \]  
              │  
              ├──► 🔴 TRIAGE T1 (High Risk / Total Skor ≥15 / Fungsi Lumpuh)  
              │    └─ Status: Recommendation for Priority Clinical Assessment  
              │  
              ├──► 🟡 TRIAGE T2 (Moderate Risk / Total Skor 7-14)  
              │    └─ Status: Recommendation for Psychosocial Follow-Up  
              │  
              └───► 🟢 TRIAGE T3 (Low Risk / Total Skor 0-6)  
                   └─ Status: Routine Community Support

\--------------------------------------------------------------------------------  
📌 PERSISTENT COMPONENT (Screen 2 dst):  
\[ 🚨 FLOATING SHORTCUT RED FLAG EMERGENCY \]  
   │  
   ▼  
\[ POP-UP RED FLAG T0 \] ──► (Trigger Suicidality / Psychosis / Emergency)  
   │  
   ▼  
\[ SYSTEM ACTION: T0 EMERGENCY \]  
   └─ Notifikasi Instan ke PSC 119 / Faskes / RS Rujukan

### **INTEGRASI AKHIR DATA & DASHBOARD ADMIN** 

Seluruh hasil akhir dari Layar Relawan akan bermuara pada 2 jenis dashboard:

1. **Kasus Red Flag (T0 Emergency):** Mengirimkan **Notifikasi Peringatan Dini & Rincian Klinis** ke Dashboard Rumah Sakit / PSC 119 / Tenaga Medis Profesional untuk tindakan rujukan cepat darurat.  
2. **Kasus T1, T2, dan T3:** Terintegrasi secara otomatis ke **Dashboard Utama BPBD & Dinkes** dalam bentuk **Peta Geospasial Interaktif (*Geomap/Heatmap*)** dan statistik pemantauan perkembangan kesehatan mental penyintas hingga 30 hari

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

Halo Dev Team\! Biar kita satu frekuensi untuk pengerjaan prototipe/mockup web-app **RAPID-MIND**, berikut adalah ringkasan spesifikasi teknis, logika *backend*, dan alur UI/UX yang perlu kita bangun:

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
* **Screen 7: Result Screen (Auto-Calculated Triage Zone)**  
  * **Logic Engine:** Memproses skor total SRQ-20 & checklist fungsi:  
    * T1 (High Risk) : Skor SRQ-20 \>/= 11  
    * T2 (Moderate Risk) : Skor SRQ-20 6–10.  
    * T3 (Low Risk) : Skor SRQ-20 0–5.

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

*Gimana Devs, draf alur & logika sistemnya sudah cukup jelas? Kalau ada struktur database atau endpoint API yang mau didiskusikan, kabari ya\!*

ok

**PANDUAN PROTOKOL EMERGENCY (RED FLAG T0)**  
**​KAPAN HARUS MENEKAN TOMBOL RED FLAG?**

Jika di tengah interaksi PFA Anda mendapati penyintas mengalami salah satu dari kondisi ini:

​​1. Risiko Keamanan Jiwa Spesifik (Suicidal & Self-Harm Behavior)  
​Indikator ini diambil langsung dari item kuesioner terstandardisasi:  

\- ​Ideasi / Ungkapan Ingin Mati (SRQ-20 Item \#17): Adanya pemikiran, niat, atau ungkapan eksplisit/implisit untuk mengakhiri hidup (misal: "Lebih baik saya mati saja", "Saya mau nyusul", "Gak ada gunanya hidup").  

\- ​Perilaku Menyakiti Diri (Non-Suicidal Self-Injury): Adanya tindakan aktif melukai diri sendiri (memukulkan kepala ke dinding, menggores kulit, mencabut rambut secara ekstrem).

​2. Gejala Psikotik Akut Bencana (Acute Disaster Psychosis / Dissociation)  
​Penelitian menunjukkan bahwa trauma berat berpotensi memicu episode disosiasi atau kegagalan realitas:

\- ​Halusinasi visual/auditorik: Melihat atau mendengar hal-hal yang tidak nyata (misal: mendengar suara gempa/ombak susulan yang tidak ada, melihat bayangan ancaman).

\- ​Waham / Delusi Paranoid: Keyakinan ekstrem yang tidak realistis bahwa semua orang di posko ingin mencelakainya atau curiga berlebihan tanpa dasar.

\- ​Disosiasi Parah & Mutisme Akut: Penurunan kesadaran lingkungan, kebingungan disorientasi penuh (tidak tahu siapa dirinya/di mana ia berada), atau mematung (catatonia) dan tidak merespons sama sekali.

​3. Perilaku Agitasi & Gangguan Kendali Impluls (Severe Agitation & Aggression)  
​Secara neurobiologis, respons fight-or-flight yang berlebih pada trauma akut dapat memicu perilaku tidak terkontrol:

\- ​Amuk / Agitasi Fisik Berat: Perilaku merusak, melemparkan barang, atau menyerang relawan/pengungsi lain secara fisik yang mengancam keselamatan posko.

\- ​Panik Parah yang Tak Terkendali (Extreme Panic Attack): Jeritan histeris menetap yang tidak bisa ditenangkan dengan teknik grounding PFA standar dan disertai tanda fisik krisis.

​4. Kegawatdaruratan Medis & Somatik Akut (Acute Somatic / Medical Crisis)  
​Distres psikologis akut sering kali bermanifestasi atau berasosiasi dengan krisis fisik yang mengancam jiwa:

\- ​Penurunan Kesadaran / Pingsan Berulang: Kehilangan kesadaran yang diakibatkan oleh trauma emosional berat (psychogenic non-epileptic seizures / pingsan histeris).

\- ​Hyperventilation Syndrome: Napas terlalu cepat dan dangkal hingga menyebabkan kram pada jari-jari tangan (carpopedal spasm), bibir kebas, atau rasa tercekik.

\- ​Gejala Kardiovaskular/Psikosomatik Berat: Nyeri dada hebat, sesak napas akut, atau dada berdebar ekstrem yang sulit dibedakan dengan serangan jantung.

​Langkah Aksi Relawan:  
1\. ​Tetap Tenang & Mendampingi: JANGAN meninggalkan penyintas sendirian secara fisik.  
2\. ​Tekan Tombol Melayang: Ketuk tombol 🚨 FLOATING RED FLAG di pojok bawah layar PWA Anda.  
3\. ​Konfirmasi Sinyal: Pilih nama/NIK penyintas (atau centang "Tanpa Nama"), lalu kirim.  
4\. ​Tunggu Bantuan: Sinyal T0-Suspect beserta titik GPS Anda telah terkirim ke Tim Medis/PSC 119\. Dampingi penyintas hingga tim medis tiba di lokasi.

**BUKU SAKU DIGITAL PFA (HARI 1–3)**

​Prinsip Utama: Hadir Utuh, Dengarkan, Jangan Menghakimi, dan Berikan Rasa Aman.

​👁️ TAHAP 1: LOOK (AMATI)  
​Lakukan pemindaian visual singkat selama 10–15 detik sebelum Anda mendekati penyintas.

1\. Amati Keamanan & Kondisi Fisik  
​Pastikan area sekitar aman dari bahaya fisik susulan (reruntuhan, cuaca ekstrem, jalanan licin).  
​Perhatikan apakah penyintas mengalami luka fisik berdarah atau cedera berat. (Jika Ada: Segera arahkan ke Tenda Medis/Faskes).

2\. Amati Reaksi Distres Parah  
​Perhatikan apakah penyintas menunjukkan salah satu perilaku berikut:  
​Shock / Mutisme: Tatapan mata kosong, mematung, atau tidak merespons saat disapa.  
​Histeria: Menangis tanpa henti, gemetar hebat, atau napas sangat cepat (hyperventilation).  
​Agitasi: Ngamuk, berteriak-teriak, atau berperilaku membahayakan.

​💡 Petunjuk Relawan: Jika Anda melihat tanda distres di atas, dekati secara perlahan. Gunakan suara yang lembut dan tenang.

​👂 TAHAP 2: LISTEN (DENGARKAN)  
​Fokus utama Anda adalah menenangkan dan memfasilitasi emosi penyintas.

1\. Sapa & Tawarkan Bantuan  
​Script: "Halo Ibu/Bapak, kenalkan saya \[Nama\], relawan pendamping di posko ini. Saya di sini untuk menemani Ibu/Bapak. Ada yang bisa saya bantu atau temani saat ini?"  
​  
2\. Panduan Mengolah Emosi (Do's & Don'ts)  
​✅ DO (Lakukan):  
​Duduk sejajar (posisi mata sama tinggi dengan penyintas).  
​Berikan kontak mata yang hangat dan anggukan kepala tanda Anda mendengarkan.  
​Sediakan air minum atau tisu jika penyintas menangis.  
​❌ DON'T (Jangan Lakukan):  
​JANGAN memaksa penyintas menceritakan kronologi kejadian bencana.  
​JANGAN memberi janji palsu (Contoh salah: "Sabar ya, rumahnya pasti nanti diganti kok").  
​JANGAN memotong pembicaraan atau membandingkan musibah mereka dengan orang lain.  
​  
3\. Teknik Grounding 5-4-3-2-1 (Gunakan Jika Penyintas Panik/Cemas)  
​Ajak penyintas melakukan latihan fokus fisik singkat berikut untuk mengembalikan kesadarannya:  
​Napas: "Ayo tarik napas pelan-pelan bersama saya... Tahan... Hembuskan..."  
​Lihat: "Sebutkan 3 benda yang ada di sekitar Ibu/Bapak saat ini."  
​Sentuh: "Rasakan pijakan kedua kaki Ibu/Bapak di tanah dan pegang gelas air ini."

​🔗 TAHAP 3: LINK (HUBUNGKAN)  
​Bantu penyintas menemukan kembali rasa kendali atas kebutuhan dasarnya.  
1\. Kebutuhan Dasar Logistik  
​Tanyakan kebutuhan paling mendesak yang mereka perlukan detik ini:  
​Air minum / Makanan  
​Selimut / Pakaian kering  
​Obat-obatan pribadi yang hilang / Tercecer  
​Popok / Perlengkapan bayi atau lansia  
​  
2\. Menghubungkan Dukungan Sosial  
​Script: "Apakah ada anggota keluarga inti atau kerabat dekat yang ingin Ibu/Bapak hubungi saat ini?"  
​Bantu sambungkan ke Posko Informasi / Pencarian Orang Hilang jika mereka terpisah dari keluarga.  
​  
3\. Penutup Sesi PFA  
​Script: "Merasa sedih, cemas, atau bingung setelah kejadian ini adalah hal yang sangat wajar, Bu/Pak. Ibu/Bapak tidak sendiri. Saya dan tim relawan ada di sekitar posko ini jika Ibu/Bapak membutuhkan bantuan lagi ya."

**PANDUAN WAWANCARA SRQ-20 UNTUK RELAWAN (HARI 4–30)**

​Pesan Pembuka Relawan (Script Onboarding)  
​"Halo Ibu/Bapak, saya mau bincang-bincang santai sebentar untuk menanyakan kabar, kondisi fisik, dan perasaan Ibu/Bapak selama beberapa hari di pengungsian ini. Tidak ada jawaban benar atau salah, jawab sesuai yang dirasakan saja ya."

​1. Apakah Sdr sering sakit kepala?    
\- ​Script Pertanyaan: "Selama di posko ini, kepala Ibu/Bapak sering terasa berat, cekot-cekot, atau pusing berulang nggak?"  
\- ​Petunjuk Relawan: Pastikan pusing bukan karena kurang minum atau terik matahari saja, melainkan pusing tegang yang terus muncul akibat pikiran tertekan.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "pusing", "sakit kepala", "cekot-cekot", "kepala berat".

​2. Apakah nafsu makan Sdr menurun?    
\- ​Script Pertanyaan: "Gimana dengan makanan di posko? Apakah merasa makanan sama sekali gak enak atau rasanya males banget buat makan?"  
\- ​Petunjuk Relawan: Centang "Ya" jika penyintas menyisakan sebagian besar porsi makan bukan karena makanan tidak cocok, melainkan karena memang kehilangan selera makan.    
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak nafsu makan", "males makan", "makanan gak masuk", "gak selera".

​3. Apakah Sdr tidak bisa tidur nyenyak?    
\- ​Script Pertanyaan: "Malam-malam kalau mau tidur susah nggak? Atau sering kebangun terus gak bisa tidur lagi?"  
\- ​Petunjuk Relawan: Bedakan antara tidak bisa tidur karena tempatnya berisik/panas dengan tidak bisa tidur karena pikiran berputar atau cemas.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak bisa tidur", "insomnia", "melek terus", "kebangun-bangun".

​4. Apakah Sdr mudah merasa takut?    
\- ​Script Pertanyaan: "Belakangan ini, apakah Ibu/Bapak gampang kaget atau merasa was-was/takut tiba-tiba padahal situasi lagi aman?"  
\- ​Petunjuk Relawan: Amati respon refleks penyintas terhadap suara keras mendadak di posko (misal: suara helikopter, sirine, atau barang jatuh).  
\- ​Auto-Checklist Keywords (Speech-to-Text): "takut", "was-was", "gampang kaget", "kawatir".

​5. Apakah tangan Sdr gemetar?    
\- ​Script Pertanyaan: "Apakah tangan atau jari-jari Ibu/Bapak sering terasa gemetar sendiri pas lagi duduk atau ngobrol?"  
\- ​Petunjuk Relawan: Dapat diisi via observasi langsung. Perhatikan apakah jari/tangan penyintas tampak tremor (gemetar) saat memegang gelas, memegang HP, atau saat diajak bicara.    
\- ​Auto-Checklist Keywords (Speech-to-Text): "gemetar", "dég-dégan", "tremor", "tangan gemeter".

​6. Apakah Sdr merasa cemas, tegang, atau khawatir?    
\- ​Script Pertanyaan: "Dada rasanya sering debar-debar, tegang, atau ganjel karena kepikiran terus nggak?"  
\- ​Petunjuk Relawan: Kata "ganjel di dada" atau "deg-degan" adalah bahasa awam yang paling sering menggambarkan kondisi cemas.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "cemas", "tegang", "dada sesek", "deg-degan", "gelisah".

​7. Apakah pencernaan Sdr buruk?    
\- ​Script Pertanyaan: "Perutnya sering terasa mual, melilit, atau bolak-balik diare tanpa sebab yang jelas nggak?"  
\- ​Petunjuk Relawan: Tanyakan apakah keluhan pencernaan ini timbul terutama saat rasa cemas atau ingatan bencana muncul (reaksi psikosomatik).  
\- ​Auto-Checklist Keywords (Speech-to-Text): "mual", "diare", "pencernaan ganggu", "perut melilit".

​8. Apakah Sdr mengalami kesulitan untuk berpikir jernih?    
\- ​Script Pertanyaan: "Rasanya kepalanya kayak penuh banget atau 'linglung', sampai susah konsentrasi pas diajak ngobrol?"  
\- ​Petunjuk Relawan: Perhatikan apakah penyintas sering melamun, tampak bingung, atau meminta pertanyaan diulang berintegrasi dengan gejala kognitif.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "linglung", "bingung", "gak fokus", "pikirannya kosong".

​9. Apakah Sdr merasa tidak bahagia?    
\- ​Script Pertanyaan: "Secara umum, rasanya sedih dan hampa banget ya perasaan Ibu/Bapak belakangan ini?"  
\- ​Petunjuk Relawan: Amati nada suara yang lesu dan ekspresi wajah penyintas saat menjawab.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "sedih", "hampa", "gak bahagia", "merana".

​10. Apakah Sdr lebih sering menangis dari biasanya?    
\- ​Script Pertanyaan: "Apakah belakangan ini rasanya pengen menangis terus, atau mendadak nangis tanpa bisa ditahan?"  
\- ​Petunjuk Relawan: Validasi emosi penyintas. Jangan melarang mereka menangis saat wawancara berlangsung.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "nangis terus", "pengen nangis", "menangis", "mewek".

​11. Apakah Sdr sulit menikmati kegiatan sehari-hari?    
\- ​Script Pertanyaan: "Hal-hal yang biasanya bikin senang (kayak ngobrol sama tetangga, nonton, atau main sama anak), sekarang rasanya udah gak menarik lagi nggak?"  
\- ​Petunjuk Relawan: Amati apakah penyintas cenderung mengisolasi diri di sudut posko dan enggan bersosialisasi.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak seru lagi", "males ngapa-ngapain", "gak hobi lagi".  
​12. Apakah Sdr merasa kesulitan untuk mengambil keputusan?    
\- ​Script Pertanyaan: "Buat milih atau memutuskan hal sepele aja (misal: mau makan apa, mau mandi jam berapa), rasanya bingung dan berat banget nggak?"  
\- ​Petunjuk Relawan: Fokus pada keraguan berlebih untuk melakukan tindakan atau pilihan sederhana sehari-hari.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "bingung milih", "gak bisa mutusin", "ragu-ragu terus".  
​13. Apakah hasil kerja sehari-hari Sdr memburuk?    
\- ​Script Pertanyaan: "Apakah tugas sehari-hari di posko terasa lambat banget selesainya atau sering terbengkalai?"  
\- ​Petunjuk Relawan: Nilai keberfungsian dasar penyintas dalam menjaga kebersihan diri, merawat anak, atau merapikan tenda.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak keurus", "tugas terbengkalai", "lambat ngerjainnya".

​14. Apakah Sdr merasa tidak bisa melakukan hal yang bermanfaat dalam hidup?    
\- ​Script Pertanyaan: "Apakah Ibu/Bapak merasa belakangan ini gak bisa berbuat apa-apa dan cuma bikin repot orang lain aja?"  
\- ​Petunjuk Relawan: Dengarkan ungkapan keputusasaan atau rasa bersalah (survivor's guilt) atas bencana yang terjadi.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak berguna", "nyusahin orang", "gak ada gunanya".

​15. Apakah Sdr kehilangan minat untuk melakukan berbagai macam hal?    
\- ​Script Pertanyaan: \- "Apakah rasanya udah kehilangan semangat total buat ngelakuin kegiatan apa pun hari ini?"  
\- ​Petunjuk Relawan: Bedakan dengan nomor 11; nomor 15 lebih berfokus pada kehilangan dorongan energi/inisiatif (apati).  
\- ​Auto-Checklist Keywords (Speech-to-Text): "hilang minat", "males semua", "gak ada semangat".

​16. Apakah Sdr merasa sebagai orang yang tidak berharga?    
\- ​Script Pertanyaan: "Pernah merasa kalau keberadaan Ibu/Bapak ini udah gak ada harganya atau merasa diri ini gagal?"  
\- ​Petunjuk Relawan: Perhatikan tanda-tanda devaluasi diri yang mendalam (low self-esteem).  
\- ​Auto-Checklist Keywords (Speech-to-Text): "gak berharga", "diri saya gagal", "gak ada artinya".

​17. Apakah Sdr memiliki pemikiran untuk mengakhiri hidup?    
\- ​Script Pertanyaan: "Dalam kondisi seberat ini, pernah nggak terlintas di pikiran Ibu/Bapak perasaan pengen nyerah aja, atau pikiran buat ngakhiri hidup?"  
\- ​Petunjuk Relawan & System Logic:

​🚨 CRITICAL SAFETY GATE TRIGGER: Jika Penyintas menjawab "YA" atau menyebut kata kunci, SISTEM AUTOMATIS MEMICU STATUS RED FLAG (T0-SUSPECT) tanpa memedulikan skor pertanyaan lainnya\!  
​Munculkan pop-up tombol darurat: \[ TRIGGER T0 RED-FLAG EMERGENCY \]. Relawan diinstruksikan tetap mendampingi penyintas secara fisik sementara sinyal dikirim ke Faskes/PSC 119\.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "mati", "bunuh diri", "nyerah", "nyusul", "diakhirin aja", "gak mau hidup".

​18. Apakah Sdr merasa lelah sepanjang waktu?    
\- ​Script Pertanyaan: "Badan dan pikiran rasanya lemes dan capek banget nggak sepanjang hari, padahal gak lagi kerja berat?"  
\- ​Petunjuk Relawan: Fokus pada rasa lelah emosional/fisik yang menetap (fatigue) meski sudah beristirahat.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "lelah terus", "capek banget", "badan lemes".

​19. Apakah Sdr merasakan perasaan tidak nyaman di perut?    
\- ​Script Pertanyaan: "Apakah perut sering terasa ganjel, perih di ulu hati, atau kayak ada rasa kebat/melilit yang bikin gak nyaman?"  
\- ​Petunjuk Relawan: Melengkapi pertanyaan nomor 7, fokus pada rasa tidak nyaman fisik umum di area abdomen akibat stres.  
\- ​Auto-Checklist Keywords (Speech-to-Text): "ulu hati sakit", "perut gak enak", "perih perut".

​20. Apakah Sdr mudah merasa lelah?    
\- ​Script Pertanyaan: "Baru gerak atau ngerjain hal kecil sebentar aja, rasanya langsung kehabisan tenaga dan capek banget nggak?"  
\- ​Petunjuk Relawan: Menilai penurunan daya tahan fisik akibat beban psikologis.  
 \- ​Auto-Checklist Keywords (Speech-to-Text): "gampang capek", "cepet lelah", "tenaga habis".

# 

# **MODUL ASSESSMENT: FAKTOR RISIKO & KEBERFUNGSIAN (FASE HARI 4–30)**

> **Catatan Penggunaan Relawan:** *Lakukan penilaian ini setelah atau bersamaan dengan wawancara SRQ-20. Pilih jawaban berdasarkan observasi langsung dan cerita penyintas.*

## **BAGIAN A: CHECKLIST FAKTOR RISIKO (RISK FACTORS)**

*Tujuan: Mengukur tingkat kerentanan latar belakang (vulnerability context).*

| No | Indikator Observasi / Pertanyaan (Bahasa Awam) | Kategori Risiko | Bobot Skor |
| :---- | :---- | :---- | :---- |
| **R1** | **Kehilangan Berat:** Penyintas kehilangan anggota keluarga inti (meninggal/hilang) ATAU rumah hancur total. | Duka Cita / Kerugian Materi Akut | **2 Point** |
| **R2** | **Pengalaman Traumatik Langsung:** Penyintas sempat tertimbun, hanyut, terjebak, atau menyaksikan langsung kematian orang lain saat bencana. | Ancaman Nyawa Langsung | **2 Point** |
| **R3** | **Kelompok Rentan:** Penyintas adalah Lansia (\>60 th), Ibu Hamil/Menyusui, Disabilitas, atau Anak Tanpa Orang Tua. | Kerentanan Biologis/Sosial | **1 Point** |
| **R4** | **Riwayat Gangguan Jiwa:** Sebelum bencana, penyintas pernah berobat rutin ke poli jiwa/Puskesmas atau minum obat penenang/jiwa. | Pre-existing Condition | **2 Point** |
| **R5** | **Terputus Obat Kronis:** Penyintas memiliki penyakit fisik kronis (Diabetes, Hipertensi, Epilepsi, dll.) dan obatnya habis/hilang. | Komorbiditas Medis | **1 Point** |

Skor Maksimal Bagian A \= 8 Point 

## **BAGIAN B: CHECKLIST PENILAIAN FUNGSI HARIAN (FUNCTIONAL ASSESSMENT)**

*Tujuan: Mengukur sejauh mana trauma mengganggu kemampuan hidup sehari-hari (Impairment Level).*

| No | Domain Keberfungsian (Bahasa Awam) | Pilihan Kondisi (1-Tap Selection) | Bobot Skor |
| :---- | :---- | :---- | :---- |
| **F1** | **Perawatan Diri (*Self-Care*):**  *"Gimana kemampuan mandi, makan, dan ganti pakaian?"* | 🟢 Mandiri & bersih tanpa perlu diingatkan 🟡 Lambat / Harus diingatkan / Baju kotor 🔴 Tidak mau mandi, tidak mau makan, mematung | **0 Point 1 Point 3 Point** |
| **F2** | **Fungsi Peran & Sosial (*Social Function*):**  *"Gimana interaksi dengan keluarga & tetangga tenda?"* | 🟢 Mau mengobrol & mengurus keluarga/anak 🟡 Cenderung mengurung diri / Jarang bicara 🔴 Mengisolasi diri total / Agresif & marah-marah | **0 Point 1 Point**  **3 Point** |
| **F3** | **Akses Kebutuhan (*Daily Tasks*):**  *"Gimana kemampuan mengurus kebutuhan dasar?"* | 🟢 Mampu ambil bantuan/makanan sendiri 🟡 Bingung / Kebingungan mengantre bantuan 🔴 Membiarkan anak/diri sendiri kelaparan | **0 Point 1 Point 3 Point** |

Skor Maksimal Bagian B \= 9 Point 

## **FORMULA & RUMUS SKORING INTEGRASI**

$Total\ Integrated\ Score=Skor\ SRQ20\ (0-20)+Skor\ Risk\ Factor\ (0-8)+Skor\ Functional\ (0-9)$

**Rentang Total Skor:** $0-37\ Point$ 

## **TRIAGE CATEGORY THRESHOLD (T0 – T3)**

### **1\. 🚨 TRIAGE T0: CRITICAL EMERGENCY (RED FLAG OVERRIDE)**

> **Kriteria:** Tidak memedulikan berapa pun Total Skor-nya. Jika **SRQ-20 Nomor 17 \= "Ya"** ATAU **Floating Red Flag Ditekan** saat interaksi PFA/Wawancara.

* **Status Logis:** *Bypassing Score Engine*.  
* **Aksi Sistem:** Sinyal SOS dikirim *real-time* ke Dashboard PSC 119 / Faskes terdekat dengan koordinat GPS.  
* **Instruksi Relawan:** Jangan tinggalkan penyintas. Dampingi fisik hingga tim medis/psikiater tiba.

### **2\. 🔴 TRIAGE T1: SEVERE DISTRESS & IMPAIRMENT (MERAH)**

> **Kriteria:** Total Integrated Score **≥ 15 Point** *(atau Skor Keberfungsian F ≥ 6 Point)*.

* **Profil Klinis:** Penyintas mengalami distres emosional berat yang disertai dengan kelumpuhan fungsi harian (tidak mau makan, tidak merawat diri, mengisolasi diri total) atau memiliki tumpukan faktor risiko trauma yang sangat masif.  
* **Rekomendasi Sistem:**  
  * Prioritas Rujukan ke Faskes Role 2 (Puskesmas/Dokter/Psikiater).  
  * Perlu evaluasi medis dan kemungkinan intervensi farmakoterapi/psikoterapi intensif.

### **3\. 🟡 TRIAGE T2: MODERATE DISTRESS / HIGH VULNERABILITY (KUNING)**

> **Kriteria:** Total Integrated Score **7 – 14 Point**.

* **Profil Klinis:** Distres emosional tingkat sedang (gejala kecemasan/somatik menonjol) ATAU skor SRQ-20 sedang yang diperberat oleh faktor risiko tinggi (misal: lansia, kehilangan rumah, atau riwayat obat terputus).  
* **Rekomendasi Sistem:**  
  * Masukkan ke **Daftar Pantau Utama Posko (Watchlist)**.  
  * Intervensi Konseling Kelompok, *Stress Management*, dan pendampingan oleh Perawat/Tenaga Kesehatan Terlatih Faskes.  
  * Re-evaluasi ulang dalam 7 hari.

### **4\. 🟢 TRIAGE T3: MILD DISTRESS / RESILIENT (HIJAU)**

> **Kriteria:** Total Integrated Score **0 – 6 Point**.

* **Profil Klinis:** Gejala emosional tergolong wajar pascabencana, keberfungsian harian masih terjaga mandiri, dan tidak memiliki faktor risiko laten yang mengancam.  
* **Rekomendasi Sistem:**  
  * Penyintas dalam kondisi adaptif/resilien.  
  * Cukup berikan **Dukungan Psikososial Komunitas (PFA Lanjutan)**, libatkan dalam kegiatan sosial posko, dan penuhi kebutuhan logistik dasarnya.

### **Wawancara Non-Verbal (Mode Pengumpulan Data Alternatif / *Adaptive Assessment*)**

* **Sifat:** Metode interaksi/wawancara terstruktur yang disesuaikan (*Clinical Adaptation*).  
* **Momen Eksekusi:** Dilakukan saat tahap wawancara terstruktur (SRQ-20 atau Penilaian Fungsi di Hari 4–30) ketika penyintas **tidak bisa atau tidak mau berbicara** (*non-verbal/mutisme* akibat syok trauma).  
* **Cara Kerja Relawan:** Relawan **AKTIF BERINTERAKSI** tetapi tanpa memaksa penyintas menjawab lewat kata-kata. Relawan menggunakan alat bantu di PWA RAPID-MIND seperti:  
  * **Isyarat / Ketukan Layar:** Meminta penyintas mengangguk/menggeleng, atau mengetuk ikon *Suka/Tidak Suka* atau *Ya/Tidak* di layar HP relawan.  
  * **Observasi Terpandu (Guided Observation):** Relawan menilai poin SRQ-20/Fungsi berdasarkan respons fisik penyintas terhadap pertanyaan yang diajukan (misal: bahasa tubuh, ekspresi wajah, atau bantuan dari konfirmasi anggota keluarga di sampingnya).  
* **Aksi Sistem:** Data masuk ke dalam **Kalkulasi Skor Integrasi biasa (T1, T2, atau T3)** untuk menentukan tingkat distres dan kebutuhan konselingnya.

## **Fitur Spesifik Efisiensi UI untuk Garda Depan**

1. **Tombol Area Tap Luas (*Fat-Finger Friendly*):** Seluruh tombol pilihan jawaban dirancang dengan tinggi minimal **56px** agar tidak salah tekan saat tangan relawan gemetar atau lelah di lapangan.  
2. **Kontras Warna Tinggi (*High Contrast Mode*):** Menggunakan palet warna yang memenuhi standar WCAG AAA agar tetap terbaca jelas di bawah terik matahari tenda pengungsian.  
3. **Indikator Sinyal & Sync Digital:** Ikon `[📶 OFF]` di pojok kanan atas memberikan kepastian kepada relawan bahwa data tersimpan di penyimpanan lokal HP (*IndexedDB*) saat tidak ada koneksi internet.

