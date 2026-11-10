import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateSynthesisMindBriefing, generateDeepMindAnalysis } from '../services/geminiService';
import { Incident, PEPProfile, StrategicAsset } from '../types';
import { 
  Sparkles, 
  BrainCircuit, 
  ShieldAlert, 
  Activity, 
  Zap, 
  RefreshCw, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  Mic, 
  SendHorizontal, 
  MessageCircle, 
  Shield, 
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in relative pb-20">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold tracking-tight text-2xl text-text-primary leading-tight">
            Synthesis Mind
          </h2>
          <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mt-1">
            Cognitive Strategic Intelligence & Executive Briefing Paper
          </p>
        </div>
        <div className="w-10 h-10 bg-bg-surface border border-border-subtle rounded-xl flex items-center justify-center text-accent">
          <BrainCircuit size={20} />
        </div>
      </div>

      {/* 2. Clean Tab Switcher & Grounding Selector */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-bg-surface p-1.5 rounded-xl border border-border-subtle">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'briefing'
                ? 'bg-accent text-accent-ink font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <Cpu size={14} />
            <span>Intelligence Briefing</span>
          </button>
          <button
            onClick={() => setActiveTab('osint')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'osint'
                ? 'bg-accent text-accent-ink font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <MessageCircle size={14} />
            <span>OSINT Research</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 justify-between sm:justify-start">
          <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">Grounding:</span>
          <div className="flex gap-1 bg-bg-elevated p-0.5 rounded-lg border border-border-subtle">
            <button 
              onClick={() => setIsDeepMode(false)}
              className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md transition-colors ${
                !isDeepMode ? 'bg-bg-surface text-text-primary border border-border-subtle' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tactical
            </button>
            <button 
              onClick={() => setIsDeepMode(true)}
              className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md transition-colors ${
                isDeepMode ? 'bg-accent text-accent-ink font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Deep Search
            </button>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: Real-time Intelligence Briefing Paper */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Telemetry Context Ribbon */}
          <div className="bg-bg-surface border border-border-subtle px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-text-secondary">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-accent" />
              <span>UTC TIMESTAMP: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-4 tabular-nums">
              <span>ACTORS: <strong className="text-text-primary">{peps.length}</strong></span>
              <span>ASSETS: <strong className="text-text-primary">{assets.length}</strong></span>
              <span>INCIDENTS: <strong className="text-text-primary">{incidents.length}</strong></span>
            </div>
          </div>

          {briefingLoading ? (
            <div className="py-24 text-center bg-bg-surface border border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                <BrainCircuit className="absolute inset-0 m-auto text-accent" size={20} />
              </div>
              <div className="space-y-1">
                <p className="font-mono text-xs text-text-primary uppercase tracking-wider">Synthesizing Executive Briefing Paper...</p>
                <p className="text-xs text-text-secondary font-mono">Correlating Actor Matrix, Infrastructure Ledger & Threat Horizon</p>
              </div>
            </div>
          ) : briefing ? (
            <article className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden">
              {/* Document Header + Section Anchors */}
              <header className="p-6 sm:p-8 border-b border-border-subtle space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-medium text-accent bg-accent/10 border border-accent/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        [TIER 5 — FORENSIC]
                      </span>
                      <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">
                        SFC OVERSIGHT // EXECUTIVE BRIEFING
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-text-primary tracking-tight leading-snug">
                      {briefing.title || 'Multi-Domain Kinetic & Strategic Assessment'}
                    </h3>
                  </div>
                  <button 
                    onClick={triggerBriefing}
                    className="p-2.5 border border-border-subtle hover:border-text-secondary/40 rounded-xl hover:bg-bg-elevated transition-colors text-text-secondary hover:text-text-primary shrink-0"
                    title="Regenerate Briefing"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>

                {/* Quick Section Anchors */}
                <nav className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
                  <a href="#assessment" className="px-2.5 py-1 rounded-md bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                    01. Sitrep Assessment
                  </a>
                  <a href="#hotspots" className="px-2.5 py-1 rounded-md bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                    02. Kinetic Hotspots
                  </a>
                  <a href="#vulnerabilities" className="px-2.5 py-1 rounded-md bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                    03. Asset Exposure
                  </a>
                  <a href="#directives" className="px-2.5 py-1 rounded-md bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                    04. Command Directives
                  </a>
                </nav>
              </header>

              {/* Document Body */}
              <div className="p-6 sm:p-8 space-y-8 report-justified">
                {/* Section 01: Executive Sitrep Assessment */}
                <section id="assessment" className="space-y-3">
                  <h4 className="text-xs font-mono font-medium uppercase text-text-secondary tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-accent" />
                    <span>01 // Executive Sitrep Assessment</span>
                  </h4>
                  <p className="text-[15px] text-text-primary leading-[1.75] border-l-2 border-accent pl-4 py-1 text-justify">
                    {briefing.threatAssessment}
                  </p>
                </section>

                {/* Sections 02 & 03: Hotspots & Vulnerabilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-subtle">
                  <section id="hotspots" className="space-y-3">
                    <h5 className="text-xs font-mono font-medium uppercase text-danger tracking-wider flex items-center gap-2">
                      <ShieldAlert size={14} />
                      <span>02 // Kinetic Friction & Hotspots</span>
                    </h5>
                    <div className="space-y-2.5">
                      {briefing.kineticHotspots?.map((hotspot: string, index: number) => (
                        <div key={index} className="bg-bg-elevated/60 p-3.5 rounded-xl border border-border-subtle flex gap-3 items-start">
                          <span className="text-danger font-mono text-xs font-medium mt-0.5 tabular-nums shrink-0">0{index + 1}</span>
                          <span className="text-sm text-text-primary leading-relaxed text-justify flex-1">{hotspot}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section id="vulnerabilities" className="space-y-3">
                    <h5 className="text-xs font-mono font-medium uppercase text-warning tracking-wider flex items-center gap-2">
                      <Zap size={14} className="text-warning" />
                      <span>03 // Critical Asset Exposure</span>
                    </h5>
                    <div className="space-y-2.5">
                      {briefing.infrastructureVulnerabilities?.map((vuln: string, index: number) => (
                        <div key={index} className="bg-bg-elevated/60 p-3.5 rounded-xl border border-border-subtle flex gap-3 items-start">
                          <span className="text-warning font-mono text-xs font-medium mt-0.5 tabular-nums shrink-0">0{index + 1}</span>
                          <span className="text-sm text-text-primary leading-relaxed text-justify flex-1">{vuln}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Section 04: Strategic Defence Maneuvers */}
                <section id="directives" className="space-y-3 pt-6 border-t border-border-subtle">
                  <h4 className="text-xs font-mono font-medium uppercase text-success tracking-wider flex items-center gap-2">
                    <Shield size={14} className="text-success" />
                    <span>04 // Strategic Defence Maneuvers</span>
                  </h4>
                  <div className="space-y-2.5">
                    {briefing.strategicRecoms?.map((recom: string, index: number) => (
                      <div key={index} className="bg-bg-elevated/60 p-4 rounded-xl border border-border-subtle flex gap-3 items-start">
                        <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                        <span className="text-sm text-text-primary leading-relaxed text-justify flex-1">{recom}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Document Footer Verdict */}
              <footer className="bg-bg-elevated/50 px-6 sm:px-8 py-4 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">SUMMARY VERDICT:</span>
                </div>
                <p className="text-xs font-medium text-text-primary text-justify">
                  "{briefing.summary}"
                </p>
              </footer>
            </article>
          ) : (
            <div className="py-16 text-center bg-bg-surface border border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-3">
              <Scroll size={32} className="text-text-secondary" />
              <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">No Briefing Generated</p>
              <button 
                onClick={triggerBriefing}
                className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Generate Briefing Paper
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: OSINT Inquiry & Document Generator */}
      {activeTab === 'osint' && (
        <div className="space-y-6">
          <section className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="text-accent" size={18} />
                <h3 className="font-display text-sm font-semibold text-text-primary">Strategic Grounding Query</h3>
              </div>
              <span className="text-[11px] font-mono text-text-secondary uppercase tracking-wider">
                Voice Dictation Ready
              </span>
            </div>
            <div className="relative">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRecording ? "Listening for voice dictation..." : "Dictate research inquiry or type intelligence query..."}
                className={`w-full bg-bg-elevated border border-border-subtle rounded-2xl p-4 pb-16 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-secondary resize-none min-h-[140px] leading-relaxed transition-colors ${
                  isRecording ? 'border-danger ring-1 ring-danger' : ''
                }`}
                disabled={osintLoading}
              />
              <div className="absolute bottom-3 left-4 flex items-center gap-3">
                {/* Prominent Voice Briefing / Dictation FAB */}
                <button 
                  onClick={toggleRecording}
                  type="button"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all shadow-md ${
                    isRecording 
                      ? 'bg-danger text-white animate-pulse' 
                      : 'bg-accent text-accent-ink hover:opacity-90'
                  }`}
                  title="Voice Dictation"
                >
                  <Mic size={15} />
                  <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
                </button>
              </div>
              <button 
                onClick={handleAnalyzeQuery}
                disabled={!query.trim() || osintLoading}
                className="absolute bottom-3 right-3 px-4 py-2 bg-accent text-accent-ink font-semibold text-xs rounded-full flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                {osintLoading ? <Sparkles className="animate-spin" size={15} /> : <SendHorizontal size={15} />}
                <span>Synthesize</span>
              </button>
            </div>
          </section>

          {/* Inquiry Output */}
          <div ref={reportContainerRef} className="animate-fade-in">
            {osintLoading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl">
                <div className="relative mb-4">
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <BrainCircuit className="absolute inset-0 m-auto text-accent" size={20} />
                </div>
                <p className="font-mono text-xs text-text-secondary uppercase tracking-wider">Running OSINT Correlation Engine...</p>
              </div>
            ) : report ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 bg-bg-surface border border-border-subtle rounded-lg text-xs font-mono text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                    title="Export PDF"
                  >
                    <Download size={14} />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-bg-surface border border-border-subtle rounded-lg text-xs font-mono text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                    title="Print Briefing"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>
                </div>

                <article ref={contentRef} className="bg-bg-surface text-text-primary border border-border-subtle rounded-2xl overflow-hidden report-justified">
                  <header className="bg-bg-elevated p-6 sm:p-8 border-b border-border-subtle space-y-4">
                    <div className="flex items-center gap-2 text-accent text-xs font-mono uppercase tracking-wider">
                      <Shield size={14} />
                      <span>SFC_OSINT_ASSESSMENT // GROUNDED COGNITIVE LAYER</span>
                    </div>
                    <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary leading-snug">
                      {report.title}
                    </h1>
                    <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl">
                      <p className="text-[11px] text-text-secondary font-mono uppercase tracking-wider mb-1.5">Executive Summary</p>
                      <p className="text-sm leading-relaxed text-text-primary text-justify">{report.executiveSummary}</p>
                    </div>
                  </header>

                  <div className="p-6 sm:p-8 space-y-8">
                    <section>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                        <Scroll size={14} className="text-accent" />
                        <span>Strategic Synthesis</span>
                      </h3>
                      <div className="text-[15px] leading-[1.75] whitespace-pre-wrap text-text-primary text-justify">
                        {report.strategicSynthesis}
                      </div>
                    </section>

                    <section className="bg-bg-elevated p-5 rounded-xl border border-border-subtle">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-accent mb-2">Operational Verdict</h3>
                      <p className="text-sm font-medium text-text-primary leading-relaxed text-justify">"{report.conclusion}"</p>
                    </section>

                    {/* Council Voices */}
                    <section>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">Strategic Council Perspectives</h3>
                      <div className="space-y-3">
                        {report.councilVoices?.map((voice: any, i: number) => (
                          <div key={i} className="p-4 bg-bg-elevated/60 border border-border-subtle rounded-xl">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span className="text-xs font-semibold text-text-primary">{voice.strategist}</span>
                            </div>
                            <p className="text-sm text-text-primary/90 mb-2 leading-relaxed text-justify">"{voice.quote}"</p>
                            <div className="text-[11px] text-text-secondary font-mono">Application: {voice.application}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <footer className="px-6 py-4 bg-bg-elevated/40 border-t border-border-subtle text-center text-[11px] font-mono text-text-secondary uppercase">
                    U-ISMS // GROUNDING_LOG // {new Date().toISOString()}
                  </footer>
                </article>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl">
                <Scroll size={32} className="mb-3 text-text-secondary" />
                <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">Enter a research query above to generate an OSINT briefing paper</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
