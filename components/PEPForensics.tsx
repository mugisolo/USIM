import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Share2, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Database, 
  Activity, 
  Sparkles, 
  Filter, 
  Check, 
  X, 
  ShieldAlert, 
  TrendingUp,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeToPEPRegistry, 
  addPEPRegistryRecord, 
  updatePEPRegistryRecord, 
  deletePEPRegistryRecord, 
  seedPEPRegistry 
} from '../services/firestoreService';
import { PEPRegistryRecord } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PEPForensics: React.FC = () => {
  const [records, setRecords] = useState<PEPRegistryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [influenceSort, setInfluenceSort] = useState<'desc' | 'asc' | 'none'>('desc');
  
  // Form State for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<PEPRegistryRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organization: '',
    connectionsInput: '',
    influenceWeighting: 50,
    status: 'Active' as PEPRegistryRecord['status']
  });

  // Load / Subscribe real-time
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPEPRegistry(
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        console.error("Forensics collection subscription failure:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Seeding of Database
  const handleAutoSeed = async () => {
    if (window.navigator?.vibrate) window.navigator.vibrate([20, 50]);
    setLoading(true);
    try {
      await seedPEPRegistry();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for adding a new record
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      name: '',
      role: '',
      organization: '',
      connectionsInput: '',
      influenceWeighting: 60,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing a record
  const handleOpenEdit = (record: PEPRegistryRecord) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      role: record.role,
      organization: record.organization,
      connectionsInput: record.connections.join(', '),
      influenceWeighting: record.influenceWeighting,
      status: record.status
    });
    setIsModalOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Comrade, the subject name is required.");
      return;
    }

    const processedConnections = formData.connectionsInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const recordData = {
      name: formData.name.trim(),
      role: formData.role.trim() || 'Unassigned Cadet',
      organization: formData.organization.trim() || 'Independent / Unknown',
      connections: processedConnections,
      influenceWeighting: Number(formData.influenceWeighting),
      status: formData.status,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingRecord) {
        await updatePEPRegistryRecord(editingRecord.id, recordData);
      } else {
        await addPEPRegistryRecord(recordData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error committing record:", error);
      alert("Failed to synchronize forensics record.");
    }
  };

  // Delete Record
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to sanitize/remove "${name}" from the active Forensics ledger?`)) return;
    try {
      await deletePEPRegistryRecord(id);
    } catch (error) {
      console.error(error);
      alert("Failed to purge target node.");
    }
  };

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    const result = records.filter(record => {
      const query = searchTerm.toLowerCase();
      const matchSearch = 
        record.name.toLowerCase().includes(query) ||
        record.role.toLowerCase().includes(query) ||
        record.organization.toLowerCase().includes(query) ||
        record.connections.some(c => c.toLowerCase().includes(query));
      
      const matchStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchSearch && matchStatus;
    });

    if (influenceSort === 'desc') {
      result.sort((a, b) => b.influenceWeighting - a.influenceWeighting);
    } else if (influenceSort === 'asc') {
      result.sort((a, b) => a.influenceWeighting - b.influenceWeighting);
    }

    return result;
  }, [records, searchTerm, statusFilter, influenceSort]);

  // Operational metrics
  const metrics = useMemo(() => {
    const total = records.length;
    if (total === 0) return { avgInfluence: 0, highRisk: 0, networkDensity: 0 };
    
    const sumInfluence = records.reduce((acc, r) => acc + r.influenceWeighting, 0);
    const highRisk = records.filter(r => r.influenceWeighting >= 80).length;
    
    const totalConnections = records.reduce((acc, r) => acc + r.connections.length, 0);
    const density = (totalConnections / total).toFixed(1);

    return {
      avgInfluence: Math.round(sumInfluence / total),
      highRisk,
      networkDensity: density
    };
  }, [records]);

  // Export current list to PDF
  const handleExportPDF = async () => {
    const tableEl = document.getElementById('forensics-print-area');
    if (!tableEl) return;

    if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);

    try {
      alert("Compiling State Security Forensics Dossier. Please wait...");
      const canvas = await html2canvas(tableEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0B',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
      
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(252, 220, 4);
      
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(pageHeight, pdfHeight));
      
      const today = new Date().toISOString().split('T')[0];
      pdf.save(`UISMS_Political_Forensics_Mugisolo_${today}.pdf`);
    } catch (err) {
      console.error("PDF generation failure:", err);
      alert("Failed to export state intelligence forensics.");
    }
  };

  const getStatusColor = (status: PEPRegistryRecord['status']) => {
    switch (status) {
      case 'Active': return 'bg-success/15 text-success border-success/30';
      case 'Under Investigation': return 'bg-warning/15 text-warning border-warning/30';
      case 'Neutralized': return 'bg-danger/15 text-danger border-danger/30';
      case 'Exiled': return 'bg-info/15 text-info border-info/30';
      default: return 'bg-bg-elevated text-text-secondary border-border-subtle';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            Strategic Actor (PEP) Forensics
          </h2>
          <p className="text-xs text-text-secondary font-mono mt-1 uppercase tracking-wider">
            State Intelligence Command // Relational Influence Registry
          </p>
        </div>
        
        <div className="flex gap-2.5 w-full sm:w-auto">
          {records.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 border border-border-subtle rounded-xl bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 text-xs font-medium flex-1 sm:flex-none justify-center"
              title="Export Forensics Dossier PDF"
            >
              <Download size={14} />
              <span>Export Dossier</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-accent hover:opacity-90 text-accent-ink rounded-xl font-semibold transition-opacity flex items-center gap-2 text-xs flex-1 sm:flex-none justify-center"
          >
            <Plus size={14} />
            <span>Intercept Actor</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider block">Total Tracked Actors</span>
            <span className="font-display text-3xl font-bold text-text-primary tabular-nums">{records.length}</span>
          </div>
          <div className="w-10 h-10 bg-bg-elevated border border-border-subtle rounded-xl flex items-center justify-center text-accent">
            <Database size={18} />
          </div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider block">Mean Influence Index</span>
            <span className="font-display text-3xl font-bold text-success tabular-nums">{metrics.avgInfluence}%</span>
          </div>
          <div className="w-10 h-10 bg-bg-elevated border border-border-subtle rounded-xl flex items-center justify-center text-success">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="bg-bg-surface p-5 rounded-2xl border border-border-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider block">High Threat Weights (≥80)</span>
            <span className="font-display text-3xl font-bold text-danger tabular-nums">{metrics.highRisk}</span>
          </div>
          <div className="w-10 h-10 bg-bg-elevated border border-border-subtle rounded-xl flex items-center justify-center text-danger">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* 3. Search & Intercept Query Filters */}
      <div className="bg-bg-surface border border-border-subtle p-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
            <input
              type="text"
              placeholder="Search Actor Name, Role, Organization, or Connection network..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-bg-elevated px-3 py-2 rounded-xl border border-border-subtle text-xs font-mono text-text-secondary">
              <Filter size={12} />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-text-primary font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-bg-surface">ALL</option>
                <option value="Active" className="bg-bg-surface">ACTIVE</option>
                <option value="Under Investigation" className="bg-bg-surface">UNDER OBSERVATION</option>
                <option value="Neutralized" className="bg-bg-surface">NEUTRALIZED</option>
                <option value="Exiled" className="bg-bg-surface">EXILED</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-bg-elevated px-3 py-2 rounded-xl border border-border-subtle text-xs font-mono text-text-secondary">
              <span>Sort Weight:</span>
              <select
                value={influenceSort}
                onChange={(e) => setInfluenceSort(e.target.value as any)}
                className="bg-transparent border-none text-text-primary font-medium focus:outline-none cursor-pointer"
              >
                <option value="desc" className="bg-bg-surface">HIGHEST</option>
                <option value="asc" className="bg-bg-surface">LOWEST</option>
                <option value="none" className="bg-bg-surface">UNSORTED</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Table / Zero State */}
      {loading ? (
        <div className="p-16 text-center bg-bg-surface border border-border-subtle rounded-2xl flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
          <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">
            Accessing Secure PEP-Registry Archives...
          </span>
        </div>
      ) : records.length === 0 ? (
        <div className="p-16 text-center bg-bg-surface border border-border-subtle rounded-2xl flex flex-col items-center justify-center space-y-5">
          <Database className="text-text-secondary" size={36} />
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-display text-base font-semibold text-text-primary">
              Forensics Registry Uninitialized
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              No political forensics records found in the active 'PEP-Registry' collection. Initialize the ledger with curated high-command connections.
            </p>
          </div>
          <button
            onClick={handleAutoSeed}
            className="px-5 py-2.5 bg-accent hover:opacity-90 text-accent-ink font-semibold rounded-xl text-xs flex items-center gap-2 transition-opacity"
          >
            <Sparkles size={14} />
            <span>Seed PEP-Registry Ledger</span>
          </button>
        </div>
      ) : (
        <div id="forensics-print-area" className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-bg-elevated/60 text-text-secondary font-mono uppercase text-[11px] border-b border-border-subtle tracking-wider">
                  <th className="py-3.5 px-5">Strategic Actor</th>
                  <th className="py-3.5 px-4">Vesting Role & Command</th>
                  <th className="py-3.5 px-4">Primary Network Links</th>
                  <th className="py-3.5 px-4 text-center">Weighting</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-bg-elevated/50 transition-colors">
                    {/* Actor Details */}
                    <td className="py-4 px-5">
                      <div className="font-medium text-text-primary">{record.name}</div>
                      <div className="text-xs font-mono text-text-secondary mt-0.5">{record.organization}</div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span className="bg-bg-elevated border border-border-subtle px-2.5 py-1 rounded-md text-xs font-mono text-text-secondary">
                        {record.role}
                      </span>
                    </td>

                    {/* Network Connections */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {record.connections && record.connections.length > 0 ? (
                          record.connections.map((c, idx) => (
                            <span 
                              key={idx} 
                              className="bg-bg-elevated border border-border-subtle text-text-primary px-2 py-0.5 rounded-md text-xs font-mono flex items-center gap-1"
                            >
                              <Share2 size={10} className="text-accent" />
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-text-secondary italic text-xs">Isolated Entity</span>
                        )}
                      </div>
                    </td>

                    {/* Influence Weighting */}
                    <td className="py-4 px-4 text-center font-mono tabular-nums">
                      <div className="inline-block">
                        <span className={`font-semibold text-sm ${
                          record.influenceWeighting >= 85 ? 'text-danger' : 
                          record.influenceWeighting >= 65 ? 'text-warning' : 'text-success'
                        }`}>
                          {record.influenceWeighting}%
                        </span>
                        <div className="w-14 h-1.5 bg-bg-elevated rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${
                              record.influenceWeighting >= 85 ? 'bg-danger' : 
                              record.influenceWeighting >= 65 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${record.influenceWeighting}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-medium uppercase ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(record)}
                          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
                          title="Modify Record"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.name)}
                          className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Purge Node"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-bg-elevated/40 border-t border-border-subtle flex justify-between items-center text-xs font-mono text-text-secondary">
            <span>SHOWING {filteredRecords.length} OF {records.length} FORENSIC NODES</span>
            <span>CLASSIFICATION: TACTICAL LEDGER</span>
          </div>
        </div>
      )}

      {/* 5. Intercept Node Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-bg-surface border border-border-subtle w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-text-primary"
            >
              {/* Modal Header */}
              <div className="bg-bg-elevated px-5 py-4 border-b border-border-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="text-accent" size={16} />
                  <span className="font-display font-semibold text-sm">
                    {editingRecord ? 'Modify Existing Intercept' : 'New Strategic Node Intercept'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-text-secondary font-mono uppercase block">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comrade Mugisolo"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-text-secondary font-mono uppercase block">Assigned Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Director Oversight"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-text-secondary font-mono uppercase block">Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. State Security Command"
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-text-secondary font-mono uppercase block">
                    Network Connections (Comma Separated)
                  </label>
                  <textarea
                    placeholder="e.g. General Muhoozi, President Museveni, Amama Mbabazi"
                    value={formData.connectionsInput}
                    onChange={(e) => setFormData({...formData, connectionsInput: e.target.value})}
                    rows={2}
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none placeholder:text-text-secondary/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center font-mono text-text-secondary uppercase">
                      <span>Influence Weight</span>
                      <span className="text-accent font-semibold tabular-nums">{formData.influenceWeighting}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.influenceWeighting}
                      onChange={(e) => setFormData({...formData, influenceWeighting: Number(e.target.value)})}
                      className="w-full h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-text-secondary font-mono uppercase block">Security Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-bg-elevated border border-border-subtle rounded-xl p-2.5 text-sm text-text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Neutralized">Neutralized</option>
                      <option value="Exiled">Exiled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary transition-colors text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-ink font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 text-xs"
                  >
                    <Check size={14} />
                    <span>Synchronize</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
