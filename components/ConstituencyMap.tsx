import React, { useMemo, useState } from 'react';
import { PEPProfile } from '../types';
import { getConstituencyProfile } from '../data/parliamentaryData';
import { generatePoliticalStrategy } from '../services/geminiService';
import { Users, Search, MapPin, ArrowUpRight, X, BrainCircuit, Activity, FileText, AlertTriangle } from 'lucide-react';

interface ConstituencyMapProps {
  peps: PEPProfile[];
}

export const ConstituencyMap: React.FC<ConstituencyMapProps> = ({ peps }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState<any | null>(null);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  const safeRender = (val: any) => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  const constituencyData = useMemo(() => {
    const groups: Record<string, PEPProfile[]> = {};
    if (Array.isArray(peps)) peps.forEach(p => {
      const country = p.country || 'Uganda';
      const key = `${country}|${p.constituency}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).map(([key, members]) => {
      const [country, constituency] = key.split('|');
      const sorted = [...members].sort((a, b) => (b.influenceIndex || 0) - (a.influenceIndex || 0));
      const leader = sorted[0];
      const runnerUp = sorted[1];
      const gap = runnerUp ? ((leader.influenceIndex || 0) - (runnerUp.influenceIndex || 0)).toFixed(1) : '100';
      return { key, country, name: constituency, candidatesCount: members.length, leader, runnerUp, gap, totalMembers: members };
    }).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [peps, searchTerm]);

  const handleRowClick = async (data: any) => {
    setSelectedConstituency(data);
    setAiReport(null);
    setLoading(true);
    try {
      const profile = getConstituencyProfile(data.name, data.leader.name, data.leader.party);
      const context = `Constituency: ${data.name}. Region: ${profile.region}. Influence Leader: ${data.leader.name}.`;
      const report = await generatePoliticalStrategy(data.leader.name, data.leader.party, data.name, context);
      setAiReport(report);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleClosePanel = () => { setSelectedConstituency(null); setAiReport(null); };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full relative">
      <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-purple-400" size={20} md:size={24} /> 
            Constituency Projection
           </h3>
           <p className="text-[10px] md:text-sm text-slate-400 mt-1 uppercase tracking-widest hidden sm:block">Aggregated intelligence for {constituencyData.length} theater zones.</p>
        </div>
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Filter Area or Leader..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 w-full" />
        </div>
      </div>

      <div className="overflow-auto flex-grow">
        {/* Desktop Table */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-[0.2em] sticky top-0 z-10">
            <tr>
              <th className="p-5 font-black border-b border-slate-700">Country</th>
              <th className="p-5 font-black border-b border-slate-700">Constituency / Area</th>
              <th className="p-5 font-black border-b border-slate-700">PEPs</th>
              <th className="p-5 font-black border-b border-slate-700">Influence Leader</th>
              <th className="p-5 font-black border-b border-slate-700 text-right">Power Gap</th>
              <th className="p-5 font-black border-b border-slate-700">Intel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-sm">
            {Array.isArray(constituencyData) && constituencyData.map((data, idx) => (
              <tr key={data.key} onClick={() => handleRowClick(data)} className="hover:bg-slate-700/30 transition-colors cursor-pointer group">
                <td className="p-5">
                    <span className="text-[10px] font-black bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400">
                        {data.country}
                    </span>
                </td>
                <td className="p-5 font-medium text-white group-hover:text-blue-400">{data.name}</td>
                <td className="p-5 text-slate-400"><div className="flex items-center gap-1"><Users size={14} /> {data.candidatesCount}</div></td>
                <td className="p-5 flex flex-col">
                    <div className="font-bold text-slate-200">{data.leader.name}</div>
                    <div className="text-[10px] text-blue-500 font-bold">{data.leader.influenceIndex || 0}% Influence</div>
                </td>
                <td className="p-5 text-right font-mono text-slate-300">+{data.gap}%</td>
                <td className="p-5 text-right">
                    <button className="text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded hover:bg-purple-500/20 hover:text-purple-300 flex items-center gap-2 text-[10px] uppercase font-black transition-all shadow-sm border border-purple-500/20">SitRep <ArrowUpRight size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-slate-800">
           {Array.isArray(constituencyData) && constituencyData.length > 0 ? (
             constituencyData.map((data, idx) => (
               <div 
                key={data.key} 
                onClick={() => handleRowClick(data)}
                className="p-4 bg-slate-900/10 active:bg-slate-800 transition-colors"
               >
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-black uppercase text-sm tracking-tight">
                       <span className="text-[10px] text-slate-500 mr-2">{data.country}</span>
                       {data.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">+{data.gap}% GAP</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-xs text-slate-400 font-bold mb-1">{data.leader.name}</p>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                             <Users size={10} /> {data.candidatesCount} PEPs
                          </span>
                          <span className="text-[10px] text-purple-400 font-black">{data.leader.influenceIndex || 0}% INFLUENCE</span>
                       </div>
                    </div>
                    <button className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Detail &rarr;</button>
                 </div>
               </div>
             ))
           ) : (
             <div className="p-10 text-center text-slate-600 text-xs">No zones matching criteria.</div>
           )}
        </div>
      </div>

      {selectedConstituency && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[50]" onClick={handleClosePanel} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-900 md:border-l md:border-slate-700 shadow-2xl z-[51] overflow-y-auto animate-in slide-in-from-right">
             <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 py-2">
                   <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{selectedConstituency.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-500 text-xs md:text-sm">Influence Leader:</span>
                        <span className="text-white text-xs md:text-sm font-bold">{selectedConstituency.leader.name}</span>
                      </div>
                   </div>
                   <button onClick={handleClosePanel} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
                </div>
                
                <div className="space-y-8 pb-20">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400"><FileText size={20} md:size={24} /></div>
                      <div>
                         <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-tighter">Constituency Briefing</h3>
                         <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">Deep Network Synthesis</p>
                      </div>
                   </div>

                   {loading ? (
                      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center flex flex-col items-center">
                          <BrainCircuit className="animate-pulse text-blue-500 mb-4" size={32} />
                          <h4 className="text-white font-bold mb-2">Analyzing theater metrics...</h4>
                          <p className="text-xs text-slate-500">Mugi-Solo is processing local friction points.</p>
                      </div>
                   ) : aiReport ? (
                      <div className="space-y-6 animate-fade-in">
                          <div className="bg-slate-800 rounded-xl border border-blue-500/20 overflow-hidden shadow-inner">
                              <div className="bg-blue-900/10 px-6 py-3 border-b border-blue-500/10 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2 tracking-widest"><Activity size={14} /> Situation Report</span>
                                 <span className="text-[9px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">EYES ONLY</span>
                              </div>
                              <div className="p-5 md:p-6">
                                 <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm md:text-base font-serif">
                                    {safeRender(aiReport.sitRep)}
                                 </p>
                              </div>
                          </div>
                          
                          <div className="bg-slate-800 rounded-xl border border-purple-500/20 overflow-hidden relative">
                              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
                              <div className="bg-purple-900/10 px-6 py-3 border-b border-purple-500/10">
                                 <span className="text-[10px] font-black text-purple-400 uppercase flex items-center gap-2 tracking-widest"><BrainCircuit size={14} /> The Grand Strategy</span>
                              </div>
                              <div className="p-5 md:p-6">
                                 <div className="border-l-2 border-purple-500 pl-4 py-1">
                                    <p className="text-slate-300 leading-relaxed italic text-sm md:text-base">
                                       "{safeRender(aiReport.grandStrategy)}"
                                    </p>
                                 </div>
                              </div>
                          </div>
                      </div>
                   ) : (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-center gap-4 text-red-300">
                         <AlertTriangle size={20} /><p className="text-xs font-bold uppercase">Node connection failed.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
};