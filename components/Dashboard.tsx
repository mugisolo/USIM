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
  Command, 
  Moon, 
  Sun,
  LayoutGrid,
  ChevronDown,
  AlertTriangle,
  Zap,
  CheckCircle2,
  MoreVertical,
  MessageSquare,
  Download,
  ShieldCheck,
  LogIn,
  LogOut,
  Plus,
  Radio,
  ExternalLink,
  Sparkles,
  Compass,
  Loader2,
  MapPin,
  Trash2,
  Search,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SlidersHorizontal,
  Clock,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, Incident, PEPProfile, StrategicAsset } from '../types';
import { SecurityMap } from './SecurityMap';
import { SynthesisMind } from './SynthesisMind';
import { PEPAnalytics } from './PEPAnalytics';
import { StrategicAssetsMap } from './StrategicAssetsMap';
import { Chatbot } from './Chatbot';
import { PEPForensics } from './PEPForensics';
import { ThreatHorizon } from './ThreatHorizon';
import { OperationalAuditPanel, logOperationalAction } from './OperationalAuditPanel';
import { SubscriptionModal } from './SubscriptionModal';
import {
  SubscriptionState,
  getInitialSubscriptionState,
  subscribeToSubscriptionChanges,
  getSubscriptionStatusMeta
} from '../services/subscriptionService';
import { 
  subscribeToIncidents, 
  subscribeToParliamentary,
  subscribeToAssets,
  addIncidentToDb,
  deleteIncidentFromDb
} from '../services/firestoreService';
import {
  fetchMapsIntelligence,
  fetchSearchIntelligence,
  generateSynthesisMindBriefing
} from '../services/geminiService';
import { auth, loginWithGoogle, logout } from '../services/authService';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- THEATER STABILITY MATRIX STACK ---
const StabilityStack: React.FC<{ region: string; score: number; trend: 'up' | 'down' | 'stable' }> = ({ region, score, trend }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStabilityMeta = (s: number) => {
    if (s >= 80) return { color: 'text-success', dot: 'bg-success', label: 'Nominal' };
    if (s >= 60) return { color: 'text-info', dot: 'bg-info', label: 'Stable' };
    if (s >= 40) return { color: 'text-warning', dot: 'bg-warning', label: 'Elevated' };
    return { color: 'text-danger', dot: 'bg-danger', label: 'Critical' };
  };

  const meta = getStabilityMeta(score);

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden transition-colors duration-150">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-bg-elevated/60 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="font-mono text-xs font-medium text-text-primary">{region}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-display text-xl font-bold tabular-nums ${meta.color}`}>{score}</span>
          <div className="flex items-center gap-1 text-text-secondary">
            {trend === 'up' && <TrendingUp size={13} className="text-success" />}
            {trend === 'down' && <TrendingUp size={13} className="text-danger rotate-180" />}
            {trend === 'stable' && <MoreVertical size={13} className="text-text-secondary rotate-90" />}
          </div>
          <ChevronDown size={14} className={`text-text-secondary transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="px-4 pb-4 border-t border-border-subtle"
          >
            <div className="pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Kinetic Friction Posture</span>
                <span className="font-mono text-success">{meta.label}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Diplomatic Pulse</span>
                <span className="font-mono text-warning">Proximal Watch</span>
              </div>
              <p className="text-xs font-mono leading-relaxed text-text-secondary bg-bg-base p-3 rounded-lg border border-border-subtle text-justify report-justified">
                OSINT clusters indicate active patrol synchronization across the sub-region. 48-hour stability projection remains monitored.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- THEATER STABILITY MATRIX RECHARTS COMPONENT (NO GRADIENTS, THIN GRID LINES) ---
interface StabilityMatrixChartsProps {
  incidents: Incident[];
}

const StabilityMatrixCharts: React.FC<StabilityMatrixChartsProps> = ({ incidents }) => {
  const [activeChartTab, setActiveChartTab] = useState<'trends' | 'regional'>('trends');

  const trendData = useMemo(() => {
    if (!incidents || incidents.length === 0) {
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
      const shortDate = rawDate.split('-').slice(1).join('/');
      if (!groups[shortDate]) {
        groups[shortDate] = { date: shortDate, 'Kinetic friction': 0, 'Severity Index': 0 };
      }
      groups[shortDate]['Kinetic friction'] += 1;
      const weight = incident.severity === 'CRITICAL' ? 4 : incident.severity === 'HIGH' ? 3 : incident.severity === 'MEDIUM' ? 2 : 1;
      groups[shortDate]['Severity Index'] += weight + (incident.fatalities || 0);
    });

    const sorted = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-7);
  }, [incidents]);

  const regionalData = useMemo(() => {
    const baseRegions = [
      { region: 'NORTH: KARAMOJA', 'Stability Score': 31, 'Incident Load': 68 },
      { region: 'EAST: ELGON', 'Stability Score': 72, 'Incident Load': 28 },
      { region: 'WEST: ALBERTINE', 'Stability Score': 89, 'Incident Load': 14 },
      { region: 'SOUTH: VICTORIA', 'Stability Score': 58, 'Incident Load': 42 },
    ];

    if (!incidents || incidents.length === 0) return baseRegions;

    const counts = { NORTH: 0, EAST: 0, WEST: 0, SOUTH: 0 };
    incidents.forEach(inc => {
      const loc = (inc.location || '').toLowerCase();
      if (loc.includes('gulu') || loc.includes('karamoja') || loc.includes('lira') || loc.includes('arua') || loc.includes('north')) counts.NORTH += 8;
      else if (loc.includes('mbale') || loc.includes('jinja') || loc.includes('tororo') || loc.includes('east')) counts.EAST += 8;
      else if (loc.includes('kasese') || loc.includes('mbarara') || loc.includes('hoima') || loc.includes('west')) counts.WEST += 8;
      else counts.SOUTH += 5;
    });

    return [
      { region: 'NORTH: KARAMOJA', 'Stability Score': Math.max(15, 75 - counts.NORTH), 'Incident Load': Math.min(95, 25 + counts.NORTH) },
      { region: 'EAST: ELGON', 'Stability Score': Math.max(20, 82 - counts.EAST), 'Incident Load': Math.min(95, 18 + counts.EAST) },
      { region: 'WEST: ALBERTINE', 'Stability Score': Math.max(25, 90 - counts.WEST), 'Incident Load': Math.min(95, 12 + counts.WEST) },
      { region: 'SOUTH: VICTORIA', 'Stability Score': Math.max(20, 78 - counts.SOUTH), 'Incident Load': Math.min(95, 22 + counts.SOUTH) },
    ];
  }, [incidents]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border-subtle p-3 rounded-lg text-xs font-mono shadow-lg">
          <p className="text-text-primary font-semibold mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4 py-0.5">
              <span>{entry.name}:</span>
              <span className="font-semibold tabular-nums">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-primary">Theater Stability Matrix</h3>
          <p className="text-xs text-text-secondary">
            7-day kinetic velocity & regional load distribution
          </p>
        </div>

        <div className="flex bg-bg-base p-1 rounded-lg border border-border-subtle self-start">
          <button
            onClick={() => setActiveChartTab('trends')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 ${
              activeChartTab === 'trends' ? 'bg-accent text-accent-ink font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Velocity
          </button>
          <button
            onClick={() => setActiveChartTab('regional')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 ${
              activeChartTab === 'regional' ? 'bg-accent text-accent-ink font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Regional
          </button>
        </div>
      </div>

      <div className="h-[220px] w-full font-mono text-[11px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartTab === 'trends' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" tickLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={32} iconType="circle" />
              <Area
                type="monotone"
                dataKey="Kinetic friction"
                stroke="#D90000"
                strokeWidth={2}
                fillOpacity={0.08}
                fill="#D90000"
              />
              <Area
                type="monotone"
                dataKey="Severity Index"
                stroke="#FCDC04"
                strokeWidth={2}
                fillOpacity={0.08}
                fill="#FCDC04"
              />
            </AreaChart>
          ) : (
            <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="region" stroke="var(--text-secondary)" tickFormatter={t => t.split(':')[0]} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={32} iconType="square" />
              <Bar dataKey="Stability Score" fill="#34D399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Incident Load" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { icon: MessageSquare, label: 'Intel Chat', view: ViewState.CHAT },
  { icon: LayoutGrid, label: 'Command Center', view: ViewState.THEATER },
  { icon: BrainCircuit, label: 'Synthesis Mind', view: ViewState.SYNTHESIS },
  { icon: Users, label: 'Actor Matrix', view: ViewState.ACTORS },
  { icon: Activity, label: 'Forensics', view: ViewState.FORENSICS },
  { icon: HardDrive, label: 'Asset Ledger', view: ViewState.ASSETS },
  { icon: MapIcon, label: 'Threat Horizon', view: ViewState.MAP },
];

const RECENT_INTEL_THREADS = [
  'Karuma Hydroelectric perimeter assessment',
  'Operation Shujaa Rwenzori sector posture',
  '2026 PEP coalition loyalty vectors',
  'Kampala–Entebbe aviation logistics corridor',
];

export const Dashboard: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CHAT);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pepProfiles, setPepProfiles] = useState<PEPProfile[]>([]);
  const [assets, setAssets] = useState<StrategicAsset[]>([]);
  const [pdfExportStatus, setPdfExportStatus] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDensityMenuOpen, setIsDensityMenuOpen] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
        backgroundColor: '#0A0A0B',
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

  // Operational States (isNightOps = false -> Dark default; true -> Day Briefing light mode toggle or vice versa)
  const [threatLevel, setThreatLevel] = useState(3);
  const [isNightOps, setIsNightOps] = useState(false); // When toggled, switches between Night Ops (Dark) and Day Briefing (Light)
  const [density, setDensity] = useState<'Compact' | 'Standard' | 'Briefing'>('Compact');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'COMMAND_CENTER' | 'MAP_FOCUS' | 'DATA_MATRIX'>('COMMAND_CENTER');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Sync theme classes on documentElement so portals and modals inherit tokens
  useEffect(() => {
    const root = document.documentElement;
    if (isNightOps) {
      root.classList.add('day-briefing-active', 'theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('day-briefing-active', 'theme-light');
    }
  }, [isNightOps]);

  // ⌘K / Ctrl+K shortcut for Global Cross-Ledger Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Audit, Subscription & Search state
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>(() => getInitialSubscriptionState());
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
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
          subtitle: `${asset.type} · ${asset.location} (${asset.status})`,
          targetView: ViewState.ASSETS,
          originalItem: asset
        });
      }
    });

    pepProfiles.forEach(pep => {
      if (
        pep.name.toLowerCase().includes(queryStr) ||
        (pep.party && pep.party.toLowerCase().includes(queryStr)) ||
        (pep.constituency && pep.constituency.toLowerCase().includes(queryStr))
      ) {
        results.push({
          id: `pep-${pep.id}`,
          type: 'ACTOR',
          title: pep.name,
          subtitle: `${pep.party || 'Independent'} · ${pep.constituency || 'National'}`,
          targetView: ViewState.ACTORS,
          originalItem: pep
        });
      }
    });

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
          subtitle: `${incident.severity} · ${incident.description.substring(0, 45)}...`,
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
        `AUTOMATED SURVEILLANCE: Real-time high-severity incident detected in ${latestNew.location}. Type: ${latestNew.type}.`,
        'SECURITY',
        'SYS_MONITOR'
      );
    }
  }, [incidents]);

  useEffect(() => {
    logOperationalAction(`Active interface module switched to ${view}`, 'SYSTEM');
  }, [view]);

  useEffect(() => {
    logOperationalAction(`Threat level updated to LEVEL ${threatLevel}`, 'SECURITY');
  }, [threatLevel]);

  useEffect(() => {
    const unsubIncidents = subscribeToIncidents(setIncidents);
    const unsubPep = subscribeToParliamentary(setPepProfiles);
    const unsubAssets = subscribeToAssets(setAssets);
    const unsubSub = subscribeToSubscriptionChanges(setSubscription);
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const timer = setTimeout(() => setIsBooting(false), 600);

    return () => { 
      unsubIncidents(); 
      unsubPep(); 
      unsubAssets(); 
      unsubSub();
      unsubAuth();
      clearTimeout(timer);
    };
  }, []);

  const subMeta = useMemo(() => getSubscriptionStatusMeta(subscription), [subscription]);

  const getThreatMeta = (level: number) => {
    switch(level) {
      case 5: return { color: 'bg-danger text-white', label: 'LEVEL 5 — CRITICAL', icon: ShieldAlert };
      case 4: return { color: 'bg-warning text-accent-ink', label: 'LEVEL 4 — HIGH', icon: AlertTriangle };
      case 3: return { color: 'bg-accent text-accent-ink', label: 'LEVEL 3 — ELEVATED', icon: Zap };
      case 2: return { color: 'bg-info text-accent-ink', label: 'LEVEL 2 — GUARDED', icon: Activity };
      default: return { color: 'bg-success text-accent-ink', label: 'LEVEL 1 — NORMAL', icon: CheckCircle2 };
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

  const getSeverityBadgeStyle = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { dot: 'bg-danger', pill: 'bg-danger/15 text-danger border-danger/30' };
      case 'HIGH':
        return { dot: 'bg-warning', pill: 'bg-warning/15 text-warning border-warning/30' };
      case 'MEDIUM':
        return { dot: 'bg-info', pill: 'bg-info/15 text-info border-info/30' };
      default:
        return { dot: 'bg-text-secondary', pill: 'bg-bg-elevated text-text-secondary border-border-subtle' };
    }
  };

  const currentViewTitle = useMemo(() => {
    const found = NAV_ITEMS.find(n => n.view === view);
    return found ? found.label : 'Command Center';
  }, [view]);

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {(() => {
            switch (view) {
              case ViewState.CHAT:
                return (
                  <div className="h-[calc(100dvh-5.5rem)] min-h-[560px] w-full flex flex-col bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                    <Chatbot isInline />
                  </div>
                );
              case ViewState.MAP:
                return (
                  <div className="space-y-6">
                    <ThreatHorizon incidents={incidents} />
                    <SecurityMap incidents={incidents} onUpdateIncidents={setIncidents} onNavigate={setView} fullScreen />
                  </div>
                );
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

                const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
                const highCount = incidents.filter(i => i.severity === 'HIGH').length;
                const operationalAssetsCount = assets.filter(a => a.status === 'Operational' || a.status === 'Secured').length;

                return (
                  <div className="space-y-6">
                    {/* Sub-header & Segmented Layout Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-bold text-text-primary tracking-tight">
                          National Strategic Command Grid
                        </h2>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Geospatial surveillance · Real-time kinetic feed · Synthesis intelligence
                        </p>
                      </div>

                      <div className="flex bg-bg-surface p-1 border border-border-subtle rounded-xl self-start sm:self-auto">
                        <button
                          onClick={() => {
                            setDashboardMode('COMMAND_CENTER');
                            logOperationalAction('Dashboard switched to Command Center layout', 'SYSTEM');
                          }}
                          className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 rounded-lg whitespace-nowrap ${
                            dashboardMode === 'COMMAND_CENTER' 
                              ? 'bg-accent text-accent-ink font-semibold' 
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <LayoutGrid size={13} />
                          <span>Command Grid</span>
                        </button>
                        <button
                          onClick={() => {
                            setDashboardMode('MAP_FOCUS');
                            logOperationalAction('Dashboard switched to Map Focus layout', 'SYSTEM');
                          }}
                          className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 rounded-lg whitespace-nowrap ${
                            dashboardMode === 'MAP_FOCUS' 
                              ? 'bg-accent text-accent-ink font-semibold' 
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <MapIcon size={13} />
                          <span>Map Focus</span>
                        </button>
                        <button
                          onClick={() => {
                            setDashboardMode('DATA_MATRIX');
                            logOperationalAction('Dashboard switched to Data Matrix layout', 'SYSTEM');
                          }}
                          className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 rounded-lg whitespace-nowrap ${
                            dashboardMode === 'DATA_MATRIX' 
                              ? 'bg-accent text-accent-ink font-semibold' 
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <Activity size={13} />
                          <span>Data Matrix</span>
                        </button>
                      </div>
                    </div>

                    {dashboardMode === 'COMMAND_CENTER' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Clean 4-Metric KPI Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>Active Incidents</span>
                              <ShieldAlert size={14} className={criticalCount > 0 ? 'text-danger' : 'text-text-secondary'} />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="font-display text-2xl font-bold tabular-nums text-text-primary">{incidents.length}</span>
                              <span className="text-xs font-mono text-text-secondary">
                                {criticalCount > 0 ? <span className="text-danger">{criticalCount} critical</span> : `${highCount} high`}
                              </span>
                            </div>
                          </div>

                          <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>Strategic Assets</span>
                              <HardDrive size={14} className="text-text-secondary" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="font-display text-2xl font-bold tabular-nums text-text-primary">{assets.length}</span>
                              <span className="text-xs font-mono text-success">
                                {operationalAssetsCount} nominal
                              </span>
                            </div>
                          </div>

                          <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>PEP Dossiers</span>
                              <Users size={14} className="text-text-secondary" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="font-display text-2xl font-bold tabular-nums text-text-primary">{pepProfiles.length}</span>
                              <span className="text-xs font-mono text-text-secondary">
                                [TIER 1–5]
                              </span>
                            </div>
                          </div>

                          <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>Sovereign Stability</span>
                              <TrendingUp size={14} className="text-success" />
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="font-display text-2xl font-bold tabular-nums text-success">84.2%</span>
                              <span className="text-xs font-mono text-text-secondary">
                                L{threatLevel} posture
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* PRIMARY MAP-FOCUS SPLIT: LARGE MAP (62% / 7 COLS) + RIGHT INCIDENT RAIL (38% / 5 COLS) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                          {/* PILLAR 1: GEOSPATIAL MAP CONTAINER */}
                          <section className="lg:col-span-7 flex flex-col bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h3 className="font-display text-sm font-semibold text-text-primary">
                                  Geospatial Surveillance & Corridor Reconnaissance
                                </h3>
                                <p className="text-xs text-text-secondary">
                                  Live kinetic coordinates & Google Maps grounding (<span className="font-mono">gemini-3.8-flash</span>)
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setView(ViewState.ASSETS)}
                                  className="px-3 py-1.5 bg-bg-elevated hover:border-accent/50 border border-border-subtle rounded-lg text-xs font-medium text-text-primary transition-colors duration-150"
                                >
                                  Asset Map
                                </button>
                                <button
                                  onClick={() => setView(ViewState.MAP)}
                                  className="px-3 py-1.5 bg-accent text-accent-ink rounded-lg text-xs font-semibold transition-opacity duration-150 hover:opacity-90"
                                >
                                  Fullscreen
                                </button>
                              </div>
                            </div>

                            <div className="p-4 flex-grow">
                              <SecurityMap
                                incidents={incidents}
                                onUpdateIncidents={setIncidents}
                                onNavigate={setView}
                              />
                            </div>

                            {/* Google Maps Grounding Bar */}
                            <div className="p-4 border-t border-border-subtle bg-bg-base/50 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                                  <Compass size={13} className="text-accent" />
                                  <span>Maps Grounding Recon</span>
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
                                      className="px-2.5 py-1 bg-bg-surface hover:bg-bg-elevated border border-border-subtle rounded-full text-[11px] text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors duration-150"
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
                                  placeholder="Query Ugandan sector, corridor, or facility via Google Maps..."
                                  className="flex-1 bg-bg-surface border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                                />
                                <button
                                  onClick={() => handleRunMapsGrounding()}
                                  disabled={mapsIntelLoading}
                                  className="px-4 py-2 bg-accent hover:opacity-90 text-accent-ink text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-opacity duration-150 disabled:opacity-50"
                                >
                                  {mapsIntelLoading ? <Loader2 size={13} className="animate-spin" /> : <Compass size={13} />}
                                  <span>Recon</span>
                                </button>
                              </div>

                              {mapsIntelResult && (
                                <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl space-y-2.5 text-xs text-text-primary report-justified">
                                  <div className="leading-relaxed text-justify markdown-body">
                                    <Markdown>{mapsIntelResult.text}</Markdown>
                                  </div>
                                  {mapsIntelResult.links && mapsIntelResult.links.length > 0 && (
                                    <div className="pt-2 border-t border-border-subtle flex flex-wrap gap-2">
                                      {mapsIntelResult.links.map((link, idx) => (
                                        <a
                                          key={idx}
                                          href={link.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-elevated hover:border-accent/50 text-text-primary border border-border-subtle rounded-lg text-[11px] font-mono transition-colors"
                                        >
                                          <MapPin size={11} className="text-accent" />
                                          <span>{link.title}</span>
                                          <ExternalLink size={10} className="text-text-secondary" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </section>

                          {/* PILLAR 2: RIGHT RAIL — REAL-TIME KINETIC INCIDENT FEED */}
                          <section className="lg:col-span-5 flex flex-col bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-2">
                              <div>
                                <h3 className="font-display text-sm font-semibold text-text-primary">
                                  Incident Feed
                                </h3>
                                <p className="text-xs text-text-secondary font-mono">
                                  {filteredRealtimeIncidents.length} active records · Live Firestore stream
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRunOsintSweep()}
                                  disabled={osintLoading}
                                  className="px-3 py-1.5 bg-bg-elevated hover:border-accent/50 text-text-primary border border-border-subtle rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
                                  title="Run Live Google Search Grounding OSINT Sweep"
                                >
                                  {osintLoading ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                                  <span>OSINT Sweep</span>
                                </button>
                                <button
                                  onClick={() => setIsLoggingIncident(!isLoggingIncident)}
                                  className="px-3 py-1.5 bg-accent hover:opacity-90 text-accent-ink rounded-lg text-xs font-semibold flex items-center gap-1 transition-opacity duration-150"
                                >
                                  <Plus size={13} />
                                  <span>Log</span>
                                </button>
                              </div>
                            </div>

                            {/* Severity Filter & Search Bar */}
                            <div className="p-3.5 border-b border-border-subtle space-y-2.5 bg-bg-base/40">
                              <div className="flex items-center gap-1 overflow-x-auto">
                                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
                                  const active = incidentFeedFilter === sev;
                                  return (
                                    <button
                                      key={sev}
                                      onClick={() => setIncidentFeedFilter(sev)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors duration-150 ${
                                        active
                                          ? sev === 'CRITICAL'
                                            ? 'bg-danger text-white font-semibold'
                                            : 'bg-accent text-accent-ink font-semibold'
                                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                                      }`}
                                    >
                                      {sev}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                  type="text"
                                  value={incidentFeedSearch}
                                  onChange={(e) => setIncidentFeedSearch(e.target.value)}
                                  placeholder="Filter incidents by location, type, or description..."
                                  className="w-full pl-8 pr-3 py-1.5 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                                />
                              </div>
                            </div>

                            {/* Inline Log New Incident Form */}
                            <AnimatePresence>
                              {isLoggingIncident && (
                                <motion.form
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  onSubmit={handleCreateRealtimeIncident}
                                  className="p-4 bg-bg-elevated border-b border-border-subtle space-y-3 overflow-hidden"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-text-primary">
                                      Log Field Incident
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsLoggingIncident(false)}
                                      className="text-text-secondary hover:text-text-primary"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Location (e.g. Kasese, Gulu)"
                                      value={newIncidentDraft.location}
                                      onChange={(e) => setNewIncidentDraft({ ...newIncidentDraft, location: e.target.value })}
                                      className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary"
                                    />
                                    <select
                                      value={newIncidentDraft.severity}
                                      onChange={(e) =>
                                        setNewIncidentDraft({
                                          ...newIncidentDraft,
                                          severity: e.target.value as NonNullable<Incident['severity']>,
                                        })
                                      }
                                      className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary"
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
                                    placeholder="Incident SITREP description..."
                                    value={newIncidentDraft.description}
                                    onChange={(e) => setNewIncidentDraft({ ...newIncidentDraft, description: e.target.value })}
                                    className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary"
                                  />
                                  <button
                                    type="submit"
                                    className="w-full py-2 bg-accent hover:opacity-90 text-accent-ink text-xs font-semibold rounded-lg transition-opacity"
                                  >
                                    Save Incident to Firestore
                                  </button>
                                </motion.form>
                              )}
                            </AnimatePresence>

                            {/* Google Search Grounding OSINT Result Box */}
                            {osintResult && (
                              <div className="p-4 bg-bg-elevated border-b border-border-subtle space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-info flex items-center gap-1.5">
                                    <Globe size={12} />
                                    <span>OSINT Search Grounding</span>
                                  </span>
                                  <button
                                    onClick={() => setOsintResult(null)}
                                    className="text-text-secondary hover:text-text-primary"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                                <div className="text-xs text-text-primary leading-relaxed max-h-40 overflow-y-auto text-justify report-justified markdown-body">
                                  <Markdown>{osintResult.text}</Markdown>
                                </div>
                                {osintResult.sources && osintResult.sources.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle">
                                    {osintResult.sources.map((src, i) => (
                                      <a
                                        key={i}
                                        href={src.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-surface text-text-secondary hover:text-text-primary border border-border-subtle rounded text-[11px] font-mono truncate max-w-[220px]"
                                      >
                                        <ExternalLink size={10} />
                                        <span className="truncate">{src.title}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Clean Incident List Rows */}
                            <div className="flex-grow overflow-y-auto max-h-[540px] divide-y divide-border-subtle">
                              {filteredRealtimeIncidents.length === 0 ? (
                                <div className="p-8 text-center text-xs text-text-secondary">
                                  No incidents match the current filter.
                                </div>
                              ) : (
                                filteredRealtimeIncidents.map((inc) => {
                                  const sevStyle = getSeverityBadgeStyle(inc.severity);
                                  return (
                                    <div
                                      key={inc.id}
                                      className="px-4 py-3.5 hover:bg-bg-elevated/50 transition-colors duration-150 flex flex-col gap-1.5 group"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${sevStyle.dot}`} />
                                          <span className="font-medium text-xs text-text-primary truncate">
                                            {inc.location}
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${sevStyle.pill}`}>
                                            {inc.severity || 'MEDIUM'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="font-mono text-[11px] text-text-secondary tabular-nums">
                                            {inc.date}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setIncidents(prev => prev.filter(i => i.id !== inc.id));
                                              deleteIncidentFromDb(inc.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-danger transition-opacity"
                                            title="Delete incident"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-xs text-text-secondary leading-relaxed pl-4 text-justify report-justified">
                                        {inc.description}
                                      </p>

                                      <div className="flex items-center justify-between pl-4 pt-1 text-[11px] font-mono text-text-secondary">
                                        <span>{inc.type}</span>
                                        <div className="flex items-center gap-3">
                                          {inc.fatalities > 0 && (
                                            <span className="text-danger font-medium">
                                              Casualties: {inc.fatalities}
                                            </span>
                                          )}
                                          {inc.injuries > 0 && (
                                            <span className="text-warning font-medium">
                                              Injuries: {inc.injuries}
                                            </span>
                                          )}
                                          <button
                                            onClick={() => {
                                              setMapsQuery(`${inc.location}, Uganda security perimeter`);
                                              handleRunMapsGrounding(`${inc.location}, Uganda security perimeter`);
                                            }}
                                            className="text-text-primary hover:text-accent flex items-center gap-1 transition-colors"
                                          >
                                            <Compass size={11} />
                                            <span>Locate</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </section>
                        </div>

                        {/* SECONDARY STRATEGIC INTELLIGENCE PANEL */}
                        <section className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                          <div className="px-5 py-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="font-display text-sm font-semibold text-text-primary">
                                Strategic Synthesis & Theater Stability
                              </h3>
                              <p className="text-xs text-text-secondary">
                                Automated executive briefing · Regional stability matrix · Predictive horizon
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={handleGenerateStrategicBriefing}
                                disabled={briefingLoading}
                                className="px-3.5 py-1.5 bg-accent hover:opacity-90 text-accent-ink text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                              >
                                {briefingLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                <span>Generate Briefing</span>
                              </button>
                              <button
                                onClick={() => setView(ViewState.CHAT)}
                                className="px-3 py-1.5 bg-bg-elevated hover:border-accent/50 text-text-primary border border-border-subtle text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                              >
                                <MessageSquare size={13} />
                                <span>Intel Chat</span>
                              </button>
                              <button
                                onClick={() => setView(ViewState.SYNTHESIS)}
                                className="px-3 py-1.5 bg-bg-elevated hover:border-accent/50 text-text-primary border border-border-subtle text-xs font-medium rounded-lg transition-colors"
                              >
                                Full Synthesis
                              </button>
                            </div>
                          </div>

                          <div className="p-5 space-y-6">
                            {strategicBriefing ? (
                              <div className="p-5 bg-bg-base border border-border-subtle rounded-xl space-y-4 report-justified">
                                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                                  <div>
                                    <span className="text-[11px] font-mono text-text-secondary">
                                      [TIER 5 — FORENSIC] · Executive Synthesis
                                    </span>
                                    <h4 className="font-display text-base font-bold text-text-primary mt-0.5">
                                      {strategicBriefing.title}
                                    </h4>
                                  </div>
                                </div>

                                <p className="text-sm text-text-primary leading-relaxed text-justify">
                                  {strategicBriefing.threatAssessment}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                                  <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl">
                                    <span className="text-xs font-mono font-medium text-danger">
                                      Kinetic Hotspots
                                    </span>
                                    <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                                      {(strategicBriefing.kineticHotspots || []).map((h, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-danger">·</span>
                                          <span className="text-justify flex-1">{h}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl">
                                    <span className="text-xs font-mono font-medium text-warning">
                                      Asset Exposures
                                    </span>
                                    <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                                      {(strategicBriefing.infrastructureVulnerabilities || []).map((v, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-warning">·</span>
                                          <span className="text-justify flex-1">{v}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl">
                                    <span className="text-xs font-mono font-medium text-success">
                                      Command Directives
                                    </span>
                                    <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                                      {(strategicBriefing.strategicRecoms || []).map((r, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-success">·</span>
                                          <span className="text-justify flex-1">{r}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-bg-base border border-border-subtle rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                  <span className="text-xs font-mono text-text-secondary">
                                    Synthesis Mind Standby
                                  </span>
                                  <p className="text-xs text-text-primary mt-0.5">
                                    Synthesize {incidents.length} incidents, {assets.length} infrastructure nodes, and {pepProfiles.length} political actors into an executive briefing.
                                  </p>
                                </div>
                                <button
                                  onClick={handleGenerateStrategicBriefing}
                                  disabled={briefingLoading}
                                  className="px-3.5 py-2 bg-bg-elevated hover:border-accent text-text-primary border border-border-subtle rounded-lg text-xs font-medium shrink-0 transition-colors"
                                >
                                  {briefingLoading ? 'Synthesizing...' : 'Run Briefing'}
                                </button>
                              </div>
                            )}

                            {/* Regional Stability + Recharts Matrix + Threat Horizon */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                              <div className="lg:col-span-4 space-y-2.5">
                                <div className="flex items-center justify-between px-1">
                                  <span className="font-display text-xs font-semibold text-text-primary">
                                    Regional Stability Index
                                  </span>
                                  <span className="text-[11px] font-mono text-text-secondary">
                                    Live Telemetry
                                  </span>
                                </div>
                                <StabilityStack region="NORTH: KARAMOJA" score={31} trend="down" />
                                <StabilityStack region="EAST: ELGON" score={72} trend="stable" />
                                <StabilityStack region="WEST: ALBERTINE" score={89} trend="up" />
                                <StabilityStack region="SOUTH: VICTORIA" score={58} trend="down" />
                              </div>

                              <div className="lg:col-span-4">
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
                        <SecurityMap incidents={incidents} onUpdateIncidents={setIncidents} onNavigate={setView} fullScreen />
                      </div>
                    )}

                    {dashboardMode === 'DATA_MATRIX' && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <ThreatHorizon incidents={incidents} />
                          <StabilityMatrixCharts incidents={incidents} />
                        </div>

                        <section className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                          <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="font-display text-sm font-semibold text-text-primary">Incident Registry Table</h3>
                              <p className="text-xs font-mono text-text-secondary">{filteredIncidentsForMatrix.length} records</p>
                            </div>
                            <div className="relative w-full sm:w-72">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                              <input
                                type="text"
                                placeholder="Filter registry records..."
                                value={matrixSearch}
                                onChange={(e) => setMatrixSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-bg-base border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                              />
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-border-subtle bg-bg-base/60 text-text-secondary font-mono text-[11px]">
                                  <th className="py-3 px-4">Date</th>
                                  <th className="py-3 px-4">Location</th>
                                  <th className="py-3 px-4">Type</th>
                                  <th className="py-3 px-4">Severity</th>
                                  <th className="py-3 px-4 text-right">Fatalities</th>
                                  <th className="py-3 px-4 text-right">Injuries</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle">
                                {filteredIncidentsForMatrix.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-secondary text-xs">
                                      No registry entries match the query parameters.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredIncidentsForMatrix.map((inc) => {
                                    const sevStyle = getSeverityBadgeStyle(inc.severity);
                                    return (
                                      <tr key={inc.id} className="hover:bg-bg-elevated/40 transition-colors">
                                        <td className="py-3 px-4 whitespace-nowrap font-mono text-text-secondary tabular-nums">{inc.date}</td>
                                        <td className="py-3 px-4 font-medium text-text-primary">{inc.location}</td>
                                        <td className="py-3 px-4 text-text-secondary">{inc.type}</td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${sevStyle.pill}`}>
                                            {inc.severity}
                                          </span>
                                        </td>
                                        <td className={`py-3 px-4 text-right font-mono tabular-nums ${inc.fatalities > 0 ? 'text-danger font-semibold' : 'text-text-secondary'}`}>{inc.fatalities}</td>
                                        <td className={`py-3 px-4 text-right font-mono tabular-nums ${inc.injuries > 0 ? 'text-warning font-semibold' : 'text-text-secondary'}`}>{inc.injuries}</td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
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

  if (isBooting) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-full max-w-xs space-y-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center text-accent">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-text-primary tracking-tight">U-ISMS</h1>
            <p className="text-xs text-text-secondary mt-1">Synchronizing Strategic Intelligence Ledger...</p>
          </div>
          <div className="h-1 w-full bg-bg-surface rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full w-full bg-accent"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] bg-bg-base text-text-primary flex flex-col ${isNightOps ? 'day-briefing-active theme-light' : 'theme-dark'}`}>
      {/* Thin 3-Color Uganda National Identity Ribbon (Black / Yellow / Red, 3px) */}
      <div className="h-[3px] w-full flex shrink-0 z-[60]">
        <div className="flex-1 bg-[#0A0A0B]" />
        <div className="flex-1 bg-[#FCDC04]" />
        <div className="flex-1 bg-[#D90000]" />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 1. LEFT SIDEBAR (Collapsible: 260px expanded / 68px icon-only collapsed) */}
        <aside
          className={`hidden md:flex flex-col shrink-0 bg-bg-surface border-r border-border-subtle transition-all duration-150 select-none ${
            isSidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
          }`}
        >
          {/* Sidebar Header: Wordmark + Collapse Toggle */}
          <div className="h-14 px-4 border-b border-border-subtle flex items-center justify-between">
            {!isSidebarCollapsed && (
              <button
                onClick={() => setView(ViewState.CHAT)}
                className="flex items-center gap-2.5 text-left focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-accent text-accent-ink font-display font-bold text-xs flex items-center justify-center">
                  UG
                </div>
                <span className="font-display font-bold text-base tracking-tight text-text-primary">
                  U-ISMS
                </span>
              </button>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors duration-150 ${
                isSidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>

          {/* Primary Vertical Navigation */}
          <nav className="p-2.5 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.view;
              return (
                <button
                  key={item.label}
                  onClick={() => setView(item.view)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-accent text-accent-ink font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Recent Intelligence Chats (like Kimi/Gemini history) */}
          {!isSidebarCollapsed && (
            <div className="px-4 pt-4 pb-2 flex-1 overflow-y-auto">
              <div className="text-[11px] font-mono text-text-secondary mb-2 px-1">
                Recent Briefings
              </div>
              <div className="space-y-0.5">
                {RECENT_INTEL_THREADS.map((thread, idx) => (
                  <button
                    key={idx}
                    onClick={() => setView(ViewState.CHAT)}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors duration-150 flex items-center gap-2 truncate"
                  >
                    <Clock size={12} className="shrink-0 opacity-60" />
                    <span className="truncate">{thread}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Bottom: Subscription Badge, Theme Toggle, Settings, & User Profile Chip */}
          <div className="mt-auto p-3 border-t border-border-subtle space-y-2">
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-colors duration-150 ${
                subscription.planId === 'FREE_TRIAL'
                  ? 'bg-accent/10 border-accent/40 text-accent hover:bg-accent/15'
                  : 'bg-bg-elevated border-border-subtle text-text-primary hover:border-accent/50'
              } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              title="Command Clearance & Subscription Tiers (First Week Free)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard size={14} className="text-accent shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-semibold truncate">
                    {subscription.planId === 'FREE_TRIAL'
                      ? 'First Week Free'
                      : subscription.planId === 'DAILY'
                      ? 'Daily Pass ($20)'
                      : subscription.planId === 'WEEKLY'
                      ? 'Weekly Tier ($150)'
                      : 'Monthly Tier ($500)'}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-text-secondary shrink-0">
                  {subscription.planId === 'FREE_TRIAL' ? 'TRIAL' : 'ACTIVE'}
                </span>
              )}
            </button>

            <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
              <button
                onClick={() => setIsNightOps(!isNightOps)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated hover:border-accent/50 border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-colors duration-150"
                title={isNightOps ? 'Switch to Night Ops (Dark)' : 'Switch to Day Briefing (Light)'}
              >
                {isNightOps ? <Moon size={14} /> : <Sun size={14} className="text-accent" />}
                {!isSidebarCollapsed && <span>{isNightOps ? 'Night Ops' : 'Day Briefing'}</span>}
              </button>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-lg bg-bg-elevated hover:border-accent/50 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors duration-150"
                title="Command Interface Settings"
              >
                <Settings size={15} />
              </button>
            </div>

            {/* User Profile Chip */}
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl bg-bg-elevated border border-border-subtle hover:border-accent/40 text-left transition-colors duration-150 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-accent text-accent-ink font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {isDirector ? 'MS' : (currentUser.email?.[0]?.toUpperCase() || 'U')}
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-text-primary truncate">
                        {isDirector ? 'Comrade Mugisolo' : (currentUser.displayName || 'Analyst')}
                      </span>
                      <span className="text-[10px] font-mono text-success shrink-0">
                        {subscription.planId === 'FREE_TRIAL' ? '7D FREE' : subscription.planId}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-text-secondary truncate">
                      {subMeta.badgeLabel}
                    </div>
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-accent text-accent-ink text-xs font-semibold transition-opacity hover:opacity-90`}
                title="Sign in with Google"
              >
                <LogIn size={14} />
                {!isSidebarCollapsed && <span>Sign In</span>}
              </button>
            )}
          </div>
        </aside>

        {/* 2. MAIN COLUMN (Slim 56px Top Bar + Centered 1200px Viewport) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* SLIM TOP BAR (56px / h-14) */}
          <header className="h-14 px-4 lg:px-6 border-b border-border-subtle bg-bg-base/85 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
            {/* Left: Mobile Menu Button + Current View Title */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-surface transition-colors"
                title="Open Navigation"
              >
                <Menu size={18} />
              </button>
              <h1 className="font-display font-semibold text-base text-text-primary whitespace-nowrap">
                {currentViewTitle}
              </h1>
            </div>

            {/* Center: Global Cross-Ledger Search Pill (max-w-xl, ⌘K) */}
            <div className="flex-1 max-w-xl relative">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search assets, actors, or incidents..."
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full h-9 pl-9 pr-14 bg-bg-surface border border-border-subtle rounded-full text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors duration-150"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-text-secondary bg-bg-elevated border border-border-subtle rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  ⌘K
                </kbd>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchFocused && globalSearch.trim().length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-bg-elevated border border-border-subtle rounded-2xl shadow-xl z-50 p-2 divide-y divide-border-subtle"
                    >
                      <div className="text-[11px] font-mono text-text-secondary px-2.5 py-1.5">
                        Matching Records ({searchResults.length})
                      </div>
                      {searchResults.length === 0 ? (
                        <div className="text-xs text-text-secondary p-4 text-center">
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
                            className="w-full text-left px-3 py-2 hover:bg-bg-surface rounded-lg transition-colors flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-text-primary truncate">{result.title}</span>
                              <span className="text-[10px] font-mono text-text-secondary shrink-0">
                                {result.type}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-text-secondary truncate">{result.subtitle}</span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Threat Level Segmented Control (L1–L5), Density, Audit Log, PDF Export, Auth Avatar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Compact Segmented Control: Threat Level L1–L5 */}
              <div className="hidden lg:flex items-center bg-bg-surface border border-border-subtle rounded-lg p-0.5" title={threat.label}>
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const active = threatLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        setThreatLevel(lvl);
                        if (lvl === 5) setIsAlertOpen(true);
                      }}
                      className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors duration-150 ${
                        active
                          ? lvl === 5
                            ? 'bg-danger text-white font-semibold'
                            : lvl === 4
                            ? 'bg-warning text-accent-ink font-semibold'
                            : 'bg-accent text-accent-ink font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      L{lvl}
                    </button>
                  );
                })}
              </div>

              {/* Display Density Menu */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsDensityMenuOpen(!isDensityMenuOpen)}
                  className="h-8 px-2.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs font-mono flex items-center gap-1.5 transition-colors duration-150"
                  title="Display density"
                >
                  <SlidersHorizontal size={13} />
                  <span className="hidden xl:inline">{density}</span>
                </button>
                {isDensityMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-bg-elevated border border-border-subtle rounded-xl p-1 shadow-xl z-50">
                    {(['Compact', 'Standard', 'Briefing'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDensity(d);
                          setIsDensityMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          density === d ? 'bg-accent text-accent-ink font-semibold' : 'text-text-primary hover:bg-bg-surface'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subscription & Clearance Tiers Button */}
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="h-8 px-2.5 rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors duration-150"
                title="Subscription & Clearance Tiers — First Week Free | Daily $20 (UGX 100k) | Weekly $150 (UGX 700k) | Monthly $500 (UGX 2M)"
              >
                <CreditCard size={13} />
                <span className="hidden md:inline">
                  {subscription.planId === 'FREE_TRIAL'
                    ? 'Free Trial (7D)'
                    : subscription.planId === 'DAILY'
                    ? 'Daily · $20'
                    : subscription.planId === 'WEEKLY'
                    ? 'Weekly · $150'
                    : 'Monthly · $500'}
                </span>
              </button>

              {/* Operational Audit Log Icon */}
              <button 
                onClick={() => setIsAuditPanelOpen(true)}
                className="h-8 w-8 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors duration-150"
                title="Operational Audit Log"
              >
                <Terminal size={14} />
              </button>
              
              {/* PDF Export Icon */}
              <button 
                onClick={handleExportDashboardPDF}
                className="h-8 w-8 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors duration-150"
                title="Export Strategic Briefing PDF"
              >
                <Download size={14} />
              </button>

              {/* Auth Avatar / Sign-in */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="h-8 px-2.5 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-primary flex items-center gap-2 transition-colors duration-150"
                    title={isDirector ? "Comrade Mugisolo — Director of Strategic Oversight" : (currentUser.email || "User Profile")}
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-accent text-accent-ink flex items-center justify-center font-mono text-[10px] font-bold">
                        {isDirector ? 'MS' : (currentUser.email?.[0]?.toUpperCase() || 'U')}
                      </div>
                    )}
                    <span className="font-mono text-xs hidden sm:inline">
                      {isDirector ? 'Mugisolo' : (currentUser.displayName?.split(' ')[0] || 'Analyst')}
                    </span>
                  </button>

                  {/* User Profile Dropdown */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-bg-elevated border border-border-subtle rounded-2xl shadow-xl p-4 z-50 space-y-3 divide-y divide-border-subtle"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-text-secondary">Operator Identity</span>
                            <span className="text-[11px] font-mono text-accent">
                              {isDirector ? 'Director · SFC' : 'Authenticated'}
                            </span>
                          </div>
                          <div className="font-display font-semibold text-sm text-text-primary">
                            {isDirector ? 'Comrade Mugisolo' : (currentUser.displayName || 'Strategic Officer')}
                          </div>
                          <div className="font-mono text-xs text-text-secondary break-all">
                            {currentUser.email}
                          </div>
                        </div>

                        <div className="pt-3 space-y-1.5 text-xs font-mono">
                          <div className="flex justify-between items-center text-text-secondary">
                            <span>Firestore DB:</span>
                            <span className="text-text-primary">ai-studio-92ba9721</span>
                          </div>
                          <div className="flex justify-between items-center text-text-secondary">
                            <span>Clearance:</span>
                            <span className="text-text-primary">
                              {isDirector ? "Level 5 (Presidential)" : "Level 3 (Tactical)"}
                            </span>
                          </div>
                        </div>

                        {/* Active Subscription Status in Profile Settings */}
                        <div className="pt-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-text-secondary uppercase">
                              Subscription Status
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-success/15 text-success border border-success/30">
                              {subscription.status === 'TRIAL_ACTIVE' ? 'FIRST WEEK FREE' : 'ACTIVE'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Tier:</span>
                              <span className="text-text-primary font-semibold">{subscription.planName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Rate:</span>
                              <span className="text-accent">{subscription.priceDisplay}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Free Window:</span>
                              <span className="text-success">{subMeta.trialDaysLeft}d remaining</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsSubscriptionModalOpen(true);
                            }}
                            className="w-full py-2 px-3 bg-accent hover:opacity-90 text-accent-ink rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
                          >
                            <CreditCard size={13} />
                            <span>Manage Subscription Tier</span>
                          </button>
                        </div>

                        <div className="pt-3">
                          <button
                            onClick={async () => {
                              await logout();
                              setIsUserMenuOpen(false);
                              logOperationalAction('User logged out from strategic terminal', 'SYSTEM');
                            }}
                            className="w-full py-2 px-3 bg-bg-surface hover:bg-danger/15 border border-border-subtle hover:border-danger/40 text-text-primary hover:text-danger rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <LogOut size={13} />
                            <span>Sign Out</span>
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
                  className="h-8 px-3 bg-accent hover:opacity-90 text-accent-ink text-xs font-semibold rounded-lg transition-opacity flex items-center gap-1.5"
                >
                  <LogIn size={13} />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </header>

          {/* CENTERED MAIN CONTENT AREA (max-w-[1200px], generous 24–32px padding) */}
          <main
            ref={dashboardRef}
            className={`flex-1 overflow-y-auto mx-auto w-full max-w-[1200px] ${
              density === 'Compact' ? 'p-5 lg:p-6' : density === 'Briefing' ? 'p-8 lg:p-10' : 'p-6 lg:p-8'
            }`}
          >
            {pdfExportStatus && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-bg-surface border border-border-subtle text-xs font-mono text-text-primary flex items-center justify-between">
                <span>{pdfExportStatus}</span>
              </div>
            )}
            {renderView()}
          </main>
        </div>
      </div>

      {/* Floating Tactical Assistant FAB & Slide-over Panel on non-Chat tabs */}
      {view !== ViewState.CHAT && <Chatbot />}

      {/* Bottom-Right Toast for Real-time High-Severity Kinetic Incidents */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 right-6 z-[80] w-full max-w-md bg-bg-elevated border border-border-subtle border-l-4 border-l-danger rounded-xl shadow-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-danger">
                    {activeToast.severity} · {activeToast.location}
                  </span>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">
                  {activeToast.description}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setView(ViewState.MAP);
                      setActiveToast(null);
                      logOperationalAction(`Acknowledged critical kinetic alert for ${activeToast.location} and routed to Tactical Map.`, 'SECURITY');
                    }}
                    className="px-3 py-1 bg-accent text-accent-ink rounded-lg text-xs font-semibold"
                  >
                    View on Map
                  </button>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="text-xs text-text-secondary hover:text-text-primary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile & Settings Slide-Over Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 w-72 bg-bg-surface border-r border-border-subtle z-[80] p-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Command className="text-accent" size={20} />
                    <h2 className="font-display font-bold text-base text-text-primary">U-ISMS Command</h2>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                {/* Mobile Navigation List */}
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.view;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setView(item.view);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition-colors ${
                          active
                            ? 'bg-accent text-accent-ink font-semibold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                        }`}
                      >
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <div className="text-xs font-mono text-text-secondary">Interface Preferences</div>
                  <button 
                    onClick={() => setIsNightOps(!isNightOps)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-primary"
                  >
                    <span className="flex items-center gap-2.5">
                      {isNightOps ? <Moon size={15} /> : <Sun size={15} className="text-accent" />}
                      <span>{isNightOps ? 'Night Ops (Dark)' : 'Day Briefing (Light)'}</span>
                    </span>
                    <span className="font-mono text-[11px] text-text-secondary">Toggle</span>
                  </button>

                  <div className="bg-bg-elevated border border-border-subtle p-1 flex gap-1 rounded-xl">
                    {(['Compact', 'Standard', 'Briefing'] as const).map(d => (
                      <button 
                        key={d}
                        onClick={() => setDensity(d)}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                          density === d ? 'bg-accent text-accent-ink font-semibold' : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* Profile Subscription Status Card in Settings Drawer */}
                  <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-text-secondary uppercase">
                        Active Tier
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                        {subscription.status === 'TRIAL_ACTIVE' ? '1ST WEEK FREE' : 'ACTIVE'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-text-primary">
                      {subscription.planName}
                    </div>
                    <div className="text-[11px] font-mono text-accent">
                      {subscription.priceDisplay} · {subMeta.trialDaysLeft}d free window
                    </div>
                    <button 
                      onClick={() => {
                        setIsSubscriptionModalOpen(true);
                        setIsDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-accent text-accent-ink text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <CreditCard size={14} />
                      <span>Manage Subscription Tiers</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setIsAuditPanelOpen(true);
                      setIsDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-bg-elevated border border-border-subtle text-xs text-text-primary hover:border-accent/40"
                  >
                    <Terminal size={15} className="text-accent" />
                    <span>Operational Audit Log</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center font-mono text-xs font-bold text-accent">
                  UG
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">National Security Grid</p>
                  <p className="text-[11px] font-mono text-success">Operational</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Level 5 Threat Escalation Modal */}
      <AnimatePresence>
        {isAlertOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-6 flex items-center justify-center"
          >
            <div className="w-full max-w-md bg-bg-elevated border border-danger rounded-2xl p-6 space-y-5 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-danger/15 text-danger flex items-center justify-center mx-auto">
                <ShieldAlert size={26} />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-danger">THREAT LEVEL 5 — CRITICAL</span>
                <h2 className="font-display text-2xl font-bold text-text-primary">Critical Theater Escalation</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Multi-domain sensors indicate heightened kinetic friction across monitored corridors. High-Command contingency readiness is active.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsAlertOpen(false)}
                  className="flex-1 py-2.5 bg-danger text-white font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity"
                >
                  Acknowledge
                </button>
                <button 
                  onClick={() => {
                    setThreatLevel(3);
                    setIsAlertOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-bg-surface border border-border-subtle text-text-primary text-xs font-medium rounded-xl hover:bg-bg-base transition-colors"
                >
                  Return to L3
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Operational Session Audit Log Panel */}
      <OperationalAuditPanel isOpen={isAuditPanelOpen} onClose={() => setIsAuditPanelOpen(false)} />

      {/* Command Clearance & Subscription Tiers Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentUser={currentUser}
        subscription={subscription}
        onSelectPlan={setSubscription}
      />
    </div>
  );
};
