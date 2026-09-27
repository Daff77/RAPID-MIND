import { SurvivorProfile } from '../types/assessment';

export const INITIAL_MOCK_SURVIVORS: SurvivorProfile[] = [
  {
    nik: '3501234567890001',
    id: 'VCT-001',
    name: 'Dewi Sartika, S.Pd',
    age: 34,
    gender: 'P',
    category: 'Dewasa',
    posko: 'Posko A',
    phone: '+62 812-9988-7711',
    registeredAt: '2026-09-24 09:30',
    currentPhase: 'followup_srq20',
    triageTier: 'T2',
    notes: 'Mengalami kecemasan dan insomnia pasca gempa susulan.',
    pfaRecord: {
      completedAt: '2026-09-24 10:15 (Hari ke-2)',
      lookItems: ['Keamanan terjamin di Tenda 3', 'Kelompok rentan (Ibu dengan 1 balita)'],
      listenNotes: 'Menangis saat menceritakan rumahnya retak. Telah diajarkan teknik grounding 5-4-3-2-1 dan sudah mulai tenang.',
      groundingUsed: true,
      linkItems: ['Distribusi susu balita dapur umum', 'Hubungan telepon dengan suami di Surabaya berhasil terhubung'],
    },
    srq20Score: 7,
  },
  {
    nik: '3501234567890002',
    id: 'VCT-002',
    name: 'Bpk. Bambang Supeno',
    age: 52,
    gender: 'L',
    category: 'Dewasa',
    posko: 'Posko B',
    phone: '+62 813-2233-4455',
    registeredAt: '2026-09-23 14:20',
    currentPhase: 'followup_srq20',
    triageTier: 'T1',
    notes: 'Kehilangan seluruh warung usaha dan barang dagangan.',
    pfaRecord: {
      completedAt: '2026-09-23 15:00 (Hari ke-1)',
      lookItems: ['Tampak linglung di dekat puing ruko', 'Luka lecet pada lengan kanan'],
      listenNotes: 'Menolak diajak bicara awalnya. Setelah diberi air hangat, mengungkapkan rasa tidak berdaya yang berat.',
      groundingUsed: true,
      linkItems: ['Obat hipertensi rutin dari puskesmas keliling', 'Tenda keluarga Blok B'],
    },
    srq20Score: 12,
  },
  {
    nik: '3501234567890003',
    id: 'VCT-003',
    name: 'Ananda Dimas Pratama',
    age: 10,
    gender: 'L',
    category: 'Anak',
    posko: 'Posko A',
    registeredAt: '2026-09-25 11:00',
    currentPhase: 'acute_pfa',
    triageTier: 'T3',
    notes: 'Bersama nenek di posko ramah anak.',
    pfaRecord: {
      completedAt: '2026-09-25 11:30 (Hari ke-3)',
      lookItems: ['Tampak bermain balok dengan anak lain', 'Kondisi fisik sehat'],
      listenNotes: 'Sempat takut saat mendengar suara helikopter BNPB. Setelah ditemani menggambar, anak merasa aman kembali.',
      groundingUsed: false,
      linkItems: ['Kebutuhan perlengkapan menggambar di Ruang Sahabat Anak'],
    },
  },
];

const STORAGE_KEY_SURVIVORS = 'rapidmind_survivor_registry_v1';

export function getStoredSurvivors(): SurvivorProfile[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_SURVIVORS;
  const raw = localStorage.getItem(STORAGE_KEY_SURVIVORS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(INITIAL_MOCK_SURVIVORS));
    return INITIAL_MOCK_SURVIVORS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_SURVIVORS;
  }
}

export function saveSurvivorToRegistry(survivor: SurvivorProfile): SurvivorProfile[] {
  const current = getStoredSurvivors();
  const existingIndex = current.findIndex(
    (s) => s.nik === survivor.nik || s.id === survivor.id
  );

  let updated: SurvivorProfile[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...updated[existingIndex], ...survivor };
  } else {
    updated = [survivor, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SURVIVORS, JSON.stringify(updated));
  }
  return updated;
}

export function findSurvivorByQuery(query: string): SurvivorProfile | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const list = getStoredSurvivors();
  return (
    list.find(
      (s) =>
        s.nik.toLowerCase() === q ||
        s.id.toLowerCase() === q ||
        s.name.toLowerCase().includes(q)
    ) || null
  );
}
