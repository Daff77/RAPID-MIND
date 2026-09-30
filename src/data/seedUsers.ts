import { User } from '../types/auth';

export const MOCK_VOLUNTEER: User = {
  id: 'user-vol-042',
  username: 'volunteer',
  email: 'volunteer@rapidmind.org',
  name: 'Siti Rahma, S.Psi',
  role: 'volunteer',
  badgeNumber: 'VOL-042',
  assignedPost: 'Posko A',
  title: 'Field Psychological Volunteer',
  phone: '+62 812-3456-7890',
};

export const MOCK_ADMIN: User = {
  id: 'user-adm-001',
  username: 'admin',
  email: 'admin@rapidmind.org',
  name: 'dr. Sarah Amanda, Sp.KJ',
  role: 'admin',
  badgeNumber: 'ADM-001',
  assignedPost: 'Posko A',
  title: 'Incident Psychological Coordinator',
  phone: '+62 811-9876-5432',
};

export const MOCK_HOSPITAL: User = {
  id: 'user-rs-001',
  username: 'rumahsakit',
  email: 'rumahsakit@rapidmind.org',
  name: 'dr. Budi Santoso, Sp.KJ',
  role: 'hospital',
  badgeNumber: 'RS-001',
  assignedHospital: 'RSUD Dr. Soetomo (Pusat Rujukan Jiwa)',
  title: 'Hospital Psychiatric Triage & Referral Specialist',
  phone: '+62 813-1122-3344',
};

export const DEFAULT_USERS: User[] = [MOCK_ADMIN, MOCK_VOLUNTEER, MOCK_HOSPITAL];
