import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateSynthesisMindBriefing, generateDeepMindAnalysis } from '../services/geminiService';
import { Incident, PEPProfile, StrategicAsset } from '../types';
import { 
  Sparkles, 
  BrainCircuit, 
  Send, 
  ShieldAlert, 
  Activity, 
  Zap, 
  FileText, 
  RefreshCw, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Mic, 
  SendHorizontal, 
  MessageCircle, 
  Shield, 
  FileDigit,
  Printer, 
  Download, 
  Scroll 
} from 'lucide-react';

interface SynthesisMindProps {
  incidents: Incident[];
  peps: PEPProfile[];
  assets: StrategicAsset[];
}

export const SynthesisMind: React.FC<SynthesisMindProps> = ({ 
  incidents = [], 
  peps = [], 
  assets = [] 
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'briefing' | 'osint'>('briefing');
  const [isDeepMode, setIsDeepMode] = useState(false);

  // Briefing State
  const [briefing, setBriefing] = useState<any | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  // OSINT Grounding Query State (ReportAnalyzer features)
  const [query, setQuery] = useState('');
  const [osintLoading, setOsintLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate Automated Briefing on load or manual trigger
  const triggerBriefing = async () => {
    setBriefingLoading(true);
    try {
      const result = await generateSynthesisMindBriefing(incidents, peps, assets, isDeepMode);
      if (result) {
        setBriefing(result);
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    // Generate briefing initially if there is data or on tab activation
    if (activeTab === 'briefing' && !briefing) {
      triggerBriefing();
    }
  }, [activeTab]);

  // Voice recording simulation
  const toggleRecording = () => {
    if (!isRecording) {
      if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
      setIsRecording(true);
      setTimeout(() => {
        setQuery("Analyze the tactical vulnerability of energy networks in relation to recent regional border tension clusters.");
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleAnalyzeQuery = async () => {
    if (!query.trim()) return;
    setOsintLoading(true);
    setReport(null);
    try {
      const result = await generateDeepMindAnalysis(query, isDeepMode);
      setReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setOsintLoading(false);
    }
  };

  useEffect(() => {
    if (report && reportContainerRef.current) {
      reportContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      alert("PDF generation element reference not found.");
      return;
    }
    try {
      const originalElement = contentRef.current;
      const clonedElement = originalElement.cloneNode(true) as HTMLElement;
      Object.assign(clonedElement.style, {
        position: 'absolute', top: '-9999px', left: '-9999px', width: '1000px',
        height: 'auto', maxHeight: 'none', overflow: 'visible', zIndex: '-1'
      });
      document.body.appendChild(clonedElement);
      const canvas = await html2canvas(clonedElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1000 });
      document.body.removeChild(clonedElement);
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
      pdf.save(`UISMS_OSINT_Research_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch { 
      alert("Failed to generate PDF."); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-pearl-africa font-black tracking-tighter text-xl uppercase leading-none">Synthesis Mind</h2>
          <p className="text-[10px] font-mono text-infra-steel uppercase tracking-[0.3em] mt-1">Cognitive Strategic Intelligence</p>
        </div>
        <div className="p-3 bg-crested-gold/15 rounded-full text-crested-gold shadow-[0_0_20px_rgba(212,175,55,0.08)]">
          <BrainCircuit size={24} className="animate-pulse" />
        </div>
      </div>

      {/* 2. Professional Tab Switcher & Deep Mode Selector */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-lake-victoria/40 p-1.5 rounded border border-white/5">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'briefing' ? 'bg-crested-gold text-lake-victoria font-bold' : 'text-crane-grey hover:text-pearl-africa'}`}
          >
            <Cpu size={12} className="inline mr-1.5 -mt-0.5" /> Intelligence Briefing
          </button>
          <button
            onClick={() => setActiveTab('osint')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'osint' ? 'bg-crested-gold text-lake-victoria font-bold' : 'text-crane-grey hover:text-pearl-africa'}`}
          >
            <MessageCircle size={12} className="inline mr-1.5 -mt-0.5" /> OSINT Research
          </button>
        </div>

        <div className="flex items-center gap-2 px-1 justify-between sm:justify-start">
          <span className="text-[9px] font-mono text-crane-grey uppercase">Grounding:</span>
          <div className="flex gap-1 bg-black/35 p-1 rounded-sm border border-white/5">
            <button 
              onClick={() => setIsDeepMode(false)}
              className={`text-[9px] font-black uppercase px-3 py-1 rounded-sm transition-all ${!isDeepMode ? 'bg-intel-blue text-white shadow-sm' : 'text-crane-grey'}`}
            >
              Tactical
            </button>
            <button 
              onClick={() => setIsDeepMode(true)}
              className={`text-[9px] font-black uppercase px-3 py-1 rounded-sm transition-all ${isDeepMode ? 'bg-purple-600 text-white shadow-sm' : 'text-crane-grey'}`}
            >
              Deep Search
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: Real-time Intelligence Briefing */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Dashboard State Snapshot */}
          <div className="bg-kampala-obsidian border border-white/5 p-4 rounded-sm flex items-center justify-between text-[10px] font-mono text-infra-steel">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-crested-gold" />
              <span>LIVE CLOCK: {new Date().toLocaleTimeString()} UTC</span>
            </div>
            <div className="flex items-center gap-4">
              <span>ACTORS Monitored: {peps.length}</span>
              <span>ASSETS Secured: {assets.length}</span>
              <span>INCIDENTS Logged: {incidents.length}</span>
            </div>
          </div>

          {briefingLoading ? (
            <div className="py-24 text-center stacked-precision-card border-dashed flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-crested-gold border-t-transparent rounded-full animate-spin"></div>
                <BrainCircuit className="absolute inset-0 m-auto text-crested-gold animate-pulse" size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[10px] text-crested-gold uppercase tracking-[0.2em] animate-pulse">Running Kinetic Matrix Convergence...</p>
                <p className="text-[9px] text-crane-grey uppercase font-mono">Synthesizing Sun Tzu & Museveni Doctrines</p>
              </div>
            </div>
          ) : briefing ? (
            <div className="space-y-6">
              {/* Minimalist, Professional briefing card */}
              <div className="stacked-precision-card border-t-4 border-t-crested-gold overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-kampala-obsidian to-lake-victoria flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[8px] font-mono font-black text-crested-gold uppercase tracking-widest bg-crested-gold/10 px-2 py-0.5 rounded-sm">
                      SFC OVERSIGHT // BRIEFING DECREE
                    </span>
                    <h3 className="text-xl font-black text-pearl-africa mt-2 uppercase tracking-tight leading-tight">
                      {briefing.title || 'Multi-Domain Kinetic Assessment'}
                    </h3>
                  </div>
                  <button 
                    onClick={triggerBriefing}
                    className="p-2 border border-white/10 hover:border-crested-gold/50 rounded-sm hover:bg-white/5 transition-all text-crane-grey hover:text-crested-gold"
                    title="Regenerate Briefing"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Threat Assessment text */}
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-crane-grey tracking-widest flex items-center gap-1.5">
                      <Activity size={12} className="text-intel-blue" />
                      Executive Sitrep Assessment
                    </h4>
                    <p className="text-xs md:text-sm text-pearl-africa/90 leading-relaxed font-serif italic border-l-2 border-intel-blue/40 pl-4 py-1">
                      "{briefing.threatAssessment}"
                    </p>
                  </div>

                  {/* Hotspots & Vulnerabilities List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-3">
                      <h5 className="text-[9px] font-black uppercase text-brotherhood-crimson tracking-widest flex items-center gap-2">
                        <ShieldAlert size={14} /> Kinetic Friction & Hotspots
                      </h5>
                      <div className="space-y-2">
                        {briefing.kineticHotspots?.map((hotspot: string, index: number) => (
                          <div key={index} className="bg-black/15 p-3 rounded-sm border border-white/5 flex gap-3 items-start">
                            <span className="text-brotherhood-crimson font-mono text-[10px] mt-0.5 font-bold">0{index + 1}</span>
                            <span className="text-xs text-crane-grey leading-relaxed">{hotspot}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[9px] font-black uppercase text-watch-gold tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-watch-gold" /> Critical Asset Exposure
                      </h5>
                      <div className="space-y-2">
                        {briefing.infrastructureVulnerabilities?.map((vuln: string, index: number) => (
                          <div key={index} className="bg-black/15 p-3 rounded-sm border border-white/5 flex gap-3 items-start">
                            <span className="text-watch-gold font-mono text-[10px] mt-0.5 font-bold">0{index + 1}</span>
                            <span className="text-xs text-crane-grey leading-relaxed">{vuln}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Command orders / Defensive maneuvers */}
                  <div className="space-y-3 pt-6 border-t border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-savanna-sage tracking-widest flex items-center gap-2">
                      <Shield size={14} className="text-savanna-sage" /> Strategic Defence Maneuvers
                    </h4>
                    <div className="space-y-2">
                      {briefing.strategicRecoms?.map((recom: string, index: number) => (
                        <div key={index} className="bg-white/5 p-3.5 rounded-sm border-l-2 border-l-savanna-sage flex gap-3 items-center">
                          <CheckCircle2 size={16} className="text-savanna-sage shrink-0" />
                          <span className="text-xs text-pearl-africa leading-snug">{recom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Presidential Summary Sign-off */}
                <div className="bg-kampala-obsidian p-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-savanna-sage animate-pulse" />
                    <span className="text-[9px] font-mono text-infra-steel uppercase">U-ISMS // SUMMARY MATRIX VERDICT:</span>
                  </div>
                  <p className="text-[11px] font-bold text-crested-gold tracking-tight italic">
                    "{briefing.summary}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center stacked-precision-card opacity-30 flex flex-col items-center justify-center gap-2">
              <Scroll size={36} />
              <p className="text-[10px] font-black uppercase tracking-widest">No Briefing Generated</p>
              <button 
                onClick={triggerBriefing}
                className="mt-2 text-xs text-crested-gold hover:underline"
              >
                Trigger Manual Sync Sequence
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: OSINT Inquiry & Document Generator (Retaining full past features safely!) */}
      {activeTab === 'osint' && (
        <div className="space-y-6">
          <section className="stacked-precision-card p-6 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border-t-2 border-crested-gold">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="text-crested-gold" size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pearl-africa">Strategic Grounding Query</h3>
            </div>
            <div className="relative">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRecording ? "Listening for dictation..." : "Dictate research inquiry or type intelligence query..."}
                className={`w-full bg-lake-victoria/60 border border-white/5 rounded-sm p-5 pb-14 text-sm focus:outline-none focus:border-crested-gold placeholder:text-crane-grey resize-none min-h-[140px] font-medium transition-all ${isRecording ? 'ring-1 ring-brotherhood-crimson animate-pulse' : ''}`}
                disabled={osintLoading}
              />
              <div className="absolute bottom-4 left-5 flex gap-5">
                <button 
                  onClick={toggleRecording}
                  type="button"
                  className={`transition-all active:scale-95 ${isRecording ? 'text-brotherhood-crimson animate-pulse' : 'text-crane-grey hover:text-crested-gold'}`}
                >
                  <Mic size={20} />
                </button>
                <div className="text-crane-grey">
                  <Shield size={20} />
                </div>
              </div>
              <button 
                onClick={handleAnalyzeQuery}
                disabled={!query.trim() || osintLoading}
                className="absolute bottom-4 right-4 p-3 bg-crested-gold text-lake-victoria rounded-sm transition-all active:scale-95 disabled:opacity-20 shadow-xl"
              >
                {osintLoading ? <Sparkles className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
              </button>
            </div>
          </section>

          {/* Inquiry Output */}
          <div ref={reportContainerRef} className="animate-fade-in">
            {osintLoading ? (
              <div className="py-20 flex flex-col items-center justify-center stacked-precision-card border-dashed">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-intel-blue border-t-transparent rounded-full animate-spin" />
                  <BrainCircuit className="absolute inset-0 m-auto text-intel-blue animate-pulse" size={24} />
                </div>
                <p className="font-mono text-[10px] text-infra-steel uppercase tracking-[0.2em] animate-pulse">Running OSINT Correlation Engine...</p>
              </div>
            ) : report ? (
              <div className="space-y-6">
                <div className="flex justify-end gap-2 px-1">
                  <button onClick={handleDownloadPDF} className="p-2 bg-lake-victoria/40 border border-white/5 rounded text-infra-steel hover:text-white transition-colors" title="Export PDF">
                    <Download size={16} />
                  </button>
                  <button onClick={handlePrint} className="p-2 bg-lake-victoria/40 border border-white/5 rounded text-infra-steel hover:text-white transition-colors" title="Print Briefing">
                    <Printer size={16} />
                  </button>
                </div>

                <article ref={contentRef} className="bg-pearl-white text-kampala-obsidian rounded-sm overflow-hidden shadow-2xl">
                  <header className="bg-kampala-obsidian text-pearl-white p-8 border-b-4 border-intel-blue relative">
                    <div className="flex items-center gap-2 mb-4 text-intel-blue text-[9px] font-black uppercase tracking-widest">
                      <Shield size={12} />
                      <span>SFC_OSINT_ASSESSMENT // GROUNDED COGNITIVE LAYER</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-4">{report.title}</h1>
                    <div className="p-4 bg-white/5 border border-white/10 rounded">
                      <p className="text-xs text-infra-steel font-mono uppercase mb-1">Executive Summary</p>
                      <p className="text-sm font-medium leading-relaxed text-slate-300">{report.executiveSummary}</p>
                    </div>
                  </header>

                  <div className="p-8 space-y-8 bg-white">
                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <Scroll size={14} className="text-intel-blue" />
                        Strategic Synthesis
                      </h3>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-800">
                        {report.strategicSynthesis}
                      </div>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-sm border border-slate-100 italic">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-intel-blue mb-2">Operational Verdict</h3>
                      <p className="text-sm font-bold text-slate-800">"{report.conclusion}"</p>
                    </section>

                    {/* Council Voices */}
                    <section>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Strategic Council Advice</h3>
                      <div className="space-y-4">
                        {report.councilVoices?.map((voice: any, i: number) => (
                          <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-intel-blue" />
                              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-700">{voice.strategist}</span>
                            </div>
                            <p className="text-xs italic text-slate-600 mb-2 leading-relaxed">"{voice.quote}"</p>
                            <div className="text-[9px] text-slate-400 uppercase font-mono">Affiliation: {voice.application}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[8px] font-mono text-slate-400 uppercase">
                    U-ISMS // GROUNDING_LOG // {new Date().toISOString()} // SECURE_HASH: {Math.random().toString(36).substring(7).toUpperCase()}
                  </footer>
                </article>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/10 rounded-xl">
                <Scroll size={40} className="mb-4 text-crane-grey" />
                <p className="text-[11px] font-black uppercase tracking-widest text-crane-grey">Awaiting Command Authorization</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
