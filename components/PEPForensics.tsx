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
  FileText, 
  Sparkles, 
  Filter, 
  Check, 
  X, 
  UserMinus, 
  AlertTriangle, 
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
    
    // Simple density metric: total connections across all / total nodes
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
        backgroundColor: '#0b1120',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
      
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(212, 175, 55); // Crested Gold
      
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
      case 'Active': return 'bg-savanna-sage/20 text-savanna-sage border-savanna-sage/30';
      case 'Under Investigation': return 'bg-nile-amber/20 text-nile-amber border-nile-amber/30';
      case 'Neutralized': return 'bg-brotherhood-crimson/20 text-brotherhood-crimson border-brotherhood-crimson/30';
      case 'Exiled': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Sub-Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-lake-victoria/40 p-4 border border-white/5 rounded">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-crested-gold animate-pulse" size={20} />
            <h2 className="text-lg font-black tracking-wider uppercase font-sans text-pearl-africa">
              Strategic Actor (PEP) Forensics
            </h2>
          </div>
          <p className="text-xs text-crane-grey font-mono mt-1 uppercase">
            State Intelligence Command // Mugisolo Director Oversight
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {records.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 border border-white/10 rounded bg-white/5 text-crane-grey hover:text-crested-gold hover:border-crested-gold/30 transition-all flex items-center gap-2 text-xs font-mono font-bold uppercase active:scale-95 flex-1 sm:flex-none justify-center"
              title="Export Forensics Dossier PDF"
            >
              <Download size={14} />
              <span>Export Dossier</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-crested-gold hover:bg-crested-gold/80 text-kampala-obsidian rounded font-bold transition-all flex items-center gap-2 text-xs font-mono uppercase active:scale-95 flex-1 sm:flex-none justify-center"
          >
            <Plus size={14} />
            <span>Intercept Actor</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="stacked-precision-card p-4 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-crane-grey uppercase tracking-widest block">Total Tracked Actors</span>
            <span className="text-3xl font-black font-sans text-crested-gold">{records.length}</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded text-crested-gold">
            <Database size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="stacked-precision-card p-4 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-crane-grey uppercase tracking-widest block">Mean Influence Index</span>
            <span className="text-3xl font-black font-sans text-savanna-sage">{metrics.avgInfluence}%</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded text-savanna-sage">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="stacked-precision-card p-4 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-crane-grey uppercase tracking-widest block">High Threat Weights (≥80)</span>
            <span className="text-3xl font-black font-sans text-brotherhood-crimson">{metrics.highRisk}</span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded text-brotherhood-crimson">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* 3. Search & Intercept Query Filters */}
      <div className="bg-kampala-obsidian border border-white/10 p-4 rounded space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 text-crane-grey" size={16} />
            <input
              type="text"
              placeholder="Search Actor Name, Role, Organization, or Connection network..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-lake-victoria/50 border border-white/10 rounded py-2 pl-10 pr-4 text-xs font-mono text-pearl-africa focus:outline-none focus:border-crested-gold/50 placeholder:text-crane-grey/60"
            />
          </div>

          {/* Filters selection */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/10 text-[10px] font-mono text-crane-grey uppercase">
              <Filter size={10} />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-crested-gold font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-kampala-obsidian">ALL</option>
                <option value="Active" className="bg-kampala-obsidian">ACTIVE</option>
                <option value="Under Investigation" className="bg-kampala-obsidian">UNDER OBSERVATION</option>
                <option value="Neutralized" className="bg-kampala-obsidian">NEUTRALIZED</option>
                <option value="Exiled" className="bg-kampala-obsidian">EXILED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/10 text-[10px] font-mono text-crane-grey uppercase">
              <span>Sort Weight:</span>
              <select
                value={influenceSort}
                onChange={(e) => setInfluenceSort(e.target.value as any)}
                className="bg-transparent border-none text-crested-gold font-bold focus:outline-none cursor-pointer"
              >
                <option value="desc" className="bg-kampala-obsidian">HIGHEST</option>
                <option value="asc" className="bg-kampala-obsidian">LOWEST</option>
                <option value="none" className="bg-kampala-obsidian">UNSORTED</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Table / Zero State */}
      {loading ? (
        <div className="p-12 text-center bg-kampala-obsidian border border-white/5 rounded flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-crested-gold"></div>
          <span className="text-xs font-mono text-crane-grey uppercase tracking-wider animate-pulse">
            Accessing Secure PEP-Registry Archives...
          </span>
        </div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-kampala-obsidian border border-white/5 rounded flex flex-col items-center justify-center space-y-6">
          <Database className="text-crane-grey/40 animate-bounce" size={40} />
          <div className="space-y-2 max-w-md">
            <h3 className="text-sm font-black text-pearl-africa uppercase tracking-widest font-mono">
              Database Uninitialized
            </h3>
            <p className="text-xs text-crane-grey leading-relaxed">
              No tactical political forensics data exists in the active 'PEP-Registry' collection. Initialize the database with curated high-command connections.
            </p>
          </div>
          <button
            onClick={handleAutoSeed}
            className="px-6 py-2 bg-gradient-to-r from-crested-gold to-nile-amber hover:opacity-95 text-kampala-obsidian font-black rounded text-xs font-mono uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-lg shadow-crested-gold/10"
          >
            <Sparkles size={14} />
            <span>Seed PEP-Registry Ledger</span>
          </button>
        </div>
      ) : (
        <div id="forensics-print-area" className="bg-kampala-obsidian border border-white/10 rounded overflow-hidden">
          {/* Print/Dossier Header Info - Only visible for exports */}
          <div className="hidden print-block p-4 bg-lake-victoria border-b border-white/10">
            <h1 className="text-crested-gold text-lg font-black tracking-widest uppercase">
              CONFIDENTIAL STATE INTELLIGENCE REGISTRY
            </h1>
            <p className="text-crane-grey text-[9px] font-mono mt-1">
              PRODUCED FOR: COMRADE MUGISOLO (DIRECTOR OF STRATEGIC OVERSIGHT)
            </p>
            <p className="text-infra-steel text-[8px] font-mono">
              TIMESTAMP: {new Date().toISOString()} // NETWORK DEEP ANALYSIS
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-lake-victoria text-crane-grey font-mono uppercase text-[9px] border-b border-white/10 tracking-widest">
                  <th className="py-3 px-4">Strategic Actor</th>
                  <th className="py-3 px-4">Vesting Role & Command</th>
                  <th className="py-3 px-4">Primary Network Links</th>
                  <th className="py-3 px-4 text-center">Weighting</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-all">
                    {/* Actor Details */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-pearl-africa font-sans text-sm">{record.name}</div>
                      <div className="text-[10px] text-infra-steel mt-0.5">{record.organization}</div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4 text-crane-grey">
                      <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[10px]">
                        {record.role}
                      </span>
                    </td>

                    {/* Network Connections */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {record.connections && record.connections.length > 0 ? (
                          record.connections.map((c, idx) => (
                            <span 
                              key={idx} 
                              className="bg-lake-victoria/80 border border-white/15 text-pearl-africa px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1"
                            >
                              <Share2 size={8} className="text-crested-gold" />
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-infra-steel italic text-[10px]">Isolated Entity</span>
                        )}
                      </div>
                    </td>

                    {/* Influence Weighting */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-block">
                        <span className={`font-black text-sm ${
                          record.influenceWeighting >= 85 ? 'text-brotherhood-crimson' : 
                          record.influenceWeighting >= 65 ? 'text-nile-amber' : 'text-savanna-sage'
                        }`}>
                          {record.influenceWeighting}%
                        </span>
                        <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${
                              record.influenceWeighting >= 85 ? 'bg-brotherhood-crimson' : 
                              record.influenceWeighting >= 65 ? 'bg-nile-amber' : 'bg-savanna-sage'
                            }`}
                            style={{ width: `${record.influenceWeighting}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-bold uppercase ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(record)}
                          className="p-1 text-crane-grey hover:text-crested-gold border border-transparent hover:border-white/10 hover:bg-white/5 rounded transition-all"
                          title="Modify Record"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.name)}
                          className="p-1 text-crane-grey hover:text-brotherhood-crimson border border-transparent hover:border-white/10 hover:bg-white/5 rounded transition-all"
                          title="Purge Node"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-lake-victoria/20 border-t border-white/10 flex justify-between items-center text-[10px] text-crane-grey">
            <span>SHOWING {filteredRecords.length} OF {records.length} FORENSIC COMRADES</span>
            <span className="font-bold">STATUS LEVEL: CLASSIFIED TACTICAL</span>
          </div>
        </div>
      )}

      {/* 5. Intercept Node Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-kampala-obsidian border border-white/15 w-full max-w-md rounded shadow-2xl overflow-hidden text-pearl-africa"
            >
              {/* Modal Header */}
              <div className="bg-lake-victoria p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="text-crested-gold" size={16} />
                  <span className="font-bold text-xs font-mono uppercase tracking-wider">
                    {editingRecord ? 'Modify Existing Intercept' : 'New Strategic Node Intercept'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-crane-grey hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-mono">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-crane-grey text-[10px] uppercase block">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comrade Mugisolo"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-lake-victoria/40 border border-white/10 rounded p-2 text-pearl-africa focus:outline-none focus:border-crested-gold/45"
                  />
                </div>

                {/* Role and Org */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-crane-grey text-[10px] uppercase block">Assigned Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Director Oversight"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-lake-victoria/40 border border-white/10 rounded p-2 text-pearl-africa focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-crane-grey text-[10px] uppercase block">Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. State Security Command"
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="w-full bg-lake-victoria/40 border border-white/10 rounded p-2 text-pearl-africa focus:outline-none"
                    />
                  </div>
                </div>

                {/* Connections (Comma Separated) */}
                <div className="space-y-1.5">
                  <label className="text-crane-grey text-[10px] uppercase block">
                    Network Connections (Comma Separated)
                  </label>
                  <textarea
                    placeholder="e.g. General Muhoozi, President Museveni, Amama Mbabazi"
                    value={formData.connectionsInput}
                    onChange={(e) => setFormData({...formData, connectionsInput: e.target.value})}
                    rows={2}
                    className="w-full bg-lake-victoria/40 border border-white/10 rounded p-2 text-pearl-africa focus:outline-none resize-none placeholder:text-crane-grey/40"
                  />
                </div>

                {/* Influence Weighting & Status */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  {/* Weighting */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-crane-grey uppercase">
                      <span>Influence Weight</span>
                      <span className="text-crested-gold font-bold">{formData.influenceWeighting}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.influenceWeighting}
                      onChange={(e) => setFormData({...formData, influenceWeighting: Number(e.target.value)})}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-crested-gold"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-crane-grey text-[10px] uppercase block">Security Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-lake-victoria/40 border border-white/10 rounded p-2 text-pearl-africa focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Neutralized">Neutralized</option>
                      <option value="Exiled">Exiled</option>
                    </select>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 border border-white/10 rounded text-crane-grey hover:text-white transition-all hover:bg-white/5 uppercase text-[10px]"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-crested-gold text-kampala-obsidian font-bold rounded hover:bg-crested-gold/90 transition-all flex items-center gap-1.5 uppercase text-[10px]"
                  >
                    <Check size={12} />
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
