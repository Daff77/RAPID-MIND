import Dexie, { Table } from 'dexie';
import { AssessmentRecord, SurvivorProfile } from '../types/assessment';

export interface OfflineQueueItem extends AssessmentRecord {
  clientEventId?: string;
  queuedAt?: string;
  retryCount?: number;
}

export interface LocalEmergencyAlert {
  id: string;
  clientEventId?: string;
  recordId?: string;
  survivorId: string;
  survivorName: string;
  posko: string;
  status: string;
  emergencyReasons: string[];
  gpsLat?: number;
  gpsLng?: number;
  reporterVolunteerId?: string;
  volunteerNotes?: string;
  createdAt: string;
  syncStatus?: 'pending' | 'synced';
}

export class RapidMindDatabase extends Dexie {
  assessments!: Table<AssessmentRecord, string>;
  offlineQueue!: Table<OfflineQueueItem, string>;
  survivors!: Table<SurvivorProfile, string>;
  emergencyAlerts!: Table<LocalEmergencyAlert, string>;

  constructor() {
    super('RapidMindDexieDB');
    this.version(1).stores({
      assessments: 'recordId, id, victimId, triageTier, t0Status, zone, location, syncStatus',
      offlineQueue: 'recordId, clientEventId, id, victimId, triageTier, syncStatus',
      survivors: 'id, name, posko, triageTier, t0Status, currentPhase',
      emergencyAlerts: 'id, recordId, survivorId, status, posko, createdAt, syncStatus',
    });
  }
}

export const db = new RapidMindDatabase();
