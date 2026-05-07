
import React, { useEffect, useState, useRef } from 'react';
import { generateDailyOpEd } from '../services/geminiService';
// Fixed: Added missing Shield and ShieldCheck icon imports from lucide-react.
import { FileText, RefreshCw, Calendar, Printer, Quote, Download, History, Shield, ShieldCheck } from 'lucide-react';
import { Incident, PEPProfile } from '../types';

declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

interface DailyOpEdProps {
  incidents: Incident[];
  peps: PEPProfile[];
}

export const DailyOpEd: React.FC<DailyOpEdProps> = ({ incidents, peps }) => {
  const [report, setReport] = useState<{ title: string; content: string; keyTakeaways: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Date Range Selection State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHistorical, setIsHistorical] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    
    // Filter incidents based on selected range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    const filteredIncidents = isHistorical 
        ? incidents.filter(i => {
            const d = new Date(i.date);
            return d >= start && d <= end;
        })
        : incidents.slice(0, 10); // Default to most recent

    const incidentsSummary = filteredIncidents.length > 0
        ? filteredIncidents.map(i => `${i.type} in ${i.location} (${i.date})`).join('; ')
        : "No significant incidents reported in this period.";

    const pepsSummary = peps?.slice(0, 4)?.map(p => `${p.name}: ${p.influenceIndex}% influence, ${p.sentimentScore}% sentiment`).join('; ') || "";

    const rangeDescription = isHistorical 
        ? `${startDate} to ${endDate}` 
        : "Latest (Last 24-48 hours)";

    try {
      const result = await generateDailyOpEd(incidentsSummary, pepsSummary, rangeDescription, isDeepMode);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !window.html2canvas || !window.jspdf) {
        alert("PDF libraries not fully loaded. Using Print fallback.");
        window.print();
        return;
    }
    try {
        const canvas = await window.html2canvas(contentRef.current, { scale: 2, backgroundColor: '#fdfbf7' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`UISMS_Intel_Brief_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-fade-in pb-10">
      {/* Header Controls */}
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-lg print:hidden">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3 font-playfair tracking-tighter uppercase">
            <Shield className="text-red-500" size={32} />
            Presidential Strategic Briefing Generator
          </h2>
          <p className="text-lg text-slate-400 font-merriweather italic">U-ISMS High-Command // Synthesis Mind Alpha</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
             <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Start Date</label>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => { setStartDate(e.target.value); setIsHistorical(true); }}
                    className="bg-transparent text-sm text-slate-200 outline-none p-1"
                />
             </div>
             <div className="h-6 w-px bg-slate-700 mx-1"></div>
             <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">End Date</label>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => { setEndDate(e.target.value); setIsHistorical(true); }}
                    className="bg-transparent text-sm text-slate-200 outline-none p-1"
                />
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg mr-2">
                <button 
                    onClick={() => setIsDeepMode(false)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${!isDeepMode ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Tactical
                </button>
                <button 
                    onClick={() => setIsDeepMode(true)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${isDeepMode ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Deep
                </button>
            </div>
            <button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                {loading ? 'Synthesizing...' : 'Generate Brief'}
            </button>
            <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors" title="Download PDF">
                    <Download size={20} />
                </button>
                <button onClick={handlePrint} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors" title="Print Briefing">
                    <Printer size={20} />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Display */}
      <div ref={contentRef} className="flex-grow bg-[#fdfbf7] text-slate-900 rounded-xl shadow-2xl overflow-hidden max-w-5xl mx-auto w-full border border-slate-200">
        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center p-12">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin mb-8"></div>
                {isDeepMode && <Shield className="absolute inset-0 m-auto text-red-500 animate-pulse" size={24} />}
             </div>
             <h3 className="text-2xl font-playfair text-slate-400">
                {isDeepMode ? 'Conducting Deep Strategic Grounding...' : 'Synthesizing Field Intelligence...'}
             </h3>
             <p className="text-sm text-slate-400 mt-4 uppercase tracking-widest font-mono">
                {isDeepMode ? 'PHASE 4: GOOGLE SEARCH ACTIVE' : 'PHASE 2: CLUSTER SYNTHESIS'}
             </p>
          </div>
        ) : report ? (
          <div className="flex flex-col lg:flex-row h-full min-h-[800px]">
            {/* Sidebar with Takeaways */}
            <div className="lg:w-80 bg-[#f4f1ea] border-r border-slate-200 p-10 flex-shrink-0">
                <h4 className="font-sans font-bold text-red-700 text-xs uppercase tracking-widest mb-6 border-b border-red-200 pb-3 flex items-center gap-2">
                    <Shield size={14} /> Key Strategic Verdicts
                </h4>
                <div className="space-y-10">
                    {report.keyTakeaways?.map((point, idx) => (
                        <div key={idx} className="group relative">
                            <Quote size={20} className="text-slate-300 mb-2" />
                            <p className="font-merriweather text-slate-700 text-sm leading-relaxed italic">{point}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-20 pt-8 border-t border-slate-200 text-[10px] text-slate-500 font-mono uppercase">
                    Protocol: U-ISMS SYNTHESIS V3.0<br/>
                    Classification: TS // SCI // AFRICAN_SOVEREIGN<br/>
                    ID: {Date.now().toString(36).toUpperCase()}<br/>
                    Node: SFC_ALPHA_COMMAND
                </div>
            </div>

            {/* Main Content Area */}
            <article className="flex-grow p-10 md:p-16 lg:p-24 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 text-slate-500 font-sans text-[10px] font-bold tracking-[0.2em] uppercase mb-10">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {isHistorical ? `${startDate} to ${endDate}` : 'LATEST OPS BRIEFING'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-blue-700">Strategic Intelligence Desk</span>
                    </div>
                    
                    <h1 className="font-playfair text-4xl md:text-6xl font-bold text-slate-950 mb-12 leading-[1.1] tracking-tight">
                        {report.title}
                    </h1>

                    <div 
                        className="prose prose-lg prose-slate font-merriweather text-slate-900 max-w-none 
                        prose-p:leading-relaxed prose-p:mb-8 prose-p:text-lg
                        prose-h2:font-playfair prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-slate-950
                        prose-h3:font-playfair prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                        prose-li:text-slate-800 prose-strong:text-slate-950 prose-strong:font-bold"
                        dangerouslySetInnerHTML={{ __html: report.content || "" }}
                    />

                    <div className="mt-24 pt-12 border-t border-slate-100 flex items-center justify-between opacity-50">
                        <p className="text-xs font-serif text-slate-500 italic">U-ISMS Strategic Intelligence Unit • Kampala SFC HQ</p>
                        <div className="flex gap-4">
                            <FileText size={16} />
                            <ShieldCheck className="text-red-600" size={16} />
                        </div>
                    </div>
                </div>
            </article>
          </div>
        ) : (
           <div className="h-[600px] flex flex-col items-center justify-center text-slate-300 gap-4">
              <History size={48} className="opacity-20" />
              <p className="font-merriweather">Initialize Historical Briefing Generation</p>
              <button onClick={handleGenerate} className="text-blue-600 font-bold hover:underline">Click to start analysis</button>
           </div>
        )}
      </div>
    </div>
  );
};
