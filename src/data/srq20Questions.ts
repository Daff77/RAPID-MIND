import { SRQ20Question } from '../types/assessment';

export const SRQ20_QUESTIONS: SRQ20Question[] = [
  {
    id: 1,
    text: 'Apakah Anda sering menderita sakit kepala?',
    category: 'somatic',
    volunteerInstruction:
      'Pastikan sakit kepala bukan karena benturan/luka fisik langsung saat gempa/bencana, melainkan ketegangan psikologis yang berulang.',
    keywords: ['sakit kepala', 'pusing', 'kepala berdenyut', 'migrain', 'kepala tegang', 'headache'],
  },
  {
    id: 2,
    text: 'Apakah nafsu makan Anda buruk / tidak bernafsu makan?',
    category: 'somatic',
    volunteerInstruction:
      'Tanyakan apakah makanan terasa hambar atau sulit menelan makanan meskipun makanan posko tersedia.',
    keywords: ['tidak nafsu makan', 'sulit makan', 'hilang selera', 'mual makan', 'tidak mau makan', 'no appetite'],
  },
  {
    id: 3,
    text: 'Apakah tidur Anda tidak nyenyak atau sulit tidur?',
    category: 'somatic',
    volunteerInstruction:
      'Gali apakah korban sering terbangun tengah malam dengan perasaan panik, mimpi buruk tentang bencana, atau sulit memejamkan mata.',
    keywords: ['sulit tidur', 'tidak nyenyak', 'insomnia', 'terbangun malam', 'mimpi buruk', 'susah tidur', 'cant sleep'],
  },
  {
    id: 4,
    text: 'Apakah Anda mudah merasa takut atau kaget?',
    category: 'anxiety',
    volunteerInstruction:
      'Perhatikan respon terhadap suara gemuruh, getaran kecil, atau sirine di sekitar posko pengungsian.',
    keywords: ['takut', 'mudah kaget', 'was-was', 'takut susulan', 'scared', 'afraid', 'frightened'],
  },
  {
    id: 5,
    text: 'Apakah Anda merasa cemas, tegang, atau khawatir berlebihan?',
    category: 'anxiety',
    volunteerInstruction:
      'Jelaskan bahwa rasa tegang terus-menerus di dada, leher, atau pikiran tidak tenang adalah reaksi distres.',
    keywords: ['cemas', 'tegang', 'khawatir', 'gelisah', 'tidak tenang', 'anxiety', 'anxious', 'worry'],
  },
  {
    id: 6,
    text: 'Apakah tangan Anda sering gemetar?',
    category: 'somatic',
    volunteerInstruction:
      'Observasi langsung apakah ada tremor halus pada jari tangan atau lutut saat relawan mengajak berinteraksi.',
    keywords: ['tangan gemetar', 'gemetaran', 'tremor', 'menggigil panik', 'shaking'],
  },
  {
    id: 7,
    text: 'Apakah pencernaan Anda terganggu atau sering mulas?',
    category: 'somatic',
    volunteerInstruction:
      'Tanyakan keluhan lambung/perut mual akibat kecemasan, bukan karena keracunan makanan posko.',
    keywords: ['sakit perut', 'mual', 'maag', 'pencernaan terganggu', 'kembung cemas', 'stomach upset'],
  },
  {
    id: 8,
    text: 'Apakah Anda sulit berpikir jernih atau linglung?',
    category: 'cognitive',
    volunteerInstruction:
      'Observasi apakah penyintas kesulitan merespons pertanyaan sederhana atau tampak bingung menentukan keputusan mendasar.',
    keywords: ['sulit berpikir', 'linglung', 'otak kosong', 'bingung', 'pusing mikir', 'confused'],
  },
  {
    id: 9,
    text: 'Apakah Anda merasa tidak bahagia atau sedih mendalam?',
    category: 'depressive',
    volunteerInstruction:
      'Validasi kesedihan mendalam akibat kehilangan keluarga/rumah tanpa menghakimi atau terburu-buru menghibur.',
    keywords: ['tidak bahagia', 'sedih mendalam', 'hampa', 'merana', 'duka', 'sad', 'unhappy'],
  },
  {
    id: 10,
    text: 'Apakah Anda menangis lebih sering dari biasanya?',
    category: 'depressive',
    volunteerInstruction:
      'Tanyakan apakah air mata mengalir tiba-tiba tanpa terkendali saat mengingat peristiwa bencana.',
    keywords: ['menangis terus', 'nangis', 'air mata', 'histeris', 'crying', 'tears'],
  },
  {
    id: 11,
    text: 'Apakah Anda merasa sulit menikmati aktivitas harian?',
    category: 'depressive',
    volunteerInstruction:
      'Tanyakan apakah hal-hal yang biasanya disukai (berbincang dengan tetangga, merawat anak) kini terasa tanpa rasa.',
    keywords: ['sulit menikmati', 'tidak senang apa-apa', 'mati rasa', 'datar', 'anhedonia'],
  },
  {
    id: 12,
    text: 'Apakah Anda merasa kesulitan dalam mengambil keputusan?',
    category: 'cognitive',
    volunteerInstruction:
      'Penyintas ragu-ragu bahkan untuk keputusan sehari-hari yang sangat kecil seperti memilih pakaian atau makan.',
    keywords: ['sulit mengambil keputusan', 'bimbang parah', 'tidak bisa milih', 'ragu-ragu'],
  },
  {
    id: 13,
    text: 'Apakah pekerjaan atau aktivitas harian Anda terganggu?',
    category: 'energy',
    volunteerInstruction:
      'Tanyakan apakah penyintas tidak mampu berpartisipasi dalam kegiatan keluarga atau gotong royong posko.',
    keywords: ['pekerjaan terganggu', 'tidak bisa bekerja', 'terbengkalai', 'lumpuh aktivitas'],
  },
  {
    id: 14,
    text: 'Apakah Anda merasa tidak mampu berperan berguna lagi dalam hidup?',
    category: 'depressive',
    volunteerInstruction:
      'Dengarkan apakah ada ungkapan rasa putus asa bahwa masa depan sudah hancur total.',
    keywords: ['tidak berguna', 'tidak mampu', 'beban orang lain', 'merasa sia-sia', 'useless'],
  },
  {
    id: 15,
    text: 'Apakah Anda kehilangan minat pada berbagai hal?',
    category: 'depressive',
    volunteerInstruction:
      'Tanyakan apakah penyintas menarik diri dan memilih mengisolasi diri di sudut tenda pengungsian.',
    keywords: ['kehilangan minat', 'tidak peduli lagi', 'apatis', 'acuh tak acuh', 'lost interest'],
  },
  {
    id: 16,
    text: 'Apakah Anda merasa diri Anda tidak berharga?',
    category: 'depressive',
    volunteerInstruction:
      'Perhatikan perasaan bersalah penyintas (survivor guilt) karena selamat sementara yang lain tidak.',
    keywords: ['tidak berharga', 'merasa bersalah', 'merasa hina', 'worthless'],
  },
  {
    id: 17,
    text: 'Apakah Anda pernah mempunyai pikiran untuk mengakhiri hidup?',
    category: 'safety',
    volunteerInstruction:
      '🚨 PERINGATAN KRITIS: Jika korban menjawab YA, sistem OTOMATIS memicu protokol RED FLAG (T0 Emergency). Lakukan pendampingan tanpa jeda!',
    keywords: ['bunuh diri', 'mengakhiri hidup', 'mati saja', 'ingin mati', 'tidak ingin hidup lagi', 'suicide', 'kill myself'],
    isRedFlag: true,
  },
  {
    id: 18,
    text: 'Apakah Anda merasa lelah sepanjang waktu?',
    category: 'energy',
    volunteerInstruction:
      'Tanyakan kelelahan fisik dan mental yang tidak pulih meski sudah berbaring atau istirahat di tenda.',
    keywords: ['lelah sepanjang waktu', 'letih', 'tidak ada tenaga', 'badan lemas', 'exhausted', 'tired'],
  },
  {
    id: 19,
    text: 'Apakah Anda merasakan ketidaknyamanan di daerah lambung/perut?',
    category: 'somatic',
    volunteerInstruction:
      'Sensasi lambung tertekan, kram perut mendadak saat mendengar kabar atau getaran gempa.',
    keywords: ['perut perih', 'lambung sakit', 'kram perut', 'perut tidak nyaman'],
  },
  {
    id: 20,
    text: 'Apakah Anda merasa mudah lelah dalam melakukan aktivitas ringan?',
    category: 'energy',
    volunteerInstruction:
      'Melangkah beberapa meter ke dapur umum atau toilet posko saja terasa sangat berat dan menguras tenaga.',
    keywords: ['mudah lelah', 'baru jalan sebentar sudah capek', 'tenaga habis', 'fatigue'],
  },
];
