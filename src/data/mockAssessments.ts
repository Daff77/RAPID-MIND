import { AssessmentRecord, LocationPost, TriageZone, AssessmentMethod } from '../types/assessment';

const INDONESIAN_FIRST_NAMES = [
  'Bambang', 'Siti', 'Agus', 'Dewi', 'Rudi', 'Nur', 'Hadi', 'Sri', 'Eko', 'Fitri',
  'Andi', 'Mega', 'Reza', 'Indah', 'Dian', 'Wahyu', 'Putri', 'Fajar', 'Ratna', 'Teguh'
];

const TRANSCRIPTS_GREEN = [
  "Saya merasa lelah dan pusing, tapi sekarang sudah di posko bersama keluarga. Air bersih cukup.",
  "Kondisi kami saat ini relatif aman, anak-anak sudah tenang setelah diberi selimut hangat.",
  "Kami sempat kaget saat gempa susulan, tapi tidak ada cedera fisik dan tetangga saling membantu.",
  "Sempat gemetar waktu evakuasi, sekarang alhamdulillah sudah bisa beristirahat di tenda.",
  "I feel tired and a bit overwhelmed, but I am resting and my neighbor is here with me.",
  "Keadaan kami stabil. Kami hanya butuh kepastian tentang bantuan logistik dapur umum besok pagi.",
];

const TRANSCRIPTS_YELLOW = [
  "Saya sangat takut dan cemas. Rumah kami rusak berat dan anak saya terus menangis, saya bingung sekali.",
  "I am very scared. I don't know where my family is. I feel panicked and I can't calm down.",
  "Dada saya terasa sesak dan gelisah. Belum bisa tidur dua malam karena khawatir ada longsor susulan.",
  "Kami kehilangan kontak dengan paman di desa sebelah. Pikiran saya tidak tenang, tangan terus bergetar.",
  "Saya merasa sedih mendalam melihat desa hancur. Masih bingung mau mulai dari mana lagi.",
  "Setiap mendengar suara gemuruh kami langsung panik dan lari keluar tenda.",
];

const TRANSCRIPTS_RED = [
  "Saya kehilangan kendali, tidak tahu harus bagaimana lagi... rasanya mau membahayakan diri sendiri dan saya tidak merespons panggilan mereka.",
  "Korban tampak menatap kosong, tidak merespons panggilan berulang kali dan menunjukkan disorientasi ruang akut.",
  "Pasien berteriak histeris, kehilangan kendali perilaku, dan mencoba berlari ke area lereng yang rawan runtuh.",
  "Korban mengalami kepanikan ekstrem dengan ancaman membahayakan orang lain di sekitarnya karena halusinasi.",
  "Unresponsive to verbal stimuli; sitting motionless on debris with severe shock reaction.",
];

// Exact target counts matching prompt requirements:
// Posko A: 80 Green, 20 Yellow, 8 Red = 108
// Posko B: 45 Green, 18 Yellow, 10 Red = 73
// Posko C: 32 Green, 15 Yellow, 5 Red = 52
// Posko D: 0 Green, 10 Yellow, 5 Red = 15
// Total: 157 Green, 63 Yellow, 28 Red = 248 Total

function generateDistribution(): AssessmentRecord[] {
  const records: AssessmentRecord[] = [];
  let idCounter = 1;

  const specs: { location: LocationPost; green: number; yellow: number; red: number }[] = [
    { location: 'Posko A', green: 80, yellow: 20, red: 8 },
    { location: 'Posko B', green: 45, yellow: 18, red: 10 },
    { location: 'Posko C', green: 32, yellow: 15, red: 5 },
    { location: 'Posko D', green: 0, yellow: 10, red: 5 },
  ];

  const now = new Date();
  const baseTime = new Date(now.getTime() - 1000 * 60 * 60 * 14); // 14 hours ago

  const addRecordsForZone = (
    location: LocationPost,
    zone: TriageZone,
    count: number
  ) => {
    for (let i = 0; i < count; i++) {
      const idNum = String(idCounter).padStart(3, '0');
      const id = `VCT-${idNum}`;
      idCounter++;

      const isVerbal: boolean = (idCounter % 3 !== 0); // 2/3 verbal, 1/3 checklist
      const method: AssessmentMethod = isVerbal ? 'VERBAL' : 'CHECKLIST';

      // Distribute timestamps progressively over today
      const elapsedMinutes = Math.floor((idCounter / 250) * 14 * 60);
      const recordDate = new Date(baseTime.getTime() + elapsedMinutes * 60000);
      const timeHours = String(recordDate.getHours()).padStart(2, '0');
      const timeMins = String(recordDate.getMinutes()).padStart(2, '0');
      const timestamp = `${timeHours}:${timeMins}`;

      let score = 0;
      let indicators: string[] = [];
      let criticalTriggered = false;
      let transcript: string | undefined;
      let checklistSelections: string[] | undefined;
      let recommendedAction = '';

      if (zone === 'GREEN') {
        score = idCounter % 2 === 0 ? 0 : 1;
        indicators = score === 0 ? [] : ['Lelah fisik (Mild exhaustion)'];
        recommendedAction = 'STANDARD MONITORING: Provide basic comfort, hydration, and routine shelter access.';
        if (method === 'VERBAL') {
          transcript = TRANSCRIPTS_GREEN[i % TRANSCRIPTS_GREEN.length];
        } else {
          checklistSelections = [];
        }
      } else if (zone === 'YELLOW') {
        score = 2 + (idCounter % 2); // 2 or 3
        indicators = ['Takut (Fear)', 'Cemas (Anxiety)', 'Tidak tenang (Restlessness)'].slice(0, score);
        recommendedAction = 'PRIORITY FOLLOW-UP: Re-evaluate within 2-4 hours. Offer basic psychological grounding.';
        if (method === 'VERBAL') {
          transcript = TRANSCRIPTS_YELLOW[i % TRANSCRIPTS_YELLOW.length];
        } else {
          checklistSelections = ['emo_anxiety', 'emo_crying'].slice(0, score);
        }
      } else {
        // RED
        criticalTriggered = true;
        score = 4 + (idCounter % 2);
        indicators = [
          'Tidak merespons (Unresponsive)',
          'Loss of behavioral control',
          'Risk of harm to self',
        ].slice(0, 2);
        recommendedAction = 'CRITICAL PROTOCOL: Immediate intervention under Psychological First Aid (PFA) and medical referral.';
        if (method === 'VERBAL') {
          transcript = TRANSCRIPTS_RED[i % TRANSCRIPTS_RED.length];
        } else {
          checklistSelections = ['cog_unresponsive', 'safe_harm_self'];
        }
      }

      const volunteerName = `Volunteer ${INDONESIAN_FIRST_NAMES[idCounter % INDONESIAN_FIRST_NAMES.length]}`;

      records.push({
        id,
        timestamp,
        location,
        method,
        zone,
        score,
        indicators,
        criticalTriggered,
        transcript,
        checklistSelections,
        recommendedAction,
        syncStatus: 'synced',
        volunteerNotes: `Assessed at ${location} triage post by ${volunteerName}.`,
        volunteerId: `VOL-${100 + (idCounter % 15)}`,
      });
    }
  };

  for (const spec of specs) {
    addRecordsForZone(spec.location, 'GREEN', spec.green);
    addRecordsForZone(spec.location, 'YELLOW', spec.yellow);
    addRecordsForZone(spec.location, 'RED', spec.red);
  }

  // Sort with most recent timestamps first for tabular presentation
  return records.reverse();
}

export const INITIAL_ASSESSMENTS: AssessmentRecord[] = generateDistribution();
