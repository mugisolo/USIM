
import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  MapPin, 
  Activity, 
  Lock, 
  Unlock, 
  Zap, 
  Anchor, 
  Plane, 
  HardDrive,
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { StrategicAsset } from '../types';

interface StrategicAssetsProps {
  assets?: StrategicAsset[];
}

const MOCK_ASSETS: StrategicAsset[] = [
  {
    id: 'as-001',
    name: 'Entebbe International Airbase',
    type: 'Airbase',
    location: 'Entebbe, Uganda',
    status: 'Operational',
    coordinates: [0.0424, 32.4431],
    country: 'Uganda',
    owner: 'UPDF Air Force'
  },
  {
    id: 'as-002',
    name: 'Mombasa Port - Terminal 3',
    type: 'Port',
    location: 'Mombasa, Kenya',
    status: 'Operational',
    coordinates: [-4.0435, 39.6682],
    country: 'Kenya',
    owner: 'Kenya Ports Authority'
  },
  {
    id: 'as-003',
    name: 'Kigali National Data Center',
    type: 'Data Center',
    location: 'Kigali, Rwanda',
    status: 'Secured',
    coordinates: [-1.9441, 30.0619],
    country: 'Rwanda',
    owner: 'Government of Rwanda'
  },
  {
    id: 'as-004',
    name: 'Bujumbura Power Plant',
    type: 'Power Plant',
    location: 'Bujumbura, Burundi',
    status: 'Under Observation',
    coordinates: [-3.3822, 29.3644],
    country: 'Burundi',
    owner: 'REGIDESO'
  },
  {
    id: 'as-005',
    name: 'Goma-Rubavu Border Crossing',
    type: 'Border Post',
    location: 'Goma, DRC',
    status: 'Compromised',
    coordinates: [-1.6741, 29.2285],
    country: 'DRC',
    owner: 'DGM'
  }
];

export const StrategicAssetsMap: React.FC<StrategicAssetsProps> = ({ assets = MOCK_ASSETS }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<StrategicAsset | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || a.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, filterType]);

  const getStatusColor = (status: StrategicAsset['status']) => {
    switch (status) {
      case 'Operational': return 'text-savanna-sage bg-savanna-sage/10 border-savanna-sage/20';
      case 'Secured': return 'text-intel-blue bg-intel-blue/10 border-intel-blue/20';
      case 'Under Observation': return 'text-nile-amber bg-nile-amber/10 border-nile-amber/20';
      case 'Compromised': return 'text-brotherhood-crimson bg-brotherhood-crimson/10 border-brotherhood-crimson/20';
      default: return 'text-crane-grey bg-crane-grey/10 border-crane-grey/20';
    }
  };

  const getTypeIcon = (type: StrategicAsset['type']) => {
    switch (type) {
      case 'Airbase': return <Plane size={18} className="text-crested-gold" />;
      case 'Port': return <Anchor size={18} className="text-intel-blue" />;
      case 'Data Center': return <HardDrive size={18} className="text-crested-gold" />;
      case 'Power Plant': return <Zap size={18} className="text-nile-amber" />;
      case 'Border Post': return <MapPin size={18} className="text-brotherhood-crimson" />;
      default: return <Shield size={18} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* 1. Module Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-pearl-africa font-black tracking-tighter text-lg uppercase leading-none">Strategic Asset Ledger</h2>
          <p className="text-[10px] font-mono text-crane-grey uppercase tracking-widest mt-1">Multi-Domain Infrastructure Grid</p>
        </div>
        <div className="p-3 bg-crested-gold/10 rounded-full text-crested-gold">
          <Shield size={24} />
        </div>
      </div>

      {/* 2. Operations Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-crane-grey mb-1 tracking-widest">Active</p>
          <p className="text-xl font-black text-savanna-sage">84.2%</p>
        </div>
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-crane-grey mb-1 tracking-widest">Watch</p>
          <p className="text-xl font-black text-nile-amber">11.8%</p>
        </div>
        <div className="stacked-precision-card p-4 text-center">
          <p className="text-[9px] font-black uppercase text-crane-grey mb-1 tracking-widest">Conflict</p>
          <p className="text-xl font-black text-brotherhood-crimson">04.0%</p>
        </div>
      </div>

      {/* 3. Search & Filter Overlay */}
      <div className="space-y-4 pt-2 pb-6 z-30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-crane-grey" size={16} />
          <input 
            type="text"
            placeholder="Search Asset Node ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-lake-victoria/40 border border-white/5 rounded-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-crested-gold placeholder:text-crane-grey font-medium transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar py-1">
          {['All', 'Airbase', 'Port', 'Data Center', 'Power Plant', 'Border Post'].map(type => (
            <button 
              key={type}
              onClick={() => {
                setFilterType(type);
                if (window.navigator?.vibrate) window.navigator.vibrate(5);
              }}
              className={`px-5 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterType === type ? 'bg-crested-gold text-lake-victoria border-crested-gold' : 'bg-transparent text-crane-grey border-white/5'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Asset List Stack */}
      <div className="space-y-1">
        {filteredAssets.length === 0 ? (
          <div className="py-20 text-center opacity-20">
             <Shield size={48} className="mx-auto mb-4" />
             <p className="text-sm font-black uppercase tracking-widest">No matching assets in ledger</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <button 
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="w-full stacked-precision-card p-5 flex items-center justify-between group active:bg-white/5"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-sm bg-lake-victoria border border-white/5 flex items-center justify-center ${asset.status === 'Compromised' ? 'bg-brotherhood-crimson/10 border-brotherhood-crimson' : 'bg-white/5 border-white/5'}`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="text-left">
                  <h4 className="text-[14px] font-black text-pearl-africa leading-none mb-2 group-active:text-crested-gold uppercase tracking-tight">{asset.name}</h4>
                  <p className="text-[10px] font-mono text-crane-grey uppercase tracking-widest">
                    {asset.id} <span className="opacity-30 px-1">//</span> {asset.country}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border ${getStatusColor(asset.status)}`}>
                  {asset.status === 'Under Observation' ? 'Watch' : asset.status}
                </span>
                <p className="text-[9px] font-black text-crane-grey mt-2 uppercase tracking-[0.2em]">{asset.type}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 5. Asset Detail Over-Panel */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] bg-kampala-obsidian overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-kampala-obsidian/80 backdrop-blur-md h-16 flex items-center justify-between px-6 z-10 border-b border-white/5">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield size={14} className="text-intel-blue" />
                Asset Intel
             </h3>
             <button onClick={() => setSelectedAsset(null)} className="p-2 bg-white/5 rounded-full">
                <X size={20} />
             </button>
          </div>

          <div className="p-6 space-y-8 max-w-lg mx-auto">
             <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter leading-none mb-2">{selectedAsset.name}</h2>
                <div className="flex gap-2">
                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border ${getStatusColor(selectedAsset.status)}`}>
                      {selectedAsset.status}
                   </span>
                   <span className="text-[10px] font-mono text-infra-steel bg-white/5 px-3 py-1 rounded uppercase tracking-tighter">
                      CID: {selectedAsset.id}
                   </span>
                </div>
             </div>

             {/* Tech Specs */}
             <div className="grid grid-cols-2 gap-4">
                <div className="stacked-precision-card p-4">
                   <p className="text-[9px] font-black text-infra-steel uppercase mb-1">Coordinates</p>
                   <p className="text-[13px] font-mono">{selectedAsset.coordinates[0].toFixed(4)}N / {selectedAsset.coordinates[1].toFixed(4)}E</p>
                </div>
                <div className="stacked-precision-card p-4">
                   <p className="text-[9px] font-black text-infra-steel uppercase mb-1">Sector Authority</p>
                   <p className="text-[13px] font-mono truncate">{selectedAsset.owner}</p>
                </div>
             </div>

             {/* Operational Log */}
             <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-infra-steel">Recent Telemetry</h4>
                <div className="space-y-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                        <div className="w-1 h-1 rounded-full bg-intel-blue mt-2" />
                        <div>
                           <p className="text-xs font-medium leading-relaxed">Automated perimeter breach alert logged in Section B-9. Visual confirmation confirms fauna interference.</p>
                           <p className="text-[9px] font-mono text-infra-steel mt-1 uppercase">2026-05-01 // 12:44:0{i}Z</p>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* Action Matrix */}
             <div className="pt-10 space-y-3">
                <button className="w-full bg-intel-blue text-pearl-white py-4 rounded font-black uppercase tracking-widest text-[11px] shadow-lg shadow-intel-blue/20">
                   Initiate Override
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button className="bg-nile-slate border border-white/10 py-3 rounded text-[10px] font-black uppercase text-infra-steel tracking-widest">
                      Satellite Link
                   </button>
                   <button className="bg-nile-slate border border-white/10 py-3 rounded text-[10px] font-black uppercase text-infra-steel tracking-widest">
                      SFC Briefing
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

