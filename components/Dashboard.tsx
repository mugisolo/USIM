
// Fix: Added missing imports for React, Lucide icons, types, components, and services
import React, { useState, useEffect, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Markdown from 'react-markdown';
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
  Download,
  ShieldCheck,
  LogIn,
  LogOut,
  UserCheck,
  Plus,
  Radio,
  ExternalLink,
  Sparkles,
  Compass,
  RefreshCw,
  Loader2,
  MapPin,
  Trash2,
  FolderOpen,
  Layers,
  Search,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, Incident, PEPProfile, StrategicAsset } from '../types';
import { StatCard } from './StatCard';
import { SecurityMap } from './SecurityMap';
import { SynthesisMind } from './SynthesisMind';
import { PEPAnalytics } from './PEPAnalytics';
import { StrategicAssetsMap } from './StrategicAssetsMap';
import { Chatbot } from './Chatbot';
import { PEPForensics } from './PEPForensics';
import { ThreatHorizon } from './ThreatHorizon';
import { OperationalAuditPanel, logOperationalAction } from './OperationalAuditPanel';
import { 
  subscribeToIncidents, 
  subscribeToParliamentary,
  subscribeToAssets,
  addIncidentToDb,
  deleteIncidentFromDb,
  seedDatabase
} from '../services/firestoreService';
import {
  fetchMapsIntelligence,
  fetchSearchIntelligence,
  generateSynthesisMindBriefing
} from '../services/geminiService';
import { auth, loginWithGoogle, logout } from '../services/authService';
import { onAuthStateChanged, User } from 'firebase/auth';
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
  const [pdfExportStatus, setPdfExportStatus] = useState<string | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement | null>(null);

  const handleExportDashboardPDF = async () => {
    if (!dashboardRef.current) {
      setPdfExportStatus("Dashboard reference unavailable.");
      setTimeout(() => setPdfExportStatus(null), 3000);
      return;
    }
    
    if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
    
    try {
      const originalElement = dashboardRef.current;
      setPdfExportStatus("Generating Strategic Briefing PDF...");
      
      const canvas = await html2canvas(originalElement, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#0B1120', // Matches Lake Victoria background
        windowWidth: 1280,
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
      setPdfExportStatus("PDF Briefing Exported");
      setTimeout(() => setPdfExportStatus(null), 3500);
    } catch (error) {
      console.error("PDF Export Failure:", error);
      setPdfExportStatus("PDF Export Failed");
      setTimeout(() => setPdfExportStatus(null), 3500);
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

  // Grid Pillar 1: Map Container & Google Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState('Kampala-Entebbe Strategic Corridor & Aviation Logistics');
  const [mapsIntelLoading, setMapsIntelLoading] = useState(false);
  const [mapsIntelResult, setMapsIntelResult] = useState<{
    text: string;
    links: { title: string; uri: string; snippet?: string }[];
  } | null>(null);

  // Grid Pillar 2: Real-Time Incident Feed & Google Search Grounding State
  const [incidentFeedFilter, setIncidentFeedFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [incidentFeedSearch, setIncidentFeedSearch] = useState('');
  const [isLoggingIncident, setIsLoggingIncident] = useState(false);
  const [newIncidentDraft, setNewIncidentDraft] = useState({
    location: '',
    type: 'Security' as Incident['type'],
    severity: 'HIGH' as NonNullable<Incident['severity']>,
    description: '',
    fatalities: 0,
    injuries: 0,
  });
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintResult, setOsintResult] = useState<{
    text: string;
    sources: { title: string; uri: string }[];
  } | null>(null);

  // Grid Pillar 3: Strategic Intelligence Panel State
  const [activeIntelTab, setActiveIntelTab] = useState<'BRIEFING' | 'STABILITY' | 'ANALYST_CHAT'>('BRIEFING');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [strategicBriefing, setStrategicBriefing] = useState<{
    title: string;
    threatAssessment: string;
    kineticHotspots: string[];
    infrastructureVulnerabilities: string[];
    strategicRecoms: string[];
    summary: string;
  } | null>(null);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isDirector = currentUser?.email === 'mugisolo@gmail.com';

  // New features state
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeToast, setActiveToast] = useState<Incident | null>(null);
  
  const initialIncidentIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const handleRunMapsGrounding = async (customQuery?: string) => {
    const q = customQuery || mapsQuery;
    if (!q.trim() || mapsIntelLoading) return;
    setMapsIntelLoading(true);
    logOperationalAction(`Executed Google Maps Grounding recon: "${q}"`, 'USER_QUERY');
    try {
      const res = await fetchMapsIntelligence(q, 0.3476, 32.5825);
      if (res) setMapsIntelResult(res);
    } finally {
      setMapsIntelLoading(false);
    }
  };

  const handleRunOsintSweep = async (customQuery?: string) => {
    const q = customQuery || 'Uganda national security, border stability, and critical infrastructure incidents';
    if (osintLoading) return;
    setOsintLoading(true);
    logOperationalAction(`Executed Google Search Grounding OSINT sweep: "${q}"`, 'SECURITY');
    try {
      const res = await fetchSearchIntelligence(q);
      if (res) setOsintResult(res);
    } finally {
      setOsintLoading(false);
    }
  };

  const handleGenerateStrategicBriefing = async () => {
    if (briefingLoading) return;
    setBriefingLoading(true);
    logOperationalAction('Generated High-Command Synthesis Mind Strategic Briefing', 'SYSTEM');
    try {
      const res = await generateSynthesisMindBriefing(incidents, pepProfiles, assets, true);
      if (res) setStrategicBriefing(res);
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleCreateRealtimeIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentDraft.location.trim() || !newIncidentDraft.description.trim()) return;
    const created: Incident = {
      id: `inc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      location: newIncidentDraft.location.trim(),
      type: newIncidentDraft.type,
      severity: newIncidentDraft.severity,
      description: newIncidentDraft.description.trim(),
      fatalities: Number(newIncidentDraft.fatalities) || 0,
      injuries: Number(newIncidentDraft.injuries) || 0,
      latitude: 0.3476 + (Math.random() - 0.5) * 1.4,
      longitude: 32.5825 + (Math.random() - 0.5) * 1.4,
      verified: true,
    };
    setIncidents(prev => [created, ...prev]);
    await addIncidentToDb(created);
    logOperationalAction(`Logged real-time incident in ${created.location} [${created.severity}]`, 'SECURITY');
    setNewIncidentDraft({
      location: '',
      type: 'Security',
      severity: 'HIGH',
      description: '',
      fatalities: 0,
      injuries: 0,
    });
    setIsLoggingIncident(false);
  };

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
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    // Boot Sequence Timer
    const timer = setTimeout(() => setIsBooting(false), 1200);

    return () => { 
      unsubIncidents(); 
      unsubPep(); 
      unsubAssets(); 
      unsubAuth();
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

  const filteredRealtimeIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSeverity = incidentFeedFilter === 'ALL' || inc.severity === incidentFeedFilter;
      if (!matchesSeverity) return false;
      if (!incidentFeedSearch.trim()) return true;
      const q = incidentFeedSearch.toLowerCase();
      return (
        inc.location.toLowerCase().includes(q) ||
        inc.type.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q)
      );
    });
  }, [incidents, incidentFeedFilter, incidentFeedSearch]);

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {(() => {
            switch (view) {
              case ViewState.CHAT:
                return (
                  <div className="h-[calc(100dvh-9.5rem)] min-h-[560px] w-full flex flex-col border border-white/10 rounded-sm overflow-hidden shadow-2xl bg-kampala-obsidian">
                    <Chatbot isInline />
                  </div>
                );
              case ViewState.MAP:
                return <SecurityMap incidents={incidents} onNavigate={setView} fullScreen />;
              case ViewState.ACTORS:
                return <PEPAnalytics peps={pepProfiles} />;
              case ViewState.FORENSICS:
                return <PEPForensics />;
              case ViewState.SYNTHESIS:
                return <SynthesisMind incidents={incidents} peps={pepProfiles} assets={assets} />;
              case ViewState.ASSETS:
                return <StrategicAssetsMap assets={assets} peps={pepProfiles} incidents={incidents} />;
              case ViewState.THEATER:
              default: {
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

                const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
                const operationalAssetsCount = assets.filter(a => a.status === 'OPERATIONAL').length;

                return (
                  <div className="space-y-6 pt-1">
                    {/* Top Control Strip & Mode Switcher */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-kampala-obsidian/80 p-3 border border-white/10 rounded-sm backdrop-blur-md shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-8 bg-crested-gold rounded-xs shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-pearl-africa font-black tracking-tight text-sm md:text-base uppercase leading-none">
                              National Strategic Command Grid
                            </h2>
                            <span className="px-1.5 py-0.5 text-[8px] font-mono font-black uppercase bg-crested-gold/15 text-crested-gold border border-crested-gold/30 rounded">
                              ALPHA_CORE // LIVE
                            </span>
                          </div>
                          <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest mt-1">
                            Integrated Geospatial Map • Real-Time Kinetic Feed • Strategic Synthesis Intelligence
                          </p>
                        </div>
                      </div>

                      <div className="flex bg-lake-victoria/90 p-1 border border-white/10 rounded-sm self-start md:self-auto">
                        <button
                          onClick={() => {
                            setDashboardMode('COMMAND_CENTER');
                            logOperationalAction('Dashboard switched to Command Center layout', 'SYSTEM');
                          }}
                          className={`px-3 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
                            dashboardMode === 'COMMAND_CENTER' 
                              ? 'bg-crested-gold text-lake-victoria font-extrabold shadow-md' 
                              : 'text-crane-grey hover:text-pearl-africa'
                          }`}
                        >
                          <LayoutGrid size={12} />
                          <span>Command Grid</span>
                        </button>
                        <button
                          onClick={() => {
                            setDashboardMode('MAP_FOCUS');
                            logOperationalAction('Dashboard switched to Map Focus layout', 'SYSTEM');
                          }}
                          className={`px-3 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
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
                          className={`px-3 py-1.5 flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-sm ${
                            dashboardMode === 'DATA_MATRIX' 
                              ? 'bg-crested-gold text-lake-victoria font-extrabold shadow-md' 
                              : 'text-crane-grey hover:text-pearl-africa'
                          }`}
                        >
                          <Activity size={12} />
                          <span>Data Matrix</span>
                        </button>
                      </div>
                    </div>

                    {dashboardMode === 'COMMAND_CENTER' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Executive Telemetry KPI Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="stacked-precision-card p-4 bg-kampala-obsidian/90 border border-white/10 border-l-2 border-l-brotherhood-crimson">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crane-grey">Active Incidents</span>
                              <ShieldAlert size={14} className="text-brotherhood-crimson" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-2xl font-black font-mono text-pearl-africa">{incidents.length}</span>
                              <span className="text-[9px] font-mono font-bold text-brotherhood-crimson">
                                {criticalCount} CRITICAL/HIGH
                              </span>
                            </div>
                          </div>

                          <div className="stacked-precision-card p-4 bg-kampala-obsidian/90 border border-white/10 border-l-2 border-l-crested-gold">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crane-grey">Strategic Assets</span>
                              <HardDrive size={14} className="text-crested-gold" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-2xl font-black font-mono text-pearl-africa">{assets.length}</span>
                              <span className="text-[9px] font-mono font-bold text-savanna-sage">
                                {operationalAssetsCount} NOMINAL
                              </span>
                            </div>
                          </div>

                          <div className="stacked-precision-card p-4 bg-kampala-obsidian/90 border border-white/10 border-l-2 border-l-intel-blue">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crane-grey">PEP Dossiers</span>
                              <Users size={14} className="text-intel-blue" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-2xl font-black font-mono text-pearl-africa">{pepProfiles.length}</span>
                              <span className="text-[9px] font-mono font-bold text-intel-blue">
                                TIER 1-5 TRACKED
                              </span>
                            </div>
                          </div>

                          <div className="stacked-precision-card p-4 bg-kampala-obsidian/90 border border-white/10 border-l-2 border-l-savanna-sage">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crane-grey">Sovereign Stability</span>
                              <TrendingUp size={14} className="text-savanna-sage" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-2xl font-black font-mono text-savanna-sage">84.2%</span>
                              <span className="text-[9px] font-mono font-bold text-crested-gold">
                                {threat.label.split('—')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* PRIMARY 12-COLUMN TACTICAL GRID: MAP CONTAINER (7 COLS) + REAL-TIME INCIDENT FEED (5 COLS) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                          {/* PILLAR 1: INTERACTIVE MAP CONTAINER + GOOGLE MAPS GROUNDING */}
                          <section className="lg:col-span-7 flex flex-col bg-kampala-obsidian border border-white/10 rounded-sm overflow-hidden shadow-2xl">
                            {/* Section Header */}
                            <div className="p-4 border-b border-white/10 bg-lake-victoria/60 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded bg-crested-gold/15 border border-crested-gold/30 text-crested-gold">
                                  <MapIcon size={15} />
                                </div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-wider text-pearl-africa">
                                    Geospatial Surveillance & Tactical Map Container
                                  </h3>
                                  <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest">
                                    Live Kinetic Coordinates & Google Maps Grounding (`gemini-3.8-flash`)
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setView(ViewState.ASSETS)}
                                  className="px-2.5 py-1 bg-white/5 hover:bg-crested-gold/20 border border-white/10 hover:border-crested-gold/40 rounded text-[9px] font-mono font-bold text-pearl-africa hover:text-crested-gold transition-all"
                                >
                                  ASSET LEDGER MAP
                                </button>
                                <button
                                  onClick={() => setView(ViewState.MAP)}
                                  className="px-2.5 py-1 bg-crested-gold/15 hover:bg-crested-gold text-crested-gold hover:text-lake-victoria border border-crested-gold/30 rounded text-[9px] font-mono font-black transition-all"
                                >
                                  FULLSCREEN THEATER
                                </button>
                              </div>
                            </div>

                            {/* Interactive SecurityMap Viewport */}
                            <div className="p-3 flex-grow">
                              <SecurityMap
                                incidents={incidents}
                                onUpdateIncidents={setIncidents}
                                onNavigate={setView}
                              />
                            </div>

                            {/* Google Maps Grounding Corridor Reconnaissance Bar */}
                            <div className="p-4 border-t border-white/10 bg-lake-victoria/90 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crested-gold flex items-center gap-1.5">
                                  <Compass size={12} />
                                  Google Maps Grounding Reconnaissance
                                </span>
                                <div className="flex items-center gap-1.5 overflow-x-auto">
                                  {[
                                    'Kampala-Entebbe Corridor',
                                    'Karuma Hydroelectric Dam',
                                    'Mpondwe Border Sector',
                                  ].map((preset) => (
                                    <button
                                      key={preset}
                                      onClick={() => {
                                        setMapsQuery(preset);
                                        handleRunMapsGrounding(preset);
                                      }}
                                      className="px-2 py-0.5 bg-white/5 hover:bg-crested-gold/15 border border-white/10 hover:border-crested-gold/30 rounded text-[8px] font-mono text-crane-grey hover:text-pearl-africa whitespace-nowrap transition-all"
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={mapsQuery}
                                  onChange={(e) => setMapsQuery(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleRunMapsGrounding()}
                                  placeholder="Query Ugandan sector, corridor, or facility via Google Maps Grounding..."
                                  className="flex-1 bg-kampala-obsidian border border-white/10 rounded px-3 py-1.5 text-[10px] font-mono text-pearl-africa placeholder:text-crane-grey focus:outline-none focus:border-crested-gold/50"
                                />
                                <button
                                  onClick={() => handleRunMapsGrounding()}
                                  disabled={mapsIntelLoading}
                                  className="px-3 py-1.5 bg-crested-gold hover:bg-watch-gold text-lake-victoria font-mono text-[9px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all disabled:opacity-50"
                                >
                                  {mapsIntelLoading ? <Loader2 size={12} className="animate-spin" /> : <Compass size={12} />}
                                  <span>RECON</span>
                                </button>
                              </div>

                              {mapsIntelResult && (
                                <div className="p-3 bg-kampala-obsidian border border-crested-gold/25 rounded space-y-2 text-[11px] text-pearl-africa">
                                  <div className="prose prose-invert max-w-none text-[11px] leading-relaxed font-sans">
                                    <Markdown>{mapsIntelResult.text}</Markdown>
                                  </div>
                                  {mapsIntelResult.links && mapsIntelResult.links.length > 0 && (
                                    <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
                                      <span className="text-[8px] font-mono uppercase text-crane-grey self-center">
                                        Verified Maps Grounding Links:
                                      </span>
                                      {mapsIntelResult.links.map((link, idx) => (
                                        <a
                                          key={idx}
                                          href={link.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-intel-blue/15 hover:bg-intel-blue/25 text-intel-blue border border-intel-blue/30 rounded text-[9px] font-mono font-bold transition-all"
                                        >
                                          <MapPin size={10} />
                                          <span>{link.title}</span>
                                          <ExternalLink size={9} />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </section>

                          {/* PILLAR 2: REAL-TIME INCIDENT FEED + GOOGLE SEARCH GROUNDING */}
                          <section className="lg:col-span-5 flex flex-col bg-kampala-obsidian border border-white/10 rounded-sm overflow-hidden shadow-2xl">
                            {/* Incident Feed Header */}
                            <div className="p-4 border-b border-white/10 bg-lake-victoria/60 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded bg-brotherhood-crimson/15 border border-brotherhood-crimson/30 text-brotherhood-crimson">
                                  <Radio size={15} className="animate-pulse" />
                                </div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-wider text-pearl-africa">
                                    Real-Time Kinetic Incident Feed
                                  </h3>
                                  <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest">
                                    Firestore Live Stream ({filteredRealtimeIncidents.length}) & OSINT Search Grounding
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleRunOsintSweep()}
                                  disabled={osintLoading}
                                  className="px-2.5 py-1 bg-intel-blue/15 hover:bg-intel-blue/25 text-intel-blue border border-intel-blue/30 rounded text-[9px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                                  title="Run Live Google Search Grounding OSINT Sweep"
                                >
                                  {osintLoading ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
                                  <span>OSINT SWEEP</span>
                                </button>
                                <button
                                  onClick={() => setIsLoggingIncident(!isLoggingIncident)}
                                  className="px-2.5 py-1 bg-brotherhood-crimson hover:bg-brotherhood-crimson/80 text-white rounded text-[9px] font-mono font-black uppercase flex items-center gap-1 transition-all"
                                >
                                  <Plus size={11} />
                                  <span>LOG</span>
                                </button>
                              </div>
                            </div>

                            {/* Filter & Search Bar */}
                            <div className="p-3 bg-lake-victoria/40 border-b border-white/5 space-y-2">
                              <div className="flex items-center gap-1 overflow-x-auto">
                                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                                  <button
                                    key={sev}
                                    onClick={() => setIncidentFeedFilter(sev)}
                                    className={`px-2 py-1 rounded text-[8px] font-mono font-black uppercase tracking-wider transition-all ${
                                      incidentFeedFilter === sev
                                        ? sev === 'CRITICAL'
                                          ? 'bg-brotherhood-crimson text-white'
                                          : sev === 'HIGH'
                                          ? 'bg-rift-rust text-white'
                                          : 'bg-crested-gold text-lake-victoria'
                                        : 'bg-white/5 text-crane-grey hover:text-pearl-africa'
                                    }`}
                                  >
                                    {sev}
                                  </button>
                                ))}
                              </div>
                              <div className="relative">
                                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-crane-grey" />
                                <input
                                  type="text"
                                  value={incidentFeedSearch}
                                  onChange={(e) => setIncidentFeedSearch(e.target.value)}
                                  placeholder="Filter real-time incident stream by location, sector, or vector..."
                                  className="w-full pl-7 pr-3 py-1.5 bg-kampala-obsidian border border-white/10 rounded text-[10px] font-mono text-pearl-africa placeholder:text-crane-grey focus:outline-none focus:border-crested-gold/40"
                                />
                              </div>
                            </div>

                            {/* Inline Log New Incident Form (Firestore Persisted) */}
                            <AnimatePresence>
                              {isLoggingIncident && (
                                <motion.form
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  onSubmit={handleCreateRealtimeIncident}
                                  className="p-3 bg-lake-victoria border-b border-brotherhood-crimson/30 space-y-2.5 overflow-hidden"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono font-black uppercase text-brotherhood-crimson">
                                      Transmit New Field Incident to Firestore
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsLoggingIncident(false)}
                                      className="text-crane-grey hover:text-white"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Location (e.g. Kasese, Gulu)"
                                      value={newIncidentDraft.location}
                                      onChange={(e) => setNewIncidentDraft({ ...newIncidentDraft, location: e.target.value })}
                                      className="bg-kampala-obsidian border border-white/10 rounded px-2.5 py-1.5 text-[10px] font-mono text-pearl-africa"
                                    />
                                    <select
                                      value={newIncidentDraft.severity}
                                      onChange={(e) =>
                                        setNewIncidentDraft({
                                          ...newIncidentDraft,
                                          severity: e.target.value as NonNullable<Incident['severity']>,
                                        })
                                      }
                                      className="bg-kampala-obsidian border border-white/10 rounded px-2.5 py-1.5 text-[10px] font-mono text-pearl-africa"
                                    >
                                      <option value="CRITICAL">CRITICAL</option>
                                      <option value="HIGH">HIGH</option>
                                      <option value="MEDIUM">MEDIUM</option>
                                      <option value="LOW">LOW</option>
                                    </select>
                                  </div>
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="SITREP tactical description..."
                                    value={newIncidentDraft.description}
                                    onChange={(e) => setNewIncidentDraft({ ...newIncidentDraft, description: e.target.value })}
                                    className="w-full bg-kampala-obsidian border border-white/10 rounded px-2.5 py-1.5 text-[10px] font-mono text-pearl-africa"
                                  />
                                  <button
                                    type="submit"
                                    className="w-full py-1.5 bg-brotherhood-crimson hover:bg-brotherhood-crimson/90 text-white font-mono text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                  >
                                    COMMIT INCIDENT TO FIRESTORE LEDGER
                                  </button>
                                </motion.form>
                              )}
                            </AnimatePresence>

                            {/* Google Search Grounding OSINT Result Box */}
                            {osintResult && (
                              <div className="p-3 bg-intel-blue/10 border-b border-intel-blue/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-mono font-black uppercase tracking-widest text-intel-blue flex items-center gap-1">
                                    <Globe size={10} />
                                    Google Search Grounding OSINT Intelligence
                                  </span>
                                  <button
                                    onClick={() => setOsintResult(null)}
                                    className="text-crane-grey hover:text-white"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                <div className="text-[11px] text-pearl-africa leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                  <Markdown>{osintResult.text}</Markdown>
                                </div>
                                {osintResult.sources && osintResult.sources.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
                                    {osintResult.sources.map((src, i) => (
                                      <a
                                        key={i}
                                        href={src.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-lake-victoria text-intel-blue border border-intel-blue/30 rounded text-[8px] font-mono truncate max-w-[220px]"
                                      >
                                        <ExternalLink size={9} />
                                        <span className="truncate">{src.title}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Scrollable Real-time Incident Feed */}
                            <div className="flex-grow overflow-y-auto max-h-[540px] divide-y divide-white/5 custom-scrollbar">
                              {filteredRealtimeIncidents.length === 0 ? (
                                <div className="p-8 text-center font-mono text-[10px] text-crane-grey uppercase tracking-widest">
                                  No active kinetic incidents match current filter parameters.
                                </div>
                              ) : (
                                filteredRealtimeIncidents.map((inc) => (
                                  <div
                                    key={inc.id}
                                    className="p-3.5 hover:bg-white/[0.03] transition-all flex flex-col gap-1.5 group"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider border ${
                                            inc.severity === 'CRITICAL'
                                              ? 'bg-brotherhood-crimson/15 text-brotherhood-crimson border-brotherhood-crimson/30'
                                              : inc.severity === 'HIGH'
                                              ? 'bg-rift-rust/15 text-rift-rust border-rift-rust/30'
                                              : inc.severity === 'MEDIUM'
                                              ? 'bg-nile-amber/15 text-nile-amber border-nile-amber/30'
                                              : 'bg-intel-blue/15 text-intel-blue border-intel-blue/30'
                                          }`}
                                        >
                                          {inc.severity || 'MEDIUM'}
                                        </span>
                                        <span className="font-mono text-[11px] font-black text-pearl-africa">
                                          {inc.location}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[9px] text-crane-grey">
                                          {inc.date}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setIncidents(prev => prev.filter(i => i.id !== inc.id));
                                            deleteIncidentFromDb(inc.id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 text-crane-grey hover:text-brotherhood-crimson transition-opacity"
                                          title="Archive incident"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-pearl-africa/85 leading-relaxed">
                                      {inc.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-crane-grey">
                                      <span className="uppercase tracking-wider text-crested-gold/90">
                                        VECTOR: {inc.type}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        {inc.fatalities > 0 && (
                                          <span className="text-brotherhood-crimson font-bold">
                                            CASUALTIES: {inc.fatalities}
                                          </span>
                                        )}
                                        {inc.injuries > 0 && (
                                          <span className="text-nile-amber font-bold">
                                            INJURIES: {inc.injuries}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => {
                                            setMapsQuery(`${inc.location}, Uganda security perimeter`);
                                            handleRunMapsGrounding(`${inc.location}, Uganda security perimeter`);
                                          }}
                                          className="text-intel-blue hover:underline flex items-center gap-0.5"
                                        >
                                          <Compass size={10} />
                                          <span>LOCATE</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </section>
                        </div>

                        {/* SECONDARY 12-COLUMN STRATEGIC INTELLIGENCE PANEL */}
                        <section className="bg-kampala-obsidian border border-white/10 rounded-sm overflow-hidden shadow-2xl">
                          {/* Panel Header */}
                          <div className="p-4 border-b border-white/10 bg-lake-victoria/70 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-crested-gold/15 border border-crested-gold/30 text-crested-gold">
                                <BrainCircuit size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-black uppercase tracking-wider text-pearl-africa">
                                    Strategic Intelligence & Synthesis Command Panel
                                  </h3>
                                  <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-savanna-sage/15 text-savanna-sage border border-savanna-sage/30 rounded">
                                    MULTI-DOMAIN AI ACTIVE
                                  </span>
                                </div>
                                <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest mt-0.5">
                                  Presidential Statecraft • Synthesis Mind Briefing • Multi-Turn Analyst Terminal
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleGenerateStrategicBriefing}
                                disabled={briefingLoading}
                                className="px-3 py-1.5 bg-crested-gold hover:bg-watch-gold text-lake-victoria font-mono text-[9px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.25)] transition-all disabled:opacity-50"
                              >
                                {briefingLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                <span>GENERATE SYNTHESIS BRIEFING</span>
                              </button>
                              <button
                                onClick={() => setView(ViewState.CHAT)}
                                className="px-3 py-1.5 bg-intel-blue/20 hover:bg-intel-blue text-intel-blue hover:text-white border border-intel-blue/40 font-mono text-[9px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all"
                              >
                                <MessageSquare size={12} />
                                <span>INTELLIGENCE COMMAND PAGE</span>
                              </button>
                              <button
                                onClick={() => setView(ViewState.SYNTHESIS)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-pearl-africa font-mono text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                              >
                                FULL SYNTHESIS MODULE
                              </button>
                            </div>
                          </div>

                          {/* Full-Width 12-Column Strategic Intelligence Panel Content */}
                          <div className="p-5 space-y-6">
                            {strategicBriefing ? (
                              <div className="p-4 bg-lake-victoria/90 border border-crested-gold/30 rounded-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                  <div>
                                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-crested-gold">
                                      HIGH-COMMAND SYNTHESIS BRIEFING // DIRECTOR MUGISOLO
                                    </span>
                                    <h4 className="text-sm font-black uppercase text-pearl-africa mt-0.5">
                                      {strategicBriefing.title}
                                    </h4>
                                  </div>
                                  <span className="px-2 py-0.5 bg-crested-gold/15 text-crested-gold border border-crested-gold/30 rounded text-[8px] font-mono font-black">
                                    TIER 5 VERIFIED
                                  </span>
                                </div>

                                <p className="text-xs text-pearl-africa/90 leading-relaxed font-sans">
                                  {strategicBriefing.threatAssessment}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                  <div className="p-2.5 bg-kampala-obsidian border border-brotherhood-crimson/25 rounded">
                                    <span className="text-[8px] font-mono font-black uppercase text-brotherhood-crimson">
                                      Kinetic Hotspots
                                    </span>
                                    <ul className="mt-1.5 space-y-1 text-[10px] text-pearl-africa/85">
                                      {(strategicBriefing.kineticHotspots || []).map((h, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-brotherhood-crimson">•</span>
                                          <span>{h}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-2.5 bg-kampala-obsidian border border-nile-amber/25 rounded">
                                    <span className="text-[8px] font-mono font-black uppercase text-nile-amber">
                                      Asset Exposures
                                    </span>
                                    <ul className="mt-1.5 space-y-1 text-[10px] text-pearl-africa/85">
                                      {(strategicBriefing.infrastructureVulnerabilities || []).map((v, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-nile-amber">•</span>
                                          <span>{v}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-2.5 bg-kampala-obsidian border border-savanna-sage/25 rounded">
                                    <span className="text-[8px] font-mono font-black uppercase text-savanna-sage">
                                      SFC / UPDF Directives
                                    </span>
                                    <ul className="mt-1.5 space-y-1 text-[10px] text-pearl-africa/85">
                                      {(strategicBriefing.strategicRecoms || []).map((r, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-savanna-sage">•</span>
                                          <span>{r}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-lake-victoria/60 border border-white/10 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-crested-gold">
                                    SYNTHESIS MIND STANDBY // READY FOR CONVERGENCE
                                  </span>
                                  <p className="text-xs text-pearl-africa/80">
                                    Synthesize {incidents.length} kinetic incidents, {assets.length} strategic infrastructure nodes, and {pepProfiles.length} political actors into an executive briefing.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGenerateStrategicBriefing}
                                  disabled={briefingLoading}
                                  className="px-3 py-2 bg-crested-gold/15 hover:bg-crested-gold text-crested-gold hover:text-lake-victoria border border-crested-gold/30 rounded text-[9px] font-mono font-black uppercase tracking-wider shrink-0 transition-all"
                                >
                                  {briefingLoading ? 'SYNTHESIZING...' : 'RUN BRIEFING'}
                                </button>
                              </div>
                            )}

                            {/* Regional Stability Grid + Recharts Matrix + Threat Horizon */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                              <div className="lg:col-span-4 space-y-2">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-pearl-africa">
                                    Theater Stability Stacks
                                  </span>
                                  <span className="text-[8px] font-mono text-crested-gold uppercase">
                                    Ground Truth V4.2
                                  </span>
                                </div>
                                <StabilityStack region="NORTH: KARAMOJA" score={31} trend="down" />
                                <StabilityStack region="EAST: ELGON" score={72} trend="stable" />
                                <StabilityStack region="WEST: ALBERTINE" score={89} trend="up" />
                                <StabilityStack region="SOUTH: VICTORIA" score={58} trend="down" />
                              </div>

                              <div className="lg:col-span-4 space-y-3">
                                <StabilityMatrixCharts incidents={incidents} />
                              </div>

                              <div className="lg:col-span-4">
                                <ThreatHorizon incidents={incidents} />
                              </div>
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
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`h-8 px-2 rounded border transition-all flex items-center gap-1.5 active:scale-95 ${
                  isDirector 
                    ? 'bg-crested-gold/15 border-crested-gold/40 text-crested-gold hover:bg-crested-gold/25 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                    : 'bg-kampala-obsidian border-white/10 text-pearl-africa hover:border-white/20'
                }`}
                title={isDirector ? "Comrade Mugisolo — Director of Strategic Oversight" : (currentUser.email || "User Profile")}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-crested-gold/20 flex items-center justify-center font-mono text-[9px] font-black text-crested-gold">
                    {isDirector ? 'MS' : (currentUser.email?.[0]?.toUpperCase() || 'U')}
                  </div>
                )}
                <span className="font-mono text-[9px] font-black uppercase tracking-wider hidden sm:inline">
                  {isDirector ? 'MUGISOLO' : (currentUser.displayName?.split(' ')[0] || 'LIAISON')}
                </span>
                {isDirector && <ShieldCheck size={12} className="text-crested-gold shrink-0" />}
              </button>

              {/* User Profile & Database Control Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-kampala-obsidian border border-white/15 rounded-sm shadow-2xl p-4 z-50 space-y-3 divide-y divide-white/10"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-crane-grey uppercase tracking-widest">Operator Identity</span>
                        {isDirector ? (
                          <span className="text-[7px] font-mono font-black text-crested-gold bg-crested-gold/15 px-1.5 py-0.5 rounded border border-crested-gold/30">
                            DIRECTOR // SFC
                          </span>
                        ) : (
                          <span className="text-[7px] font-mono font-bold text-savanna-sage bg-savanna-sage/10 px-1.5 py-0.5 rounded border border-savanna-sage/20">
                            AUTHENTICATED
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-black text-xs text-pearl-africa">
                        {isDirector ? 'Comrade Mugisolo' : (currentUser.displayName || 'Strategic Officer')}
                      </div>
                      <div className="font-mono text-[10px] text-crane-grey break-all">
                        {currentUser.email}
                      </div>
                    </div>

                    <div className="pt-3 space-y-1.5 text-[9px] font-mono">
                      <div className="flex justify-between items-center text-crane-grey">
                        <span>FIRESTORE DB:</span>
                        <span className="text-pearl-africa font-mono font-bold">ai-studio-92ba9721</span>
                      </div>
                      <div className="flex justify-between items-center text-crane-grey">
                        <span>CLEARANCE:</span>
                        <span className={isDirector ? "text-crested-gold font-bold" : "text-pearl-africa"}>
                          {isDirector ? "LEVEL 5 (PRESIDENTIAL)" : "LEVEL 3 (TACTICAL)"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-crane-grey">
                        <span>REAL-TIME PERSISTENCE:</span>
                        <span className="text-savanna-sage font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> SYNCHRONIZED
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <button
                        onClick={async () => {
                          await logout();
                          setIsUserMenuOpen(false);
                          logOperationalAction('User logged out from strategic terminal', 'SYSTEM');
                        }}
                        className="w-full py-1.5 px-3 bg-white/5 hover:bg-brotherhood-crimson/20 border border-white/10 hover:border-brotherhood-crimson/40 text-pearl-africa hover:text-brotherhood-crimson rounded text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <LogOut size={12} />
                        TERMINATE SESSION (SIGN OUT)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                  logOperationalAction('Operator initiated Google Sign-in authentication', 'SYSTEM');
                } catch (err) {
                  console.error("Sign in failed:", err);
                }
              }}
              className="h-8 px-2.5 bg-crested-gold hover:bg-watch-gold text-lake-victoria font-mono text-[9px] font-black uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.3)] active:scale-95"
              title="Sign in with Google to enable real-time persistent intelligence dossiers"
            >
              <LogIn size={13} />
              <span className="hidden sm:inline">AUTHENTICATE // GOOGLE</span>
              <span className="sm:hidden">SIGN IN</span>
            </button>
          )}
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
      <main ref={dashboardRef} className="flex-grow p-4 lg:p-6 overflow-y-auto pb-32 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[9px] font-mono text-crane-grey uppercase tracking-[0.2em]">
            {view === ViewState.CHAT ? 'INTELLIGENCE COMMAND TERMINAL // SECURE' : `${view} MODULE // SECURE`}
          </span>
          <div className="flex items-center gap-3">
            {pdfExportStatus && (
              <span className="text-[9px] font-mono font-bold text-crested-gold bg-crested-gold/10 px-2 py-0.5 rounded border border-crested-gold/30">
                {pdfExportStatus}
              </span>
            )}
            <div className="flex items-center gap-1 font-mono text-[8px] text-crested-gold">
              <span className="animate-pulse">●</span> SYNC_ACTIVE
            </div>
          </div>
        </div>
        {renderView()}
      </main>

      {/* 4. Strategic Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-lake-victoria border-t border-white/5 flex items-center px-2 pb-safe z-50">
        {[
          { icon: MessageSquare, label: 'Intel Chat', view: ViewState.CHAT },
          { icon: LayoutGrid, label: 'Theater', view: ViewState.THEATER },
          { icon: HardDrive, label: 'Assets', view: ViewState.ASSETS },
          { icon: MapIcon, label: 'Tactical', view: ViewState.MAP },
          { icon: Users, label: 'Actors', view: ViewState.ACTORS },
          { icon: Activity, label: 'Forensics', view: ViewState.FORENSICS },
          { icon: BrainCircuit, label: 'Synthesis', view: ViewState.SYNTHESIS },
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

      {/* 7. Operational Session Audit Log Panel */}
      <OperationalAuditPanel isOpen={isAuditPanelOpen} onClose={() => setIsAuditPanelOpen(false)} />
    </div>
  );
};
