import { SRQ20Question } from '../types/assessment';

/**
 * Pesan Pembuka Relawan (Script Onboarding)
 * Sesuai Dokumen Panduan Wawancara SRQ-20 Untuk Relawan (Hari 4–30)
 */
export const SRQ20_ONBOARDING_SCRIPT =
  'Halo Ibu/Bapak, saya mau bincang-bincang santai sebentar untuk menanyakan kabar, kondisi fisik, dan perasaan Ibu/Bapak selama beberapa hari di pengungsian ini. Tidak ada jawaban benar atau salah, jawab sesuai yang dirasakan saja ya.';

export const SRQ20_QUESTIONS: SRQ20Question[] = [
  {
    id: 1,
    text: 'Apakah Sdr sering sakit kepala?',
    category: 'somatic',
    scriptQuestion: 'Selama di posko ini, kepala Ibu/Bapak sering terasa berat, cekot-cekot, atau pusing berulang nggak?',
    volunteerInstruction:
      'Pastikan pusing bukan karena kurang minum atau terik matahari saja, melainkan pusing tegang yang terus muncul akibat pikiran tertekan.',
    keywords: ['pusing', 'sakit kepala', 'cekot-cekot', 'kepala berat'],
  },
  {
    id: 2,
    text: 'Apakah nafsu makan Sdr menurun?',
    category: 'somatic',
    scriptQuestion: 'Gimana dengan makanan di posko? Apakah merasa makanan sama sekali gak enak atau rasanya males banget buat makan?',
    volunteerInstruction:
      'Centang "Ya" jika penyintas menyisakan sebagian besar porsi makan bukan karena makanan tidak cocok, melainkan karena memang kehilangan selera makan.',
    keywords: ['gak nafsu makan', 'males makan', 'makanan gak masuk', 'gak selera', 'tidak nafsu makan'],
  },
  {
    id: 3,
    text: 'Apakah Sdr tidak bisa tidur nyenyak?',
    category: 'somatic',
    scriptQuestion: 'Malam-malam kalau mau tidur susah nggak? Atau sering kebangun terus gak bisa tidur lagi?',
    volunteerInstruction:
      'Bedakan antara tidak bisa tidur karena tempatnya berisik/panas dengan tidak bisa tidur karena pikiran berputar atau cemas.',
    keywords: ['gak bisa tidur', 'insomnia', 'melek terus', 'kebangun-bangun', 'sulit tidur', 'tidak nyenyak'],
  },
  {
    id: 4,
    text: 'Apakah Sdr mudah merasa takut?',
    category: 'anxiety',
    scriptQuestion: 'Belakangan ini, apakah Ibu/Bapak gampang kaget atau merasa was-was/takut tiba-tiba padahal situasi lagi aman?',
    volunteerInstruction:
      'Amati respon refleks penyintas terhadap suara keras mendadak di posko (misal: suara helikopter, sirine, atau barang jatuh).',
    keywords: ['takut', 'was-was', 'gampang kaget', 'kawatir', 'khawatir', 'mudah kaget'],
  },
  {
    id: 5,
    text: 'Apakah tangan Sdr gemetar?',
    category: 'somatic',
    scriptQuestion: 'Apakah tangan atau jari-jari Ibu/Bapak sering terasa gemetar sendiri pas lagi duduk atau ngobrol?',
    volunteerInstruction:
      'Dapat diisi via observasi langsung. Perhatikan apakah jari/tangan penyintas tampak tremor (gemetar) saat memegang gelas, memegang HP, atau saat diajak bicara.',
    keywords: ['gemetar', 'dég-dégan', 'deg-degan', 'tremor', 'tangan gemeter', 'gemetaran'],
  },
  {
    id: 6,
    text: 'Apakah Sdr merasa cemas, tegang, atau khawatir?',
    category: 'anxiety',
    scriptQuestion: 'Dada rasanya sering debar-debar, tegang, atau ganjel karena kepikiran terus nggak?',
    volunteerInstruction:
      'Kata "ganjel di dada" atau "deg-degan" adalah bahasa awam yang paling sering menggambarkan kondisi cemas.',
    keywords: ['cemas', 'tegang', 'dada sesek', 'deg-degan', 'gelisah', 'khawatir'],
  },
  {
    id: 7,
    text: 'Apakah pencernaan Sdr buruk?',
    category: 'somatic',
    scriptQuestion: 'Perutnya sering terasa mual, melilit, atau bolak-balik diare tanpa sebab yang jelas nggak?',
    volunteerInstruction:
      'Tanyakan apakah keluhan pencernaan ini timbul terutama saat rasa cemas atau ingatan bencana muncul (reaksi psikosomatik).',
    keywords: ['mual', 'diare', 'pencernaan ganggu', 'perut melilit', 'sakit perut', 'mulas'],
  },
  {
    id: 8,
    text: 'Apakah Sdr mengalami kesulitan untuk berpikir jernih?',
    category: 'cognitive',
    scriptQuestion: 'Rasanya kepalanya kayak penuh banget atau "linglung", sampai susah konsentrasi pas diajak ngobrol?',
    volunteerInstruction:
      'Perhatikan apakah penyintas sering melamun, tampak bingung, atau meminta pertanyaan diulang berintegrasi dengan gejala kognitif.',
    keywords: ['linglung', 'bingung', 'gak fokus', 'pikirannya kosong', 'sulit berpikir', 'tidak fokus'],
  },
  {
    id: 9,
    text: 'Apakah Sdr merasa tidak bahagia?',
    category: 'depressive',
    scriptQuestion: 'Secara umum, rasanya sedih dan hampa banget ya perasaan Ibu/Bapak belakangan ini?',
    volunteerInstruction: 'Amati nada suara yang lesu dan ekspresi wajah penyintas saat menjawab.',
    keywords: ['sedih', 'hampa', 'gak bahagia', 'merana', 'tidak bahagia', 'duka'],
  },
  {
    id: 10,
    text: 'Apakah Sdr lebih sering menangis dari biasanya?',
    category: 'depressive',
    scriptQuestion: 'Apakah belakangan ini rasanya pengen menangis terus, atau mendadak nangis tanpa bisa ditahan?',
    volunteerInstruction: 'Validasi emosi penyintas. Jangan melarang mereka menangis saat wawancara berlangsung.',
    keywords: ['nangis terus', 'pengen nangis', 'menangis', 'mewek', 'sering menangis'],
  },
  {
    id: 11,
    text: 'Apakah Sdr sulit menikmati kegiatan sehari-hari?',
    category: 'depressive',
    scriptQuestion: 'Hal-hal yang biasanya bikin senang (kayak ngobrol sama tetangga, nonton, atau main sama anak), sekarang rasanya udah gak menarik lagi nggak?',
    volunteerInstruction: 'Amati apakah penyintas cenderung mengisolasi diri di sudut posko dan enggan bersosialisasi.',
    keywords: ['gak seru lagi', 'males ngapa-ngapain', 'gak hobi lagi', 'sulit menikmati', 'tidak tertarik'],
  },
  {
    id: 12,
    text: 'Apakah Sdr merasa kesulitan untuk mengambil keputusan?',
    category: 'cognitive',
    scriptQuestion: 'Buat milih atau memutuskan hal sepele aja (misal: mau makan apa, mau mandi jam berapa), rasanya bingung dan berat banget nggak?',
    volunteerInstruction: 'Fokus pada keraguan berlebih untuk melakukan tindakan atau pilihan sederhana sehari-hari.',
    keywords: ['bingung milih', 'gak bisa mutusin', 'ragu-ragu terus', 'sulit mengambil keputusan'],
  },
  {
    id: 13,
    text: 'Apakah hasil kerja sehari-hari Sdr memburuk?',
    category: 'energy',
    scriptQuestion: 'Apakah tugas sehari-hari di posko terasa lambat banget selesainya atau sering terbengkalai?',
    volunteerInstruction: 'Nilai keberfungsian dasar penyintas dalam menjaga kebersihan diri, merawat anak, atau merapikan tenda.',
    keywords: ['gak keurus', 'tugas terbengkalai', 'lambat ngerjainnya', 'aktivitas terbengkalai', 'hasil kerja buruk'],
  },
  {
    id: 14,
    text: 'Apakah Sdr merasa tidak bisa melakukan hal yang bermanfaat dalam hidup?',
    category: 'depressive',
    scriptQuestion: 'Apakah Ibu/Bapak merasa belakangan ini gak bisa berbuat apa-apa dan cuma bikin repot orang lain aja?',
    volunteerInstruction: 'Dengarkan ungkapan keputusasaan atau rasa bersalah (survivor\'s guilt) atas bencana yang terjadi.',
    keywords: ['gak berguna', 'nyusahin orang', 'gak ada gunanya', 'tidak bermanfaat', 'beban'],
  },
  {
    id: 15,
    text: 'Apakah Sdr kehilangan minat untuk melakukan berbagai macam hal?',
    category: 'depressive',
    scriptQuestion: 'Apakah rasanya udah kehilangan semangat total buat ngelakuin kegiatan apa pun hari ini?',
    volunteerInstruction: 'Bedakan dengan nomor 11; nomor 15 lebih berfokus pada kehilangan dorongan energi/inisiatif (apati).',
    keywords: ['hilang minat', 'males semua', 'gak ada semangat', 'kehilangan minat', 'apatis'],
  },
  {
    id: 16,
    text: 'Apakah Sdr merasa sebagai orang yang tidak berharga?',
    category: 'depressive',
    scriptQuestion: 'Pernah merasa kalau keberadaan Ibu/Bapak ini udah gak ada harganya atau merasa diri ini gagal?',
    volunteerInstruction: 'Perhatikan tanda-tanda devaluasi diri yang mendalam (low self-esteem).',
    keywords: ['gak berharga', 'diri saya gagal', 'gak ada artinya', 'tidak berharga', 'merasa gagal'],
  },
  {
    id: 17,
    text: 'Apakah Sdr memiliki pemikiran untuk mengakhiri hidup?',
    category: 'safety',
    scriptQuestion: 'Dalam kondisi seberat ini, pernah nggak terlintas di pikiran Ibu/Bapak perasaan pengen nyerah aja, atau pikiran buat ngakhiri hidup?',
    volunteerInstruction:
      '🚨 CRITICAL SAFETY GATE TRIGGER: Jika Penyintas menjawab "YA" atau menyebut kata kunci, SISTEM OTOMATIS MEMICU STATUS RED FLAG (T0-SUSPECT) tanpa memedulikan skor pertanyaan lainnya! Relawan diinstruksikan tetap mendampingi penyintas secara fisik sementara sinyal dikirim ke Faskes/PSC 119.',
    keywords: ['mati', 'bunuh diri', 'nyerah', 'nyusul', 'diakhirin aja', 'gak mau hidup', 'mengakhiri hidup', 'ingin mati'],
    isRedFlag: true,
  },
  {
    id: 18,
    text: 'Apakah Sdr merasa lelah sepanjang waktu?',
    category: 'energy',
    scriptQuestion: 'Badan dan pikiran rasanya lemes dan capek banget nggak sepanjang hari, padahal gak lagi kerja berat?',
    volunteerInstruction: 'Fokus pada rasa lelah emosional/fisik yang menetap (fatigue) meski sudah beristirahat.',
    keywords: ['lelah terus', 'capek banget', 'badan lemes', 'lelah sepanjang waktu', 'letih'],
  },
  {
    id: 19,
    text: 'Apakah Sdr merasakan perasaan tidak nyaman di perut?',
    category: 'somatic',
    scriptQuestion: 'Apakah perut sering terasa ganjel, perih di ulu hati, atau kayak ada rasa kebat/melilit yang bikin gak nyaman?',
    volunteerInstruction: 'Melengkapi pertanyaan nomor 7, fokus pada rasa tidak nyaman fisik umum di area abdomen akibat stres.',
    keywords: ['ulu hati sakit', 'perut gak enak', 'perih perut', 'tidak nyaman di perut', 'perut perih'],
  },
  {
    id: 20,
    text: 'Apakah Sdr mudah merasa lelah?',
    category: 'energy',
    scriptQuestion: 'Baru gerak atau ngerjain hal kecil sebentar aja, rasanya langsung kehabisan tenaga dan capek banget nggak?',
    volunteerInstruction: 'Menilai penurunan daya tahan fisik akibat beban psikologis.',
    keywords: ['gampang capek', 'cepet lelah', 'tenaga habis', 'mudah lelah', 'cepat lelah'],
  },
];
