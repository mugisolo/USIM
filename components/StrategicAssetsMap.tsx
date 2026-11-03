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
  EyeOff,
  Download,
  BrainCircuit,
  Sparkles,
  Cpu,
  Globe,
  FileText,
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
        
        // Coordinates validation
        let coords: [number, number] = [0.3476, 32.5825]; // default Kampala
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
        
        // Type validation
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
        
        // Status validation
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

      {/* Strategic Actions Toolbar */}
      <div className="bg-kampala-obsidian/45 border border-white/5 p-2.5 rounded flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* 1. Bulk Import Button */}
          <button
            onClick={() => {
              setShowBulkImport(true);
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-intel-blue/15 hover:bg-intel-blue/30 border border-intel-blue/20 text-intel-blue rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all"
            title="Bulk import assets from JSON string"
          >
            <Database size={12} />
            <span>Bulk Import (JSON)</span>
          </button>

          {/* 2. Synthesis Mind Briefing */}
          <button
            onClick={() => {
              setShowSynthesisModal(true);
              triggerBriefing();
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-crested-gold/15 hover:bg-crested-gold/30 border border-crested-gold/20 text-crested-gold rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all animate-pulse"
            title="Generate real-time intelligence summary using Gemini API"
          >
            <BrainCircuit size={12} />
            <span>Synthesis Briefing</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* 3. Export PDF Report */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-pearl-africa hover:text-crested-gold rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all disabled:opacity-50"
            title="Export asset list as Branded PDF Intelligence Report"
          >
            <Download size={12} />
            <span>Export Report (PDF)</span>
          </button>

          {/* 4. Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-pearl-africa hover:text-crested-gold rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all"
            title="Export asset ledger data as CSV file"
          >
            <Database size={12} />
            <span>Export Ledger (CSV)</span>
          </button>
        </div>
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
      {/* BULK IMPORT MODAL */}
      <AnimatePresence>
        {showBulkImport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-kampala-obsidian border border-white/10 rounded-sm p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowBulkImport(false)}
                className="absolute top-4 right-4 text-crane-grey hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-crested-gold flex items-center gap-2">
                  <Database size={14} />
                  Bulk Infrastructure Import Protocol
                </h3>
                <p className="text-[10px] font-mono text-infra-steel uppercase tracking-wider">
                  Paste JSON array payload to upsert infrastructure nodes.
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-crane-grey leading-relaxed">
                  Provide an array of assets. Existing nodes matching by Name or ID will be updated; otherwise, new nodes will be registered.
                </p>
                <div className="p-2 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-infra-steel select-all">
                  Example format: <br/>
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
                className="w-full h-44 bg-lake-victoria/80 border border-white/15 rounded-sm p-4 font-mono text-[10px] text-pearl-africa focus:outline-none focus:border-crested-gold resize-none"
              />

              {importStatus && (
                <p className="text-[10px] font-mono text-crested-gold animate-pulse">{importStatus}</p>
              )}

              {importError && (
                <div className="p-3 bg-brotherhood-crimson/15 border border-brotherhood-crimson/20 rounded-sm">
                  <p className="text-[9px] font-mono text-brotherhood-crimson leading-tight uppercase font-black">IMPORT INTERFERENCE DETECTED:</p>
                  <p className="text-[9px] font-mono text-brotherhood-crimson/80 leading-relaxed mt-1">{importError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="px-4 py-2 border border-white/10 text-crane-grey hover:text-white rounded-sm text-[9px] font-mono font-black uppercase tracking-widest transition-colors"
                >
                  Abstain
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkJson.trim() || !!importStatus}
                  className="px-5 py-2 bg-crested-gold text-lake-victoria hover:opacity-90 active:scale-95 text-[9px] font-mono font-black uppercase tracking-widest rounded-sm transition-all disabled:opacity-30"
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-kampala-obsidian border border-white/10 rounded-sm p-6 space-y-6 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowSynthesisModal(false)}
                className="absolute top-4 right-4 text-crane-grey hover:text-white z-20 p-1.5 hover:bg-white/5 rounded-sm"
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-crested-gold flex items-center gap-2">
                    <BrainCircuit size={16} className="text-crested-gold animate-pulse" />
                    Synthesis Mind Briefing
                  </h3>
                  <p className="text-[9px] font-mono text-infra-steel uppercase tracking-[0.3em] mt-1">
                    Cognitive Strategic Intelligence Matrix
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-sm border border-white/5 mr-8">
                  <button 
                    onClick={() => {
                      setIsDeepMode(false);
                      setBriefing(null);
                    }}
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm transition-all ${!isDeepMode ? 'bg-intel-blue text-white' : 'text-crane-grey'}`}
                  >
                    Tactical
                  </button>
                  <button 
                    onClick={() => {
                      setIsDeepMode(true);
                      setBriefing(null);
                    }}
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm transition-all ${isDeepMode ? 'bg-purple-600 text-white' : 'text-crane-grey'}`}
                  >
                    Deep Search
                  </button>
                </div>
              </div>

              {briefingLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-crested-gold border-t-transparent rounded-full animate-spin" />
                    <BrainCircuit className="absolute inset-0 m-auto text-crested-gold animate-pulse" size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[9px] text-crested-gold uppercase tracking-[0.2em] animate-pulse">Running Cognitive Friction Synthesis...</p>
                    <p className="text-[8px] text-crane-grey uppercase font-mono">Synthesizing Asset Integrity and Incident Logs</p>
                  </div>
                </div>
              ) : briefing ? (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-lake-victoria/40 border border-white/5 p-4 rounded-sm">
                    <span className="text-[8px] font-mono font-black text-crested-gold uppercase tracking-widest bg-crested-gold/10 px-2 py-0.5 rounded-sm inline-block mb-3">
                      SFC OVERSIGHT BRIEFING DECREE
                    </span>
                    <h4 className="text-md font-black text-pearl-africa uppercase tracking-tight leading-snug">
                      {briefing.title || 'Dynamic Multi-Domain Security Brief'}
                    </h4>
                    <p className="text-[11px] text-pearl-africa/90 font-serif leading-relaxed italic border-l border-crested-gold/30 pl-4 py-1 mt-3">
                      "{briefing.threatAssessment}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-brotherhood-crimson tracking-widest flex items-center gap-1.5">
                        <AlertOctagon size={12} /> Escalatory / Kinetic Hotspots
                      </span>
                      <div className="space-y-1.5">
                        {briefing.kineticHotspots?.map((hotspot: string, i: number) => (
                          <div key={i} className="p-2.5 bg-black/25 border border-white/5 rounded-sm text-[10px] text-crane-grey leading-relaxed">
                            {hotspot}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-nile-amber tracking-widest flex items-center gap-1.5">
                        <Activity size={12} className="text-nile-amber" /> Asset Vulnerabilities
                      </span>
                      <div className="space-y-1.5">
                        {briefing.infrastructureVulnerabilities?.map((vuln: string, i: number) => (
                          <div key={i} className="p-2.5 bg-black/25 border border-white/5 rounded-sm text-[10px] text-crane-grey leading-relaxed">
                            {vuln}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-black uppercase text-savanna-sage tracking-widest flex items-center gap-1.5">
                      <Shield size={12} className="text-savanna-sage" /> Command Directives & Maneuvers
                    </span>
                    <div className="space-y-1.5">
                      {briefing.strategicRecoms?.map((recom: string, i: number) => (
                        <div key={i} className="p-3 bg-white/5 border-l-2 border-l-savanna-sage rounded-sm text-[10px] text-pearl-africa leading-snug">
                          {recom}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-black/55 border border-white/5 rounded-sm flex items-center justify-between">
                    <span className="text-[8px] font-mono text-infra-steel uppercase">PRESIDENTIAL VERDICT BRIEF:</span>
                    <span className="text-[10px] font-bold text-crested-gold italic">"{briefing.summary}"</span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center opacity-35 flex flex-col items-center justify-center gap-2">
                  <Database size={32} />
                  <p className="text-[9px] font-black uppercase tracking-widest">Inquiry failed. No data compiled.</p>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <button
                  onClick={triggerBriefing}
                  disabled={briefingLoading}
                  className="flex items-center gap-1 px-3 py-1.5 border border-white/10 hover:border-crested-gold/30 rounded-sm text-[9px] font-mono font-black uppercase tracking-wider text-crane-grey hover:text-crested-gold transition-all"
                >
                  <RefreshCw size={11} className={briefingLoading ? 'animate-spin' : ''} />
                  <span>Synchronize Intelligence</span>
                </button>
                <button
                  onClick={() => setShowSynthesisModal(false)}
                  className="px-5 py-1.5 bg-crested-gold text-lake-victoria hover:opacity-95 text-[9px] font-mono font-black uppercase tracking-widest rounded-sm transition-colors"
                >
                  Dismiss Report
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

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded text-center">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Node Count</p>
              <p className="text-xl font-black text-slate-800">{assets.length}</p>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded text-center">
              <p className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Nominal / Secure</p>
              <p className="text-xl font-black text-emerald-700">
                {assets.filter(a => a.status === 'Operational' || a.status === 'Secured').length}
              </p>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded text-center">
              <p className="text-[9px] font-black uppercase text-amber-500 tracking-wider">Under Observation</p>
              <p className="text-xl font-black text-amber-600">
                {assets.filter(a => a.status === 'Under Observation').length}
              </p>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded text-center">
              <p className="text-[9px] font-black uppercase text-rose-600 tracking-wider">Compromised / Alert</p>
              <p className="text-xl font-black text-rose-700">
                {assets.filter(a => a.status === 'Compromised').length}
              </p>
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
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      asset.status === 'Operational' || asset.status === 'Secured' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                      asset.status === 'Under Observation' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                      'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-200 pt-6 mt-12 flex justify-between items-start">
            <div className="space-y-1 text-[9px] text-slate-400 uppercase font-mono">
              <p>SYSTEM SECURITY CHECKSUM: {Math.random().toString(36).substring(7).toUpperCase()}</p>
              <p>DECREE CLASSIFICATION: CLASS-A INTEL-GRADE</p>
              <p>VERIFIED DOMAIN SURVEILLANCE NODE PROXIES ACTIVE</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-serif italic text-slate-500 font-bold">Comrade Mugisolo</p>
              <p className="text-[8px] font-mono text-slate-400 uppercase mt-1">DIRECTOR OF STRATEGIC OVERSIGHT // SIGN-OFF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
