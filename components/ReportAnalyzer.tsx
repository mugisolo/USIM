import React, { useState, useEffect, useRef } from 'react';
import { generateDeepMindAnalysis } from '../services/geminiService';
import { Sparkles, BrainCircuit, Send, User, Quote, Scroll, History, BookOpen, Printer, Download, MessageCircle, Mic, Shield } from 'lucide-react';

declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

export const ReportAnalyzer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleRecording = () => {
    if (!isRecording) {
      if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
      setIsRecording(true);
      // Simulate voice-to-text
      setTimeout(() => {
        setQuery("Analyze recent troop movements near Northern Corridor relative to energy infrastructure vulnerabilities.");
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const safeRender = (val: any) => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setReport(null);
    try {
      const result = await generateDeepMindAnalysis(query, isDeepMode);
      setReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (report && reportContainerRef.current) {
        reportContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !window.html2canvas || !window.jspdf) {
        alert("PDF generation libraries not loaded.");
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
        const canvas = await window.html2canvas(clonedElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1000 });
        document.body.removeChild(clonedElement);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
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
        pdf.save(`UISMS_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch { alert("Failed to generate PDF."); }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      {/* 1. Module Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-pearl-africa font-black tracking-tighter text-xl uppercase leading-none glitch-text" data-text="Synthesis Mind AI">Synthesis Mind AI</h2>
          <p className="text-[10px] font-mono text-crane-grey uppercase tracking-[0.3em] mt-1">Cognitive Strategic Engine V4.2</p>
        </div>
        <div className="p-3 bg-crested-gold/10 rounded-full text-crested-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <BrainCircuit size={24} />
        </div>
      </div>

      {/* 2. Predictive Alert Cards - Horizontal Scroll */}
      <section>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-crane-grey mb-4 px-1">Integrity Forecast</h4>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
          <div className="min-w-[300px] stacked-precision-card p-6 border-l-4 border-l-brotherhood-crimson bg-gradient-to-br from-lake-victoria to-kampala-obsidian snap-center">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-brotherhood-crimson text-white text-[9px] font-black uppercase rounded-sm shadow-lg shadow-brotherhood-crimson/20">Level 5</span>
              <span className="text-[10px] font-mono text-crested-gold">PROBABILITY: 91%</span>
            </div>
            <h4 className="text-base font-black leading-tight mb-3 uppercase tracking-tight text-pearl-africa">Kinetic Escalation: N. Corridor</h4>
            <p className="text-xs text-crane-grey leading-snug">Multi-domain SIGINT verifies buildup of irregular signals at Sector Alpha-0. Immediate kinetic response protocols recommended.</p>
          </div>
          <div className="min-w-[300px] stacked-precision-card p-6 border-l-4 border-l-rift-rust bg-gradient-to-br from-lake-victoria to-kampala-obsidian snap-center">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-rift-rust text-white text-[9px] font-black uppercase rounded-sm">Level 4</span>
              <span className="text-[10px] font-mono text-crested-gold">PROBABILITY: 74%</span>
            </div>
            <h4 className="text-base font-black leading-tight mb-3 uppercase tracking-tight text-pearl-africa">Legislative Friction Point</h4>
            <p className="text-xs text-crane-grey leading-snug">Semantic analysis of actor communications indicates imminent breakdown in regional caucus unification for infrastructure vote.</p>
          </div>
        </div>
      </section>

      {/* 3. Conversational Input Interface */}
      <section className="stacked-precision-card p-6 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border-t-2 border-crested-gold">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="text-crested-gold" size={20} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pearl-africa">Strategic Grounding Query</h3>
        </div>
        <div className="relative">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isRecording ? "Listening for dictate..." : "Dictate theater query or type strategic inquiry..."}
            className={`w-full bg-lake-victoria/60 border border-white/5 rounded-sm p-5 pb-14 text-sm focus:outline-none focus:border-crested-gold placeholder:text-crane-grey resize-none min-h-[140px] font-medium transition-all ${isRecording ? 'ring-1 ring-brotherhood-crimson animate-pulse' : ''}`}
            disabled={loading}
          />
          <div className="absolute bottom-4 left-5 flex gap-5">
             <button 
                onClick={toggleRecording}
                className={`transition-all active:scale-90 ${isRecording ? 'text-brotherhood-crimson animate-pulse' : 'text-crane-grey hover:text-crested-gold'}`}
             >
                <Mic size={20} />
             </button>
             <button className="text-crane-grey hover:text-crested-gold transition-colors active:scale-90">
                <Shield size={20} />
             </button>
          </div>
          <button 
             onClick={handleAnalyze}
             disabled={!query.trim() || loading}
             className="absolute bottom-4 right-4 p-3 bg-crested-gold text-lake-victoria rounded-sm transition-all active:scale-95 disabled:opacity-20 shadow-xl"
          >
            {loading ? <Sparkles className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsDeepMode(false)}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${!isDeepMode ? 'bg-intel-blue border-intel-blue text-white' : 'border-white/5 text-infra-steel'}`}
              >Tactical</button>
              <button 
                onClick={() => setIsDeepMode(true)}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${isDeepMode ? 'bg-purple-600 border-purple-600 text-white' : 'border-white/5 text-infra-steel'}`}
              >Deep Research</button>
            </div>
            <span className="text-[8px] font-mono text-infra-steel uppercase">V4.2 // GEMINI-1.5-PRO</span>
        </div>
      </section>

      {/* 4. Dynamic Briefing Output */}
      <div ref={reportContainerRef} className="animate-fade-in">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center stacked-precision-card border-dashed">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-2 border-intel-blue border-t-transparent rounded-full animate-spin" />
              <BrainCircuit className="absolute inset-0 m-auto text-intel-blue animate-pulse" size={24} />
            </div>
            <p className="font-mono text-[10px] text-infra-steel uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence Streams...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            <div className="flex justify-end gap-2 px-1">
                <button onClick={handleDownloadPDF} className="p-2 bg-nile-slate border border-white/5 rounded text-infra-steel hover:text-white transition-colors">
                    <Download size={16} />
                </button>
                <button onClick={handlePrint} className="p-2 bg-nile-slate border border-white/5 rounded text-infra-steel hover:text-white transition-colors">
                    <Printer size={16} />
                </button>
            </div>

            <article ref={contentRef} className="bg-pearl-white text-kampala-obsidian rounded-xl overflow-hidden shadow-2xl">
              <header className="bg-kampala-obsidian text-pearl-white p-8 border-b-4 border-intel-blue relative">
                <div className="flex items-center gap-2 mb-4 text-intel-blue text-[9px] font-black uppercase tracking-widest">
                  <Shield size={12} />
                  <span>SFC_OPERATIONAL_ASESSMENT // THEATER_ALPHA</span>
                </div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-4">{report.title}</h1>
                <div className="p-4 bg-white/5 border border-white/10 rounded">
                   <p className="text-xs text-infra-steel font-mono uppercase mb-1">Executive Summary</p>
                   <p className="text-sm font-medium leading-relaxed">{report.executiveSummary}</p>
                </div>
              </header>

              <div className="p-8 space-y-8">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-nile-slate mb-4 pb-2 border-b border-nile-slate/10 flex items-center gap-2">
                    <Scroll size={14} className="text-intel-blue" />
                    Strategic Synthesis
                  </h3>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {report.strategicSynthesis}
                  </div>
                </section>

                <section className="bg-nile-slate/5 p-6 rounded-lg border border-nile-slate/10 italic">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-intel-blue mb-2">Operational Verdict</h3>
                  <p className="text-sm font-bold">"{report.conclusion}"</p>
                </section>

                {/* Council Voices - Redesigned as vertical feed */}
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-nile-slate mb-4">Strategic Council Input</h3>
                  <div className="space-y-4">
                    {report.councilVoices?.map((voice: any, i: number) => (
                      <div key={i} className="p-4 bg-white border border-nile-slate/10 rounded shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-intel-blue" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{voice.strategist}</span>
                        </div>
                        <p className="text-xs italic text-nile-slate mb-2 leading-relaxed">"{voice.quote}"</p>
                        <div className="text-[9px] text-infra-steel uppercase font-mono">APP: {voice.application}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <footer className="p-4 bg-nile-slate/5 border-t border-white/5 text-center text-[8px] font-mono text-infra-steel uppercase">
                U-ISMS // SYNTHESIS_LOG // {new Date().toISOString()} // SECURE_HASH: {Math.random().toString(36).substring(7).toUpperCase()}
              </footer>
            </article>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-xl">
             <Scroll size={40} className="mb-4" />
             <p className="text-[11px] font-black uppercase tracking-widest">Awaiting Command Authorization</p>
          </div>
        )}
      </div>
    </div>
  );
};
