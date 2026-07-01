
// Fix: Added missing imports for React, Lucide icons, types, components, and services
import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Globe, 
  HardDrive, 
  Map as MapIcon, 
  Users, 
  BrainCircuit, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Menu, 
  X, 
  Bell, 
  Command, 
  Eye, 
  EyeOff, 
  Moon, 
  Sun,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  CheckCircle2,
  MoreVertical,
  MessageSquare,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, Incident, PEPProfile, StrategicAsset } from '../types';
import { StatCard } from './StatCard';
import { SecurityMap } from './SecurityMap';
import { SynthesisMind } from './SynthesisMind';
import { PEPAnalytics } from './PEPAnalytics';
import { StrategicAssetsMap } from './StrategicAssetsMap';
import { Chatbot } from './Chatbot';
import { WorkspaceManager } from './WorkspaceManager';
import { PEPForensics } from './PEPForensics';
import { ThreatHorizon } from './ThreatHorizon';
import { OperationalAuditPanel, logOperationalAction } from './OperationalAuditPanel';
import { FolderOpen, Layers, Search, Terminal } from 'lucide-react';
import { 
  subscribeToIncidents, 
  subscribeToParliamentary,
  subscribeToAssets,
  seedDatabase
} from '../services/firestoreService';
import { TOP_100_UG_POLITICIANS, STRATEGIC_ASSET_SEED } from '../data/seedData';

// --- THEATER STABILITY MATRIX COMPONENT ---
const StabilityStack: React.FC<{ region: string; score: number; trend: 'up' | 'down' | 'stable' }> = ({ region, score, trend }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStabilityMeta = (s: number) => {
    if (s >= 80) return { color: 'text-savanna-sage', bg: 'bg-savanna-sage/10', border: 'border-savanna-sage/20' };
    if (s >= 60) return { color: 'text-nile-amber', bg: 'bg-nile-amber/10', border: 'border-nile-amber/20' };
    if (s >= 40) return { color: 'text-nile-amber', bg: 'bg-nile-amber/15', border: 'border-nile-amber/30' };
    if (s >= 20) return { color: 'text-rift-rust', bg: 'bg-rift-rust/10', border: 'border-rift-rust/20' };
    return { color: 'text-brotherhood-crimson', bg: 'bg-brotherhood-crimson/10', border: 'border-brotherhood-crimson/20' };
  };

  const meta = getStabilityMeta(score);

  return (
    <div className={`transition-all duration-300 border ${meta.bg} ${meta.border} rounded-sm overflow-hidden mb-1.5`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{region}</span>
          <span className={`text-2xl font-black tracking-tighter ${meta.color}`}>{score}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest">Trend</span>
            {trend === 'up' && <TrendingUp size={12} className="text-savanna-sage" />}
            {trend === 'down' && <TrendingUp size={12} className="text-brotherhood-crimson rotate-180" />}
            {trend === 'stable' && <MoreVertical size={12} className="text-crane-grey rotate-90" />}
          </div>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t border-white/5"
          >
            <div className="pt-4 space-y-3">
              <div className="flex justify-between text-[10px] items-center">
                <span className="uppercase font-bold tracking-widest text-crane-grey">Kinetic Friction Points</span>
                <span className="font-mono text-savanna-sage bg-savanna-sage/10 px-2 py-0.5 rounded-full border border-savanna-sage/20">NOMINAL</span>
              </div>
              <div className="flex justify-between text-[10px] items-center">
                <span className="uppercase font-bold tracking-widest text-crane-grey">Diplomatic Pulse</span>
                <span className="text-nile-amber font-black italic">PROXIMAL_THREAT</span>
              </div>
              <div className="bg-black/20 p-3 rounded mt-2">
                 <p className="text-[9px] font-mono leading-relaxed text-pearl-africa/60">
                   Recent OSINT clusters indicate troop movement in the sub-region. Analysis suggests a 64% likelihood of localized instability within T-minus 48 hours.
                 </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- THEATER STABILITY MATRIX RECHARTS COMPONENT ---
interface StabilityMatrixChartsProps {
  incidents: Incident[];
}

const StabilityMatrixCharts: React.FC<StabilityMatrixChartsProps> = ({ incidents }) => {
  const [activeChartTab, setActiveChartTab] = useState<'trends' | 'regional'>('trends');

  // Compute dynamic trends
  const trendData = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      // Elegant high-command mock fallback trend
      return [
        { date: '06/24', 'Kinetic friction': 2, 'Severity Index': 4 },
        { date: '06/25', 'Kinetic friction': 4, 'Severity Index': 9 },
        { date: '06/26', 'Kinetic friction': 3, 'Severity Index': 6 },
        { date: '06/27', 'Kinetic friction': 6, 'Severity Index': 14 },
        { date: '06/28', 'Kinetic friction': 5, 'Severity Index': 11 },
        { date: '06/29', 'Kinetic friction': 8, 'Severity Index': 19 },
        { date: '06/30', 'Kinetic friction': 10, 'Severity Index': 25 },
      ];
    }

    const groups: { [key: string]: { date: string; 'Kinetic friction': number; 'Severity Index': number } } = {};
    incidents.forEach(incident => {
      const rawDate = incident.date || new Date().toISOString().split('T')[0];
      const d = rawDate.split('-').slice(1).join('/'); // MM/DD format
      if (!groups[d]) {
        groups[d] = { date: d, 'Kinetic friction': 0, 'Severity Index': 0 };
      }
      groups[d]['Kinetic friction'] += 1;
      let score = 1;
      if (incident.severity === 'CRITICAL') score = 5;
      else if (incident.severity === 'HIGH') score = 3;
      else if (incident.severity === 'MEDIUM') score = 2;
      groups[d]['Severity Index'] += score;
    });

    return Object.values(groups)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
  }, [incidents]);

  // Compute dynamic regional stability
  const regionalData = useMemo(() => {
    const regions = [
      { region: 'NORTH: KARAMOJA', 'Stability Score': 100, 'Incident Load': 0 },
      { region: 'EAST: ELGON', 'Stability Score': 100, 'Incident Load': 0 },
      { region: 'WEST: ALBERTINE', 'Stability Score': 100, 'Incident Load': 0 },
      { region: 'SOUTH: VICTORIA', 'Stability Score': 100, 'Incident Load': 0 },
    ];

    incidents.forEach(incident => {
      const loc = (incident.location || '').toLowerCase();
      let index = 3; // default South/Victoria
      if (loc.includes('karamoja') || loc.includes('gulu') || loc.includes('north')) index = 0;
      else if (loc.includes('elgon') || loc.includes('mbale') || loc.includes('east')) index = 1;
      else if (loc.includes('albertine') || loc.includes('kasese') || loc.includes('west')) index = 2;

      regions[index]['Incident Load'] += 1;
      let deduct = 10;
      if (incident.severity === 'CRITICAL') deduct = 30;
      else if (incident.severity === 'HIGH') deduct = 20;
      else if (incident.severity === 'MEDIUM') deduct = 12;
      regions[index]['Stability Score'] = Math.max(15, regions[index]['Stability Score'] - deduct);
    });

    return regions;
  }, [incidents]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-kampala-obsidian border border-white/10 p-3 rounded text-[10px] font-mono shadow-2xl">
          <p className="text-crested-gold font-bold mb-1 uppercase tracking-wider">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || '#D4AF37' }} className="uppercase leading-tight mt-0.5">
              {p.name}: <span className="font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="stacked-precision-card p-4 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 space-y-4">
      {/* Tab Selectors */}
      <div className="flex gap-2 bg-black/45 p-1 rounded border border-white/5">
        <button
          onClick={() => setActiveChartTab('trends')}
          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
            activeChartTab === 'trends' ? 'bg-crested-gold text-lake-victoria font-bold' : 'text-crane-grey hover:text-pearl-africa font-medium'
          }`}
        >
          Kinetic Incident Trends
        </button>
        <button
          onClick={() => setActiveChartTab('regional')}
          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
            activeChartTab === 'regional' ? 'bg-crested-gold text-lake-victoria font-bold' : 'text-crane-grey hover:text-pearl-africa font-medium'
          }`}
        >
          Regional Stability Matrix
        </button>
      </div>

      <div className="h-[200px] w-full font-mono text-[9px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartTab === 'trends' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="frictionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C41E3A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="date" stroke="#7A8699" tickLine={false} />
              <YAxis stroke="#7A8699" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="Kinetic friction"
                stroke="#C41E3A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#frictionGrad)"
              />
              <Area
                type="monotone"
                dataKey="Severity Index"
                stroke="#D4AF37"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#severityGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
              <XAxis dataKey="region" stroke="#7A8699" tickFormatter={t => t.split(':')[0]} tickLine={false} />
              <YAxis stroke="#7A8699" tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="square" />
              <Bar dataKey="Stability Score" fill="#3D6B4F" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Incident Load" fill="#A0401A" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="text-[8px] font-mono text-infra-steel uppercase tracking-widest text-center">
        Telemetry synced from Multi-Domain Sensor Array
      </p>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CHAT);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pepProfiles, setPepProfiles] = useState<PEPProfile[]>([]);
  const [assets, setAssets] = useState<StrategicAsset[]>([]);
  
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const handleExportDashboardPDF = async () => {
    if (!dashboardRef.current) {
      alert("Dashboard view reference not found.");
      return;
    }
    
    if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
    
    try {
      const originalElement = dashboardRef.current;
      
      alert("Generating Strategic Briefing PDF Report for offline distribution. Please stand by...");
      
      const canvas = await html2canvas(originalElement, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#0B1120', // Matches Lake Victoria background
        windowWidth: 800,
      });
      
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
      pdf.save(`UISMS_Strategic_Briefing_Mugisolo_${formattedDate}.pdf`);
    } catch (error) {
      console.error("PDF Export Failure:", error);
      alert("Failed to export strategic PDF report.");
    }
  };

  // Operational States
  const [threatLevel, setThreatLevel] = useState(3);
  const [isNightOps, setIsNightOps] = useState(false);
  const [density, setDensity] = useState<'Compact' | 'Standard' | 'Briefing'>('Compact');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'COMMAND_CENTER' | 'MAP_FOCUS' | 'DATA_MATRIX'>('COMMAND_CENTER');
  const [matrixSearch, setMatrixSearch] = useState('');

  // New features state
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeToast, setActiveToast] = useState<Incident | null>(null);
  
  const initialIncidentIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Global search matching logic
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const queryStr = globalSearch.toLowerCase();
    const results: {
      id: string;
      type: 'ASSET' | 'ACTOR' | 'INCIDENT';
      title: string;
      subtitle: string;
      targetView: ViewState;
      originalItem: any;
    }[] = [];

    // Filter Assets
    assets.forEach(asset => {
      if (
        asset.name.toLowerCase().includes(queryStr) ||
        asset.type.toLowerCase().includes(queryStr) ||
        asset.location.toLowerCase().includes(queryStr) ||
        asset.status.toLowerCase().includes(queryStr)
      ) {
        results.push({
          id: `asset-${asset.id}`,
          type: 'ASSET',
          title: asset.name,
          subtitle: `${asset.type} • ${asset.location} (${asset.status})`,
          targetView: ViewState.ASSETS,
          originalItem: asset
        });
      }
    });

    // Filter Actors (PEP)
    pepProfiles.forEach(pep => {
      if (
        pep.name.toLowerCase().includes(queryStr) ||
        (pep.party && pep.party.toLowerCase().includes(queryStr)) ||
        (pep.district && pep.district.toLowerCase().includes(queryStr))
      ) {
        results.push({
          id: `pep-${pep.id}`,
          type: 'ACTOR',
          title: pep.name,
          subtitle: `${pep.party || 'Independent'} • District: ${pep.district || 'N/A'}`,
          targetView: ViewState.ACTORS,
          originalItem: pep
        });
      }
    });

    // Filter Incidents
    incidents.forEach(incident => {
      if (
        incident.location.toLowerCase().includes(queryStr) ||
        incident.type.toLowerCase().includes(queryStr) ||
        incident.description.toLowerCase().includes(queryStr) ||
        incident.severity.toLowerCase().includes(queryStr)
      ) {
        results.push({
          id: `incident-${incident.id}`,
          type: 'INCIDENT',
          title: `${incident.type} in ${incident.location}`,
          subtitle: `${incident.severity} • ${incident.description.substring(0, 45)}...`,
          targetView: ViewState.THEATER,
          originalItem: incident
        });
      }
    });

    return results;
  }, [globalSearch, assets, pepProfiles, incidents]);

  // Real-time Firestore Surveillance Monitor for critical incident toasts
  useEffect(() => {
    if (incidents.length === 0) return;

    if (isFirstLoadRef.current) {
      incidents.forEach(inc => initialIncidentIdsRef.current.add(inc.id));
      isFirstLoadRef.current = false;
      return;
    }

    const newCriticalIncidents = incidents.filter(inc => {
      const isNew = !initialIncidentIdsRef.current.has(inc.id);
      const isHighSeverity = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
      return isNew && isHighSeverity;
    });

    if (newCriticalIncidents.length > 0) {
      const latestNew = newCriticalIncidents[0];
      setActiveToast(latestNew);
      if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
      initialIncidentIdsRef.current.add(latestNew.id);
      
      logOperationalAction(
        `AUTOMATED SURVEILLANCE: Real-time high-severity incident detected in ${latestNew.location}. Type: ${latestNew.type}. [ALERT BANNER DEPLOYED]`,
        'SECURITY',
        'SYS_MONITOR'
      );
    }
  }, [incidents]);

  // Track interface transitions in the audit log
  useEffect(() => {
    logOperationalAction(`Active interface module switched to ${view}`, 'SYSTEM');
  }, [view]);

  // Track threat level manual updates
  useEffect(() => {
    logOperationalAction(`Threat level updated to LEVEL ${threatLevel}`, 'SECURITY');
  }, [threatLevel]);

  useEffect(() => {
    const unsubIncidents = subscribeToIncidents(setIncidents);
    const unsubPep = subscribeToParliamentary(setPepProfiles);
    const unsubAssets = subscribeToAssets(setAssets);

    // Boot Sequence Timer
    const timer = setTimeout(() => setIsBooting(false), 2400);

    return () => { 
      unsubIncidents(); 
      unsubPep(); 
      unsubAssets(); 
      clearTimeout(timer);
    };
  }, []);

  // Threat Banner Logic
  const getThreatMeta = (level: number) => {
    switch(level) {
      case 5: return { color: 'bg-brotherhood-crimson', label: 'LEVEL 5 — CRITICAL', icon: ShieldAlert, shape: 'pentagon' };
      case 4: return { color: 'bg-rift-rust', label: 'LEVEL 4 — HIGH', icon: AlertTriangle, shape: 'diamond' };
      case 3: return { color: 'bg-nile-amber', label: 'LEVEL 3 — ELEVATED', icon: Zap, shape: 'triangle' };
      case 2: return { color: 'bg-nile-amber', label: 'LEVEL 2 — GUARDED', icon: Activity, shape: 'circle-outline' };
      default: return { color: 'bg-savanna-sage', label: 'LEVEL 1 — NORMAL', icon: CheckCircle2, shape: 'circle-outline' };
    }
  };

  const threat = getThreatMeta(threatLevel);

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {(() => {
            switch (view) {
              case ViewState.CHAT:
                return <Chatbot isInline />;
              case ViewState.MAP:
                return <SecurityMap incidents={incidents} onNavigate={setView} fullScreen />;
              case ViewState.ACTORS:
                return <PEPAnalytics peps={pepProfiles} />;
              case ViewState.FORENSICS:
                return <PEPForensics />;
              case ViewState.SYNTHESIS:
                return <SynthesisMind incidents={incidents} peps={pepProfiles} assets={assets} />;
              case ViewState.ASSETS:
                return <StrategicAssetsMap assets={assets} />;
              case ViewState.WORKSPACE:
                return <WorkspaceManager peps={pepProfiles} assets={assets} incidents={incidents} />;
              case ViewState.THEATER:
              default:
                const filteredIncidentsForMatrix = incidents.filter(i => {
                  if (!matrixSearch.trim()) return true;
                  const query = matrixSearch.toLowerCase();
                  return (
                    i.location.toLowerCase().includes(query) ||
                    i.type.toLowerCase().includes(query) ||
                    i.severity.toLowerCase().includes(query) ||
                    i.description.toLowerCase().includes(query)
                  );
                });

                return (
                  <div className="space-y-6 pt-2">
                    {/* Segmented Dashboard Layout View Toggle */}
                    <div className="flex bg-kampala-obsidian/60 p-1 border border-white/5 rounded-sm mb-4 sticky top-1 z-20 backdrop-blur-md shadow-lg">
                      <button
                        onClick={() => {
                          setDashboardMode('COMMAND_CENTER');
                          logOperationalAction('Dashboard switched to Command Center layout', 'SYSTEM');
                        }}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
                          dashboardMode === 'COMMAND_CENTER' 
                            ? 'bg-crested-gold text-lake-victoria font-extrabold shadow-md' 
                            : 'text-crane-grey hover:text-pearl-africa'
                        }`}
                      >
                        <LayoutGrid size={12} />
                        <span>Command Center</span>
                      </button>
                      <button
                        onClick={() => {
                          setDashboardMode('MAP_FOCUS');
                          logOperationalAction('Dashboard switched to Map Focus layout', 'SYSTEM');
                        }}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
                          dashboardMode === 'MAP_FOCUS' 
                            ? 'bg-crested-gold text-lake-victoria font-extrabold shadow-md' 
                            : 'text-crane-grey hover:text-pearl-africa'
                        }`}
                      >
                        <MapIcon size={12} />
                        <span>Map Focus</span>
                      </button>
                      <button
                        onClick={() => {
                          setDashboardMode('DATA_MATRIX');
                          logOperationalAction('Dashboard switched to Data Matrix layout', 'SYSTEM');
                        }}
                        className={`flex-1 py-1.5 flex items-center justify-center gap-2 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
                          dashboardMode === 'DATA_MATRIX' 
                            ? 'bg-crested-gold text-lake-victoria font-extrabold shadow-md' 
                            : 'text-crane-grey hover:text-pearl-africa'
                        }`}
                      >
                        <Activity size={12} />
                        <span>Data Matrix</span>
                      </button>
                    </div>

                    {dashboardMode === 'COMMAND_CENTER' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* 1. Threat Horizon Forecasting Chart */}
                        <ThreatHorizon incidents={incidents} />

                        {/* 2. Theater Stability Matrix */}
                        <section className="space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <div>
                              <h2 className="text-pearl-africa font-black tracking-tighter text-md uppercase leading-none">Theater Stability Grid</h2>
                              <p className="text-[9px] font-mono text-infra-steel uppercase tracking-widest mt-1">Ground Truth Protocol V4.2</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="h-1 w-8 bg-savanna-sage rounded-full" />
                               <LayoutGrid size={16} className="text-crested-gold" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-1.5">
                            <StabilityStack region="NORTH: KARAMOJA" score={31} trend="down" />
                            <StabilityStack region="EAST: ELGON" score={72} trend="stable" />
                            <StabilityStack region="WEST: ALBERTINE" score={89} trend="up" />
                            <StabilityStack region="SOUTH: VICTORIA" score={58} trend="down" />
                          </div>

                          {/* Theater Stability Matrix Recharts */}
                          <div className="mt-4">
                            <StabilityMatrixCharts incidents={incidents} />
                          </div>
                        </section>
                        
                        {/* 3. Tactical Briefing Summary */}
                        <section className="stacked-precision-card p-6 relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-crested-gold" />
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-crested-gold/10 rounded">
                                 <TrendingUp className="text-crested-gold" size={20} />
                              </div>
                              <h3 className="text-[11px] font-black uppercase tracking-widest">Stability Velocity</h3>
                            </div>
                            <span className="text-[18px] font-black text-savanna-sage">+12.4%</span>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-crane-grey uppercase font-bold">24H Differential</span>
                               <span className="text-pearl-africa font-mono text-savanna-sage">+4.2 pts</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-crane-grey uppercase font-bold">Vector Persistence</span>
                               <span className="text-pearl-africa font-mono">HIGH (98%)</span>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}

                    {dashboardMode === 'MAP_FOCUS' && (
                      <div className="animate-fade-in w-full h-full">
                        <SecurityMap incidents={incidents} onNavigate={setView} fullScreen />
                      </div>
                    )}

                    {dashboardMode === 'DATA_MATRIX' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Graphical Analytics */}
                        <section className="space-y-4">
                          <div>
                            <h2 className="text-pearl-africa font-black tracking-tighter text-md uppercase leading-none">Graph Intelligence Matrix</h2>
                            <p className="text-[9px] font-mono text-infra-steel uppercase tracking-widest mt-1">Multi-Domain Time Series Models</p>
                          </div>
                          <ThreatHorizon incidents={incidents} />
                          <StabilityMatrixCharts incidents={incidents} />
                        </section>

                        {/* Tabular Registry Grid */}
                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-pearl-africa font-black tracking-tighter text-md uppercase leading-none">Tabular Registry Matrix</h2>
                              <p className="text-[9px] font-mono text-infra-steel uppercase tracking-widest mt-1">SITREP Database Records ({filteredIncidentsForMatrix.length})</p>
                            </div>
                          </div>

                          {/* Search Filter for Ledger */}
                          <div className="flex items-center relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-crane-grey" />
                            <input
                              type="text"
                              placeholder="Filter registry records..."
                              value={matrixSearch}
                              onChange={(e) => setMatrixSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-kampala-obsidian/80 border border-white/10 rounded font-mono text-[9px] text-pearl-africa placeholder:text-crane-grey focus:outline-none focus:border-crested-gold/40 transition-all"
                            />
                          </div>

                          {/* The Data Grid */}
                          <div className="stacked-precision-card overflow-hidden bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 font-mono">
                            <div className="overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left border-collapse text-[9px]">
                                <thead>
                                  <tr className="border-b border-white/5 bg-black/40 text-crane-grey font-bold uppercase tracking-wider text-[8px]">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Location</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Severity</th>
                                    <th className="p-3 text-right">Fatalities</th>
                                    <th className="p-3 text-right">Injuries</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {filteredIncidentsForMatrix.length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className="p-8 text-center text-crane-grey uppercase tracking-widest text-[9px]">
                                        No registry entries match the query parameters.
                                      </td>
                                    </tr>
                                  ) : (
                                    filteredIncidentsForMatrix.map((inc) => (
                                      <tr key={inc.id} className="hover:bg-white/5 transition-all">
                                        <td className="p-3 whitespace-nowrap text-infra-steel font-bold">{inc.date.split('-').slice(1).join('/')}</td>
                                        <td className="p-3 font-bold text-pearl-africa max-w-[120px] truncate">{inc.location}</td>
                                        <td className="p-3 text-crane-grey">{inc.type}</td>
                                        <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                            inc.severity === 'CRITICAL' ? 'text-brotherhood-crimson bg-brotherhood-crimson/10 border border-brotherhood-crimson/20' :
                                            inc.severity === 'HIGH' ? 'text-rift-rust bg-rift-rust/10 border border-rift-rust/20' :
                                            inc.severity === 'MEDIUM' ? 'text-nile-amber bg-nile-amber/10 border border-nile-amber/20' :
                                            'text-intel-blue bg-intel-blue/10 border border-intel-blue/20'
                                          }`}>
                                            {inc.severity}
                                          </span>
                                        </td>
                                        <td className={`p-3 text-right font-black ${inc.fatalities > 0 ? 'text-brotherhood-crimson' : 'text-crane-grey'}`}>{inc.fatalities}</td>
                                        <td className={`p-3 text-right font-black ${inc.injuries > 0 ? 'text-nile-amber' : 'text-crane-grey'}`}>{inc.injuries}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const isChatView = view === ViewState.CHAT;

  if (isBooting) {
    return (
      <div className="min-h-screen bg-kampala-obsidian flex flex-col items-center justify-center p-8 font-mono overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(113, 128, 150, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(113, 128, 150, 0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="w-full max-w-xs space-y-6 relative z-10">
          <div className="flex flex-col items-center gap-4">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
               className="p-4 bg-intel-blue/10 rounded-full border border-intel-blue/20"
             >
                <BrainCircuit className="text-intel-blue" size={48} />
             </motion.div>
             <div className="text-center">
                <h1 className="text-xl font-black tracking-tighter uppercase mb-1">U-ISMS CORE</h1>
                <p className="text-[10px] text-infra-steel uppercase tracking-[0.3em]">Operational Readiness Protocol</p>
             </div>
          </div>
          <div className="space-y-1">
             <div className="flex justify-between text-[10px]">
                <span className="text-infra-steel">DECRYPTING_LDGR</span>
                <span className="text-stable-sage">OK</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span className="text-infra-steel">SYNCING_THEATER_NODES</span>
                <span className="text-stable-sage">OK</span>
             </div>
             <div className="flex justify-between text-[10px]">
                <span className="text-infra-steel">AI_ANALYST_STABILIZING</span>
                <span className="text-watch-gold">PENDING</span>
             </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: '0%' }}
               transition={{ duration: 2.4, ease: 'easeInOut' }}
               className="h-full w-full bg-intel-blue"
             />
          </div>
          <p className="text-[8px] text-center text-infra-steel uppercase tracking-widest animate-pulse">Initializing encrypted secure link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] bg-lake-victoria flex flex-col ${isNightOps ? 'night-ops-active shadow-[inset_0_0_100px_rgba(255,0,0,0.1)]' : ''}`}>
      {/* 1. Tactical Threat Banner */}
      <div 
        onClick={() => setIsAlertOpen(true)}
        className={`h-1 w-full relative z-[60] ${threat.color} ${threatLevel >= 4 ? 'animate-pulse' : ''}`} 
      />
      
      {/* 2. Top Header */}
      <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-lake-victoria/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-3 -ml-3 text-pearl-africa hover:bg-white/5 rounded-full transition-colors active:scale-90"
          >
            <Menu size={20} className="text-crested-gold" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none glitch-text" data-text="U-ISMS">U-ISMS</h1>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${threat.color} shadow-[0_0_8px_var(--color-crested-gold)] scale-75`} />
              <span className="text-[8px] font-mono font-bold text-crane-grey tracking-widest uppercase">Theater: Alpha_Core</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (filters assets, actors/PEP, and incidents simultaneously) */}
        <div className="flex-grow max-w-[120px] xs:max-w-[180px] sm:max-w-xs mx-3 relative">
          <div className="relative w-full">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-crane-grey" />
            <input
              type="text"
              placeholder="Search assets, actors..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-7 pr-3 py-1 bg-kampala-obsidian/80 border border-white/10 rounded font-mono text-[10px] text-pearl-africa placeholder:text-crane-grey focus:outline-none focus:border-crested-gold/40 transition-all"
            />
            
            {/* Search results dropdown */}
            <AnimatePresence>
              {isSearchFocused && globalSearch.trim().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-kampala-obsidian border border-white/10 rounded shadow-2xl z-50 p-2 space-y-1 divide-y divide-white/5"
                >
                  <div className="text-[8px] font-mono font-bold text-crane-grey uppercase tracking-widest p-1">
                    Matching Records ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-[10px] font-mono text-crane-grey p-2 text-center">
                      No matching records found.
                    </div>
                  ) : (
                    searchResults.map(result => (
                      <button
                        key={result.id}
                        onMouseDown={() => {
                          setView(result.targetView);
                          logOperationalAction(`Search selection triggered navigation: ${result.title} [${result.type}]`, 'USER_QUERY');
                          setGlobalSearch('');
                        }}
                        className="w-full text-left p-1.5 hover:bg-white/5 transition-all flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-pearl-africa truncate">{result.title}</span>
                          <span className={`text-[7px] font-mono font-black px-1 rounded uppercase tracking-wider ${
                            result.type === 'ASSET' ? 'text-intel-blue bg-intel-blue/10 border border-intel-blue/20' :
                            result.type === 'ACTOR' ? 'text-crested-gold bg-crested-gold/10 border border-crested-gold/20' :
                            'text-brotherhood-crimson bg-brotherhood-crimson/10 border border-brotherhood-crimson/20'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-crane-grey truncate">{result.subtitle}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Operational Audit Log Toggle */}
          <button 
            onClick={() => setIsAuditPanelOpen(true)}
            className="p-1.5 border border-white/10 rounded-sm bg-white/5 text-crane-grey hover:text-crested-gold hover:border-crested-gold/30 transition-all flex items-center gap-1 active:scale-95"
            title="Operational Audit Log"
          >
            <Terminal size={14} />
            <span className="text-[8px] font-mono font-black uppercase tracking-wider hidden sm:inline">Audit Log</span>
          </button>
          
          <button 
            onClick={handleExportDashboardPDF}
            className="p-1.5 border border-white/10 rounded-sm bg-white/5 text-crane-grey hover:text-crested-gold hover:border-crested-gold/30 transition-all flex items-center gap-1 active:scale-95"
            title="Export Strategic PDF"
          >
            <Download size={14} />
            <span className="text-[8px] font-mono font-black uppercase tracking-wider hidden sm:inline">Export PDF</span>
          </button>
          <button 
            onClick={() => setThreatLevel(prev => prev >= 5 ? 1 : prev + 1)}
            className="p-2 text-crane-grey hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            {threatLevel >= 4 && <span className="absolute top-1 right-1 w-2 h-2 bg-brotherhood-crimson rounded-full animate-ping" />}
          </button>
          <div className="w-8 h-8 rounded bg-kampala-obsidian border border-white/10 flex items-center justify-center font-mono text-[10px] font-black text-crested-gold">
            UC
          </div>
        </div>
      </header>

      {/* Real-time High-Severity Kinetic Incident Visual Alert Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-brotherhood-crimson border-b border-brotherhood-crimson/20 relative overflow-hidden z-30"
          >
            <div className="max-w-lg mx-auto p-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center flex-shrink-0 border border-brotherhood-crimson text-brotherhood-crimson shadow-[0_0_12px_var(--color-brotherhood-crimson)] animate-pulse">
                <AlertTriangle size={16} className="text-brotherhood-crimson" />
              </div>
              
              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase text-white tracking-widest bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
                    KINETIC_ALERT: {activeToast.severity}
                  </span>
                  <span className="text-[9px] font-mono text-white/60">
                    Location: {activeToast.location}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-white leading-relaxed">
                  {activeToast.description}
                </p>
                <div className="flex items-center gap-3 pt-1.5">
                  <button
                    onClick={() => {
                      setView(ViewState.MAP);
                      setActiveToast(null);
                      logOperationalAction(`Acknowledged critical kinetic alert for ${activeToast.location} and routed to Tactical Map.`, 'SECURITY');
                    }}
                    className="px-2.5 py-1 bg-white text-brotherhood-crimson rounded text-[9px] font-mono font-black uppercase tracking-wider transition-all hover:bg-white/90 active:scale-95 shadow-md"
                  >
                    ACTIVATE SURVEILLANCE FEED
                  </button>
                  <button
                    onClick={() => {
                      setActiveToast(null);
                      logOperationalAction(`Critical kinetic alert for ${activeToast.location} dismissed.`, 'SECURITY');
                    }}
                    className="text-[9px] font-mono font-bold text-white/70 hover:text-white underline"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            </div>
            {/* Glowing warning line design */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Operational Grid */}
      <main ref={dashboardRef} className={`flex-grow ${isChatView ? 'p-0 pb-16 overflow-hidden' : 'p-4 overflow-y-auto pb-32'} max-w-lg mx-auto w-full ${density === 'Compact' ? 'text-xs' : density === 'Briefing' ? 'text-lg' : 'text-base'}`}>
        {!isChatView && (
          <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[9px] font-mono text-crane-grey uppercase tracking-[0.2em]">{view} MODULE // SECURE</span>
              <div className="flex items-center gap-1 font-mono text-[8px] text-crested-gold">
                <span className="animate-pulse">●</span> SYNC_ACTIVE
              </div>
          </div>
        )}
        {renderView()}
      </main>

      {/* 4. Strategic Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-lake-victoria border-t border-white/5 flex items-center px-2 pb-safe z-50">
        {[
          { icon: LayoutGrid, label: 'Theater', view: ViewState.THEATER },
          { icon: HardDrive, label: 'Assets', view: ViewState.ASSETS },
          { icon: MapIcon, label: 'Tactical', view: ViewState.MAP },
          { icon: Users, label: 'Actors', view: ViewState.ACTORS },
          { icon: Activity, label: 'Forensics', view: ViewState.FORENSICS },
          { icon: BrainCircuit, label: 'Synthesis', view: ViewState.SYNTHESIS },
          { icon: FolderOpen, label: 'Command', view: ViewState.WORKSPACE },
        ].map((item) => (
          <button 
            key={item.label}
            onClick={() => {
              setView(item.view);
              // Simulated haptic feedback
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative py-2 ${view === item.view ? 'text-crested-gold' : 'text-crane-grey'}`}
          >
            <item.icon size={18} strokeWidth={view === item.view ? 3 : 2} className="transition-transform duration-300 transform active:scale-75" />
            <span className="text-[7px] font-black uppercase tracking-widest leading-none mt-1">{item.label}</span>
            {view === item.view && (
              <motion.div 
                layoutId="nav-glow" 
                className="absolute inset-0 bg-crested-gold/5 rounded-lg -z-10 blur-xl" 
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            {view === item.view && <motion.div layoutId="nav-dot" className="w-3 h-0.5 rounded-full bg-crested-gold absolute bottom-2" />}
          </button>
        ))}
      </nav>

      {/* 5. Command Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70]"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-lake-victoria border-r border-white/5 z-[80] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                   <Command className="text-crested-gold" size={24} />
                   <h2 className="text-sm font-black uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">Command Interface</h2>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 border border-white/5 rounded-full active:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-grow space-y-12 overflow-y-auto custom-scrollbar pr-2">
                <section>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-crane-grey mb-6 border-b border-white/5 pb-2">Operational Controls</h4>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsNightOps(!isNightOps)}
                      className={`w-full flex items-center justify-between p-4 stacked-precision-card ${isNightOps ? 'border-brotherhood-crimson/30' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <Moon size={18} className={isNightOps ? 'text-brotherhood-crimson' : 'text-crested-gold'} />
                        <span className="text-xs font-black uppercase tracking-widest">Night Ops Protocol</span>
                      </div>
                      <div className={`w-10 h-5 rounded-sm p-1 transition-colors ${isNightOps ? 'bg-brotherhood-crimson/20 border border-brotherhood-crimson/50' : 'bg-lake-victoria border border-white/10'}`}>
                         <motion.div 
                          animate={{ x: isNightOps ? 20 : 0 }}
                          className={`w-2.5 h-full rounded-sm ${isNightOps ? 'bg-brotherhood-crimson' : 'bg-crane-grey'}`} 
                         />
                      </div>
                    </button>
                    
                    <div className="bg-kampala-obsidian border border-white/5 p-1 flex gap-1 rounded-sm">
                      {['Compact', 'Standard', 'Briefing'].map(d => (
                        <button 
                          key={d}
                          onClick={() => setDensity(d as any)}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter transition-all ${density === d ? 'bg-crested-gold text-lake-victoria font-extrabold' : 'text-crane-grey hover:text-pearl-africa'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => {
                        setIsAuditPanelOpen(true);
                        setIsDrawerOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 stacked-precision-card text-pearl-africa hover:text-crested-gold hover:border-crested-gold/30 transition-all active:scale-95 text-left"
                    >
                      <Terminal size={18} className="text-crested-gold animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest">Operational Audit Panel</span>
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-crane-grey mb-6 border-b border-white/5 pb-2">Node Presence</h4>
                  <div className="space-y-4">
                    {[
                      { name: 'SFC_DIRECTOR', status: 'Theater Alpha', role: 'HQ' },
                      { name: 'ANALYST_09', status: 'Synthesis AI', role: 'Intel' },
                      { name: 'RANGER_COMMAND', status: 'Tactical Map', role: 'Field' },
                    ].map(user => (
                      <div key={user.name} className="flex items-center gap-4 group">
                        <div className="relative">
                           <div className="w-10 h-10 rounded-sm bg-kampala-obsidian border border-white/10 flex items-center justify-center font-mono text-[10px] text-crane-grey">
                             {user.name.slice(0, 2)}
                           </div>
                           <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-savanna-sage border-2 border-lake-victoria shadow-[0_0_8px_var(--color-savanna-sage)]" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-black uppercase tracking-widest">{user.name}</p>
                          <p className="text-[10px] text-crane-grey font-mono uppercase">{user.status} <span className="opacity-30 mx-2">|</span> {user.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-auto border-t border-white/5 pt-8 flex items-center gap-5">
                <div className="w-12 h-12 rounded-sm bg-kampala-obsidian border border-white/5 flex items-center justify-center font-mono text-sm font-black text-crested-gold shadow-inner">
                    UG
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-[0.2em] leading-tight">National Security Grid</p>
                   <p className="text-[9px] text-savanna-sage font-mono uppercase tracking-widest mt-1">Status: Operational</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 6. Alert Cascade - Full-screen Interstitial for level 5 */}
      <AnimatePresence>
        {isAlertOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-brotherhood-crimson text-white p-10 flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative mb-12"
            >
               <ShieldAlert size={120} className="relative z-10" />
               <div className="absolute inset-0 bg-white blur-3xl opacity-30 animate-pulse" />
            </motion.div>

            <div className="space-y-4 mb-20 max-w-xs">
              <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">CRITICAL ESCALATION</h2>
              <div className="h-1 w-full bg-white/20">
                 <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-80">Threat Level Five Active</p>
            </div>

            <p className="text-lg font-bold leading-tight max-w-sm mb-16 uppercase tracking-tight">
              A kinetic breach of Theater Alpha core perimeter has been verified by multi-domain sensors. Ground truth stability score degraded to CRITICAL (12%).
            </p>

            <div className="w-full max-w-xs space-y-4">
              <button 
                onClick={() => setIsAlertOpen(false)}
                className="w-full py-5 bg-white text-brotherhood-crimson font-black uppercase tracking-[0.3em] text-xs rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-transform"
              >
                Acknowledge Threat
              </button>
              <button className="w-full py-4 border border-white/30 font-black uppercase tracking-[0.3em] text-[10px] rounded-sm hover:bg-white/10 transition-colors">
                Initiate Protocol 44
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view !== ViewState.CHAT && <Chatbot />}

      {/* 7. Operational Session Audit Log Panel */}
      <OperationalAuditPanel isOpen={isAuditPanelOpen} onClose={() => setIsAuditPanelOpen(false)} />
    </div>
  );
};
