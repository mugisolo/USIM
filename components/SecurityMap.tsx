
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Incident, ViewState } from '../types';
// Fixed: Added missing BrainCircuit and Download icon imports from lucide-react.
import { Clock, MapPin, FileText, ArrowUpRight, Plus, Upload, Trash2, Shield, Lock, X, Globe, Activity, ShieldCheck, Zap, BrainCircuit, Download, ChevronRight, Users } from 'lucide-react';

interface ViolenceMapProps {
  incidents: Incident[];
  onUpdateIncidents?: (_incidents: Incident[]) => void;
  onNavigate?: (view: ViewState) => void;
  fullScreen?: boolean;
}

export const SecurityMap: React.FC<ViolenceMapProps> = ({ incidents, onUpdateIncidents, onNavigate, fullScreen = false }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newIncident, setNewIncident] = useState<Partial<Incident>>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    type: 'Violence',
    severity: 'MEDIUM',
    fatalities: 0,
    injuries: 0,
    description: '',
    verified: false
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-brotherhood-crimson bg-brotherhood-crimson/20 border-brotherhood-crimson/40';
      case 'HIGH': return 'text-rift-rust bg-rift-rust/20 border-rift-rust/40';
      case 'MEDIUM': return 'text-nile-amber bg-nile-amber/20 border-nile-amber/40';
      case 'LOW': return 'text-intel-blue bg-intel-blue/20 border-intel-blue/40';
      default: return 'text-crane-grey bg-crane-grey/20 border-crane-grey/40';
    }
  };

  const getReliabilityColor = (reliability: string) => {
    if (!reliability) return 'bg-slate-700 text-slate-400 border-slate-600';
    if (reliability.startsWith('A')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (reliability.startsWith('B')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (reliability.startsWith('C')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (reliability.startsWith('D')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleDelete = (id: string) => {
    if (onUpdateIncidents && window.confirm('Delete this incident report?')) {
        onUpdateIncidents(incidents.filter(i => i.id !== id));
    }
  };

  const handleAdd = () => {
    if (onUpdateIncidents && newIncident.location && newIncident.description) {
        const incident: Incident = {
            id: `new-${Date.now()}`,
            latitude: 1.373, // Default Uganda center
            longitude: 32.290,
            date: newIncident.date || new Date().toISOString().split('T')[0],
            location: newIncident.location || 'Unknown',
            type: newIncident.type as any || 'Violence',
            fatalities: Number(newIncident.fatalities) || 0,
            injuries: Number(newIncident.injuries) || 0,
            description: newIncident.description || '',
            verified: false
        };
        onUpdateIncidents([incident, ...incidents]);
        setIsAddModalOpen(false);
        setNewIncident({
            date: new Date().toISOString().split('T')[0],
            location: '',
            type: 'Violence',
            fatalities: 0,
            injuries: 0,
            description: '',
            verified: false
        });
    }
  };

  const handleBulkUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onUpdateIncidents) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          try {
              const lines = text.split('\n');
              const newItems: Incident[] = [];
              
              lines.forEach((line, index) => {
                  if (index === 0) return; // Skip header
                  const [date, location, type, desc, deaths, inj] = line.split(',').map(s => s.trim());
                  if (date && location) {
                      newItems.push({
                          id: `bulk-${Date.now()}-${index}`,
                          date,
                          location,
                          type: (type as any) || 'Violence',
                          description: desc || 'Imported incident',
                          fatalities: Number(deaths) || 0,
                          injuries: Number(inj) || 0,
                          latitude: 1.373,
                          longitude: 32.290,
                          verified: false
                      });
                  }
              });

              if (newItems.length > 0) {
                  onUpdateIncidents([...newItems, ...incidents]);
                  alert(`Successfully imported ${newItems.length} incidents.`);
              }
          } catch {
              alert("Failed to parse CSV. Format: Date,Location,Type,Description,Fatalities,Injuries");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Module Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-pearl-africa font-black tracking-tighter text-lg uppercase leading-none">Tactical Security Log</h2>
          <p className="text-[10px] font-mono text-crane-grey uppercase tracking-widest mt-1">Ground Truth Intelligence V4.2</p>
        </div>
        <div className="flex gap-2">
           {onUpdateIncidents && (
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="p-3 bg-intel-blue/10 rounded-full text-intel-blue hover:bg-intel-blue hover:text-white transition-all shadow-lg active:scale-90"
             >
                <Plus size={18} />
             </button>
           )}
           <div className="p-3 bg-brotherhood-crimson/10 rounded-full text-brotherhood-crimson shadow-lg">
             <Activity size={20} />
           </div>
        </div>
      </div>

      {/* 2. Live Intel Feed - Ticker Style Header */}
      <div className="bg-lake-victoria border-y border-white/5 py-3 px-1 flex items-center justify-between overflow-hidden shadow-inner">
        <div className="flex items-center gap-3">
           <span className="w-2 h-2 rounded-full bg-brotherhood-crimson animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-crane-grey whitespace-nowrap">Grid Node Status: Operational</span>
        </div>
        <div className="flex gap-5">
           <span className="text-[9px] font-mono text-savanna-sage uppercase tracking-tighter">Sector: C [STABLE]</span>
           <span className="text-[9px] font-mono text-brotherhood-crimson uppercase tracking-tighter">Sector: N [WATCH]</span>
        </div>
      </div>

      {/* 3. The Stacked Intelligence List */}
      <div className="space-y-1">
        {Array.isArray(incidents) && incidents.length > 0 ? (
          incidents.map((incident, idx) => (
            <motion.button 
              key={incident.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedIncident(incident)}
              className="w-full stacked-precision-card p-5 flex items-start gap-5 active:bg-white/5 group relative"
            >
              {/* Severity & Spatial reference */}
              <div className="w-14 shrink-0 flex flex-col items-center gap-3">
                 <div className={`w-10 h-10 rounded-sm border flex items-center justify-center ${
                    incident.severity === 'CRITICAL' ? 'bg-brotherhood-crimson/10 border-brotherhood-crimson text-brotherhood-crimson shadow-[0_0_15px_rgba(196,30,58,0.2)]' :
                    incident.severity === 'HIGH' ? 'bg-rift-rust/10 border-rift-rust text-rift-rust' :
                    'bg-intel-blue/10 border-intel-blue/30 text-intel-blue'
                 }`}>
                    <span className="text-[11px] font-black uppercase">{incident.severity?.[0] || 'M'}</span>
                 </div>
                 <div className="h-6 w-px bg-white/5" />
                 <span className="text-[9px] font-mono text-crane-grey uppercase tracking-tighter whitespace-nowrap">{incident.date.split('-').slice(1).join('/')}</span>
              </div>

              {/* Content */}
              <div className="flex-grow text-left">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-[14px] font-black text-pearl-africa tracking-tight uppercase leading-none group-active:text-crested-gold">{incident.location}</h4>
                   <span className="text-[9px] font-black text-crane-grey uppercase tracking-[0.2em]">{incident.type}</span>
                </div>
                <p className="text-[12px] text-crane-grey leading-tight line-clamp-2 italic mb-3 opacity-80 group-active:opacity-100 transition-opacity">"{incident.description}"</p>
                
                <div className="flex items-center gap-4">
                   {incident.fatalities > 0 && (
                     <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brotherhood-crimson shadow-[0_0_5px_var(--color-brotherhood-crimson)]" />
                        <span className="text-[9px] font-black text-brotherhood-crimson uppercase tracking-widest">{incident.fatalities} CASUALTIES</span>
                     </div>
                   )}
                   <div className="flex items-center gap-2">
                      <Shield size={12} className="text-savanna-sage" />
                      <span className="text-[9px] font-mono text-crane-grey uppercase tracking-widest">OSINT_VERIFIED</span>
                   </div>
                </div>
              </div>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-crane-grey opacity-10 group-active:opacity-100 group-active:translate-x-1 transition-all" size={16} />
            </motion.button>
          ))
        ) : (
          <div className="py-20 text-center opacity-20">
             <Globe size={48} className="mx-auto mb-4" />
             <p className="text-sm font-black uppercase tracking-widest">No reports active in registry</p>
          </div>
        )}
      </div>

      {/* 4. Incident Detail Full-Screen Overlay */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[100] bg-kampala-obsidian overflow-y-auto animate-fade-in">
           {/* Modal Header */}
           <div className="sticky top-0 bg-kampala-obsidian/90 backdrop-blur-md h-16 flex items-center justify-between px-6 z-10 border-b border-white/5">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${selectedIncident.severity === 'CRITICAL' ? 'bg-threat-crimson' : 'bg-intel-blue'}`} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em]">Operational Report</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-2 bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
           </div>

           {/* Modal Content */}
           <div className="p-6 space-y-8 max-w-lg mx-auto">
              <header className="space-y-4">
                 <div className="flex flex-wrap gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded border ${getSeverityColor(selectedIncident.severity || 'MEDIUM')}`}>
                       {selectedIncident.severity || 'MEDIUM'} SEVERITY
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded border border-white/10 bg-white/5 text-infra-steel">
                       {selectedIncident.type}
                    </span>
                 </div>
                 <h2 className="text-3xl font-black tracking-tighter leading-none">{selectedIncident.location}</h2>
                 <p className="text-[10px] font-mono text-infra-steel uppercase tracking-widest">
                    Captured: {selectedIncident.date} // {selectedIncident.osintReport?.timeline?.[0]?.time || '00:00'}Z
                 </p>
              </header>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="stacked-precision-card p-4 text-center">
                    <p className="text-[9px] font-black text-infra-steel uppercase mb-1 tracking-widest">Intelligence</p>
                    <p className="text-xl font-black text-intel-blue">{selectedIncident.osintReport?.credibilityScore || 85}%</p>
                    <p className="text-[7px] text-infra-steel uppercase font-mono mt-1">Confidence Score</p>
                 </div>
                 <div className="stacked-precision-card p-4 text-center">
                    <p className="text-[9px] font-black text-infra-steel uppercase mb-1 tracking-widest">Kinetic Impact</p>
                    <p className="text-xl font-black text-threat-crimson">{selectedIncident.fatalities + selectedIncident.injuries}</p>
                    <p className="text-[7px] text-infra-steel uppercase font-mono mt-1">Total Casualties</p>
                 </div>
              </div>

              {/* Detailed Narrative */}
              <section className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-infra-steel border-b border-white/5 pb-2">Narrative Dossier</h4>
                 <div className="synth-border p-5 italic text-sm leading-relaxed text-pearl-white/90">
                    "{selectedIncident.description}"
                 </div>
              </section>

              {/* Strategic Synthesis */}
              <section className="space-y-4">
                 <div className="flex items-center gap-2">
                    <BrainCircuit size={16} className="text-intel-blue" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-pearl-white">AI Contextualization</h4>
                 </div>
                 <div className="bg-intel-blue/5 border border-intel-blue/10 p-5 rounded-lg">
                    <p className="text-xs leading-relaxed text-infra-steel">
                       {selectedIncident.osintReport?.aiAnalysis || "Strategic analysis pending deeper network crawl. Indicators suggest a localized friction point rather than a systemic territorial shift."}
                    </p>
                 </div>
              </section>

              {/* Source Verification */}
              <section className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-infra-steel">Source Attribution</h4>
                 <div className="space-y-2">
                    {(selectedIncident.osintReport?.verifiedSources || ['Local OSINT Cluster Alpha', 'Ground Surveillance SIGINT']).map((src, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded">
                         <Globe size={14} className="text-intel-blue" />
                         <span className="text-[10px] font-mono text-infra-steel truncate">{src}</span>
                      </div>
                    ))}
                 </div>
              </section>

              {/* Action Matrix */}
              <div className="pt-10 space-y-4">
                 {onNavigate && (
                    <button 
                       onClick={() => { onNavigate(ViewState.ACTORS); setSelectedIncident(null); }}
                       className="w-full bg-crested-gold text-lake-victoria py-4 rounded font-black uppercase tracking-widest text-[11px] shadow-lg shadow-crested-gold/20 flex items-center justify-center gap-3"
                    >
                       <Users size={18} /> Investigate Linked Actors
                    </button>
                 )}
                 <button className="w-full bg-intel-blue text-pearl-white py-4 rounded font-black uppercase tracking-widest text-[11px] shadow-lg shadow-intel-blue/20">
                    Export Situational Report
                 </button>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="bg-white/5 border border-white/10 py-3 rounded text-[10px] font-black uppercase text-infra-steel tracking-widest flex items-center justify-center gap-2">
                       <MapPin size={14} /> Map Point
                    </button>
                    <button onClick={() => setSelectedIncident(null)} className="border border-white/10 py-3 rounded text-[10px] font-black uppercase text-infra-steel tracking-widest">
                       Return to Feed
                    </button>
                 </div>
                 {isAdminMode && (
                   <button 
                      onClick={() => { handleDelete(selectedIncident.id); setSelectedIncident(null); }}
                      className="w-full border border-threat-crimson/50 text-threat-crimson py-3 rounded text-[10px] font-black uppercase tracking-widest"
                   >
                      Redact Intelligence
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-kampala-obsidian/95 p-6 animate-fade-in flex flex-col items-center justify-center">
           <div className="w-full max-w-sm space-y-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Draft SitRep</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 border border-white/10 rounded-full">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-infra-steel tracking-widest">Theater / Location</label>
                    <input 
                       className="w-full bg-nile-slate border border-white/10 rounded-lg p-3 text-sm focus:border-intel-blue outline-none"
                       placeholder="e.g. Arua District, West Nile"
                       value={newIncident.location}
                       onChange={e => setNewIncident({...newIncident, location: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-infra-steel tracking-widest">Report Date</label>
                       <input 
                          type="date"
                          className="w-full bg-nile-slate border border-white/10 rounded-lg p-3 text-sm focus:border-intel-blue outline-none"
                          value={newIncident.date}
                          onChange={e => setNewIncident({...newIncident, date: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-infra-steel tracking-widest">Severity</label>
                       <select 
                          className="w-full bg-nile-slate border border-white/10 rounded-lg p-3 text-sm focus:border-intel-blue outline-none"
                          value={newIncident.severity}
                          onChange={e => setNewIncident({...newIncident, severity: e.target.value as any})}
                       >
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-infra-steel tracking-widest">Narrative Description</label>
                    <textarea 
                       className="w-full bg-nile-slate border border-white/10 rounded-lg p-3 text-sm focus:border-intel-blue outline-none h-24 resize-none"
                       placeholder="Detailed incident narrative..."
                       value={newIncident.description}
                       onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                    />
                 </div>
                 <button 
                    onClick={handleAdd}
                    className="w-full bg-intel-blue text-pearl-white py-4 rounded font-black uppercase tracking-widest text-[11px] shadow-lg shadow-intel-blue/20 pt-4"
                 >
                    Authorize SITREP Publication
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
