import { apiClient } from '../lib/api';
import { db } from '../lib/db';
import { subscribeToEmergencies } from '../lib/echo';

export interface EmergencyAlertItem {
  id: string;
  clientEventId?: string;
  recordId?: string;
  survivorId: string;
  survivorName: string;
  posko: string;
  status: 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded';
  t0Status?: 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded';
  emergencyReasons: string[];
  gpsLat?: number;
  gpsLng?: number;
  reporterVolunteerId?: string;
  volunteerNotes?: string;
  verifiedByDoctorName?: string;
  verifiedAt?: string;
  teleNotes?: string;
  downgradedTier?: 'T1' | 'T2';
  transportStage?: 'dispatch' | 'on_site' | 'en_route_hospital' | 'admitted';
  assignedBed?: string;
  createdAt?: string;
}

export const emergencyService = {
  /**
   * Fetch all emergency alerts.
   */
  async getEmergencyAlerts(status?: string, posko?: string): Promise<EmergencyAlertItem[]> {
    try {
      const res = await apiClient.get<{ data: EmergencyAlertItem[] }>('/emergency', { status, posko });
      if (res.data) {
        db.emergencyAlerts.bulkPut(res.data as any).catch(() => {});
        return res.data;
      }
    } catch {
      try {
        const local = await db.emergencyAlerts.toArray();
        if (local.length > 0) return local as unknown as EmergencyAlertItem[];
      } catch {}
    }
    return [];
  },

  /**
   * Trigger/Broadcast a T0 Red Flag Emergency Alert (Volunteer).
   */
  async createEmergencyAlert(data: Partial<EmergencyAlertItem>): Promise<EmergencyAlertItem> {
    try {
      const res = await apiClient.post<{ data: EmergencyAlertItem }>('/emergency', data);
      db.emergencyAlerts.put(res.data as any).catch(() => {});
      return res.data;
    } catch {
      // Offline T0 handling: Save locally to Dexie, will sync when back online
      const offlineAlert: EmergencyAlertItem = {
        id: data.id || `EMG-${Date.now()}`,
        clientEventId: data.clientEventId || `client-emg-${Date.now()}`,
        recordId: data.recordId,
        survivorId: data.survivorId || 'VCT-ACTIVE',
        survivorName: data.survivorName || 'Penyintas Lapangan',
        posko: data.posko || 'Posko A',
        status: 'T0-Suspect',
        t0Status: 'T0-Suspect',
        emergencyReasons: data.emergencyReasons || ['Pemicu kedaruratan Red Flag manual oleh relawan'],
        gpsLat: data.gpsLat,
        gpsLng: data.gpsLng,
        reporterVolunteerId: data.reporterVolunteerId,
        volunteerNotes: data.volunteerNotes,
        createdAt: new Date().toISOString(),
      };

      await db.emergencyAlerts.put({
        ...offlineAlert,
        syncStatus: 'pending',
      } as any);

      return offlineAlert;
    }
  },

  /**
   * Healthcare Verification: Confirm T0 Emergency (Rujukan Segera).
   */
  async confirmEmergency(
    emergencyId: string,
    doctorName: string,
    teleNotes?: string,
    assignedBed?: string
  ): Promise<EmergencyAlertItem> {
    const res = await apiClient.post<{ data: EmergencyAlertItem }>(`/emergency/${emergencyId}/confirm`, {
      doctorName,
      teleNotes,
      assignedBed,
    });
    return res.data;
  },

  /**
   * Healthcare Verification: Downgrade status to T1 or T2.
   */
  async downgradeEmergency(
    emergencyId: string,
    targetTier: 'T1' | 'T2',
    doctorName: string,
    teleNotes?: string
  ): Promise<EmergencyAlertItem> {
    const res = await apiClient.post<{ data: EmergencyAlertItem }>(`/emergency/${emergencyId}/downgrade`, {
      targetTier,
      doctorName,
      teleNotes,
    });
    return res.data;
  },

  /**
   * Realtime WebSockets subscription using Laravel Reverb / Echo.
   */
  listenForRealtimeAlerts(
    onCreated: (alert: EmergencyAlertItem) => void,
    onConfirmed?: (alert: EmergencyAlertItem) => void,
    onDowngraded?: (alert: EmergencyAlertItem) => void
  ) {
    return subscribeToEmergencies(onCreated, onConfirmed, onDowngraded);
  },
};
