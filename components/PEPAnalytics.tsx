import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PEPProfile, PoliticalDossier } from '../types';
import { getConstituencyProfile } from '../data/parliamentaryData';
import { TOP_100_UG_POLITICIANS, STRATEGIC_ASSET_SEED } from '../data/seedData';
import { generatePoliticalStrategy, extractPEPsFromFiles, generateGlobalRecommendations } from '../services/geminiService';
import { addParliamentaryToDb, deleteParliamentaryFromDb, seedDatabase, deduplicatePEPs } from '../services/firestoreService';
import { loginWithGoogle, auth } from '../services/authService';
import { PARLIAMENT_INTEL_BATCH_1 } from '../data/intelBatch';
import { seedEALAHistoricalPEPs } from '../services/ealaSeeder';
import { 
  Search, Users, Filter, X, Activity, 
  Zap, BrainCircuit, Sun, Moon, ChevronRight
} from 'lucide-react';

interface PEPAnalyticsProps {
  peps: PEPProfile[];
}

export const PEPAnalytics: React.FC<PEPAnalyticsProps> = ({ peps }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [selectedPEP, setSelectedPEP] = useState<PEPProfile | null>(null);
  const [politicalDossier, setPoliticalDossier] = useState<PoliticalDossier | null>(null);
  const [isNightOps, setIsNightOps] = useState(false);
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ingestMode, setIngestMode] = useState<'form' | 'json' | 'batch'>('form');

  const handleBatchSeed = async (batch: 'intel1' | 'top100') => {
    setIsExtracting(true);
    try {
        const data = batch === 'intel1' ? PARLIAMENT_INTEL_BATCH_1 : TOP_100_UG_POLITICIANS;
        let count = 0;
        for (const item of data) {
            const pep: PEPProfile = {
                ...item,
                id: item.id || `seed-${Date.now()}-${Math.random()}`,
                country: item.country || 'Uganda',
                sentimentScore: item.sentimentScore || 50,
                mentions: item.mentions || 0,
                confidence: item.confidence || '[TIER 3 — PROBABLE]'
            };
            await addParliamentaryToDb(pep);
            count++;
        }
        alert(`Successfully synchronized ${count} nodes with the central ledger.`);
        setIsAddModalOpen(false);
    } catch (err) {
        alert("Synchronization failure: " + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
        setIsExtracting(false);
    }
  };
  const [jsonInput, setJsonInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedReviewData, setExtractedReviewData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    constituency: '',
    country: 'Uganda',
    party: 'Independent',
    category: 'Constituency' as any,
    rank: '',
    clearance: ''
  });
  
  // AI Strategy State
  const [aiReport, setAiReport] = useState<{ grandStrategy: string; sitRep: string } | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [globalRecommendations, setGlobalRecommendations] = useState<{ moves: { title: string; logic: string; impact: string }[]; summary: string } | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [isDeepMode, setIsDeepMode] = useState(false);

  // Auto-generate recommendations when PEPs change and no recommendations exist
  React.useEffect(() => {
    if (peps.length > 0 && !globalRecommendations && !isGeneratingRecommendations) {
      generateGlobalAdvice();
    }
  }, [peps.length]);

  const filteredPEPs = useMemo(() => {
    return peps.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.constituency.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesParty = filterParty === 'All' || p.party === filterParty;
      const matchesCountry = filterCountry === 'All' || p.country === filterCountry;
      return matchesSearch && matchesParty && matchesCountry;
    });
  }, [peps, searchTerm, filterParty, filterCountry]);

  const handleJsonIngest = async () => {
    try {
        const data = JSON.parse(jsonInput);
        if (!Array.isArray(data)) throw new Error("Input must be a JSON array.");
        
        for (const item of data) {
            const pep: PEPProfile = {
                id: `json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name || 'Unknown',
                constituency: item.constituency || 'National',
                country: item.country || 'Uganda',
                party: item.party || 'Independent',
                category: item.category || 'Constituency',
                sentimentScore: item.sentimentScore || 50,
                mentions: item.mentions || 0,
                confidence: item.confidence || '[TIER 3 — PROBABLE]',
                intelligenceDossier: item.intelligenceDossier
            };
            await addParliamentaryToDb(pep);
        }
        alert(`Ingested ${data.length} records successfully.`);
        setIsAddModalOpen(false);
        setJsonInput('');
    } catch (err) {
        alert(`Ingestion failed: ${err instanceof Error ? err.message : 'Invalid JSON format'}`);
    }
  };

  const handleRowClick = async (pep: PEPProfile) => {
    setSelectedPEP(pep);
    const profile = getConstituencyProfile(pep.constituency, pep.name, pep.party) as any;
    setPoliticalDossier(profile);
    
    // Reset and Trigger AI Strategy
    setAiReport(null);
    setIsGeneratingStrategy(true);
    
    try {
      const context = `
        Region: ${profile.region}. 
        Strategic Constraints: ${profile.politicalStrategy.keyChallenges.join(', ')}. 
        Socio-Econ: ${profile.socioEconomic.primaryActivity}, Poverty: ${profile.socioEconomic.povertyIndex}.
        Historical Power: Previous winner was ${profile.historical.previousWinner}.
      `;
      
      const report = await generatePoliticalStrategy(
        pep.name,
        pep.party,
        pep.constituency,
        context
      );
      setAiReport(report);
    } catch {
      // Error handling is implicit (stays null)
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedPEP(null);
    setPoliticalDossier(null);
    setAiReport(null);
  };

  // --- Admin Functions ---

  const handleAdminToggle = () => {
    if (isAdminMode) {
        setIsAdminMode(false);
    } else {
        setIsPasswordModalOpen(true);
    }
  };

  const verifyPassword = async () => {
      if (passwordInput === '@Kaw3123') {
          try {
              if (!auth.currentUser) {
                  await loginWithGoogle();
              }
              
              if (auth.currentUser?.email === 'mugisolo@gmail.com') {
                  setIsAdminMode(true);
                  setIsPasswordModalOpen(false);
                  setPasswordInput('');
              } else {
                  alert(`Access Denied: ${auth.currentUser?.email} is not authorized for administrative operations.`);
                  setIsPasswordModalOpen(false);
              }
          } catch (err) {
              console.error("Auth failed", err);
              alert("Authentication failed. Administrative mode could not be enabled.");
          }
      } else {
          alert('Incorrect Intelligence Clearance Password.');
          setPasswordInput('');
      }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this PEP?')) {
        try {
            await deleteParliamentaryFromDb(id);
            if (selectedPEP?.id === id) {
                handleClosePanel();
            }
        } catch {
            alert("Delete failed: Check permissions.");
        }
    }
  };

  const handleAddCandidate = async () => {
    const sentimentScore = Math.floor(Math.random() * 60) + 20;
    const influenceIndex = Math.floor(Math.random() * 40) + 5;
    const mentions = Math.floor(Math.random() * 5000) + 500;
    
    const pep: any = {
        id: `nc-${Date.now()}`,
        name: newCandidate.name,
        constituency: newCandidate.constituency,
        country: newCandidate.country,
        party: newCandidate.party,
        category: newCandidate.category,
        rank: newCandidate.rank,
        clearance: newCandidate.clearance,
        sentimentScore,
        influenceIndex,
        mentions
    };

    try {
        await addParliamentaryToDb(pep);
        setIsAddModalOpen(false);
        setNewCandidate({ 
            name: '', 
            constituency: '', 
            country: 'Uganda', 
            party: 'Independent', 
            category: 'Constituency',
            rank: '',
            clearance: ''
        });
    } catch {
        alert("Upload failed: Check permissions.");
    }
  };

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeduplicate = async () => {
    await deduplicatePEPs(peps);
  };

  const handleSeedTop100 = async () => {
      if (window.confirm("Load Top 100 Ugandan PEP Intelligence onto Grid?")) {
          try {
              await seedDatabase([], TOP_100_UG_POLITICIANS, STRATEGIC_ASSET_SEED);
          } catch {
              alert("Seeding failed. Check permissions.");
          }
      }
  };

  const handleSeedIntelBatch = async () => {
    if (window.confirm('Ingest Batch 1 Intelligence Dossiers from the 11th Parliament Document?')) {
        try {
            setExtractionProgress({ current: 0, total: PARLIAMENT_INTEL_BATCH_1.length, stage: 'Ingesting Dossiers' });
            let i = 0;
            for (const pep of PARLIAMENT_INTEL_BATCH_1) {
                await addParliamentaryToDb(pep);
                i++;
                setExtractionProgress({ current: i, total: PARLIAMENT_INTEL_BATCH_1.length, stage: 'Ingesting Dossiers' });
            }
            alert(`Intelligence Ingestion Complete: ${PARLIAMENT_INTEL_BATCH_1.length} dossiers added to the grid.`);
        } catch (error) {
            console.error(error);
            alert("Ingestion failed: Authentication or rule violations detected.");
        } finally {
            setExtractionProgress(null);
        }
    }
  };

  const handleSeedEALA = async () => {
    if (window.confirm('Ingest EALA Historical Ledger (240 Entities) into the Intelligence Node?')) {
        try {
            setExtractionProgress({ current: 0, total: 240, stage: 'Synchronizing EALA Ledger' });
            await seedEALAHistoricalPEPs();
            alert('EALA Historical Ledger Synchronized. 240 Regional Entities indexed.');
        } catch (error) {
            console.error(error);
            alert("Sync failed: Check protocol permissions.");
        } finally {
            setExtractionProgress(null);
        }
    }
  };

  const generateGlobalAdvice = async () => {
    if (peps.length === 0) return;
    setIsGeneratingRecommendations(true);
    try {
        const advice = await generateGlobalRecommendations(peps as any, isDeepMode);
        if (advice && advice.moves) {
            setGlobalRecommendations(advice);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsGeneratingRecommendations(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfs = files.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
    const csvs = files.filter(f => f.name.endsWith('.csv'));

    if (pdfs.length > 0) {
        setIsExtracting(true);
        setExtractionProgress({ current: 0, total: pdfs.length, stage: 'Awaiting Intelligence Grounding' });
        try {
            const fileDataList = await Promise.all(pdfs.map(async (file, idx) => {
                return new Promise<{ data: string, mimeType: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        setExtractionProgress({ current: idx + 1, total: pdfs.length, stage: `Reading Document ${idx + 1}...` });
                        resolve({ data: base64, mimeType: file.type });
                    };
                    reader.readAsDataURL(file);
                });
            }));

            setExtractionProgress({ current: 1, total: 1, stage: 'Gemini 1.5 Pro Analyzing Dossiers...' });
            const extracted = await extractPEPsFromFiles(fileDataList);
            if (extracted && extracted.length > 0) {
                setExtractedReviewData(extracted);
            } else {
                alert("AI could not extract any recognizable PEP data from the provided documents.");
            }
        } catch (err) {
            console.error(err);
            alert("Intelligent extraction failed. Protocol error.");
        } finally {
            setIsExtracting(false);
            setExtractionProgress(null);
        }
    }

    if (csvs.length > 0) {
        const file = csvs[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                const lines = text.split('\n');
                const newCandidates: any[] = [];
                lines.forEach((line, index) => {
                    if (index === 0) return;
                    const [name, constituency, party, category] = line.split(',').map(s => s.trim());
                    if (name && constituency) {
                        newCandidates.push({
                            id: `bulk-${Date.now()}-${index}`,
                            name,
                            constituency,
                            party: party || 'Independent',
                            category: (category as any) || 'Constituency',
                            sentimentScore: Math.floor(Math.random() * 60) + 20,
                            mentions: Math.floor(Math.random() * 5000) + 500
                        });
                    }
                });
                if (newCandidates.length > 0) {
                    for (const cand of newCandidates) await addParliamentaryToDb(cand);
                    alert(`Successfully imported ${newCandidates.length} PEPs.`);
                }
            } catch {
                alert("CSV Parse Error.");
            }
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleConfirmExtraction = async () => {
    if (!extractedReviewData) return;
    
    try {
        for (const item of extractedReviewData) {
            const pep: any = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name || 'Unknown Entity',
                constituency: item.constituency || 'National Perspective',
                party: item.party || 'Independent',
                category: item.category || 'Constituency',
                sentimentScore: item.sentimentScore || 50,
                mentions: item.mentions || 100,
                confidence: item.confidence || '[TIER 4 — HIGHLY PROBABLE]',
                intelligenceDossier: item.intelligenceDossier || 'Preliminary intelligence synthesized from documentation.'
            };
            await addParliamentaryToDb(pep);
        }
        alert(`Successfully processed ${extractedReviewData.length} records. Merges were applied where identities matched.`);
        setExtractedReviewData(null);
    } catch {
        alert("Batch ingestion failed. Check encryption/permission state.");
    }
  };

  // -- Statistics Calculation --
  const totalPEPs = peps.length;

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-1">Actor Nodes Indexed</p>
            <span className="font-display text-3xl font-bold text-text-primary tabular-nums">{totalPEPs}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent">
            <Users size={18} />
          </div>
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-1">Relational Stability</p>
            <span className="font-display text-3xl font-bold text-success tabular-nums">84.2%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-success">
            <Activity size={18} />
          </div>
        </div>
      </div>

      {/* 2. Synthesis Intelligence Card */}
      <section className="bg-bg-surface border border-border-subtle rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent">
              <BrainCircuit size={16} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-text-primary">Predictive Actor Logic</h3>
              <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Coalition & Constituency Calculus</p>
            </div>
          </div>
          {globalRecommendations && (
            <button
              onClick={() => setGlobalRecommendations(null)}
              className="px-3 py-1.5 text-xs font-mono text-text-secondary hover:text-text-primary border border-border-subtle rounded-lg transition-colors"
            >
              Refresh Analysis
            </button>
          )}
        </div>
        
        {isGeneratingRecommendations ? (
          <div className="py-6 flex flex-col items-center">
            <BrainCircuit className="text-accent animate-pulse mb-2" size={24} />
            <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">Computing regional power calculus...</p>
          </div>
        ) : globalRecommendations ? (
          <div className="space-y-4 report-justified">
            <p className="text-sm text-text-primary/90 leading-relaxed border-l-2 border-accent pl-4 text-justify">
              "{globalRecommendations.summary}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {globalRecommendations.moves.slice(0, 2).map((move, i) => (
                <div key={i} className="p-4 bg-bg-elevated/60 rounded-xl border border-border-subtle">
                  <p className="text-xs font-mono font-medium text-accent uppercase tracking-wider mb-1">
                    Strategy 0{i + 1}: {move.title}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed text-justify">{move.logic}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <p className="text-xs text-text-secondary">Protocol ready for automated actor-cluster synthesis.</p>
            <button 
              onClick={generateGlobalAdvice}
              className="px-4 py-2 bg-accent text-accent-ink text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Synthesize Matrix
            </button>
          </div>
        )}
      </section>

      {/* 3. Search & Filter Bar */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
          <input 
            type="text"
            placeholder="Search Actor Name or Constituency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary"
          />
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['All', 'NRM', 'NUP', 'FDC', 'DP', 'UPC', 'Independent'].map(party => (
            <button 
              key={party}
              onClick={() => {
                setFilterParty(party);
                if (window.navigator?.vibrate) window.navigator.vibrate(5);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                filterParty === party
                  ? 'bg-accent text-accent-ink border-accent font-semibold'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:text-text-primary'
              }`}
            >
              {party}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Clean Data Table */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Active Actors Ledger ({filteredPEPs.length})
          </span>
          <Filter size={14} className="text-text-secondary" />
        </div>
        
        {filteredPEPs.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto text-text-secondary/40 mb-3" />
            <p className="text-text-secondary text-sm">No matching intelligence nodes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated/60 border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-text-secondary">
                  <th className="py-3 px-5">Actor</th>
                  <th className="py-3 px-4">Affiliation</th>
                  <th className="py-3 px-4">Constituency / Domain</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-5 text-right">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {filteredPEPs.map((pep) => (
                  <tr 
                    key={pep.id}
                    onClick={() => handleRowClick(pep)}
                    className="hover:bg-bg-elevated/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center font-mono text-xs font-medium text-text-secondary shrink-0">
                          {pep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                          {pep.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono border ${
                        pep.party === 'NRM' ? 'bg-accent/10 text-accent border-accent/30' :
                        pep.party === 'NUP' ? 'bg-danger/10 text-danger border-danger/30' :
                        pep.party === 'FDC' ? 'bg-info/10 text-info border-info/30' :
                        'bg-bg-elevated text-text-secondary border-border-subtle'
                      }`}>
                        {pep.party}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary font-mono text-xs">
                      {pep.constituency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono text-text-secondary">
                        {pep.confidence || '[TIER 3 — PROBABLE]'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end font-mono tabular-nums">
                        <span className={`w-2 h-2 rounded-full ${
                          pep.sentimentScore > 60 ? 'bg-success' : pep.sentimentScore > 40 ? 'bg-warning' : 'bg-danger'
                        }`} />
                        <span className="text-xs font-medium text-text-primary">{pep.sentimentScore}%</span>
                        <ChevronRight size={14} className="text-text-secondary opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Detail Slide-Over Panel */}
      <AnimatePresence>
        {selectedPEP && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="w-full max-w-xl bg-bg-surface border-l border-border-subtle h-full overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 bg-bg-surface/95 border-b border-border-subtle h-16 flex items-center justify-between px-6 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <h3 className="font-display text-sm font-semibold text-text-primary">Actor Forensics Dossier</h3>
                </div>
                <button 
                  onClick={handleClosePanel}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-grow">
                {/* Header Info */}
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center text-xl font-display font-bold text-accent shrink-0">
                    {selectedPEP.name[0]}
                  </div>
                  <div className="flex-grow">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary">
                      {selectedPEP.name}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2.5 py-0.5 bg-accent/10 border border-accent/30 text-xs font-mono text-accent rounded-md">
                        {selectedPEP.party}
                      </span>
                      <span className="px-2.5 py-0.5 bg-bg-elevated border border-border-subtle text-xs font-mono text-text-secondary rounded-md">
                        {selectedPEP.constituency}
                      </span>
                      <span className="px-2.5 py-0.5 bg-bg-elevated border border-border-subtle text-xs font-mono text-text-secondary rounded-md">
                        {selectedPEP.confidence || '[TIER 3 — PROXIMAL]'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stability Metrics Chart */}
                <section className="bg-bg-elevated/50 border border-border-subtle rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary">Sentiment Trajectory</h4>
                    <span className="text-xs font-mono font-medium text-text-primary tabular-nums">{selectedPEP.sentimentScore}% Current</span>
                  </div>
                  <div className="h-36 w-full bg-bg-surface border border-border-subtle rounded-xl p-4 flex items-end justify-between gap-2">
                    {[65, 42, 88, 59, 71, 84, selectedPEP.sentimentScore].map((h, i) => (
                      <div key={i} className="flex-1 h-full bg-bg-elevated rounded-md relative overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.04, type: 'spring', damping: 20 }}
                          className={`w-full rounded-md absolute bottom-0 ${
                            i === 6 ? 'bg-accent' : 'bg-text-secondary/40'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2.5 px-1">
                    {['W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'NOW'].map(v => (
                      <span key={v} className="text-[10px] font-mono text-text-secondary tabular-nums">{v}</span>
                    ))}
                  </div>
                </section>

                {/* Intelligence Dossier */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-accent" size={16} />
                    <h4 className="font-display text-sm font-semibold text-text-primary">Synthesis Mind Assessment</h4>
                  </div>
                  
                  {isGeneratingStrategy ? (
                    <div className="flex flex-col items-center py-10 bg-bg-elevated/40 border border-border-subtle rounded-2xl">
                      <Zap className="animate-pulse text-accent mb-2" size={20} />
                      <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">Consulting Strategic Oracle...</p>
                    </div>
                  ) : aiReport ? (
                    <div className="space-y-4 report-justified">
                      <div className="p-4 bg-bg-elevated/60 rounded-xl border-l-2 border-accent">
                        <p className="text-[11px] font-mono text-accent uppercase tracking-wider mb-1">Grand Strategy Verdict</p>
                        <p className="text-sm font-medium text-text-primary leading-relaxed text-justify">{aiReport.grandStrategy}</p>
                      </div>
                      <div className="p-4 bg-bg-elevated/40 rounded-xl border border-border-subtle">
                        <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider mb-1.5">Theater SitRep</p>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap text-justify">{aiReport.sitRep}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-bg-elevated/30 rounded-2xl border border-border-subtle">
                      <p className="text-xs text-text-secondary mb-3">Deep-scan dossier extraction ready.</p>
                      <button 
                        onClick={() => handleRowClick(selectedPEP)}
                        className="px-4 py-2 bg-accent text-accent-ink text-xs font-semibold rounded-lg"
                      >
                        Generate Dossier
                      </button>
                    </div>
                  )}
                </section>

                {/* Actions */}
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => handleRowClick(selectedPEP)}
                    className="flex-1 bg-accent text-accent-ink py-3 rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity"
                  >
                    Regenerate Dossier
                  </button>
                  <button 
                    onClick={() => setIsNightOps(!isNightOps)}
                    className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {isNightOps ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
