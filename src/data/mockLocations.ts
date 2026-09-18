import { LocationPostInfo } from '../types/assessment';

export const MOCK_LOCATIONS: LocationPostInfo[] = [
  {
    id: 'posko-a',
    name: 'Posko A',
    lat: -6.8152,
    lng: 107.1395,
    sector: 'Central Staging Sector',
    coordinator: 'dr. Sarah Amanda (Medical & Psych Team)',
    activeVolunteers: 18,
    description: 'Main emergency logistics and registration hub with primary medical tent.',
  },
  {
    id: 'posko-b',
    name: 'Posko B',
    lat: -6.8285,
    lng: 107.1510,
    sector: 'East Shelter Complex',
    coordinator: 'Budi Santoso, S.Psi (Crisis Relief)',
    activeVolunteers: 14,
    description: 'Community sports hall converted into temporary shelter for 350 displaced families.',
  },
  {
    id: 'posko-c',
    name: 'Posko C',
    lat: -6.8040,
    lng: 107.1260,
    sector: 'North Evacuation Zone',
    coordinator: 'Rina Wijaya (Disaster Care Unit)',
    activeVolunteers: 11,
    description: 'School grounds emergency settlement with family tracing desk.',
  },
  {
    id: 'posko-d',
    name: 'Posko D',
    lat: -6.8410,
    lng: 107.1180,
    sector: 'South Remote Valley',
    coordinator: 'Hendra Kusuma (Rapid Assessment Unit)',
    activeVolunteers: 9,
    description: 'Sub-district hillside staging area cut off from primary grid; heavy distress concentration.',
  },
];
