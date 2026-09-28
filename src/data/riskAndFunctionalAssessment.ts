import { RiskFactorItem, FunctionalDomain } from '../types/assessment';

/**
 * MODUL ASSESSMENT: FAKTOR RISIKO & KEBERFUNGSIAN (FASE HARI 4–30)
 * Sesuai Dokumen Resmi RAPID-MIND Full Paper
 */

export const RISK_FACTOR_ITEMS: RiskFactorItem[] = [
  {
    id: 'R1',
    code: 'R1',
    title: 'Kehilangan Berat',
    category: 'Duka Cita / Kerugian Materi Akut',
    points: 2,
    description: 'Penyintas kehilangan anggota keluarga inti (meninggal/hilang) ATAU rumah hancur total.',
  },
  {
    id: 'R2',
    code: 'R2',
    title: 'Pengalaman Traumatik Langsung',
    category: 'Ancaman Nyawa Langsung',
    points: 2,
    description: 'Penyintas sempat tertimbun, hanyut, terjebak, atau menyaksikan langsung kematian orang lain saat bencana.',
  },
  {
    id: 'R3',
    code: 'R3',
    title: 'Kelompok Rentan',
    category: 'Kerentanan Biologis/Sosial',
    points: 1,
    description: 'Penyintas adalah Lansia (>60 th), Ibu Hamil/Menyusui, Disabilitas, atau Anak Tanpa Orang Tua.',
  },
  {
    id: 'R4',
    code: 'R4',
    title: 'Riwayat Gangguan Jiwa',
    category: 'Pre-existing Condition',
    points: 2,
    description: 'Sebelum bencana, penyintas pernah berobat rutin ke poli jiwa/Puskesmas atau minum obat penenang/jiwa.',
  },
  {
    id: 'R5',
    code: 'R5',
    title: 'Terputus Obat Kronis',
    category: 'Komorbiditas Medis',
    points: 1,
    description: 'Penyintas memiliki penyakit fisik kronis (Diabetes, Hipertensi, Epilepsi, dll.) dan obatnya habis/hilang.',
  },
];

export const FUNCTIONAL_DOMAINS: FunctionalDomain[] = [
  {
    id: 'F1',
    code: 'F1',
    title: 'Perawatan Diri (Self-Care)',
    question: 'Gimana kemampuan mandi, makan, dan ganti pakaian?',
    options: [
      {
        level: 'green',
        label: 'Mandiri & Bersih',
        points: 0,
        detail: 'Mandiri & bersih tanpa perlu diingatkan',
      },
      {
        level: 'yellow',
        label: 'Lambat / Perlu Diingatkan',
        points: 1,
        detail: 'Lambat / Harus diingatkan / Baju kotor',
      },
      {
        level: 'red',
        label: 'Lumpuh / Tidak Mau Rawat Diri',
        points: 3,
        detail: 'Tidak mau mandi, tidak mau makan, mematung',
      },
    ],
  },
  {
    id: 'F2',
    code: 'F2',
    title: 'Fungsi Peran & Sosial (Social Function)',
    question: 'Gimana interaksi dengan keluarga & tetangga tenda?',
    options: [
      {
        level: 'green',
        label: 'Mau Mengobrol & Mengurus',
        points: 0,
        detail: 'Mau mengobrol & mengurus keluarga/anak',
      },
      {
        level: 'yellow',
        label: 'Mengurung Diri / Jarang Bicara',
        points: 1,
        detail: 'Cenderung mengurung diri / Jarang bicara',
      },
      {
        level: 'red',
        label: 'Isolasi Total / Agresif',
        points: 3,
        detail: 'Mengisolasi diri total / Agresif & marah-marah',
      },
    ],
  },
  {
    id: 'F3',
    code: 'F3',
    title: 'Akses Kebutuhan (Daily Tasks)',
    question: 'Gimana kemampuan mengurus kebutuhan dasar?',
    options: [
      {
        level: 'green',
        label: 'Mampu Mandiri Ambil Bantuan',
        points: 0,
        detail: 'Mampu ambil bantuan/makanan sendiri',
      },
      {
        level: 'yellow',
        label: 'Bingung / Ragu Mengantre',
        points: 1,
        detail: 'Bingung / Kebingungan mengantre bantuan',
      },
      {
        level: 'red',
        label: 'Menelantarkan / Membiarkan Lapar',
        points: 3,
        detail: 'Membiarkan anak/diri sendiri kelaparan',
      },
    ],
  },
];
