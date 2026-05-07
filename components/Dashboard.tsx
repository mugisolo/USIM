
// Fix: Added missing imports for React, Lucide icons, types, components, and services
import React, { useState, useEffect, useMemo } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState, Incident, PEPProfile, StrategicAsset } from '../types';
import { StatCard } from './StatCard';
import { SecurityMap } from './SecurityMap';
import { ReportAnalyzer } from './ReportAnalyzer';
import { PEPAnalytics } from './PEPAnalytics';
import { StrategicAssetsMap } from './StrategicAssetsMap';
import { Chatbot } from './Chatbot';
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

export const Dashboard: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CHAT);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pepProfiles, setPepProfiles] = useState<PEPProfile[]>([]);
  const [assets, setAssets] = useState<StrategicAsset[]>([]);
  
  // Operational States
  const [threatLevel, setThreatLevel] = useState(3);
  const [isNightOps, setIsNightOps] = useState(false);
  const [density, setDensity] = useState<'Compact' | 'Standard' | 'Briefing'>('Compact');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);

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
              case ViewState.SYNTHESIS:
                return <ReportAnalyzer />;
              case ViewState.ASSETS:
                return <StrategicAssetsMap assets={assets} />;
              case ViewState.THEATER:
              default:
                return (
                  <div className="space-y-8 pt-2">
                    {/* 1. Theater Stability Matrix */}
                    <section className="animate-fade-in">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div>
                          <h2 className="text-pearl-africa font-black tracking-tighter text-lg uppercase leading-none">Theater Stability Grid</h2>
                          <p className="text-[10px] font-mono text-infra-steel uppercase tracking-widest mt-1">Ground Truth Protocol V4.2</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="h-1 w-8 bg-savanna-sage rounded-full" />
                           <LayoutGrid size={18} className="text-crested-gold" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                        <StabilityStack region="NORTH: KARAMOJA" score={31} trend="down" />
                        <StabilityStack region="EAST: ELGON" score={72} trend="stable" />
                        <StabilityStack region="WEST: ALBERTINE" score={89} trend="up" />
                        <StabilityStack region="SOUTH: VICTORIA" score={58} trend="down" />
                      </div>
                    </section>
                    
                    {/* 2. Tactical Briefing Summary */}
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
        <div className="flex items-center gap-2">
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

      {/* 3. Main Operational Grid */}
      <main className={`flex-grow ${isChatView ? 'p-0 pb-16 overflow-hidden' : 'p-4 overflow-y-auto pb-32'} max-w-lg mx-auto w-full ${density === 'Compact' ? 'text-xs' : density === 'Briefing' ? 'text-lg' : 'text-base'}`}>
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
    </div>
  );
};
