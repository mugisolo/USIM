import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Terminal, 
  User, 
  Clock, 
  Search, 
  Trash2, 
  X, 
  ChevronRight, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Server,
  Play
} from 'lucide-react';
import { addIncidentToDb } from '../services/firestoreService';
import { Incident } from '../types';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'SYSTEM' | 'SECURITY' | 'USER_QUERY' | 'DATA_OPERATION';
  operator: string;
}

const STORAGE_KEY = 'u-isms-audit-logs';

export const logOperationalAction = (
  action: string,
  category: AuditLogEntry['category'],
  operator: string = 'UC_01'
) => {
  const entry: AuditLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action,
    category,
    operator,
  };
  
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(entry);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn("sessionStorage write failed", e);
  }

  window.dispatchEvent(new CustomEvent('operational-audit-log', { detail: entry }));
};

interface OperationalAuditPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperationalAuditPanel: React.FC<OperationalAuditPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);

  // Load logs on mount
  useEffect(() => {
    const loadLogs = () => {
      try {
        const existing = sessionStorage.getItem(STORAGE_KEY);
        if (existing) {
          setLogs(JSON.parse(existing));
        } else {
          // Add default init entries
          const initialLogs: AuditLogEntry[] = [
            {
              id: 'init-1',
              timestamp: new Date(Date.now() - 600000).toISOString(),
              action: 'U-ISMS surveillance engine initialized.',
              category: 'SYSTEM',
              operator: 'SYS_DAEMON'
            },
            {
              id: 'init-2',
              timestamp: new Date(Date.now() - 300000).toISOString(),
              action: 'Secure link with Alpha_Core theater established.',
              category: 'SECURITY',
              operator: 'SYS_DAEMON'
            },
            {
              id: 'init-3',
              timestamp: new Date(Date.now() - 150000).toISOString(),
              action: 'Multi-domain sensor array online and synchronized.',
              category: 'SYSTEM',
              operator: 'SYS_DAEMON'
            }
          ];
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialLogs));
          setLogs(initialLogs);
        }
      } catch (e) {
        console.warn("Failed to load sessionStorage logs", e);
      }
    };

    loadLogs();

    // Listen to real-time additions
    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLogEntry>;
      if (customEvent.detail) {
        setLogs(prev => [...prev, customEvent.detail]);
      }
    };

    window.addEventListener('operational-audit-log', handleNewLog);
    return () => {
      window.removeEventListener('operational-audit-log', handleNewLog);
    };
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = 
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchTerm, selectedCategory]);

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear session audit logs?")) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        setLogs([]);
        logOperationalAction('Session audit logs cleared by operator.', 'SECURITY');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExportLogs = () => {
    try {
      const jsonStr = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uisms-audit-log-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logOperationalAction('Audit log report exported to JSON.', 'DATA_OPERATION');
    } catch (e) {
      console.error(e);
    }
  };

  // Simulated Alert Trigger
  const triggerMockKineticIncident = async () => {
    setIsSimulating(true);
    try {
      // Create a mock high-severity kinetic incident and push to firestore
      const mockIncident: Incident = {
        id: `mock-${Math.random().toString(36).substring(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        location: 'Kla_Central_Highway',
        latitude: 0.3162,
        longitude: 32.5821,
        type: 'Military Movement',
        severity: 'CRITICAL',
        fatalities: 0,
        injuries: 0,
        description: `CRITICAL SECURE BREACH: Unscheduled armored troop transport detected near Central Sector. Visual sensor feeds confirm local hostile configuration. [TACTICAL ALERT]`,
        verified: true,
      };

      await addIncidentToDb(mockIncident);
      logOperationalAction('Triggered mock critical kinetic incident in Firestore for system validation.', 'SECURITY');
    } catch (err) {
      console.error("Failed to trigger mock kinetic incident", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const getCategoryStyles = (category: AuditLogEntry['category']) => {
    switch (category) {
      case 'SECURITY':
        return 'text-brotherhood-crimson bg-brotherhood-crimson/10 border-brotherhood-crimson/20';
      case 'USER_QUERY':
        return 'text-crested-gold bg-crested-gold/10 border-crested-gold/20';
      case 'DATA_OPERATION':
        return 'text-intel-blue bg-intel-blue/10 border-intel-blue/20';
      case 'SYSTEM':
      default:
        return 'text-savanna-sage bg-savanna-sage/10 border-savanna-sage/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-sm"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-kampala-obsidian border-l border-white/5 shadow-2xl z-[80] flex flex-col font-sans"
            id="operational-audit-panel"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-lake-victoria/40">
              <div className="flex items-center gap-3">
                <Terminal className="text-crested-gold" size={20} />
                <div>
                  <h3 className="text-sm font-black text-pearl-africa uppercase tracking-widest">Operational Audit Log</h3>
                  <p className="text-[9px] font-mono text-crane-grey uppercase tracking-wider">Session Accountability System</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-crane-grey hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Live Alert trigger for testing */}
            <div className="px-6 py-4 border-b border-white/5 bg-brotherhood-crimson/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-brotherhood-crimson uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} className="animate-pulse" /> Kinetic Incident Sim
                </span>
                <span className="text-[8px] font-mono text-crane-grey">FOR EVALUATION ONLY</span>
              </div>
              <p className="text-[10px] text-crane-grey leading-relaxed">
                Add a high-severity critical incident to Firestore to validate the automated real-time alert banner.
              </p>
              <button
                onClick={triggerMockKineticIncident}
                disabled={isSimulating}
                className="w-full mt-1 px-3 py-1.5 bg-brotherhood-crimson/20 hover:bg-brotherhood-crimson/40 border border-brotherhood-crimson/30 rounded text-[10px] font-mono font-bold text-brotherhood-crimson transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Play size={10} className="fill-current" />
                {isSimulating ? "UPLOADING INCIDENT..." : "TRIGGER CRITICAL KINETIC INCIDENT"}
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-white/5 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crane-grey" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-lake-victoria/50 border border-white/10 rounded font-mono text-xs text-pearl-africa placeholder:text-crane-grey focus:outline-none focus:border-crested-gold/40"
                />
              </div>

              {/* Category Toggles */}
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'SYSTEM', 'SECURITY', 'USER_QUERY', 'DATA_OPERATION'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                      selectedCategory === cat 
                        ? 'bg-crested-gold text-lake-victoria shadow-[0_0_8px_rgba(241,165,17,0.3)]' 
                        : 'bg-white/5 text-crane-grey border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
                  <Server className="text-white/10" size={32} />
                  <p className="text-xs font-mono text-crane-grey uppercase tracking-wider">No audit logs match criteria</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-white/[0.02] border border-white/5 rounded space-y-2 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getCategoryStyles(log.category)}`}>
                        {log.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-[8px] font-mono text-crane-grey">
                        <Clock size={10} />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <p className="text-xs text-pearl-africa font-mono leading-relaxed select-all">
                      {log.action}
                    </p>

                    <div className="flex items-center justify-between text-[8px] font-mono text-crane-grey border-t border-white/5 pt-1.5 mt-1.5">
                      <span className="flex items-center gap-1 text-crested-gold">
                        <User size={10} /> Operator: {log.operator}
                      </span>
                      <span>ID: {log.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Controls */}
            <div className="p-6 border-t border-white/5 bg-lake-victoria/20 flex items-center justify-between gap-4">
              <button
                onClick={handleClearLogs}
                className="px-3 py-2 bg-white/5 hover:bg-brotherhood-crimson/15 border border-white/10 hover:border-brotherhood-crimson/20 text-crane-grey hover:text-brotherhood-crimson rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all"
              >
                <Trash2 size={12} /> Clear Logs
              </button>
              
              <button
                onClick={handleExportLogs}
                className="flex-grow py-2 bg-crested-gold hover:bg-watch-gold text-lake-victoria rounded text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Download size={12} /> Export Audit Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
