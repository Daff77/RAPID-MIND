export interface PFACheckItem {
  id: string;
  label: string;
  subtext?: string;
  isUrgent?: boolean;
}

export const PFA_LOOK_ITEMS: PFACheckItem[] = [
  {
    id: 'look_safety',
    label: 'Keamanan Lingkungan Posko',
    subtext: 'Penyintas berada di area yang aman dari reruntuhan, tanah longsor, atau bahaya fisik lain.',
  },
  {
    id: 'look_physical_injury',
    label: 'Cedera Fisik yang Memerlukan Medis Darurat',
    subtext: 'Periksa adanya perdarahan, patah tulang, atau luka bakar yang butuh penanganan tenaga medis segera.',
    isUrgent: true,
  },
  {
    id: 'look_severe_distress',
    label: 'Tanda Distres Ekstrem / Pembekuan Emosi (Shock)',
    subtext: 'Penyintas tampak menatap kosong (mutisme), tidak merespons panggilan, atau gemetar hebat tak terkendali.',
    isUrgent: true,
  },
  {
    id: 'look_children_elderly',
    label: 'Kelompok Rentan (Anak / Lansia / Ibu Hamil)',
    subtext: 'Perhatikan anak tanpa pendamping orang tua atau lansia yang terpisah dari keluarga inti.',
  },
];

export const PFA_LISTEN_GUIDELINES = [
  {
    title: 'Sapa & Perkenalkan Diri',
    instruction: 'Ucapkan salam dengan nada tenang: "Halo Bapak/Ibu, saya [Nama] relawan psikososial di sini. Saya hadir untuk menemani Anda."',
  },
  {
    title: 'Dengarkan Tanpa Memaksa',
    instruction: 'Jangan menanyakan detail kronologi saat rumah roboh. Cukup tanyakan: "Apa yang paling Anda butuhkan dan rasakan saat ini?"',
  },
  {
    title: 'Validasi Emosi',
    instruction: 'Katakan bahwa rasa sedih, syok, bingung, atau takut adalah reaksi yang sangat wajar terhadap peristiwa luar biasa ini.',
  },
  {
    title: 'Teknik Grounding / Penenangan (Jika Panik/Sesak)',
    instruction: 'Ajak tarik napas dalam: Tarik napas 4 detik, tahan 4 detik, hembuskan perlahan 6 detik. Minta sebutkan 3 benda yang dilihat di tenda.',
  },
];

export const PFA_LINK_ITEMS: PFACheckItem[] = [
  {
    id: 'link_food_water',
    label: 'Kebutuhan Pangan & Air Bersih',
    subtext: 'Menghubungkan dengan dapur umum posko dan distribusi air minum bersih.',
  },
  {
    id: 'link_shelter_blanket',
    label: 'Tempat Bernaung & Selimut Hangat',
    subtext: 'Memastikan korban memiliki tempat tidur terlindung dari hujan, alas tidur, dan selimut.',
  },
  {
    id: 'link_family_search',
    label: 'Reunifikasi / Pencarian Kontak Keluarga',
    subtext: 'Membantu menghubungi keluarga via telepon/WhatsApp relawan atau posko pencarian orang hilang.',
  },
  {
    id: 'link_health_post',
    label: 'Layanan Medis Posko / Obat Rutin',
    subtext: 'Menghubungkan ke pos kesehatan terdekat jika memiliki riwayat hipertensi, diabetes, atau asma.',
  },
  {
    id: 'link_factual_info',
    label: 'Informasi Resmi & Menangkal Hoaks',
    subtext: 'Memberikan informasi resmi BMKG/BPBD agar penyintas tidak termakan kabar bohong tentang gempa susulan.',
  },
];

export const FUNCTIONAL_IMPAIRMENT_ITEMS = [
  { id: 'func_sleep', label: 'Terganggu tidur berat (kurang dari 3 jam atau mimpi buruk terus-menerus)' },
  { id: 'func_eating', label: 'Penurunan asupan makan/minum drastis selama > 48 jam' },
  { id: 'func_selfcare', label: 'Tidak mampu merawat kebersihan diri dasar tanpa bantuan penuh orang lain' },
  { id: 'func_social', label: 'Menarik diri total / menolak kontak dengan keluarga dan warga posko' },
  { id: 'func_agitation', label: 'Ledakan amarah tak terkendali atau histeria saat dipicu suara sekitar' },
];
