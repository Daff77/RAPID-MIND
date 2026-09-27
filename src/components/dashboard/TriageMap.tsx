import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_LOCATIONS } from '../../data/mockLocations';
import { useAssessment } from '../../context/AssessmentContext';
import { MapPin, Info, Layers } from 'lucide-react';

export const TriageMap: React.FC = () => {
  const { centralAssessments } = useAssessment();
  const [mapProvider, setMapProvider] = useState<'osm' | 'carto'>('osm');

  const poskoData = useMemo(() => {
    return MOCK_LOCATIONS.map((loc) => {
      const records = centralAssessments.filter((r) => r.location === loc.name);
      const green = records.filter((r) => r.zone === 'GREEN').length;
      const yellow = records.filter((r) => r.zone === 'YELLOW').length;
      const red = records.filter((r) => r.zone === 'RED').length;
      const total = records.length;

      let markerBorder = '#16A34A';
      if (red > 5) {
        markerBorder = '#DC2626';
      } else if (yellow > 10) {
        markerBorder = '#EAB308';
      }

      return {
        ...loc,
        total,
        green,
        yellow,
        red,
        markerBorder,
      };
    });
  }, [centralAssessments]);

  // Clean light HTML markers
  const createLightCustomIcon = (name: string, total: number, borderColor: string, redCount: number) => {
    return L.divIcon({
      className: 'custom-light-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div style="border-color: ${borderColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.12);" 
               class="w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center font-bold text-xs text-slate-800 cursor-pointer hover:scale-105 transition-transform">
            ${name.replace('Posko ', '')}
          </div>
          <div style="background-color: ${borderColor};" class="absolute -bottom-1 text-white text-[9px] font-mono px-1 rounded-full font-bold shadow-xs">
            ${total}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const centerLat = -6.822;
  const centerLng = 107.135;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3.5">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>GEOSPATIAL SITUATION — RESPONSE POSTS</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Demo / Simulated Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic stations overview across the operational relief sector.
          </p>
        </div>

        {/* Layer Selector & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Map Layer Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMapProvider('osm')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                mapProvider === 'osm'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>OSM Standard</span>
            </button>
            <button
              type="button"
              onClick={() => setMapProvider('carto')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                mapProvider === 'carto'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Clean Light</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Stable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 relative z-10">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          {/* Tile Layer: OpenStreetMap (OSM) Standard or CartoDB Positron */}
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
              icon={createLightCustomIcon(posko.name, posko.total, posko.markerBorder, posko.red)}
            >
              <Popup className="custom-light-popup">
                <div className="p-1 space-y-2 min-w-[170px] text-xs text-slate-800 font-sans">
                  <div className="border-b border-slate-200 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{posko.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{posko.sector}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Total Screenings: <strong className="text-slate-900 font-mono">{posko.total}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>🟢 Green:</span>
                      <strong>{posko.green}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-800">
                      <span>🟡 Yellow:</span>
                      <strong>{posko.yellow}</strong>
                    </div>
                    <div className="flex items-center justify-between text-red-700 font-bold">
                      <span>🔴 Red:</span>
                      <strong>{posko.red}</strong>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <div>Lead: {posko.coordinator}</div>
                    <div>Staff: {posko.activeVolunteers} volunteers</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Small simulated data note */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs border border-slate-200 px-2.5 py-1 rounded-md text-[10px] text-slate-600 flex items-center gap-1.5 shadow-xs pointer-events-none">
          <Info className="w-3 h-3 text-blue-600" />
          <span>Post location markers represent operational relief stations.</span>
        </div>
      </div>
    </div>
  );
};
