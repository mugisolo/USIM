import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  User, 
  Clock, 
  Search, 
  Trash2, 
  X, 
  Download, 
  AlertTriangle, 
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

  useEffect(() => {
    const loadLogs = () => {
      try {
        const existing = sessionStorage.getItem(STORAGE_KEY);
        if (existing) {
          setLogs(JSON.parse(existing));
        } else {
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

  const triggerMockKineticIncident = async () => {
    setIsSimulating(true);
    try {
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
        return 'text-danger bg-danger/10 border-danger/30';
      case 'USER_QUERY':
        return 'text-accent bg-accent/10 border-accent/30';
      case 'DATA_OPERATION':
        return 'text-info bg-info/10 border-info/30';
      case 'SYSTEM':
      default:
        return 'text-success bg-success/10 border-success/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-[70] backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-2xl z-[80] flex flex-col font-sans"
            id="operational-audit-panel"
          >
            {/* Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-bg-elevated/50">
              <div className="flex items-center gap-3">
                <Terminal className="text-accent" size={18} />
                <div>
                  <h3 className="font-display text-sm font-semibold text-text-primary">Operational Audit Log</h3>
                  <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Session Accountability Ledger</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Live Alert trigger */}
            <div className="px-5 py-4 border-b border-border-subtle bg-danger/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-danger uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Kinetic Incident Simulation
                </span>
                <span className="text-[10px] font-mono text-text-secondary">VALIDATION</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Add a critical incident to Firestore to validate the real-time alert banner.
              </p>
              <button
                onClick={triggerMockKineticIncident}
                disabled={isSimulating}
                className="w-full mt-1 px-3 py-2 bg-danger/15 hover:bg-danger/25 border border-danger/30 rounded-xl text-xs font-mono font-semibold text-danger transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play size={11} className="fill-current" />
                {isSimulating ? "UPLOADING INCIDENT..." : "TRIGGER CRITICAL KINETIC INCIDENT"}
              </button>
            </div>

            {/* Filters */}
            <div className="p-5 border-b border-border-subtle space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-bg-elevated border border-border-subtle rounded-xl font-mono text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'SYSTEM', 'SECURITY', 'USER_QUERY', 'DATA_OPERATION'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium uppercase transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-accent text-accent-ink font-semibold' 
                        : 'bg-bg-elevated text-text-secondary border border-border-subtle hover:text-text-primary'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List */}
            <div className="flex-grow overflow-y-auto p-5 space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
                  <Server className="text-text-secondary/40" size={28} />
                  <p className="text-xs font-mono text-text-secondary uppercase">No audit logs match criteria</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3.5 bg-bg-elevated/50 border border-border-subtle rounded-xl space-y-2 hover:bg-bg-elevated transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase border ${getCategoryStyles(log.category)}`}>
                        {log.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-text-secondary tabular-nums">
                        <Clock size={11} />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <p className="text-xs text-text-primary font-mono leading-relaxed select-all">
                      {log.action}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary border-t border-border-subtle pt-2">
                      <span className="flex items-center gap-1 text-text-primary">
                        <User size={11} className="text-accent" /> {log.operator}
                      </span>
                      <span>ID: {log.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Controls */}
            <div className="p-5 border-t border-border-subtle bg-bg-elevated/40 flex items-center justify-between gap-3">
              <button
                onClick={handleClearLogs}
                className="px-3.5 py-2 bg-bg-elevated hover:bg-danger/10 border border-border-subtle hover:border-danger/30 text-text-secondary hover:text-danger rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} /> Clear
              </button>
              
              <button
                onClick={handleExportLogs}
                className="flex-grow py-2 bg-accent hover:opacity-90 text-accent-ink rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity"
              >
                <Download size={13} /> Export Audit Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
