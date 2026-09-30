import { apiClient } from '../lib/api';

export interface AdminStats {
  totalSurvivors: number;
  totalAssessments: number;
  totalVolunteers: number;
  totalUsers: number;
  triage: {
    t0: number;
    t1: number;
    t2: number;
    t3: number;
  };
  zones: {
    green: number;
    yellow: number;
    red: number;
  };
  poskoStats: Array<{
    posko: string;
    disaster_name: string;
    coordinates: [number, number];
    assessments_count: number;
    t0_count: number;
    volunteers_count: number;
    current_occupancy: number;
    max_capacity: number;
  }>;
}

export const adminService = {
  async getStats(): Promise<AdminStats | null> {
    try {
      const res = await apiClient.get<{ data: AdminStats }>('/admin/stats');
      return res.data;
    } catch {
      return null;
    }
  },

  async getLongitudinal(): Promise<any[]> {
    try {
      const res = await apiClient.get<{ data: any[] }>('/admin/longitudinal');
      return res.data;
    } catch {
      return [];
    }
  },

  async getPosts(): Promise<any[]> {
    try {
      const res = await apiClient.get<{ data: any[] }>('/admin/posts');
      return res.data;
    } catch {
      return [];
    }
  },
};
