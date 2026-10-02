export interface PFACheckItem {
  id: string;
  label: string;
  subtext?: string;
  isUrgent?: boolean;
}

export const PFA_PRINCIPLE =
  'Prinsip Utama: Hadir Utuh, Dengarkan, Jangan Menghakimi, dan Berikan Rasa Aman.';

/**
 * 👁️ TAHAP 1: LOOK (AMATI)
 * Lakukan pemindaian visual singkat selama 10–15 detik sebelum mendekati penyintas.
 */
export const PFA_LOOK_ITEMS: PFACheckItem[] = [
  {
    id: 'look_safety_environment',
    label: 'Keamanan Lingkungan Posko',
    subtext: 'Area sekitar aman dari bahaya fisik susulan (reruntuhan, cuaca ekstrem, jalanan licin).',
  },
  {
    id: 'look_physical_injury',
    label: 'Luka Fisik / Cedera Berat',
    subtext: 'Perhatikan apakah penyintas mengalami luka berdarah atau cedera berat.',
    isUrgent: true,
  },
  {
    id: 'look_shock_mutism',
    label: 'Reaksi Shock / Mutisme',
    subtext: 'Tatapan mata kosong, mematung, atau tidak merespons saat disapa.',
    isUrgent: true,
  },
  {
    id: 'look_hysteria',
    label: 'Reaksi Histeria / Hiperventilasi',
    subtext: 'Menangis tanpa henti, gemetar hebat, atau napas sangat cepat (hyperventilation).',
    isUrgent: true,
  },
  {
    id: 'look_agitation',
    label: 'Reaksi Agitasi / Amuk',
    subtext: 'Ngamuk, berteriak-teriak, atau berperilaku membahayakan diri/orang lain.',
    isUrgent: true,
  },
];

export const PFA_VOLUNTEER_LOOK_TIP =
  'Jika Anda melihat tanda distres di atas, dekati secara perlahan. Gunakan suara yang lembut dan tenang.';

/**
 * 👂 TAHAP 2: LISTEN (DENGARKAN)
 * Fokus utama: Menenangkan dan memfasilitasi emosi penyintas.
 */
export const PFA_LISTEN_GREETING_SCRIPT =
  'Halo Ibu/Bapak, kenalkan saya [Nama], relawan pendamping di posko ini. Saya di sini untuk menemani Ibu/Bapak. Ada yang bisa saya bantu atau temani saat ini?';

export const PFA_DOS_AND_DONTS = {
  dos: [
    'Duduk sejajar (posisi mata sama tinggi dengan penyintas).',
    'Berikan kontak mata yang hangat dan anggukan kepala tanda Anda mendengarkan.',
    'Sediakan air minum atau tisu jika penyintas menangis.',
  ],
  donts: [
    'JANGAN memaksa penyintas menceritakan kronologi kejadian bencana.',
    'JANGAN memberi janji palsu (Contoh salah: "Sabar ya, rumahnya pasti nanti diganti kok").',
    'JANGAN memotong pembicaraan atau membandingkan musibah mereka dengan orang lain.',
  ],
};

export const PFA_GROUNDING_STEPS = {
  title: 'Teknik Grounding 5-4-3-2-1 (Gunakan Jika Penyintas Panik/Cemas)',
  intro: 'Ajak penyintas melakukan latihan fokus fisik singkat berikut untuk mengembalikan kesadarannya:',
  steps: [
    { title: 'Napas', script: 'Ayo tarik napas pelan-pelan bersama saya... Tahan... Hembuskan...' },
    { title: 'Lihat', script: 'Sebutkan 3 benda yang ada di sekitar Ibu/Bapak saat ini.' },
    { title: 'Sentuh', script: 'Rasakan pijakan kedua kaki Ibu/Bapak di tanah dan pegang gelas air ini.' },
  ],
};

/**
 * 🔗 TAHAP 3: LINK (HUBUNGKAN)
 * Bantu penyintas menemukan kembali rasa kendali atas kebutuhan dasarnya.
 */
export const PFA_LINK_LOGISTICS_ITEMS: PFACheckItem[] = [
  {
    id: 'link_water_food',
    label: 'Air Minum & Makanan Siap Saji',
    subtext: 'Pemenuhan hidrasi dan makanan hangat paling mendesak detik ini.',
  },
  {
    id: 'link_blanket_clothes',
    label: 'Selimut Hangat & Pakaian Kering',
    subtext: 'Perlindungan dari kedinginan atau pakaian basah/kotor.',
  },
  {
    id: 'link_medication',
    label: 'Obat-obatan Pribadi Hilang / Tercecer',
    subtext: 'Identifikasi kebutuhan obat rutin (hipertensi, diabetes, asma, dll).',
  },
  {
    id: 'link_baby_elderly',
    label: 'Popok / Perlengkapan Bayi & Lansia',
    subtext: 'Kebutuhan khusus untuk kelompok paling rentan.',
  },
];

export const PFA_LINK_SOCIAL_SCRIPT =
  'Apakah ada anggota keluarga inti atau kerabat dekat yang ingin Ibu/Bapak hubungi saat ini? (Bantu sambungkan ke Posko Informasi / Pencarian Orang Hilang jika terpisah dari keluarga).';

export const PFA_CLOSING_SCRIPT =
  'Merasa sedih, cemas, atau bingung setelah kejadian ini adalah hal yang sangat wajar, Bu/Pak. Ibu/Bapak tidak sendiri. Saya dan tim relawan ada di sekitar posko ini jika Ibu/Bapak membutuhkan bantuan lagi ya.';
