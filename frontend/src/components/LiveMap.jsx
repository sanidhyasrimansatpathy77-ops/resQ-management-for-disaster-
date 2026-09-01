import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDisaster } from '../context/DisasterContext';
import { 
  Waves, 
  Building2, 
  Flame, 
  Mountain, 
  Zap, 
  TreePine, 
  AlertCircle,
  Filter, 
  Layers, 
  Crosshair, 
  Search, 
  ShieldAlert, 
  Eye, 
  Truck,
  Sparkles,
  Info,
  CheckCircle2,
  Ban,
  Users
} from 'lucide-react';
import { HAZARD_CATEGORIES, PRIORITY_CONFIG, SEVERITY_CONFIG } from '../data/seedIncidents';

// Helper component to center and animate map
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

// Generate custom SVG icon for Leaflet based on hazard category and P0-P3 priority
function createDisasterIcon(category, priority, severity, isRealDisaster, isCorroborated) {
  let color = '#3b82f6';
  let pulseClass = '';
  let iconSvg = '';

  const prio = priority || (severity === 'CRITICAL' ? 'P0' : severity === 'HIGH' ? 'P1' : severity === 'MEDIUM' ? 'P2' : 'P3');

  if (!isRealDisaster) {
    color = '#9ca3af';
  } else if (prio === 'P0' || severity === 'CRITICAL') {
    color = '#ef4444';
    pulseClass = 'pulsing-marker-critical';
  } else if (prio === 'P1' || severity === 'HIGH') {
    color = '#f97316';
    pulseClass = 'pulsing-marker-high';
  } else if (prio === 'P2' || severity === 'MEDIUM') {
    color = '#eab308';
  } else {
    color = '#38bdf8';
  }

  // Choose SVG glyph
  if (category?.includes('Flood')) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
  } else if (category?.includes('Structural')) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`;
  } else if (category?.includes('Fire')) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
  } else if (category?.includes('Landslide')) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`;
  } else if (category?.includes('Powerline') || category?.includes('Electrical')) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  }

  const corroborationGlow = isCorroborated ? 'ring-2 ring-sky-400' : '';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <div class="absolute w-10 h-10 rounded-full ${pulseClass}" style="background-color: ${color}33;"></div>
      <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 border-white/80 transition-transform group-hover:scale-110 ${corroborationGlow}" style="background-color: ${color};">
        ${iconSvg}
      </div>
      <div class="absolute -bottom-1 -right-1.5 px-1 rounded-full border border-black flex items-center justify-center text-[8px] font-black text-white font-mono ${
        prio === 'P0' ? 'bg-rose-900' : prio === 'P1' ? 'bg-orange-900' : 'bg-slate-900'
      }">
        ${prio}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-disaster-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}

// 100% Free, Keyless, Unwatermarked Tile Providers
const TILE_LAYERS = {
  dark: {
    name: 'Dark Tactical',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'dark-tactical-tiles'
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    className: ''
  },
  street: {
    name: 'Standard Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: ''
  }
};

export default function LiveMap() {
  const { 
    incidents,
    selectedIncident, 
    setSelectedIncident, 
    filters, 
    setFilters,
    setActiveView,
    setActiveResponderIncident
  } = useDisaster();

  const [mapLayer, setMapLayer] = useState('dark');
  const [mapCenter, setMapCenter] = useState([17.4474, 78.3745]); // Focus on Hyderabad / National Map
  const [mapZoom, setMapZoom] = useState(6);

  // Filtered incidents list
  const filteredIncidents = incidents.filter(inc => {
    if (filters.hazardCategory !== 'ALL' && inc.hazardCategory !== filters.hazardCategory) {
      return false;
    }
    if (filters.priority && filters.priority !== 'ALL' && inc.priority !== filters.priority) {
      return false;
    }
    if (filters.severity !== 'ALL' && inc.severity !== filters.severity) {
      return false;
    }
    if (filters.corroboratedOnly && !inc.isCorroborated) {
      return false;
    }
    if (filters.verifiedOnly && (!inc.isRealDisaster || inc.status === 'FLAGGED_FALSE_ALARM')) {
      return false;
    }
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = inc.title?.toLowerCase().includes(q);
      const matchAddress = inc.address?.toLowerCase().includes(q);
      const matchId = inc.id?.toLowerCase().includes(q);
      if (!matchTitle && !matchAddress && !matchId) return false;
    }
    return true;
  });

  useEffect(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      setMapCenter([selectedIncident.latitude, selectedIncident.longitude]);
      setMapZoom(13);
    }
  }, [selectedIncident]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(14);
        },
        err => console.warn("Geolocation error:", err)
      );
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] rounded-2xl overflow-hidden border border-[#1f293d] shadow-2xl bg-[#0a0e17]">
      
      {/* Top Filter Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#111827]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#1f293d] shadow-xl pointer-events-auto max-w-full">
          <button
            onClick={() => setFilters(prev => ({ ...prev, hazardCategory: 'ALL' }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filters.hazardCategory === 'ALL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Hazards
          </button>

          {HAZARD_CATEGORIES.map(cat => {
            const isSelected = filters.hazardCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilters(prev => ({ ...prev, hazardCategory: isSelected ? 'ALL' : cat }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.includes('Flood') && <Waves className="w-3 h-3 text-sky-400" />}
                {cat.includes('Structural') && <Building2 className="w-3 h-3 text-amber-400" />}
                {cat.includes('Fire') && <Flame className="w-3 h-3 text-rose-400" />}
                {cat.includes('Landslide') && <Mountain className="w-3 h-3 text-emerald-400" />}
                {cat.includes('Powerline') && <Zap className="w-3 h-3 text-yellow-400" />}
                {cat.includes('Road') && <TreePine className="w-3 h-3 text-teal-400" />}
                <span>{cat.split('/')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right Map Controls: Search & Layer Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location or ID..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="bg-[#111827]/90 backdrop-blur-md text-xs text-white pl-8 pr-3 py-2 rounded-xl border border-[#1f293d] focus:outline-none focus:border-rose-500 w-44 sm:w-56 shadow-xl"
            />
          </div>

          {/* Layer Selector */}
          <div className="flex bg-[#111827]/90 backdrop-blur-md p-1 rounded-xl border border-[#1f293d] shadow-xl">
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => setMapLayer(key)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
                  mapLayer === key
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={handleLocateMe}
            title="Recenter to My Location"
            className="p-2 bg-[#111827]/90 backdrop-blur-md text-slate-300 hover:text-white rounded-xl border border-[#1f293d] hover:bg-slate-800 shadow-xl"
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Main Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={mapLayer}
          attribution={TILE_LAYERS[mapLayer].attribution}
          url={TILE_LAYERS[mapLayer].url}
          className={TILE_LAYERS[mapLayer].className}
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Render Corroboration Spatial Radius Circles (Slide 06) */}
        {filteredIncidents.filter(i => i.isCorroborated && i.isRealDisaster).map(incident => (
          <Circle
            key={`circle-${incident.id}`}
            center={[incident.latitude, incident.longitude]}
            radius={incident.affectedRadiusMeters || 400}
            pathOptions={{
              color: incident.priority === 'P0' ? '#ef4444' : '#38bdf8',
              fillColor: incident.priority === 'P0' ? '#ef4444' : '#0284c7',
              fillOpacity: 0.18,
              weight: 1.5,
              dashArray: '4, 6'
            }}
          />
        ))}

        {/* Disaster Incident Markers */}
        {filteredIncidents.map(incident => {
          const icon = createDisasterIcon(incident.hazardCategory, incident.priority, incident.severity, incident.isRealDisaster, incident.isCorroborated);
          const prioConf = PRIORITY_CONFIG[incident.priority] || SEVERITY_CONFIG[incident.severity] || PRIORITY_CONFIG.P2;

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  setSelectedIncident(incident);
                }
              }}
            >
              <Popup className="custom-tactical-popup">
                <div className="w-64 p-1 text-slate-100 font-sans">
                  {/* Photo thumbnail */}
                  <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2 bg-slate-900 border border-slate-700">
                    <img
                      src={incident.imageUrl}
                      alt={incident.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-sm">
                      {incident.hazardCategory.split('/')[0]}
                    </div>
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase ${prioConf.badge}`}>
                      {incident.priority || 'P1'} · {prioConf.label}
                    </div>
                  </div>

                  {/* Title & Address */}
                  <h4 className="font-bold text-xs text-white mb-1 line-clamp-1">
                    {incident.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 mb-2 line-clamp-1">
                    {incident.address}
                  </p>

                  {/* Corroboration Badge (Slide 06) */}
                  {incident.isCorroborated && (
                    <div className="mb-2 px-2 py-1 bg-sky-950/70 border border-sky-600/40 rounded text-[10px] text-sky-300 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-sky-400" />
                        {incident.corroboratedReportsCount} Corroborated Reports
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {incident.affectedRadiusMeters}m area
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      Inspect AI
                    </button>
                    <button
                      onClick={() => {
                        setActiveResponderIncident(incident);
                        setActiveView('responder');
                      }}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-md shadow-rose-900/30 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Live Feed
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Bottom Quick Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden sm:flex items-center gap-3 bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1f293d] text-[11px] text-slate-300 shadow-xl">
        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Priority (Slide 07):</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> P0 Critical</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> P1 High</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> P2 Medium</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> P3 Low</span>
      </div>

      {/* Active Incident Counter Pill */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1f293d] text-xs font-mono text-slate-300 shadow-xl flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Displaying <b className="text-white">{filteredIncidents.length}</b> Geotagged Hazards</span>
      </div>
    </div>
  );
}
