import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, 
  MapPin, 
  Activity, 
  Lock, 
  Unlock, 
  Zap, 
  Anchor, 
  Plane, 
  HardDrive,
  Filter,
  Search,
  Eye,
  Plus,
  Trash2,
  X,
  PlusCircle,
  Database,
  CheckCircle2,
  AlertOctagon,
  EyeOff
} from 'lucide-react';
import { StrategicAsset } from '../types';
import { addAssetToDb, updateAssetStatusInDb, deleteAssetFromDb } from '../services/firestoreService';

interface StrategicAssetsProps {
  assets?: StrategicAsset[];
}

const DEFAULT_SEED_ASSETS: StrategicAsset[] = [
  {
    id: 'as-001',
    name: 'Entebbe International Airbase',
    type: 'Airbase',
    location: 'Entebbe, Uganda',
    status: 'Operational',
    coordinates: [0.0424, 32.4431],
    country: 'Uganda',
    owner: 'UPDF Air Force'
  },
  {
    id: 'as-002',
    name: 'Mombasa Port - Terminal 3',
    type: 'Port',
    location: 'Mombasa, Kenya',
    status: 'Operational',
    coordinates: [-4.0435, 39.6682],
    country: 'Kenya',
    owner: 'Kenya Ports Authority'
  },
  {
    id: 'as-003',
    name: 'Kigali National Data Center',
    type: 'Data Center',
    location: 'Kigali, Rwanda',
    status: 'Secured',
    coordinates: [-1.9441, 30.0619],
    country: 'Rwanda',
    owner: 'Government of Rwanda'
  },
  {
    id: 'as-004',
    name: 'Bujumbura Power Plant',
    type: 'Power Plant',
    location: 'Bujumbura, Burundi',
    status: 'Under Observation',
    coordinates: [-3.3822, 29.3644],
    country: 'Burundi',
    owner: 'REGIDESO'
  },
  {
    id: 'as-005',
    name: 'Goma-Rubavu Border Crossing',
    type: 'Border Post',
    location: 'Goma, DRC',
    status: 'Compromised',
    coordinates: [-1.6741, 29.2285],
    country: 'DRC',
    owner: 'DGM'
  }
];

export const StrategicAssetsMap: React.FC<StrategicAssetsProps> = ({ assets = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<StrategicAsset | null>(null);
  
  // Registration Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<StrategicAsset['type']>('Data Center');
  const [newLocation, setNewLocation] = useState('');
  const [newCountry, setNewCountry] = useState('Uganda');
  const [newOwner, setNewOwner] = useState('');
  const [newLat, setNewLat] = useState('0.3476');
  const [newLng, setNewLng] = useState('32.5825');
  const [newStatus, setNewStatus] = useState<StrategicAsset['status']>('Operational');

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || a.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, filterType]);

  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Clean up map instance on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Check if container element exists in DOM
    const mapEl = document.getElementById('assets-leaflet-map');
    if (!mapEl) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map('assets-leaflet-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([1.3733, 32.2903], 6.5);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;

    if (map && markerGroup) {
      markerGroup.clearLayers();

      const bounds: L.LatLngExpression[] = [];

      filteredAssets.forEach(asset => {
        if (asset.coordinates && Array.isArray(asset.coordinates) && asset.coordinates.length === 2) {
          const [lat, lng] = asset.coordinates;
          if (!isNaN(lat) && !isNaN(lng)) {
            let color = '#3182CE'; // intel-blue
            if (asset.status === 'Operational') color = '#3D6B4F'; // savanna-sage
            else if (asset.status === 'Secured') color = '#3D6B4F'; // savanna-sage
            else if (asset.status === 'Under Observation') color = '#C8941E'; // nile-amber
            else if (asset.status === 'Compromised') color = '#C41E3A'; // brotherhood-crimson

            const customMarker = L.divIcon({
              className: 'custom-radar-marker',
              html: `
                <div class="relative flex items-center justify-center w-6 h-6">
                  <span class="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style="background-color: ${color}"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 border border-white/60 shadow" style="background-color: ${color}"></span>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const marker = L.marker([lat, lng], { icon: customMarker });
            
            marker.bindPopup(`
              <div class="p-2 font-sans text-xs" style="min-width: 140px; background-color: #0b1120; color: #f5f1e8; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1)">
                <h4 style="margin: 0; color: #D4AF37; font-weight: 900; text-transform: uppercase;">${asset.name}</h4>
                <p style="margin: 2px 0; color: #7a8699; font-family: monospace; font-size: 9px; text-transform: uppercase;">${asset.type}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 9px;">
                  <span style="color: #7a8699;">STATUS:</span>
                  <span style="color: ${color}; font-weight: bold; text-transform: uppercase;">${asset.status}</span>
                </div>
              </div>
            `);

            marker.on('click', () => {
              setSelectedAsset(asset);
            });

            marker.addTo(markerGroup);
            bounds.push([lat, lng]);
          }
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [filteredAssets]);

  // Operational metrics
  const metrics = useMemo(() => {
    if (assets.length === 0) return { operational: 0, watch: 0, alert: 0 };
    const operational = assets.filter(a => a.status === 'Operational' || a.status === 'Secured').length;
    const watch = assets.filter(a => a.status === 'Under Observation').length;
    const alert = assets.filter(a => a.status === 'Compromised').length;
    
    return {
      operational: Math.round((operational / assets.length) * 100),
      watch: Math.round((watch / assets.length) * 100),
      alert: Math.round((alert / assets.length) * 100)
    };
  }, [assets]);

  const getStatusColor = (status: StrategicAsset['status']) => {
    switch (status) {
      case 'Operational': return 'text-savanna-sage bg-savanna-sage/10 border-savanna-sage/20';
      case 'Secured': return 'text-intel-blue bg-intel-blue/10 border-intel-blue/20';
      case 'Under Observation': return 'text-nile-amber bg-nile-amber/10 border-nile-amber/20';
      case 'Compromised': return 'text-brotherhood-crimson bg-brotherhood-crimson/10 border-brotherhood-crimson/20';
      default: return 'text-crane-grey bg-crane-grey/10 border-crane-grey/20';
    }
  };

  const getStatusLabelText = (status: StrategicAsset['status']) => {
    switch (status) {
      case 'Operational': return 'Operational';
      case 'Secured': return 'Maintenance / Secured';
      case 'Under Observation': return 'Watch';
      case 'Compromised': return 'Alert';
      default: return status;
    }
  };

  const getTypeIcon = (type: StrategicAsset['type']) => {
    switch (type) {
      case 'Airbase': return <Plane size={18} className="text-crested-gold" />;
      case 'Port': return <Anchor size={18} className="text-intel-blue" />;
      case 'Data Center': return <HardDrive size={18} className="text-crested-gold" />;
      case 'Power Plant': return <Zap size={18} className="text-nile-amber" />;
      case 'Border Post': return <MapPin size={18} className="text-brotherhood-crimson" />;
      default: return <Shield size={18} />;
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLocation.trim()) return;

    const lat = parseFloat(newLat) || 0.3476;
    const lng = parseFloat(newLng) || 32.5825;

    const newAsset: StrategicAsset = {
      id: `as-${Math.floor(Math.random() * 900) + 100}`,
      name: newName,
      type: newType,
      location: newLocation,
      status: newStatus,
      coordinates: [lat, lng],
      country: newCountry,
      owner: newOwner || 'SFC Joint Task Authority'
    };

    try {
      await addAssetToDb(newAsset);
      setNewName('');
      setNewLocation('');
      setNewOwner('');
      setShowAddForm(false);
      if (window.navigator?.vibrate) window.navigator.vibrate(20);
    } catch (err) {
      console.error(err);
      alert("Failed to submit strategic asset register.");
    }
  };

  const handleUpdateStatus = async (id: string, status: StrategicAsset['status']) => {
    try {
      await updateAssetStatusInDb(id, status);
      // Update selected locale state safely
      if (selectedAsset && selectedAsset.id === id) {
        setSelectedAsset({ ...selectedAsset, status });
      }
      if (window.navigator?.vibrate) window.navigator.vibrate(10);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm("CONFIRM NODE DECOMMISSIONING: Proceeding will erase asset from the multi-domain high command ledger.")) return;
    try {
      await deleteAssetFromDb(id);
      setSelectedAsset(null);
      if (window.navigator?.vibrate) window.navigator.vibrate([20, 10, 30]);
    } catch (err) {
      console.error(err);
      alert("Failed to decommission asset.");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      for (const asset of DEFAULT_SEED_ASSETS) {
        await addAssetToDb(asset);
      }
      alert("Default strategic asset registry successfully synchronized.");
    } catch (err) {
      console.error(err);
      alert("Failed to seed default assets.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-pearl-africa font-black tracking-tighter text-lg uppercase leading-none">Strategic Asset Ledger</h2>
          <p className="text-[10px] font-mono text-crane-grey uppercase tracking-widest mt-1">Multi-Domain Infrastructure Grid</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
          }}
          className="flex items-center gap-2 p-2 bg-crested-gold/15 rounded text-crested-gold hover:bg-crested-gold/30 transition-colors uppercase font-mono text-[9px] font-bold tracking-widest"
          title="Register Asset"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Cancel Protocol' : 'Register Node'}</span>
        </button>
      </div>

      {/* 1a. Register Asset Collapsible Form */}
      {showAddForm && (
        <form onSubmit={handleCreateAsset} className="bg-lake-victoria/65 p-6 rounded-sm border border-crested-gold/30 space-y-4 animate-fade-in relative">
          <div className="absolute top-2 right-2 text-crested-gold/10">
            <Database size={64} className="rotate-12" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-crested-gold flex items-center gap-2">
            <PlusCircle size={14} /> NEW INFRASTRUCTURE REGISTRATION PROTOCOL
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Asset Node Name</label>
              <input 
                type="text"
                placeholder="e.g. Karuma Hydro Transmission Tower"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Infrastructure Domain</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold"
              >
                <option value="Airbase">Airbase / Hangar</option>
                <option value="Port">Maritime / Inland Port</option>
                <option value="Data Center">Strategic Data Center / Telecom Node</option>
                <option value="Mine">Extractives / Mining Concession</option>
                <option value="Power Plant">Energy / Generation Grid Plant</option>
                <option value="Border Post">Border Security Post / Crossing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Location / District</label>
              <input 
                type="text"
                placeholder="e.g. Kiryandongo District, Uganda"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                required
                className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Sovereign State (Country)</label>
              <input 
                type="text"
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                required
                className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Sector Authority / Owner</label>
              <input 
                type="text"
                placeholder="e.g. Uganda Electricity Generation Company"
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Latitude</label>
                <input 
                  type="text"
                  value={newLat}
                  onChange={e => setNewLat(e.target.value)}
                  className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-crane-grey uppercase tracking-wider">Longitude</label>
                <input 
                  type="text"
                  value={newLng}
                  onChange={e => setNewLng(e.target.value)}
                  className="w-full bg-kampala-obsidian border border-white/5 rounded-sm p-3 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="bg-crested-gold text-lake-victoria font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-sm hover:opacity-90 active:scale-95 transition-all text-center w-full"
            >
              Commit Asset Registry Protocol
            </button>
          </div>
        </form>
      )}

      {/* 2. Real-time Metrics Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-savanna-sage mb-1 tracking-widest">Nominal / Secure</p>
          <p className="text-xl font-black text-savanna-sage">{assets.length > 0 ? `${metrics.operational}%` : '---'}</p>
        </div>
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-nile-amber mb-1 tracking-widest">Maintenance</p>
          <p className="text-xl font-black text-nile-amber">{assets.length > 0 ? `${metrics.watch}%` : '---'}</p>
        </div>
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-brotherhood-crimson mb-1 tracking-widest">Alert / Threat</p>
          <p className="text-xl font-black text-brotherhood-crimson">{assets.length > 0 ? `${metrics.alert}%` : '---'}</p>
        </div>
      </div>

      {/* Interactive Tactical Radar Map */}
      <div className="stacked-precision-card p-1 overflow-hidden relative border border-white/5" style={{ height: '300px' }}>
        <div id="assets-leaflet-map" className="w-full h-full rounded" style={{ minHeight: '100%', zIndex: 1 }} />
      </div>

      {/* 3. Search & Category Filters */}
      <div className="space-y-4 pt-1">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-crane-grey" size={16} />
          <input 
            type="text"
            placeholder="Search Asset Node Name, ID or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-lake-victoria/40 border border-white/5 rounded-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-crested-gold placeholder:text-crane-grey font-medium transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar py-0.5">
          {['All', 'Airbase', 'Port', 'Data Center', 'Mine', 'Power Plant', 'Border Post'].map(type => (
            <button 
              key={type}
              onClick={() => {
                setFilterType(type);
                if (window.navigator?.vibrate) window.navigator.vibrate(5);
              }}
              className={`px-4 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterType === type ? 'bg-crested-gold text-lake-victoria border-crested-gold font-extrabold' : 'bg-transparent text-crane-grey border-white/5 hover:text-white hover:border-white/20'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Asset List Stack */}
      <div className="space-y-1">
        {assets.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-sm p-8 space-y-4">
             <Shield size={40} className="mx-auto text-crane-grey opacity-40 animate-pulse" />
             <div className="space-y-1">
               <p className="text-xs font-black uppercase tracking-widest text-crane-grey">Asset Ledger is Empty</p>
               <p className="text-[10px] text-infra-steel">Firestore database is active. Populate node infrastructure registry now.</p>
             </div>
             <button 
               onClick={handleSeedDefaults}
               className="mt-2 py-2.5 px-6 bg-intel-blue hover:bg-intel-blue/80 text-white font-mono text-[9px] font-black uppercase tracking-widest rounded-sm transition-all"
             >
               Initialize Live Default Registry
             </button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-16 text-center opacity-40">
             <EyeOff size={36} className="mx-auto mb-2 text-crane-grey" />
             <p className="text-xs font-black uppercase tracking-widest text-crane-grey">No matching nodes located</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <button 
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="w-full stacked-precision-card p-5 flex items-center justify-between group active:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-sm bg-lake-victoria border border-white/5 flex items-center justify-center shrink-0 ${asset.status === 'Compromised' ? 'bg-brotherhood-crimson/15 border-brotherhood-crimson/50' : 'bg-white/5 border-white/5'}`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-black text-pearl-africa leading-none mb-1 group-hover:text-crested-gold uppercase tracking-tight">{asset.name}</h4>
                  <p className="text-[10px] font-mono text-crane-grey uppercase tracking-widest leading-none">
                    {asset.id} <span className="opacity-30 px-1">//</span> {asset.country}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border inline-block ${getStatusColor(asset.status)}`}>
                  {getStatusLabelText(asset.status)}
                </span>
                <p className="text-[9px] font-black text-crane-grey mt-2 uppercase tracking-[0.2em]">{asset.type}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 5. Detail Drawer / Over-Panel with Status Transitioning & Decommissioning */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] bg-kampala-obsidian overflow-y-auto animate-fade-in relative">
          <div className="sticky top-0 bg-kampala-obsidian/85 backdrop-blur-md h-16 flex items-center justify-between px-6 border-b border-white/5">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield size={14} className="text-crested-gold" />
                Asset Node Controls
             </h3>
             <button 
              onClick={() => setSelectedAsset(null)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-sm"
             >
                <X size={18} />
             </button>
          </div>

          <div className="p-6 space-y-8 max-w-lg mx-auto">
             <div className="space-y-3">
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-pearl-africa">{selectedAsset.name}</h2>
                <div className="flex flex-wrap gap-2">
                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border ${getStatusColor(selectedAsset.status)}`}>
                      {getStatusLabelText(selectedAsset.status)}
                   </span>
                   <span className="text-[10px] font-mono text-infra-steel bg-white/5 border border-white/5 px-3 py-1 rounded-sm uppercase">
                      ID: {selectedAsset.id}
                   </span>
                   <span className="text-[10px] font-mono text-infra-steel bg-white/5 border border-white/5 px-3 py-1 rounded-sm uppercase">
                      {selectedAsset.type}
                   </span>
                </div>
             </div>

             {/* Tech Specs Grid */}
             <div className="grid grid-cols-2 gap-4">
                <div className="stacked-precision-card p-4">
                   <p className="text-[9px] font-black text-infra-steel uppercase mb-1">Geocentric Location</p>
                   <p className="text-[11px] font-mono text-Pearl-Africa leading-none">{selectedAsset.coordinates?.[0]?.toFixed(4)}N / {selectedAsset.coordinates?.[1]?.toFixed(4)}E</p>
                </div>
                <div className="stacked-precision-card p-4">
                   <p className="text-[9px] font-black text-infra-steel uppercase mb-1">Sector Authority</p>
                   <p className="text-[11px] font-mono text-Pearl-Africa leading-none truncate">{selectedAsset.owner}</p>
                </div>
             </div>

             {/* REAL-TIME STATUS SWITCH PROTOCOL */}
             <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-infra-steel border-b border-white/5 pb-2">
                 TRANSITION INTENT STATUS
               </h4>
               <p className="text-[10px] text-crane-grey leading-relaxed">
                 Select a state below to trigger immediate telemetry updates in the high-command national security database.
               </p>

               <div className="grid grid-cols-2 gap-2">
                 <button
                   onClick={() => handleUpdateStatus(selectedAsset.id, 'Operational')}
                   className={`p-3 text-left border flex items-center gap-3 transition-all rounded-sm uppercase font-mono text-[9px] ${selectedAsset.status === 'Operational' ? 'bg-savanna-sage/20 border-savanna-sage text-savanna-sage font-black' : 'bg-transparent border-white/5 text-crane-grey hover:border-white/10'}`}
                 >
                   <CheckCircle2 size={14} />
                   <span>Operational</span>
                 </button>

                 <button
                   onClick={() => handleUpdateStatus(selectedAsset.id, 'Secured')}
                   className={`p-3 text-left border flex items-center gap-3 transition-all rounded-sm uppercase font-mono text-[9px] ${selectedAsset.status === 'Secured' ? 'bg-intel-blue/20 border-intel-blue text-intel-blue font-black' : 'bg-transparent border-white/5 text-crane-grey hover:border-white/10'}`}
                 >
                   <Shield size={14} />
                   <span>Secured / Maintenance</span>
                 </button>

                 <button
                   onClick={() => handleUpdateStatus(selectedAsset.id, 'Under Observation')}
                   className={`p-3 text-left border flex items-center gap-3 transition-all rounded-sm uppercase font-mono text-[9px] ${selectedAsset.status === 'Under Observation' ? 'bg-nile-amber/20 border-nile-amber text-nile-amber font-black' : 'bg-transparent border-white/5 text-crane-grey hover:border-white/10'}`}
                 >
                    <Activity size={14} />
                    <span>Watch / Maintenance</span>
                 </button>

                 <button
                   onClick={() => handleUpdateStatus(selectedAsset.id, 'Compromised')}
                   className={`p-3 text-left border flex items-center gap-3 transition-all rounded-sm uppercase font-mono text-[9px] ${selectedAsset.status === 'Compromised' ? 'bg-brotherhood-crimson/20 border-brotherhood-crimson text-brotherhood-crimson font-black' : 'bg-transparent border-white/5 text-crane-grey hover:border-white/10'}`}
                 >
                   <AlertOctagon size={14} />
                   <span>Alert / Compromised</span>
                 </button>
               </div>
             </div>

             {/* Decommission node */}
             <div className="pt-8 border-t border-white/5 space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-brotherhood-crimson">
                 HIGH COMMAND ESCALATION
               </h4>
               <button 
                 onClick={() => handleDeleteAsset(selectedAsset.id)}
                 className="w-full bg-brotherhood-crimson/15 hover:bg-brotherhood-crimson/30 text-brotherhood-crimson py-3 border border-brotherhood-crimson/30 rounded-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95"
               >
                 <Trash2 size={14} />
                 <span>Decommission Node From Grid</span>
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
