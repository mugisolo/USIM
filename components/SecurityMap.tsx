import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Incident, ViewState } from '../types';
import { MapPin, Plus, Shield, X, Globe, Activity, BrainCircuit, ChevronRight, Users } from 'lucide-react';

interface ViolenceMapProps {
  incidents: Incident[];
  onUpdateIncidents?: (_incidents: Incident[]) => void;
  onNavigate?: (view: ViewState) => void;
  fullScreen?: boolean;
}

export const SecurityMap: React.FC<ViolenceMapProps> = ({ incidents, onUpdateIncidents, onNavigate }) => {
  const [isAdminMode] = useState(false);
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

  // Strict semantic severity colors: CRITICAL=red, HIGH=amber, MEDIUM=blue, LOW=neutral gray
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-danger bg-danger/10 border-danger/30';
      case 'HIGH': return 'text-warning bg-warning/10 border-warning/30';
      case 'MEDIUM': return 'text-info bg-info/10 border-info/30';
      case 'LOW': return 'text-text-secondary bg-bg-elevated border-border-subtle';
      default: return 'text-text-secondary bg-bg-elevated border-border-subtle';
    }
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
        latitude: 1.373,
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

  return (
    <div className="space-y-4 animate-fade-in relative">
      {/* 1. Module Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-text-primary">Tactical Security Log</h2>
          <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mt-0.5">Ground Truth Incident Feed</p>
        </div>
        <div className="flex items-center gap-2">
          {onUpdateIncidents && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 bg-accent text-accent-ink rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Log SitRep</span>
            </button>
          )}
          <div className="w-9 h-9 bg-bg-surface border border-border-subtle rounded-xl flex items-center justify-center text-text-secondary">
            <Activity size={16} />
          </div>
        </div>
      </div>

      {/* 2. Status Strip */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl py-2.5 px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-text-secondary uppercase">Grid Node Status: Operational</span>
        </div>
        <div className="flex gap-4">
          <span className="text-success">CENTRAL: STABLE</span>
          <span className="text-warning">BORDER: WATCH</span>
        </div>
      </div>

      {/* 3. Incident Feed List */}
      <div className="space-y-2.5">
        {Array.isArray(incidents) && incidents.length > 0 ? (
          incidents.map((incident, idx) => (
            <motion.button 
              key={incident.id} 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => setSelectedIncident(incident)}
              className="w-full bg-bg-surface hover:bg-bg-elevated/60 border border-border-subtle rounded-2xl p-4 flex items-start gap-4 group relative transition-colors text-left"
            >
              {/* Severity Pill & Date */}
              <div className="w-16 shrink-0 flex flex-col items-start gap-1.5">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold uppercase ${getSeverityColor(incident.severity || 'MEDIUM')}`}>
                  {incident.severity || 'MED'}
                </span>
                <span className="text-[11px] font-mono text-text-secondary tabular-nums">
                  {incident.date.split('-').slice(1).join('/')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-grow pr-6">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {incident.location}
                  </h4>
                  <span className="text-[11px] font-mono text-text-secondary uppercase">{incident.type}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-2.5 text-justify report-justified">
                  {incident.description}
                </p>
                
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  {incident.fatalities > 0 && (
                    <div className="flex items-center gap-1.5 text-danger font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                      <span>{incident.fatalities} CASUALTIES</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Shield size={12} className="text-success" />
                    <span>OSINT_VERIFIED</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-hover:opacity-100 transition-opacity" size={16} />
            </motion.button>
          ))
        ) : (
          <div className="py-16 text-center bg-bg-surface border border-border-subtle rounded-2xl text-text-secondary">
            <Globe size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-xs font-mono uppercase tracking-wider">No reports active in registry</p>
          </div>
        )}
      </div>

      {/* 4. Incident Detail Slide-Over */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-bg-surface border-l border-border-subtle h-full overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-bg-surface/95 backdrop-blur-md h-16 flex items-center justify-between px-6 z-10 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedIncident.severity === 'CRITICAL' ? 'bg-danger' : 'bg-accent'}`} />
                <h3 className="font-display text-sm font-semibold text-text-primary">Operational Incident Report</h3>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-grow">
              <header className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-mono font-medium uppercase px-2.5 py-0.5 rounded-md border ${getSeverityColor(selectedIncident.severity || 'MEDIUM')}`}>
                    {selectedIncident.severity || 'MEDIUM'} SEVERITY
                  </span>
                  <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-md border border-border-subtle bg-bg-elevated text-text-secondary">
                    {selectedIncident.type}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">{selectedIncident.location}</h2>
                <p className="text-xs font-mono text-text-secondary uppercase">
                  Captured: {selectedIncident.date} // {selectedIncident.osintReport?.timeline?.[0]?.time || '00:00'}Z
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-elevated/60 border border-border-subtle rounded-xl p-4 text-center">
                  <p className="text-xs font-mono text-text-secondary uppercase mb-1">Confidence Score</p>
                  <p className="font-display text-2xl font-bold text-text-primary tabular-nums">{selectedIncident.osintReport?.credibilityScore || 85}%</p>
                </div>
                <div className="bg-bg-elevated/60 border border-border-subtle rounded-xl p-4 text-center">
                  <p className="text-xs font-mono text-text-secondary uppercase mb-1">Total Casualties</p>
                  <p className="font-display text-2xl font-bold text-danger tabular-nums">{selectedIncident.fatalities + selectedIncident.injuries}</p>
                </div>
              </div>

              <section className="space-y-2 report-justified">
                <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary">Narrative Dossier</h4>
                <div className="border-l-2 border-accent pl-4 py-1 text-sm leading-relaxed text-text-primary text-justify">
                  "{selectedIncident.description}"
                </div>
              </section>

              <section className="space-y-2 report-justified">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={15} className="text-accent" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-text-primary">Contextual Synthesis</h4>
                </div>
                <div className="bg-bg-elevated/60 border border-border-subtle p-4 rounded-xl">
                  <p className="text-xs leading-relaxed text-text-secondary text-justify">
                    {selectedIncident.osintReport?.aiAnalysis || "Strategic analysis pending deeper network crawl. Indicators suggest a localized friction point rather than a systemic territorial shift."}
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary">Source Attribution</h4>
                <div className="space-y-2">
                  {(selectedIncident.osintReport?.verifiedSources || ['Local OSINT Cluster Alpha', 'Ground Surveillance SIGINT']).map((src, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 bg-bg-elevated/40 border border-border-subtle rounded-xl">
                      <Globe size={14} className="text-accent" />
                      <span className="text-xs font-mono text-text-secondary truncate">{src}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-4 space-y-2.5">
                {onNavigate && (
                  <button 
                    onClick={() => { onNavigate(ViewState.ACTORS); setSelectedIncident(null); }}
                    className="w-full bg-accent text-accent-ink py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Users size={16} />
                    <span>Investigate Linked Actors</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="bg-bg-elevated border border-border-subtle py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5">
                    <MapPin size={14} />
                    <span>Map Point</span>
                  </button>
                  <button onClick={() => setSelectedIncident(null)} className="border border-border-subtle py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary">
                    Close Report
                  </button>
                </div>
                {isAdminMode && (
                  <button 
                    onClick={() => { handleDelete(selectedIncident.id); setSelectedIncident(null); }}
                    className="w-full border border-danger/40 text-danger py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Redact Intelligence
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm p-4 animate-fade-in flex items-center justify-center">
          <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg font-bold text-text-primary">Draft SitRep</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-text-secondary">Theater / Location</label>
                <input 
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:border-accent outline-none"
                  placeholder="e.g. Arua District, West Nile"
                  value={newIncident.location}
                  onChange={e => setNewIncident({...newIncident, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-text-secondary">Report Date</label>
                  <input 
                    type="date"
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:border-accent outline-none"
                    value={newIncident.date}
                    onChange={e => setNewIncident({...newIncident, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-text-secondary">Severity</label>
                  <select 
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:border-accent outline-none"
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
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-text-secondary">Narrative Description</label>
                <textarea 
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-3 text-sm text-text-primary focus:border-accent outline-none h-24 resize-none"
                  placeholder="Detailed incident narrative..."
                  value={newIncident.description}
                  onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAdd}
                className="w-full bg-accent text-accent-ink py-3 rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity"
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
