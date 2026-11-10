import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  MapPin, 
  Activity, 
  Zap, 
  Anchor, 
  Plane, 
  HardDrive,
  Search,
  Plus,
  Trash2,
  X,
  PlusCircle,
  Database,
  CheckCircle2,
  AlertOctagon,
  EyeOff,
  Download,
  BrainCircuit,
  RefreshCw
} from 'lucide-react';
import { StrategicAsset, Incident, PEPProfile } from '../types';
import { addAssetToDb, updateAssetStatusInDb, deleteAssetFromDb } from '../services/firestoreService';
import { generateSynthesisMindBriefing } from '../services/geminiService';
import { db } from '../firebaseConfig';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';

interface StrategicAssetsProps {
  assets?: StrategicAsset[];
  peps?: PEPProfile[];
  incidents?: Incident[];
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

export const StrategicAssetsMap: React.FC<StrategicAssetsProps> = ({ 
  assets = [], 
  peps = [], 
  incidents = [] 
}) => {
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

  // Bulk Import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');

  // Synthesis Mind Briefing state
  const [showSynthesisModal, setShowSynthesisModal] = useState(false);
  const [briefing, setBriefing] = useState<any | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);

  // PDF Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleBulkImport = async () => {
    setImportError('');
    setImportStatus('Parsing JSON payload...');
    
    try {
      const parsed = JSON.parse(bulkJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      
      if (items.length === 0) {
        throw new Error("Payload contains zero records.");
      }
      
      setImportStatus(`Validating ${items.length} records...`);
      
      const validated: StrategicAsset[] = items.map((item: any, idx: number) => {
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Record at index ${idx} is missing a valid 'name'.`);
        }
        if (!item.location || typeof item.location !== 'string') {
          throw new Error(`Record at index ${idx} ('${item.name}') is missing a valid 'location'.`);
        }
        
        let coords: [number, number] = [0.3476, 32.5825];
        if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
          const lat = parseFloat(item.coordinates[0]);
          const lng = parseFloat(item.coordinates[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            coords = [lat, lng];
          }
        } else if (item.latitude !== undefined && item.longitude !== undefined) {
          const lat = parseFloat(item.latitude);
          const lng = parseFloat(item.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            coords = [lat, lng];
          }
        }
        
        const allowedTypes = ['Airbase', 'Port', 'Data Center', 'Mine', 'Oil Refined', 'Power Plant', 'Border Post'];
        let assetType: any = item.type || 'Data Center';
        if (!allowedTypes.includes(assetType)) {
          if (assetType.toLowerCase().includes('power') || assetType.toLowerCase().includes('energy')) assetType = 'Power Plant';
          else if (assetType.toLowerCase().includes('air') || assetType.toLowerCase().includes('hangar')) assetType = 'Airbase';
          else if (assetType.toLowerCase().includes('port') || assetType.toLowerCase().includes('harbor')) assetType = 'Port';
          else if (assetType.toLowerCase().includes('border') || assetType.toLowerCase().includes('customs')) assetType = 'Border Post';
          else if (assetType.toLowerCase().includes('mine') || assetType.toLowerCase().includes('extractive')) assetType = 'Mine';
          else assetType = 'Data Center';
        }
        
        const allowedStatuses = ['Operational', 'Secured', 'Under Observation', 'Compromised'];
        let status = item.status || 'Operational';
        if (!allowedStatuses.includes(status)) {
          if (status.toLowerCase().includes('alert') || status.toLowerCase().includes('threat') || status.toLowerCase().includes('compromised')) {
            status = 'Compromised';
          } else if (status.toLowerCase().includes('watch') || status.toLowerCase().includes('observation')) {
            status = 'Under Observation';
          } else if (status.toLowerCase().includes('secure')) {
            status = 'Secured';
          } else {
            status = 'Operational';
          }
        }
        
        return {
          id: item.id || `as-${Math.floor(Math.random() * 900) + 100}`,
          name: item.name,
          type: assetType,
          location: item.location,
          status: status,
          coordinates: coords,
          country: item.country || 'Uganda',
          owner: item.owner || 'SFC Joint Task Authority'
        };
      });
      
      setImportStatus(`Importing ${validated.length} nodes to database...`);
      
      for (const val of validated) {
        const match = assets.find(a => 
          a.id === val.id || 
          a.name.toLowerCase().trim() === val.name.toLowerCase().trim()
        );
        
        if (match) {
          const cleanedData = { ...val } as any;
          delete cleanedData.id;
          const docRef = doc(db, 'strategic_assets', match.id);
          await updateDoc(docRef, cleanedData);
        } else {
          const cleanedData = { ...val } as any;
          delete cleanedData.id;
          await addDoc(collection(db, 'strategic_assets'), cleanedData);
        }
      }
      
      setImportStatus('');
      setBulkJson('');
      setShowBulkImport(false);
      alert(`Bulk Import Protocol Complete: ${validated.length} strategic infrastructure nodes successfully synchronized.`);
      if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Malformed JSON payload or Firestore write failure.');
      setImportStatus('');
    }
  };

  const triggerBriefing = async () => {
    setBriefingLoading(true);
    try {
      const result = await generateSynthesisMindBriefing(incidents, peps, assets, isDeepMode);
      if (result) {
        setBriefing(result);
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
      alert("Intelligence node timed out. Please try again.");
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
    alert("Compiling National Security Infrastructure Intelligence Report PDF. Please stand by...");
    
    const reportEl = document.getElementById('asset-ledger-pdf-report');
    if (!reportEl) {
      alert("Error: PDF report element node not found.");
      setIsExportingPDF(false);
      return;
    }
    
    try {
      const clone = reportEl.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '900px',
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        zIndex: '-1'
      });
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 900
      });
      
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const formattedDate = new Date().toISOString().split('T')[0];
      pdf.save(`UISMS_Infrastructure_Strategic_Ledger_${formattedDate}.pdf`);
    } catch (error) {
      console.error("PDF Export failure:", error);
      alert("Failed to compile strategic PDF report.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (!assets || assets.length === 0) {
      alert("No asset ledger data available to export.");
      return;
    }
    
    const headers = ["ID", "Asset Name", "Domain Type", "Location", "Country", "Sector Authority", "Operational Status", "Latitude", "Longitude"];
    
    const rows = assets.map(asset => {
      const lat = asset.coordinates?.[0] || "";
      const lng = asset.coordinates?.[1] || "";
      return [
        asset.id,
        `"${asset.name.replace(/"/g, '""')}"`,
        asset.type,
        `"${asset.location.replace(/"/g, '""')}"`,
        asset.country,
        `"${asset.owner.replace(/"/g, '""')}"`,
        asset.status,
        lat,
        lng
      ];
    });
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const formattedDate = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `UISMS_Asset_Ledger_Export_${formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
  };

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
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const mapEl = document.getElementById('assets-leaflet-map');
    if (!mapEl) return;

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
            // Semantic status colors: Operational = green (#34D399), Under Observation = amber (#F59E0B), Compromised = red (#D90000), Secured/Maintenance = neutral gray (#A1A1AA)
            let color = '#A1A1AA';
            if (asset.status === 'Operational') color = '#34D399';
            else if (asset.status === 'Secured') color = '#A1A1AA';
            else if (asset.status === 'Under Observation') color = '#F59E0B';
            else if (asset.status === 'Compromised') color = '#D90000';

            const customMarker = L.divIcon({
              className: 'custom-radar-marker',
              html: `
                <div class="relative flex items-center justify-center w-6 h-6">
                  <span class="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style="background-color: ${color}"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 border border-white/70 shadow" style="background-color: ${color}"></span>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const marker = L.marker([lat, lng], { icon: customMarker });
            
            marker.bindPopup(`
              <div class="p-2.5 font-sans text-xs" style="min-width: 150px; background-color: #141416; color: #F5F5F4; border-radius: 10px; border: 1px solid #2A2A2E">
                <h4 style="margin: 0; color: #F5F5F4; font-weight: 600;">${asset.name}</h4>
                <p style="margin: 2px 0; color: #A1A1AA; font-family: monospace; font-size: 10px; text-transform: uppercase;">${asset.type}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid #2A2A2E; font-size: 10px;">
                  <span style="color: #A1A1AA;">STATUS:</span>
                  <span style="color: ${color}; font-weight: 600; text-transform: uppercase;">${asset.status}</span>
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

  // Strict semantic status colors: Operational = green, Degraded/Watch = amber, Critical/Compromised = red, Under Maintenance/Secured = neutral gray
  const getStatusColor = (status: StrategicAsset['status']) => {
    switch (status) {
      case 'Operational': return 'text-success bg-success/10 border-success/30';
      case 'Secured': return 'text-text-secondary bg-bg-elevated border-border-subtle';
      case 'Under Observation': return 'text-warning bg-warning/10 border-warning/30';
      case 'Compromised': return 'text-danger bg-danger/10 border-danger/30';
      default: return 'text-text-secondary bg-bg-elevated border-border-subtle';
    }
  };

  const getStatusLabelText = (status: StrategicAsset['status']) => {
    switch (status) {
      case 'Operational': return 'Operational';
      case 'Secured': return 'Under Maintenance';
      case 'Under Observation': return 'Degraded';
      case 'Compromised': return 'Critical';
      default: return status;
    }
  };

  const getTypeIcon = (type: StrategicAsset['type']) => {
    switch (type) {
      case 'Airbase': return <Plane size={18} className="text-accent" />;
      case 'Port': return <Anchor size={18} className="text-info" />;
      case 'Data Center': return <HardDrive size={18} className="text-accent" />;
      case 'Power Plant': return <Zap size={18} className="text-warning" />;
      case 'Border Post': return <MapPin size={18} className="text-danger" />;
      default: return <Shield size={18} className="text-text-secondary" />;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">Strategic Asset Ledger</h2>
          <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mt-1">Multi-Domain Infrastructure Grid</p>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-ink rounded-xl hover:opacity-90 transition-opacity font-semibold text-xs"
          title="Register Asset"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Cancel' : 'Register Node'}</span>
        </button>
      </div>

      {/* Strategic Actions Toolbar */}
      <div className="bg-bg-surface border border-border-subtle p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowBulkImport(true);
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle text-text-primary rounded-xl text-xs font-medium transition-colors"
            title="Bulk import assets from JSON string"
          >
            <Database size={14} className="text-text-secondary" />
            <span>Bulk Import (JSON)</span>
          </button>

          <button
            onClick={() => {
              setShowSynthesisModal(true);
              triggerBriefing();
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl text-xs font-medium transition-colors"
            title="Generate real-time intelligence summary using Gemini API"
          >
            <BrainCircuit size={14} />
            <span>Synthesis Briefing</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-3.5 py-2 bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            title="Export asset list as Branded PDF Intelligence Report"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-colors"
            title="Export asset ledger data as CSV file"
          >
            <Database size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1a. Register Asset Collapsible Form */}
      {showAddForm && (
        <form onSubmit={handleCreateAsset} className="bg-bg-surface p-6 rounded-2xl border border-border-subtle space-y-4 animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-text-primary flex items-center gap-2">
            <PlusCircle size={16} className="text-accent" />
            <span>New Infrastructure Registration Protocol</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase">Asset Node Name</label>
              <input 
                type="text"
                placeholder="e.g. Karuma Hydro Transmission Tower"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase">Infrastructure Domain</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="Airbase">Airbase / Hangar</option>
                <option value="Port">Maritime / Inland Port</option>
                <option value="Data Center">Strategic Data Center / Telecom Node</option>
                <option value="Mine">Extractives / Mining Concession</option>
                <option value="Power Plant">Energy / Generation Grid Plant</option>
                <option value="Border Post">Border Security Post / Crossing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase">Location / District</label>
              <input 
                type="text"
                placeholder="e.g. Kiryandongo District, Uganda"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase">Sovereign State (Country)</label>
              <input 
                type="text"
                value={newCountry}
                onChange={e => setNewCountry(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-secondary uppercase">Sector Authority / Owner</label>
              <input 
                type="text"
                placeholder="e.g. Uganda Electricity Generation Company"
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary uppercase">Latitude</label>
                <input 
                  type="text"
                  value={newLat}
                  onChange={e => setNewLat(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-text-secondary uppercase">Longitude</label>
                <input 
                  type="text"
                  value={newLng}
                  onChange={e => setNewLng(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-accent text-accent-ink font-semibold text-xs px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Commit Asset Registry Protocol
            </button>
          </div>
        </form>
      )}

      {/* 2. Real-time Metrics Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 text-center">
          <p className="text-xs font-mono uppercase text-success mb-1">Operational</p>
          <p className="font-display text-2xl font-bold text-success tabular-nums">{assets.length > 0 ? `${metrics.operational}%` : '---'}</p>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 text-center">
          <p className="text-xs font-mono uppercase text-warning mb-1">Degraded</p>
          <p className="font-display text-2xl font-bold text-warning tabular-nums">{assets.length > 0 ? `${metrics.watch}%` : '---'}</p>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 text-center">
          <p className="text-xs font-mono uppercase text-danger mb-1">Critical</p>
          <p className="font-display text-2xl font-bold text-danger tabular-nums">{assets.length > 0 ? `${metrics.alert}%` : '---'}</p>
        </div>
      </div>

      {/* Interactive Tactical Radar Map */}
      <div className="bg-bg-surface rounded-2xl p-1.5 overflow-hidden relative border border-border-subtle" style={{ height: '320px' }}>
        <div id="assets-leaflet-map" className="w-full h-full rounded-xl" style={{ minHeight: '100%', zIndex: 1 }} />
      </div>

      {/* 3. Search & Category Filters */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
          <input 
            type="text"
            placeholder="Search Asset Node Name, ID or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary"
          />
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', 'Airbase', 'Port', 'Data Center', 'Mine', 'Power Plant', 'Border Post'].map(type => (
            <button 
              key={type}
              onClick={() => {
                setFilterType(type);
                if (window.navigator?.vibrate) window.navigator.vibrate(5);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                filterType === type
                  ? 'bg-accent text-accent-ink border-accent font-semibold'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:text-text-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Asset List */}
      <div className="space-y-2.5">
        {assets.length === 0 ? (
          <div className="py-16 text-center bg-bg-surface border border-border-subtle rounded-2xl p-8 space-y-4">
            <Shield size={36} className="mx-auto text-text-secondary" />
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold text-text-primary">Asset Ledger is Empty</p>
              <p className="text-xs text-text-secondary">Firestore database is active. Populate node infrastructure registry now.</p>
            </div>
            <button 
              onClick={handleSeedDefaults}
              className="py-2.5 px-5 bg-accent text-accent-ink font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity"
            >
              Initialize Live Default Registry
            </button>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-16 text-center bg-bg-surface border border-border-subtle rounded-2xl">
            <EyeOff size={32} className="mx-auto mb-2 text-text-secondary" />
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">No matching nodes located</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <button 
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="w-full bg-bg-surface hover:bg-bg-elevated/60 border border-border-subtle rounded-2xl p-4 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  asset.status === 'Compromised'
                    ? 'bg-danger/10 border-danger/30'
                    : 'bg-bg-elevated border-border-subtle'
                }`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {asset.name}
                  </h4>
                  <p className="text-xs font-mono text-text-secondary mt-0.5">
                    {asset.id} · {asset.location} ({asset.country})
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-md border inline-block ${getStatusColor(asset.status)}`}>
                  {getStatusLabelText(asset.status)}
                </span>
                <p className="text-[11px] font-mono text-text-secondary mt-1.5 uppercase">{asset.type}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 5. Detail Slide-Over Drawer */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="w-full max-w-lg bg-bg-surface border-l border-border-subtle h-full overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 bg-bg-surface/95 backdrop-blur-md h-16 flex items-center justify-between px-6 border-b border-border-subtle z-10">
                <h3 className="font-display text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Shield size={16} className="text-accent" />
                  <span>Asset Node Controls</span>
                </h3>
                <button 
                  onClick={() => setSelectedAsset(null)} 
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-grow">
                <div className="space-y-3">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">{selectedAsset.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-md border ${getStatusColor(selectedAsset.status)}`}>
                      {getStatusLabelText(selectedAsset.status)}
                    </span>
                    <span className="text-xs font-mono text-text-secondary bg-bg-elevated border border-border-subtle px-2.5 py-1 rounded-md">
                      ID: {selectedAsset.id}
                    </span>
                    <span className="text-xs font-mono text-text-secondary bg-bg-elevated border border-border-subtle px-2.5 py-1 rounded-md">
                      {selectedAsset.type}
                    </span>
                  </div>
                </div>

                {/* Tech Specs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-elevated/60 border border-border-subtle rounded-xl p-4">
                    <p className="text-[11px] font-mono text-text-secondary uppercase mb-1">Coordinates</p>
                    <p className="text-xs font-mono text-text-primary tabular-nums">
                      {selectedAsset.coordinates?.[0]?.toFixed(4)}°N, {selectedAsset.coordinates?.[1]?.toFixed(4)}°E
                    </p>
                  </div>
                  <div className="bg-bg-elevated/60 border border-border-subtle rounded-xl p-4">
                    <p className="text-[11px] font-mono text-text-secondary uppercase mb-1">Sector Authority</p>
                    <p className="text-xs font-mono text-text-primary truncate">{selectedAsset.owner}</p>
                  </div>
                </div>

                {/* REAL-TIME STATUS SWITCH PROTOCOL */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-2">
                    Transition Operational Status
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Select a state below to trigger immediate telemetry updates in the national security database.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleUpdateStatus(selectedAsset.id, 'Operational')}
                      className={`p-3 text-left border flex items-center gap-2.5 transition-colors rounded-xl font-mono text-xs ${
                        selectedAsset.status === 'Operational'
                          ? 'bg-success/15 border-success text-success font-semibold'
                          : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      <span>Operational</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedAsset.id, 'Secured')}
                      className={`p-3 text-left border flex items-center gap-2.5 transition-colors rounded-xl font-mono text-xs ${
                        selectedAsset.status === 'Secured'
                          ? 'bg-bg-elevated border-text-secondary text-text-primary font-semibold'
                          : 'bg-bg-elevated/50 border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Shield size={15} />
                      <span>Under Maintenance</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedAsset.id, 'Under Observation')}
                      className={`p-3 text-left border flex items-center gap-2.5 transition-colors rounded-xl font-mono text-xs ${
                        selectedAsset.status === 'Under Observation'
                          ? 'bg-warning/15 border-warning text-warning font-semibold'
                          : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <Activity size={15} />
                      <span>Degraded / Watch</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedAsset.id, 'Compromised')}
                      className={`p-3 text-left border flex items-center gap-2.5 transition-colors rounded-xl font-mono text-xs ${
                        selectedAsset.status === 'Compromised'
                          ? 'bg-danger/15 border-danger text-danger font-semibold'
                          : 'bg-bg-elevated border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <AlertOctagon size={15} />
                      <span>Critical / Alert</span>
                    </button>
                  </div>
                </div>

                {/* Decommission node */}
                <div className="pt-6 border-t border-border-subtle space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-danger">
                    High Command Escalation
                  </h4>
                  <button 
                    onClick={() => handleDeleteAsset(selectedAsset.id)}
                    className="w-full bg-danger/10 hover:bg-danger/20 text-danger py-3 border border-danger/30 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={15} />
                    <span>Decommission Node From Grid</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK IMPORT MODAL */}
      <AnimatePresence>
        {showBulkImport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowBulkImport(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
              >
                <X size={16} />
              </button>
              
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold text-text-primary flex items-center gap-2">
                  <Database size={16} className="text-accent" />
                  <span>Bulk Infrastructure Import Protocol</span>
                </h3>
                <p className="text-xs font-mono text-text-secondary">
                  Paste JSON array payload to upsert infrastructure nodes.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Provide an array of assets. Existing nodes matching by Name or ID will be updated; otherwise, new nodes will be registered.
                </p>
                <div className="p-3 bg-bg-elevated border border-border-subtle rounded-xl text-[11px] font-mono text-text-secondary select-all">
                  {"[\n  {\n    \"name\": \"Karuma Transmission Substation\",\n    \"type\": \"Power Plant\",\n    \"location\": \"Kiryandongo District\",\n    \"status\": \"Operational\",\n    \"coordinates\": [2.2415, 32.2411],\n    \"country\": \"Uganda\",\n    \"owner\": \"UETCL\"\n  }\n]"}
                </div>
              </div>

              <textarea
                value={bulkJson}
                onChange={e => {
                  setBulkJson(e.target.value);
                  setImportError('');
                }}
                placeholder="Paste your JSON payload array here..."
                className="w-full h-44 bg-bg-elevated border border-border-subtle rounded-xl p-4 font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-none"
              />

              {importStatus && (
                <p className="text-xs font-mono text-accent">{importStatus}</p>
              )}

              {importError && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl">
                  <p className="text-xs font-mono text-danger font-semibold">Import Error:</p>
                  <p className="text-xs font-mono text-danger/90 mt-1">{importError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="px-4 py-2 border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkJson.trim() || !!importStatus}
                  className="px-5 py-2 bg-accent text-accent-ink hover:opacity-90 text-xs font-semibold rounded-xl transition-opacity disabled:opacity-30"
                >
                  Execute Import Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYNTHESIS MIND BRIEFING MODAL */}
      <AnimatePresence>
        {showSynthesisModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-2xl bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-6 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowSynthesisModal(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary z-20 p-1.5 hover:bg-bg-elevated rounded-lg"
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary flex items-center gap-2">
                    <BrainCircuit size={18} className="text-accent" />
                    <span>Synthesis Mind Briefing</span>
                  </h3>
                  <p className="text-xs font-mono text-text-secondary mt-0.5">
                    Cognitive Strategic Infrastructure Matrix
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-bg-elevated p-1 rounded-lg border border-border-subtle mr-8">
                  <button 
                    onClick={() => {
                      setIsDeepMode(false);
                      setBriefing(null);
                    }}
                    className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${!isDeepMode ? 'bg-bg-surface text-text-primary font-medium' : 'text-text-secondary'}`}
                  >
                    Tactical
                  </button>
                  <button 
                    onClick={() => {
                      setIsDeepMode(true);
                      setBriefing(null);
                    }}
                    className={`text-xs font-mono px-2.5 py-1 rounded-md transition-colors ${isDeepMode ? 'bg-accent text-accent-ink font-semibold' : 'text-text-secondary'}`}
                  >
                    Deep Search
                  </button>
                </div>
              </div>

              {briefingLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <BrainCircuit className="absolute inset-0 m-auto text-accent" size={20} />
                  </div>
                  <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">Synthesizing Asset Integrity & Incident Logs...</p>
                </div>
              ) : briefing ? (
                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 report-justified">
                  <div className="bg-bg-elevated/60 border border-border-subtle p-4 rounded-xl">
                    <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md inline-block mb-2">
                      SFC OVERSIGHT BRIEFING
                    </span>
                    <h4 className="font-display text-base font-bold text-text-primary">
                      {briefing.title || 'Dynamic Multi-Domain Security Brief'}
                    </h4>
                    <p className="text-sm text-text-primary/90 leading-relaxed border-l-2 border-accent pl-4 py-1 mt-2 text-justify">
                      "{briefing.threatAssessment}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase text-danger flex items-center gap-1.5">
                        <AlertOctagon size={13} /> Kinetic Hotspots
                      </span>
                      <div className="space-y-2">
                        {briefing.kineticHotspots?.map((hotspot: string, i: number) => (
                          <div key={i} className="p-3 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary leading-relaxed text-justify">
                            {hotspot}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase text-warning flex items-center gap-1.5">
                        <Activity size={13} className="text-warning" /> Asset Vulnerabilities
                      </span>
                      <div className="space-y-2">
                        {briefing.infrastructureVulnerabilities?.map((vuln: string, i: number) => (
                          <div key={i} className="p-3 bg-bg-elevated border border-border-subtle rounded-xl text-xs text-text-primary leading-relaxed text-justify">
                            {vuln}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <span className="text-xs font-mono uppercase text-success flex items-center gap-1.5">
                      <Shield size={13} className="text-success" /> Command Directives
                    </span>
                    <div className="space-y-2">
                      {briefing.strategicRecoms?.map((recom: string, i: number) => (
                        <div key={i} className="p-3 bg-bg-elevated border-l-2 border-l-success rounded-xl text-xs text-text-primary leading-relaxed text-justify">
                          {recom}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
                  <Database size={28} />
                  <p className="text-xs font-mono uppercase">Inquiry failed. No data compiled.</p>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-border-subtle pt-4">
                <button
                  onClick={triggerBriefing}
                  disabled={briefingLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-border-subtle rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  <RefreshCw size={13} className={briefingLoading ? 'animate-spin' : ''} />
                  <span>Synchronize</span>
                </button>
                <button
                  onClick={() => setShowSynthesisModal(false)}
                  className="px-5 py-2 bg-accent text-accent-ink hover:opacity-90 text-xs font-semibold rounded-xl transition-opacity"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIDDEN BRANDED INTEL REPORT FOR PDF GENERATION */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="asset-ledger-pdf-report" className="p-10 bg-white text-slate-900 font-sans" style={{ width: '900px', color: '#1e293b' }}>
          <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">CONFIDENTIAL // EYES ONLY</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">U-ISMS INTEGRATED SECURITY SYSTEMS</h1>
              <h2 className="text-md font-bold tracking-widest text-slate-700 uppercase mt-1">High-Command Strategic Infrastructure Ledger</h2>
            </div>
            <div className="text-right font-mono text-[9px] text-slate-400">
              <p>COMPILED ON: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} UTC</p>
              <p>COMPILER: COMRADE MUGISOLO</p>
              <p>TARGET ACCESS: DIRECTOR OF STRATEGIC OVERSIGHT</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-[10px] mb-8 font-mono">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <th className="p-3">Node ID</th>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Domain Type</th>
                <th className="p-3">Location / Geocoords</th>
                <th className="p-3">Authority / Owner</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap text-slate-500 font-bold">{asset.id}</td>
                  <td className="p-3 font-bold text-slate-800 uppercase">{asset.name}</td>
                  <td className="p-3 text-slate-600">{asset.type}</td>
                  <td className="p-3 text-slate-600">
                    <p>{asset.location}</p>
                    <p className="text-[8px] text-slate-400">{asset.coordinates?.[0]?.toFixed(4)}N / {asset.coordinates?.[1]?.toFixed(4)}E</p>
                  </td>
                  <td className="p-3 text-slate-500 truncate max-w-[150px]">{asset.owner}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
