### **A. ALUR PWA RELAWAN (Garda Depan)** 

\[ LOG IN \]  
   │  
   ▼  
\[ MENU UTAMA \] ───► (1) PFA GUIDEBOOK (Hari 1-3) ──► Interactive Cards & Grounding  
   │  
   └───► (2) WAWANCARA SRQ-20 (Hari 4-30)  
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

⚠️ **Catatan Etik & Medis pada UI Hasil Asesmen:** Di layar hasil asesmen akan selalu tercantum *disclaimer* baku: *"Hasil asesmen ini bersifat REKOMENDASI SISTEM sebagai alat bantu keputusan awal hingga dilakukan VALIDASI KLINIS resmi oleh Tenaga Kesehatan / Spesialis Profesional."* 

### 

### 

### **Bagaimana Mengirimkan Notifikasi T0 Saat TIDAK ADA Internet? (*Offline-First T0 Mechanism*)**

Ini adalah celah kritis di area bencana. Dalam arsitektur PWA, untuk mengirimkan notifikasi *real-time* (WebSocket/Push) memang dibutuhkan koneksi internet. Namun, ketika sinyal mati total (*Blank Spot*), RAPID-MIND menggunakan **3-Tier Fallback Strategy** untuk Notifikasi T0:

1. **Tier 1 (Kondisi Ada Internet): WebSockets & Push Notification** Sinyal T0 dikirimkan langsung via internet ke Dashboard Faskes & PSC 119 dalam \<1 detik.  
2. **Tier 2 (Sinyal Internet Mati, Tapi Ada Sinyal Seluler 2G/GSM): SMS Gateway Auto-Fallback** Ketika PWA mendeteksi `navigator.onLine == false` atau koneksi server gagal, PWA secara otomatis memicu perintah pembuka SMS terenkripsi/native SMS gateway di HP relawan untuk mengirimkan SMS format darurat berisi NIK, Jenis Red Flag, dan Koordinat GPS Relawan langsung ke Server/Nomor Emergency PSC 119\.  
3. **Tier 3 (Sinyal Mati Total / Offline Murni): Store, Local Alert, & Mesh-Sync**  
   * **Local Storage (IndexedDB):** Data T0 langsung dikunci di urutan teratas (*High-Priority Queue*) memori HP relawan.  
   * **Local Audio-Visual Alert:** Layar HP relawan bergetar dan menampilkan instruksi fisik: *"KONEKSI OFFLINE: Segera lakukan penanganan fisik PFA dan bawa/dampingi penyintas secara langsung ke Tenda Medis Posko Terdekat\!"*  
   * **Auto-Sync Background Sync API:** Begitu HP relawan menangkap secuil sinyal (atau saat relawan berjalan mendekati area yang ada sinyal/router posko utama), *Service Worker* PWA secara otomatis menyinkronkan sinyal T0 tersebut ke dashboard medis tanpa relawan perlu menekan tombol apa pun.

### **B. DASHBOARD PENGATUR / ADMIN (PSC 119, BPBD, Dinkes \- Level Makro)**

Dashboard ini berfokus pada **Data-Driven Decision Making** untuk alokasi sumber daya krisis:

* **Interactive Geospatial Heatmap:** Peta wilayah bencana berbasis koordinat GPS yang menampilkan sebaran titik T0, T1, T2, dan T3. Area dengan warna merah pekat menandakan klaster trauma/distres tinggi yang butuh intervensi tim medis tambahan.  
* **Real-time WebSockets Live Data Update:** Grafik dan angka statistik posko yang diperbarui secara otomatis setiap kali relawan di lapangan menekan tombol *submit*.  
* **Agregat Statistik Wilayah:** Rekapitulasi demografi (persentase kelompok rentan, distribusi skor SRQ-20, dan faktor risiko paling mendominasi).  
* **Pemantauan Longitudinal 30 Hari:**  
  * Pemantauan Makro Perkembangan Kesehatan Jiwa Masyarakat selama 30 Hari Bencana.  
  * **Mengapa Penting?** Secara epidemiologi jiwa, reaksi trauma bencana berubah seiring waktu:  
    * *Hari 1–3:* Fase Akut/Shock.  
    * *Hari 4–14:* Fase Reaksi Trauma / Distres Memuncak.  
    * *Hari 15–30:* Fase Pemulihan atau Transisi menuju Gangguan Kronis (seperti PTSD/Depresi).  
  * Fitur ini menampilkan **grafik tren agregat wilayah**: Apakah jumlah kasus T1/T2 di Posko A menurun setelah dikirimkan psikolog? Jika di hari ke-20 angka T1 di suatu posko justru melonjak, Admin Dinkes bisa mendeteksi adanya *secondary trauma* (misal: sanitasi buruk, kelangkaan logistik, atau isu keamanan).  
* **Manajemen Logistik & Relawan:**  
  * Pendataan sebaran lokasi relawan aktif (*Volunteer Tracking*).  
  * Pemetaan kebutuhan logistik spesifik MHPSS (obat-obatan psikiatri, kit anak, perlengkapan lansia) berbasis kebutuhan real-time di posko.

### **C. DASHBOARD HEALTHCARE (Puskesmas, Rumah Sakit Rujukan, Dokter, Psikiater)**

Dashboard ini berfokus pada **Triage & Intervensi Klinis**:

* **Real-time Alert Notification (T0-Suspect):** Pop-up darurat berbunyi keras di layar monitor Faskes saat ada relawan yang menekan *Red Flag* di lapangan, menampilkan NIK/Identitas, Nama Relawan, Jenis Red Flag, dan Lokasi GPS Penjemputan.  
* **Rekam Medis Klinis Pasien (Clinical Patient Record):**  
  * Rekam jejak hasil asesmen terintegrasi (Skor SRQ-20 \+ Faktor Risiko \+ Penilaian Fungsi Harian) dari setiap penyintas.  
  * **Prioritas Asesmen Klinis:** Mengurutkan daftar pasien berdasarkan kegawatan: **T0 $\rightarrow$ T1 $\rightarrow$ T2 $\rightarrow$ T3**.  
    


### **A. Alur Antarmuka Relawan Garda Depan (*Frontline Volunteer Workflow*)**

Alur kerja pada antarmuka relawan difokuskan pada prinsip efisiensi operasional dan kepatuhan etik penanganan trauma tanpa membebani relawan secara administratif:

1. **Autentikasi dan Navigasi Utama:**  
   Relawan melakukan *log in* ke dalam PWA dan dihadapkan pada dua modul utama berdasarkan fase waktu bencana: Modul *Psychological First Aid* (PFA) untuk fase akut (Hari 1–3) dan Modul Penapisan Terstruktur (Hari 4–30).  
2. **Modul PFA (Hari 1–3):**  
   Navigasi PFA dirancang sebagai *Interactive Guidebook* berbasis prinsip *Look, Listen, Link* (WHO). Pada fase ini, sistem tidak memuat formulir masukan data yang kompleks untuk menjaga kehangatan interaksi humanis relawan. Relawan dibekali kartu panduan visual, skrip penenang, dan modul panduan latihan *grounding* fisik.  
3. **Modul Penapisan Terstruktur SRQ-20 dan Asesmen Terintegrasi (Hari 4–30):**  
   * **Inisiasi dan Mode Interaksi:** Relawan memilih mode wawancara: **Mode Verbal** (interaksi dialogis) atau **Mode Non-Verbal/Adaptif** (menggunakan isyarat visual/ketukan layar untuk penyintas yang mengalami *mutisme* atau syok). Pembacaan data identitas (NIK/Scan QR) dilakukan pada tahap ini.  
   * **Pengumpulan Data Tiga Tingkat:** Relawan memandu pengisian 20 item pertanyaan SRQ-20, dilanjutkan dengan pengisian checklist *Faktor Risiko* (5 indikator kerentanan) dan *Penilaian Keberfungsian Harian* (3 domain fungsi).  
   * **Kalkulasi dan Rekomendasi Asesmen:** Sistem secara otomatis menghitung *Total Integrated Score* ($0-37\ point$) dan menetapkan rekomendasi klasifikasi triase:  
     * 🟢 **Triage T3 (Low Risk / Routine Community Support):** Skor 0–6.  
     * 🟡 **Triage T2 (Moderate Risk / Psychosocial Follow-up):** Skor 7–14.  
     * 🔴 **Triage T1 (High Risk / Priority Clinical Assessment):** Skor $\geq 15$ atau indikasi kelumpuhan fungsi harian.  
     * *Catatan Sistem:* Tampilan hasil asesmen memuat penafsiran eksplisit bahwa status triase merupakan **rekomendasi keputusan awal (*decision support*)** hingga dilakukan validasi resmi oleh tenaga medis profesional.  
4. **Komponen Pintas Emergency (*Floating Red Flag Shortcut*):**  
   Seluruh halaman antarmuka (selain layar *log in*) dilengkapi dengan tombol melayang (*Floating Shortcut*) yang dapat diakses dalam kurun waktu $<0,5detik$. Apabila relawan mendeteksi indikator bahaya jiwa (*Red Flag*) seperti ideasi bunuh diri (SRQ \#17), gejala psikosis akut, atau kegawatdaruratan medis, tombol ini akan memicu status **Triage T0 (Critical Emergency)** secara langsung dengan memotong (*bypassing*) seluruh proses kalkulasi skor.  
5. **Mekanisme Respon T0 pada Kondisi Keterbatasan Jaringan (*Offline-First T0 Strategy*):**  
   Untuk mengatasi krisis komunikasi di area pemukiman terisolasi (*blank spot*), sistem menerapkan tiga lapis strategi transmisi sinyal darurat:  
   * **Lapis 1 (Jaringan Internet Aktif):** Transmisi data instan melalui arsitektur *WebSockets* dan *Push Notification* ke dashboard Faskes/PSC 119\.  
   * **Lapis 2 (Jaringan Internet Mati, Sinyal Seluler 2G/GSM Aktif):** Sistem mengalihkan transmisi (*auto-fallback*) secara otomatis melalui pemicuan *SMS Gateway* terenkripsi yang memuat identitas dan koordinat GPS relawan.  
   * **Lapis 3 (Nirkoneksi / Offline Murni):** Sinyal dikunci pada urutan prioritas tertinggi memori lokal (*IndexedDB*), memicu peringatan audio-visual lokal untuk instruksi penanganan fisik langsung di lapangan, serta mengeksekusi sinkronisasi otomatis (*Background Sync API*) saat perangkat menangkap sinyal sekecil apa pun.

### **B. Alur Dashboard Administrator Makro (*Macro-Management Dashboard Workflow*)**

Dashboard administrator dirancang untuk pemangku kebijakan (BPBD, Dinas Kesehatan, dan PSC 119\) guna mendukung pengambilan keputusan berbasis data (*data-driven decision making*):

1. **Interactive Geospatial Heatmap:**  
   Menampilkan visualisasi peta spasial wilayah bencana berbasis data GPS yang mengklasifikasikan pemukiman posko berdasarkan kerapatan tingkat risiko (T0–T3) secara real-time.  
2. **Real-time WebSockets Live Data & Agregat Statistik:**  
   Menyajikan pembaruan grafik demografi, distribusi faktor risiko dominan, dan persentase tingkat distres wilayah secara otomatis tanpa perlu penyegaran (*refresh*) halaman.  
3. **Pemantauan Longitudinal 30 Hari:**  
   Fasilitas grafik kurva tren temporal yang memantau dinamika epidemiologis kondisi psikologis masyarakat selama 30 hari pascabencana (memantau transisi dari fase reaksi trauma akut menuju pemulihan atau potensi kronisitas seperti PTSD).  
4. **Manajemen Logistik MHPSS dan Relawan:**  
   Modul pelacak sebaran relawan aktif di lapangan serta pemetaan alokasi kebutuhan logistik spesifik kesehatan jiwa (kit anak, obat psikotropika/kronis, dan perlengkapan lansia) berbasis kebutuhan riil di tiap titik posko.

### **C. Alur Dashboard Pelayanan Kesehatan Klinis (*Healthcare Service Dashboard Workflow*)**

Dashboard pelayanan kesehatan diperuntukkan bagi tenaga kesehatan profesional (dokter, perawat terlatih, dan psikiater) di tingkat Puskesmas, Rumah Sakit Rujukan, atau PSC 119:

1. **Notifikasi Peringatan Dini Real-Time (T0-Suspect Alert):**  
   Sistem menampilkan jendela pop-up darurat disertai sinyal audio berfrekuensi tinggi secara instan begitu sinyal T0 dipicu oleh relawan di lapangan. Layar menampilkan data NIK/identitas pasien, jenis indikator darurat, nama relawan pendamping, dan lokasi titik GPS penjemputan.  
2. **Rekam Medis Klinis dan Prioritasi Asesmen:**  
   Menyajikan rekam jejak psikologis pasien secara longitudinal (riwayat SRQ-20, faktor risiko, dan skor fungsi). Sistem mengurutkan antrean intervensi pasien secara otomatis berdasarkan matriks kegawatan klinis (**T0 $\rightarrow$ T1 $\rightarrow$ T2 $\rightarrow$ T3**).  
3. **Modul Validasi dan Tindakan Medis:**  
   Tenaga medis profesional melakukan evaluasi klinis mendalam (*clinical validation*) untuk mengonfirmasi atau menyesuaikan status rekomendasi sistem, memasukkan catatan diagnosis medis, menetapkan rencana intervensi/farmakoterapi, atau menerbitkan surat rujukan resmi ke fasilitas kesehatan tingkat lanjut.

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

## **1\. Arsitektur Platform & Infrastruktur**

## **A. PLATFORM & UI FRAMEWORK**

* **Architecture:** *Progressive Web App* (PWA) berbasis *Mobile-First Responsive UI* untuk Relawan Lapangan (Role 1), serta *Desktop-Optimized Dashboard* untuk Faskes/Healthcare (Role 2\) dan Admin Command Center BPBD/Dinkes (Role 3).

* **Responsive Design:** Dioptimalkan untuk perangkat *mobile* (relawan di lapangan) dan *desktop/tablet* layar lebar (command center faskes & dinas).

  ### **B. OFFLINE-FIRST CAPABILITY & DATA SYNC**

* **Local Storage Engine:** Menggunakan *Service Workers* dan *IndexedDB* (via Dexie.js) untuk menangani pencatatan data PFA dan wawancara saat berada di area *blank spot* (tanpa koneksi internet).  
* **Background Auto-Sync:** Begitu perangkat relawan menangkap sinyal internet, *Service Worker* secara otomatis melakukan *background sync* untuk mengirimkan seluruh data antrean di *IndexedDB* ke server backend tanpa perlu *refresh* manual.  
* **3-Tier Fallback Mechanism untuk Red Flag (T0 Emergency):**  
  1. *Tier 1 (Online):* Transmisi instan via *WebSockets & Push Notification* ke Dashboard Faskes.  
  2. *Tier 2 (Sinyal Seluler 2G/GSM):* *Auto-trigger SMS Gateway* terenkripsi yang memuat NIK, Jenis Red Flag, dan Koordinat GPS Relawan ke server/PSC 119\.  
  3. *Tier 3 (Offline Murni):* Data dikunci di urutan prioritas teratas *IndexedDB*, memicu *Audio-Visual Alert* lokal, dan mengeksekusi *Background Sync API* saat sinyal kembali terhubung.  
* **Data Collision Handling:** Menggunakan *timestamp* dan *Unique Patient ID* berbasis NIK agar tidak terjadi duplikasi data saat sinkronisasi beruntun dari beberapa relawan.

  ### **C. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)**

* **Auth Protocol:** Universal *Single Sign-On* (SSO) berbasis JWT (*JSON Web Token*).  
* **System Routing:** Setelah autentikasi berhasil, backend membaca *role* dari token JWT dan melakukan *auto-redirect* ke 3 antarmuka terpisah:  
  * **ROLE\_RELAWAN (Mobile PWA):** Auto-redirect ke PWA Mobile UI (Menu PFA, Wawancara SRQ-20 \+ Risk & Function, dan Persistent Floating Red-Flag Shortcut).  
  * **ROLE\_HEALTHCARE / FASKES (Dashboard Command Center & Tele-Emergency):** Auto-redirect ke Web Dashboard Faskes / PSC 119 / TRC Kesehatan (Real-time Alert T0-Suspect, Verifikasi Tele-Emergency, Validasi Klinis Sekunder, Rekam Medis, dan Konfirmasi Rujukan).  
  * **ROLE\_ADMIN (Dashboard BPBD & Dinkes):** Auto-redirect ke Web Dashboard Monitoring & Analytics (Interactive Geospatial Heatmap, Real-time WebSockets, Agregat Wilayah, Pemantauan Longitudinal 30 Hari, dan Manajemen Logistik/Relawan).

#### **2\. Screen Flow & Logic (Mobile PWA Relawan)**

**Screen 1: Universal Login Screen**

* Input Email/Username \+ Password universal.

**Screen 2: Menu Utama (Pilihan Jalur Interaksi)**

* **Jalur 1: PFA Guidebook (Fase Akut: Hari 1–3)** $\rightarrow$ Membuka *Interactive Pocket Guide*.  
* **Jalur 2: Penapisan Terstruktur (Fase Lanjutan: Hari 4–30)** $\rightarrow$ Membuka alur penapisan komprehensif.

**Screen 3: PFA Interactive Guidebook (Fase Akut: Hari 1–3)**

* **Karakteristik:** *Non-data-entry & human-centric* (mencegah relawan sibuk mencentang layar di depan korban syok).  
* **Tabulation UI:**  
  * *LOOK:* Kartu panduan amati keamanan fisik dan tanda distres visual.  
  * *LISTEN:* Skrip kalimat penenang, *Do's & Don'ts*, dan *Interactive Visual Grounding 5-4-3-2-1*.  
  * *LINK:* Checklist kebutuhan dasar logistik & bantuan pencarian keluarga.

**Screen 4: Modul Wawancara SRQ-20 (Fase Lanjutan: Hari 4–30)**

* **Identifikasi Penyintas (Auto-Lookup):** Input NIK / Scan QR Code. Jika NIK baru $\rightarrow$ Buat Profil; Jika NIK lama $\rightarrow$ Panggil data riwayat pemantauan longitudinal.  
* **Dual-Path Toggle:** Switcher antara **\[Verbal\]** (dialog biasa) dan **\[Non-Verbal / Mutisme\]** (mode adaptif berbasis isyarat anggukan/gelengan dengan tombol area *tap* raksasa).  
* **Speech-to-Text Feature:** Mikrofon perekam suara wawancara dengan NLP sederhana untuk *auto-check* kata kunci berisiko.  
* **CRITICAL REQUIREMENT:** *Human-in-the-Loop Control*. Relawan wajib memiliki akses *override* manual untuk menambah/mengurangi centang secara bebas.

**Screen 5: Evaluasi Faktor Risiko & Penilaian Fungsi Harian**

* **Bagian A (Faktor Risiko / Kerentanan):** Checklist 5 indikator (Duka cita/kehilangan, trauma langsung, kelompok rentan, riwayat gangguan jiwa, terputus obat kronis).  
* **Bagian B (Penilaian Keberfungsian Harian):** Checklist 3 Domain WHODAS-based (*Self-Care*, *Social Role*, *Daily Tasks*) dengan skala 3 tingkat (Mandi/makan mandiri, terganggu sebagian, atau lumpuh total).

**Screen 6: Result Screen (Auto-Calculated Integrated Triage Zone)**

* **Logic Engine Calculation:** Memproses penjumlahan bobot skor terintegrasi:

* $TotalIntegratedScore=SkorSRQ-20(0-20)+SkorRisiko(0-8)+SkorFungsi(0-9)$  
* **Triage Zone Output:**  
  * 🔴 **T1 (High Risk / Priority Clinical Assessment):** Total Skor $\geq 15$ ATAU Skor Fungsi Lumpuh ($\geq 6$).  
  * 🟡 **T2 (Moderate Risk / Psychosocial Follow-up):** Total Skor $7-14$.  
  * 🟢 **T3 (Low Risk / Routine Community Support):** Total Skor $0-6$.  
* **Clinical Disclaimer:** Memuat penafsiran eksplisit bahwa hasil asesmen bersifat *Rekomendasi Sistem* sebagai alat bantu keputusan awal hingga dilakukan *Validasi Klinis* resmi oleh Tenaga Medis Profesional.

**Screen 7: Red-Flag Emergency Alert (Modal Pop-Up T0)**

* Dipicu saat indikator *Red Flag* teridentifikasi. Menampilkan modal konfirmasi cepat (\<0,5 detik) yang mengirimkan *payload* darurat T0 beserta titik GPS ke Dashboard Faskes/PSC 119\.

#### **3\. Persistent Global Component: "Floating Red-Flag Shortcut"**

**UI Component:** *Floating Action Button* (FAB) berwarna merah menyala dengan ikon 🚨 *Red Flag Emergency* yang melayang di pojok kanan bawah.

**Behavior:** **Wajib selalu melayang (persistent)** di seluruh layar mulai dari Screen 2 hingga Screen 6 (selain Screen 1 Login).

**Trigger Logic & Safety Gate:** Jika ditekan kapan pun saat interaksi PFA maupun Wawancara (atau tercentang indikator ideasi bunuh diri SRQ \#17, halusinasi/psikosis, agitasi/amuk, atau krisis medis vital), sistem secara otomatis:

1. Memotong (*bypassing*) seluruh kalkulasi skor kuesioner.  
2. Mengunci status pasien ke **T0 (Critical Emergency)**.  
3. Memicu **Screen 7 (Modal Alert Rujukan)** untuk mentransmisikan sinyal SOS ke Faskes/PSC 119\.

#### **4\. Dashboard Web Admin (BPBD / Dinkes / Faskes)**

### **A. DASHBOARD ROLE 2: TENAGA KESEHATAN / FASKES / PSC 119 (Clinical & Action-Oriented)**

* **Tujuan UI:** Berfokus pada penanganan cepat krisis darurat (T0 Red Flag), validasi klinis, dan manajemen rujukan medis.  
* **Layout Main Components:**  
  * **Top Bar:** Header nama Faskes/Unit PSC 119, Indikator Status Koneksi Real-time, dan Counter Alert (Jumlah T0 Pending).  
  * **Panel Kiri (Emergency Queue & Notification List):**  
    * Daftar kartu panggilan darurat (T0-Suspect) yang masuk secara *real-time* via WebSockets.  
    * Kartu T0 berkedip merah (*pulsing alert*) dengan bunyi alarm, menampilkan: Nama Posko, Waktu Input, NIK/Identitas Penyintas, Nama Relawan Pendamping, dan Jenis Red Flag.  
    * Tombol aksi cepat: *"Buka Tele-Emergency"* dan *"Lihat Detail Klinis"*.  
  * **Panel Tengah (Patient Clinical Detail & Validation Workspace):**  
    * Rekam Medis Terintegrasi Penyintas: jawaban SRQ-20, detail faktor risiko, dan skor fungsi harian.  
    * Fitur *Tele-Emergency Modal:* Jendela panggilan suara/video atau obrolan terintegrasi ke PWA relawan untuk verifikasi visual kondisi penyintas.  
    * *Action Button Area* (Tombol Eksekusi Validasi Medis):  
      * Tombol Hijau: *"Konfirmasi Rujukan (T0-Confirmed)"* $\rightarrow$ Mengirim perintah penjemputan ambulans/PSC 119\.  
      * Tombol Kuning: *"Downgrade Status (Ke T1 High Risk / T2 Moderate)"* $\rightarrow$ Jika verifikasi klinis menunjukkan penyintas tidak dalam bahaya nyawa/psikosis akut.  
  * **Panel Kanan (Active Referral & Priority Queue Tracking):**  
    * Pengurutan antrean penanganan medis berdasarkan matriks kegawatan: **T0 $\rightarrow$ T1 $\rightarrow$ T2 $\rightarrow$ T3**.  
    * *Transport Tracking:* Status pengiriman unit ambulans/tim medis mobile ke posko (*Menuju Lokasi $\rightarrow$ Tiba di Posko $\rightarrow$ Transportasi ke RS $\rightarrow$ Selesai*).

### **B. DASHBOARD ROLE 3: ADMIN BPBD / DINKES (Analytical & Geospatial Command Center)**

* **Tujuan UI:** Berfokus pada pemantauan makro, peta sebaran risiko geospasial, statistik wilayah, dan pengawasan longitudinal 30 hari.  
* **Layout Main Components:**  
  * **Top Bar:** Title Command Center BPBD/Dinkes, Global Date/Time Filter (Fase Akut Hari 1–3 vs Lanjutan Hari 4–30), dan Tombol Ekspor Laporan PDF/Excel.  
  * **Area Utama / Center Stage (Interactive Geospatial Heatmap):**  
    * *Map View* (OpenStreetMap/Mapbox via PostGIS) yang menampilkan titik-titik posko pengungsian.  
    * *Visual Markers* (Pin Lokasi Posko) dengan kode warna terintegrasi:  
      * **Merah Kedip:** Posko memiliki kasus T0 (Critical Emergency).  
      * **Merah / Orange:** Posko didominasi penyintas T1 (High Risk / Total Skor $\geq 15$).  
      * **Kuning:** Posko didominasi penyintas T2 (Moderate Risk / Total Skor 7–14).  
      * **Hijau:** Posko dalam kondisi stabil T3 (Low Risk / Total Skor 0–6).  
    * *Pop-up Interaktif:* Klik pada pin posko menampilkan ringkasan: Jumlah Pengungsi, Sebaran T0/T1/T2/T3, dan Jumlah Relawan Aktif.  
  * **Sidebar Kiri (Macro Analytics & Executive Metrics):**  
    * *Stat Cards:* Total Penyintas Terdata, Jumlah Kasus T0, Total T1, Total T2, dan Total T3.  
    * *Pie Chart:* Persentase sebaran tingkat risiko kesehatan mental wilayah.  
    * *Line Graph:* Pemantauan Longitudinal 30 Hari (Tren fluktuasi distres mental masyarakat dari Hari ke-1 hingga Hari ke-30 pascabencana untuk mendeteksi potensi *secondary trauma* atau PTSD kronis).  
  * **Panel Bawah / Drawer (Longitudinal Patient Master Table):**  
    * Tabel Master Data Seluruh Penyintas berbasis NIK/Unique ID.  
    * *Filter & Search:* Filter berdasarkan Nama Posko, Status Risiko (T0–T3), dan Rentang Hari Penanganan.  
    * *History Progress Column:* Sparkline (grafik mini) perkembangan skor trauma penyintas dari waktu ke waktu.  
  * **Panel Right Sidebar (Resource & Volunteer Management):**  
    * Daftar relawan aktif di setiap posko dan fitur alokasi/pemindahan relawan ke posko berdampak tinggi (Zona Merah/Orange).

*Gimana Devs, draf alur & logika sistemnya sudah cukup jelas? Kalau ada struktur database atau endpoint API yang mau didiskusikan, kabari ya\!*

ok

**PANDUAN PROTOKOL EMERGENCY (RED FLAG T0)**  
**​KAPAN HARUS MENEKAN TOMBOL RED FLAG?**

Jika di tengah interaksi PFA Anda mendapati penyintas mengalami salah satu dari kondisi ini:

​​1. Risiko Keamanan Jiwa Spesifik (Suicidal & Self-Harm Behavior)  
​Indikator ini diambil langsung dari item kuesioner terstandarisasi:  

\- ​Ideasi / Ungkapan Ingin Mati (SRQ-20 Item \#17): Adanya pemikiran, niat, atau ungkapan eksplisit/implisit untuk mengakhiri hidup (misal: "Lebih baik saya mati saja", "Saya mau nyusul", "Gak ada gunanya hidup").  

\- ​Perilaku Menyakiti Diri (Non-Suicidal Self-Injury): Adanya tindakan aktif melukai diri sendiri (memukulkan kepala ke dinding, menggores kulit, mencabut rambut secara ekstrem).

​2. Gejala Psikotik Akut Bencana (Acute Disaster Psychosis / Dissociation)  
​Penelitian menunjukkan bahwa trauma berat berpotensi memicu episode disosiasi atau kegagalan realitas:

\- ​Halusinasi visual/auditori: Melihat atau mendengar hal-hal yang tidak nyata (misal: mendengar suara gempa/ombak susulan yang tidak ada, melihat bayangan ancaman).

\- ​Waham / Delusi Paranoid: Keyakinan ekstrem yang tidak realistis bahwa semua orang di posko ingin mencelakainya atau curiga berlebihan tanpa dasar.

\- ​Disosiasi Parah & Mutisme Akut: Penurunan kesadaran lingkungan, kebingungan disorientasi penuh (tidak tahu siapa dirinya/di mana ia berada), atau mematung (catatonia) dan tidak merespons sama sekali.

​3. Perilaku Agitasi & Gangguan Kendali Impuls (Severe Agitation & Aggression)  
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

