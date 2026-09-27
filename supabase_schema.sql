-- ====================================================================
-- RAPID-MIND: Skrip Pembuatan Tabel Database Supabase (PostgreSQL)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- 1. Tabel Master Penyintas (survivors)
CREATE TABLE IF NOT EXISTS public.survivors (
    id TEXT PRIMARY KEY,                             -- Format: RM-2026-000001
    nik TEXT UNIQUE,                                 -- NIK 16 digit (opsional jika belum ada)
    posko_id TEXT,                                   -- ID Gelang posko / kode tenda
    name TEXT NOT NULL,                              -- Nama Lengkap
    age TEXT NOT NULL,                               -- Usia
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')), -- Gender
    category TEXT NOT NULL CHECK (category IN ('Anak', 'Remaja', 'Dewasa', 'Lansia')),
    posko TEXT NOT NULL,                             -- Lokasi Posko (Posko A, B, C, D)
    phone TEXT,                                      -- Kontak darurat / HP
    registered_at TIMESTAMPTZ DEFAULT NOW(),         -- Waktu registrasi
    current_phase TEXT DEFAULT 'acute_pfa',          -- 'acute_pfa' | 'followup_srq20'
    pfa_record JSONB,                                -- Data rekam PFA (Look, Listen, Link)
    srq20_score INT,                                 -- Skor total SRQ-20 (0 - 20)
    triage_tier TEXT DEFAULT 'T3' CHECK (triage_tier IN ('T0', 'T1', 'T2', 'T3')),
    t0_status TEXT,                                  -- 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded'
    notes TEXT,                                      -- Catatan lapangan
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks pencarian cepat untuk Auto-Lookup
CREATE INDEX IF NOT EXISTS idx_survivors_nik ON public.survivors (nik);
CREATE INDEX IF NOT EXISTS idx_survivors_posko_id ON public.survivors (posko_id);
CREATE INDEX IF NOT EXISTS idx_survivors_name ON public.survivors (name);
CREATE INDEX IF NOT EXISTS idx_survivors_posko ON public.survivors (posko);

-- 2. Tabel Rekam Asesmen / Log Triase (assessments)
CREATE TABLE IF NOT EXISTS public.assessments (
    record_id TEXT PRIMARY KEY,                      -- Format: ASM-2026-000001
    victim_id TEXT NOT NULL REFERENCES public.survivors(id) ON DELETE CASCADE,
    nik TEXT,
    timestamp TEXT NOT NULL,                         -- Format HH:mm
    location TEXT NOT NULL,                          -- Posko A, B, C, D
    method TEXT NOT NULL CHECK (method IN ('VERBAL', 'CHECKLIST')),
    phase TEXT DEFAULT 'acute_pfa',                  -- 'acute_pfa' | 'followup_srq20'
    zone TEXT NOT NULL CHECK (zone IN ('GREEN', 'YELLOW', 'RED')),
    triage_tier TEXT DEFAULT 'T3' CHECK (triage_tier IN ('T0', 'T1', 'T2', 'T3')),
    t0_status TEXT,                                  -- 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded'
    score INT DEFAULT 0,
    indicators JSONB DEFAULT '[]'::jsonb,
    critical_triggered BOOLEAN DEFAULT FALSE,
    transcript TEXT,                                 -- Transkrip hasil Speech-to-Text
    checklist_selections JSONB DEFAULT '[]'::jsonb,
    srq20_yes_list JSONB DEFAULT '[]'::jsonb,        -- Daftar nomor butir SRQ-20 bernilai YA
    functional_selections JSONB DEFAULT '[]'::jsonb,
    recommended_action TEXT,
    sync_status TEXT DEFAULT 'synced',
    volunteer_notes TEXT,
    volunteer_id TEXT,
    victim_name TEXT,
    victim_age TEXT,
    victim_gender CHAR(1),
    victim_category TEXT,
    hospital_referral_status TEXT,                   -- 'pending' | 'in_transit' | 'admitted' | 'discharged'
    hospital_notes TEXT,
    hospital_bed TEXT,
    tele_emergency_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks riwayat longitudinal asesmen
CREATE INDEX IF NOT EXISTS idx_assessments_victim_id ON public.assessments (victim_id);
CREATE INDEX IF NOT EXISTS idx_assessments_zone ON public.assessments (zone);
CREATE INDEX IF NOT EXISTS idx_assessments_tier ON public.assessments (triage_tier);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments (created_at DESC);

-- 3. Aktifkan Row Level Security (RLS) & Kebijakan Akses Anonim (Publik)
ALTER TABLE public.survivors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Survivors (Read/Write untuk Anon Key)
CREATE POLICY "Allow public read access on survivors" 
ON public.survivors FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on survivors" 
ON public.survivors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on survivors" 
ON public.survivors FOR UPDATE USING (true);

-- Kebijakan Akses Assessments (Read/Write untuk Anon Key)
CREATE POLICY "Allow public read access on assessments" 
ON public.assessments FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on assessments" 
ON public.assessments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on assessments" 
ON public.assessments FOR UPDATE USING (true);
