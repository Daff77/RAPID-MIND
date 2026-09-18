import { LocationPost, AssessmentMethod, TriageZone } from '../types/assessment';

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  expectedZone: TriageZone;
  defaultLocation: LocationPost;
  method: AssessmentMethod;
  description: string;
  victimId: string;
  // Verbal payload
  transcript?: string;
  // Checklist payload
  checklistIds?: string[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-1-green',
    title: 'Scenario 1 — Green (Baseline)',
    subtitle: 'Normal calm response with mild physical fatigue',
    badgeText: '🟢 GREEN EXPECTED',
    expectedZone: 'GREEN',
    defaultLocation: 'Posko A',
    method: 'VERBAL',
    victimId: 'VCT-249',
    description: 'Victim reports feeling tired from evacuation but remains oriented, resting with neighbors, and has access to water.',
    transcript: 'I feel tired and a bit overwhelmed, but I am resting and my neighbor is here with me. We have clean water and feel safe for now.',
  },
  {
    id: 'scenario-2-yellow',
    title: 'Scenario 2 — Yellow (Fear & Panic)',
    subtitle: 'Transcript containing fear, panic, anxiety',
    badgeText: '🟡 YELLOW EXPECTED',
    expectedZone: 'YELLOW',
    defaultLocation: 'Posko A',
    method: 'VERBAL',
    victimId: 'VCT-001',
    description: 'Victim expresses acute fear, separated family members, panic and inability to calm down (restlessness).',
    transcript: "I am very scared. I don't know where my family is. I feel panicked and I can't calm down.",
  },
  {
    id: 'scenario-3-red',
    title: 'Scenario 3 — Red (Critical Safety)',
    subtitle: 'Checklist with critical safety indicator',
    badgeText: '🔴 RED EXPECTED',
    expectedZone: 'RED',
    defaultLocation: 'Posko B',
    method: 'CHECKLIST',
    victimId: 'VCT-002',
    description: 'Observational checklist immediately triggers RED Zone due to acute unresponsiveness and risk of harm to self.',
    checklistIds: ['cog_unresponsive', 'safe_harm_self'],
  },
];
