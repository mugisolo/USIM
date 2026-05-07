
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
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Search, Users, Filter, Briefcase, UserCheck, X, Activity, 
  BookOpen, History, Award, Zap, FileText, AlertTriangle, 
  GraduationCap, Heart, Newspaper, Target, Crosshair, TrendingDown, MessageCircle,
  BrainCircuit, Sparkles, Lock, Plus, Upload, Trash2, Shield, MoreVertical, Sun, Moon, ChevronRight
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
              // Ensure user is logged in for Firestore Rules to pass
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
    // Generate mock stats for the new PEP
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
                const newCandidates: PEPCandidate[] = [];
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
  
  const partyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    peps.forEach(p => {
      counts[p.party] = (counts[p.party] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [peps]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    peps.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [peps]);

  // Colors for charts (Kampala Command alignment)
  const COLORS = {
    'NRM': 'var(--color-crested-gold)',
    'NUP': 'var(--color-brotherhood-crimson)',
    'FDC': 'var(--color-intel-blue)',
    'Independent': 'var(--color-crane-grey)',
    'DP': 'var(--color-savanna-sage)',
    'UPC': 'var(--color-brotherhood-crimson)',
    'ANT': '#A855F7',
    'Other': 'var(--color-infra-steel)'
  };

  const getPartyColor = (party: string) => {
    if (party === 'NRM') return COLORS.NRM;
    if (party === 'NUP') return COLORS.NUP;
    if (party === 'FDC') return COLORS.FDC;
    if (party === 'Independent') return COLORS.Independent;
    if (party === 'DP') return COLORS.DP;
    if (party === 'UPC') return COLORS.UPC;
    if (party === 'ANT') return COLORS.ANT;
    return COLORS.Other;
  };

  // Prepare Stacked Bar Chart Data for Historical Results
  const stackedBarData = useMemo(() => {
    if (!politicalDossier?.politicalTrend) return [];
    return politicalDossier.politicalTrend.map(trend => {
        const dataPoint: any = { year: trend.year };
        if (trend.results) {
            trend.results.forEach(r => {
                dataPoint[r.party] = r.percentage;
            });
        }
        return dataPoint;
    });
  }, [politicalDossier]);

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Summary Metrics & Primary Action */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stacked-precision-card p-5 bg-gradient-to-br from-lake-victoria to-kampala-obsidian">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-crane-grey mb-2">Actor Nodes</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-pearl-africa">{totalPEPs}</span>
            <Users size={18} className="text-crested-gold" />
          </div>
        </div>
        <div className="stacked-precision-card p-5 bg-gradient-to-br from-lake-victoria to-kampala-obsidian">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-crane-grey mb-2">Relational Stability</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-savanna-sage">84.2%</span>
            <Activity size={18} className="text-savanna-sage" />
          </div>
        </div>
      </div>

      {/* 2. Synthesis Intelligence Card */}
      <section className="stacked-precision-card p-6 bg-synthesis-indigo/10 border-l-4 border-synthesis-indigo">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-synthesis-indigo/20 rounded">
            <BrainCircuit className="text-pearl-africa" size={18} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-pearl-africa">Predictive Actor Logic</h3>
        </div>
        
        {isGeneratingRecommendations ? (
          <div className="py-6 flex flex-col items-center">
             <BrainCircuit className="text-intel-blue animate-pulse mb-3" size={32} />
             <p className="font-mono text-[9px] text-infra-steel uppercase animate-pulse">Computing regional power calculus...</p>
          </div>
        ) : globalRecommendations ? (
          <div className="space-y-4">
            <p className="text-xs italic text-infra-steel leading-relaxed">"{globalRecommendations.summary}"</p>
            <div className="space-y-2">
              {globalRecommendations.moves.slice(0, 1).map((move, i) => (
                <div key={i} className="p-3 bg-white/5 rounded border border-white/5">
                  <p className="text-[9px] font-black text-intel-blue uppercase mb-1">Primary Strategy: {move.title}</p>
                  <p className="text-xs">{move.logic}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setGlobalRecommendations(null)} className="w-full py-2 text-[10px] font-black uppercase text-infra-steel mt-2 border border-white/5 rounded">Refine Analysis</button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
             <p className="text-[11px] text-infra-steel mb-4 text-center">Protocol ready for automated actor-cluster synthesis.</p>
             <button 
                onClick={generateGlobalAdvice}
                className="px-6 py-2 bg-intel-blue text-pearl-white text-[10px] font-black uppercase tracking-widest rounded"
             >
               Synthesize Matrix
             </button>
          </div>
        )}
      </section>

      {/* 3. Search & Filter Interface */}
      <div className="space-y-4 sticky top-16 bg-kampala-obsidian/90 backdrop-blur-md pt-2 pb-4 z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-infra-steel" size={14} />
          <input 
            type="text"
            placeholder="Search Actor Name or Entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-nile-slate border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-intel-blue placeholder:text-infra-steel font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide py-1 no-scrollbar">
          {['All', 'NRM', 'NUP', 'FDC', 'DP', 'UPC', 'Independent'].map(party => (
            <button 
              key={party}
              onClick={() => {
                 setFilterParty(party);
                 if (window.navigator?.vibrate) window.navigator.vibrate(5);
              }}
              className={`px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterParty === party ? 'bg-crested-gold text-lake-victoria border-crested-gold' : 'bg-transparent text-crane-grey border-white/5'}`}
            >
              {party}
            </button>
          ))}
        </div>
      </div>

      {/* 4. The Stacked Actor List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-infra-steel">Active Actors // Tier 1-5</span>
            <Filter size={12} className="text-infra-steel" />
        </div>
        
        {filteredPEPs.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-infra-steel text-sm font-medium">No matching intelligence nodes found.</p>
          </div>
        ) : (
          filteredPEPs.map((pep) => (
            <button 
              key={pep.id}
              onClick={() => handleRowClick(pep)}
              className="w-full stacked-precision-card p-5 flex items-center justify-between group active:bg-white/5"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-sm bg-lake-victoria border border-white/10 flex items-center justify-center font-mono text-xs font-black relative overflow-hidden">
                  {pep.party === 'NRM' && <div className="absolute inset-x-0 bottom-0 h-1 bg-crested-gold" />}
                  {pep.party === 'NUP' && <div className="absolute inset-x-0 bottom-0 h-1 bg-brotherhood-crimson" />}
                  {pep.party === 'FDC' && <div className="absolute inset-x-0 bottom-0 h-1 bg-intel-blue" />}
                  <span className="opacity-60 text-crane-grey uppercase">{pep.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-black text-pearl-africa leading-none mb-2 group-active:text-crested-gold uppercase tracking-tight">{pep.name}</h4>
                  <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest">
                    {pep.party} <span className="opacity-30">//</span> {pep.constituency}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <div className={`w-2 h-2 rounded-full ${pep.sentimentScore > 60 ? 'bg-savanna-sage' : pep.sentimentScore > 40 ? 'bg-nile-amber' : 'bg-brotherhood-crimson'} shadow-sm`} />
                    <span className="text-xs font-black font-mono tracking-tighter">{pep.sentimentScore}%</span>
                  </div>
                  <p className="text-[8px] font-black text-crane-grey uppercase tracking-widest">Sentiment</p>
                </div>
                <ChevronRight size={16} className="text-crane-grey opacity-20 group-active:translate-x-1 transition-transform" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* 5. Detail Panel - Expanded Intelligence */}
      <AnimatePresence>
        {selectedPEP && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-kampala-obsidian overflow-y-auto"
          >
            <div className="sticky top-0 bg-kampala-obsidian/90 border-b border-white/5 h-16 flex items-center justify-between px-6 z-10 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-1.5 h-6 bg-intel-blue rounded-full shadow-[0_0_10px_rgba(49,130,206,0.5)]" 
                />
                <h3 className="text-sm font-black uppercase tracking-tighter glitch-text" data-text="Actor Forensics">Actor Forensics</h3>
              </div>
              <button 
                onClick={handleClosePanel}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-w-lg mx-auto">
              {/* Header Info */}
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-lg bg-nile-slate border border-white/10 flex items-center justify-center text-3xl font-black text-white/10">
                   {selectedPEP.name[0]}
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-black tracking-tighter leading-none mb-1">{selectedPEP.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-0.5 bg-intel-blue/10 border border-intel-blue/20 text-[9px] font-black text-intel-blue uppercase rounded tracking-widest">{selectedPEP.party}</span>
                    <span className="px-2 py-0.5 bg-infra-steel/10 border border-infra-steel/20 text-[9px] font-black text-infra-steel uppercase rounded tracking-widest">{selectedPEP.constituency}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded tracking-widest shadow-sm ${
                      selectedPEP.confidence?.includes('HIGH') ? 'bg-stable-sage/10 border border-stable-sage/30 text-stable-sage' : 'bg-watch-gold/10 border border-watch-gold/30 text-watch-gold'
                    }`}>
                      {selectedPEP.confidence || '[TIER 3 — PROXIMAL]'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stability Metrics Chart */}
              <section className="stacked-precision-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-infra-steel">Sentiment Calculus</h4>
                  <Activity size={14} className="text-intel-blue" />
                </div>
                <div className="h-40 w-full bg-kampala-obsidian rounded-lg p-4 flex items-end justify-between gap-2 overflow-hidden relative">
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-intel-blue) 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
                   {[65, 42, 88, 59, 71, 84, selectedPEP.sentimentScore].map((h, i) => (
                     <div key={i} className="flex-1 bg-intel-blue/10 rounded-t relative group overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                          className={`w-full rounded-t absolute bottom-0 ${i === 6 ? 'bg-intel-blue shadow-[0_0_10px_rgba(49,130,206,0.4)]' : 'bg-intel-blue/60'}`}
                        />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity" />
                     </div>
                   ))}
                </div>
                <div className="flex justify-between mt-3 px-1">
                   {['W: -6', 'W: -5', 'W: -4', 'W: -3', 'W: -2', 'W: -1', 'NOW'].map(v => (
                     <span key={v} className="text-[8px] font-mono text-infra-steel uppercase tracking-tighter">{v}</span>
                   ))}
                </div>
              </section>

              {/* Intelligence Dossier */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="text-intel-blue" size={20} />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Synthesis Mind Assessment</h4>
                </div>
                
                {isGeneratingStrategy ? (
                  <div className="flex flex-col items-center py-10 opacity-50">
                    <Zap className="animate-pulse text-intel-blue mb-2" size={24} />
                    <p className="text-[10px] font-mono uppercase animate-pulse">Consulting Strategic Oracle...</p>
                  </div>
                ) : aiReport ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="synth-border pl-4">
                       <p className="text-[9px] font-black text-intel-blue uppercase mb-1">Grand Strategy Verdict</p>
                       <p className="text-sm font-bold leading-relaxed">{aiReport.grandStrategy}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                       <p className="text-[9px] font-black text-infra-steel uppercase mb-2">Theater SitRep</p>
                       <p className="text-xs text-infra-steel leading-relaxed whitespace-pre-wrap">{aiReport.sitRep}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white/5 rounded-lg border border-white/5 border-dashed">
                    <p className="text-[11px] text-infra-steel">Deep-scan dossier extraction requires authorization.</p>
                    <button 
                      onClick={() => handleRowClick(selectedPEP!)}
                      className="mt-4 px-6 py-2 border border-intel-blue text-intel-blue text-[10px] font-black uppercase tracking-widest rounded"
                    >
                      Authenticate Ingestion
                    </button>
                  </div>
                )}
              </section>

              {/* Actions */}
              <div className="pt-10 flex gap-4">
                <button 
                  className="flex-1 bg-intel-blue text-pearl-white py-4 rounded font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-[0.97] transition-all"
                >
                  Generate Dossier
                </button>
                <button 
                  onClick={() => setIsNightOps(!isNightOps)}
                  className="p-4 rounded bg-nile-slate border border-white/10 active:scale-[0.97] transition-all"
                >
                  {isNightOps ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
