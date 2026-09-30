import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_LOCATIONS } from '../../data/seedLocations';
import { useAssessment } from '../../context/AssessmentContext';
import { MapPin, Info, Layers, Users } from 'lucide-react';

export const TriageMap: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const [mapProvider, setMapProvider] = useState<'osm' | 'carto'>('osm');

  const poskoData = useMemo(() => {
    return MOCK_LOCATIONS.map((loc) => {
      const records = centralAssessments.filter((r) => r.location === loc.name);
      const t0 = records.filter((r) => r.triageTier === 'T0' || (r.zone === 'RED' && r.criticalTriggered)).length;
      const t1 = records.filter((r) => r.triageTier === 'T1' || (r.zone === 'RED' && !r.criticalTriggered)).length;
      const t2 = records.filter((r) => r.triageTier === 'T2' || r.zone === 'YELLOW').length;
      const t3 = records.filter((r) => r.triageTier === 'T3' || r.zone === 'GREEN').length;
      const total = records.length;

      let markerBorder = '#16A34A'; // T3 Hijau
      let dominantTier: 'T0' | 'T1' | 'T2' | 'T3' = 'T3';

      if (t0 > 0) {
        markerBorder = '#DC2626'; // T0 Merah
        dominantTier = 'T0';
      } else if (t1 > 0) {
        markerBorder = '#EA580C'; // T1 Oranye
        dominantTier = 'T1';
      } else if (t2 > 0) {
        markerBorder = '#EAB308'; // T2 Kuning
        dominantTier = 'T2';
      } else {
        markerBorder = '#16A34A'; // T3 Hijau
        dominantTier = 'T3';
      }

      return {
        ...loc,
        total,
        t0,
        t1,
        t2,
        t3,
        dominantTier,
        markerBorder,
      };
    });
  }, [centralAssessments]);

  // Clean light HTML markers
  const createLightCustomIcon = (name: string, total: number, borderColor: string) => {
    return L.divIcon({
      className: 'custom-light-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div style="border-color: ${borderColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" 
               class="w-9 h-9 rounded-full bg-white border-2 flex items-center justify-center font-bold text-xs text-slate-800 cursor-pointer hover:scale-110 transition-transform">
            ${name.replace('Posko ', '')}
          </div>
          <div style="background-color: ${borderColor};" class="absolute -bottom-1 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold shadow-xs">
            ${total}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });
  };

  const centerLat = -6.822;
  const centerLng = 107.135;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Map Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              SEBARAN KASUS GEOSPASIAL — POSKO PENANGGULANGAN BENCANA
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring konsentrasi persebaran dan beban tingkat triase di setiap posko darurat sektor Cianjur.
          </p>
        </div>

        {/* Layer Selector & Semantic Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMapProvider('osm')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                mapProvider === 'osm'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>OSM Standard</span>
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('carto')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                mapProvider === 'carto'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Clean Light</span>
            </button>
          </div>

          {/* Semantic Legend */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="text-red-700 font-bold">T0</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-orange-700 font-bold">T1</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-amber-800 font-bold">T2</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-emerald-700 font-bold">T3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-80 sm:h-96 lg:h-[400px] rounded-xl overflow-hidden border border-slate-200 relative z-10">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          {mapProvider === 'osm' ? (
            <TileLayer
              key="osm"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              key="carto"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}

          {poskoData.map((posko) => (
            <Marker
              key={posko.id}
              position={[posko.lat, posko.lng]}
              icon={createLightCustomIcon(posko.name, posko.total, posko.markerBorder)}
            >
              <Popup className="custom-light-popup">
                <div className="p-1 space-y-2 min-w-[180px] text-xs text-slate-800 font-sans">
                  <div className="border-b border-slate-200 pb-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{posko.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{posko.sector}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Total Penapisan: <strong className="text-slate-900 font-mono">{posko.total}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-red-700 font-bold">
                      <span>T0 Emergency:</span>
                      <strong>{posko.t0}</strong>
                    </div>
                    <div className="flex items-center justify-between text-orange-700 font-semibold">
                      <span>T1 High Risk:</span>
                      <strong>{posko.t1}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-800 font-semibold">
                      <span>T2 Moderate:</span>
                      <strong>{posko.t2}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>T3 Low Risk:</span>
                      <strong>{posko.t3}</strong>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <div>Koordinator: <strong className="text-slate-700">{posko.coordinator}</strong></div>
                    <div>Relawan Aktif: <strong className="text-slate-700">{posko.activeVolunteers} personel</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs border border-slate-200 px-2.5 py-1 rounded-md text-[10px] text-slate-600 flex items-center gap-1.5 shadow-xs pointer-events-none">
          <Info className="w-3 h-3 text-blue-600" />
          <span>Marker posko merepresentasikan pos darurat operasional penanggulangan bencana.</span>
        </div>
      </div>

      {/* Post Station Summary Cards: Bridging Aggregate Data with Geographic Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {poskoData.map((posko) => (
          <div
            key={posko.id}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">{posko.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  posko.dominantTier === 'T0'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : posko.dominantTier === 'T1'
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : posko.dominantTier === 'T2'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {posko.dominantTier} Dominan
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Skrining:</span>
              <span className="font-mono font-bold text-slate-900">{posko.total} jiwa</span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-200/60 pt-1 text-slate-600">
              <span className="text-red-700 font-bold">{posko.t0} T0</span>
              <span className="text-orange-700">{posko.t1} T1</span>
              <span className="text-amber-800">{posko.t2} T2</span>
              <span className="text-emerald-700">{posko.t3} T3</span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span className="truncate max-w-[80px]">{posko.coordinator}</span>
              <span className="flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                <span>{posko.activeVolunteers}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
