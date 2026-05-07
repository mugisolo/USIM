
import React, { useState, useMemo, useEffect } from 'react';
import { Country, CountrySitrep, CountryAnalytics, Incident, PEPProfile, StrategicAsset } from '../types';
import { generateCountrySitrep, generateCountryLedgerAnalytics } from '../services/geminiService';
import { Globe, Shield, Search, X, BrainCircuit, Activity, Zap, AlertTriangle, ChevronRight, Landmark, Swords, Users, ExternalLink, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';

const AFRICAN_COUNTRIES: Country[] = [
    { id: '1', name: 'Algeria', region: 'North', stabilityIndex: 'Stable', isoCode: 'DZ', flagUrl: 'https://flagcdn.com/w160/dz.png' },
    { id: '2', name: 'Angola', region: 'South', stabilityIndex: 'Stable', isoCode: 'AO', flagUrl: 'https://flagcdn.com/w160/ao.png' },
    { id: '3', name: 'Benin', region: 'West', stabilityIndex: 'Stable', isoCode: 'BJ', flagUrl: 'https://flagcdn.com/w160/bj.png' },
    { id: '4', name: 'Botswana', region: 'South', stabilityIndex: 'Stable', isoCode: 'BW', flagUrl: 'https://flagcdn.com/w160/bw.png' },
    { id: '5', name: 'Burkina Faso', region: 'West', stabilityIndex: 'Conflict', isoCode: 'BF', flagUrl: 'https://flagcdn.com/w160/bf.png' },
    { id: '6', name: 'Burundi', region: 'East', stabilityIndex: 'Fragile', isoCode: 'BI', flagUrl: 'https://flagcdn.com/w160/bi.png' },
    { id: '7', name: 'Cabo Verde', region: 'West', stabilityIndex: 'Stable', isoCode: 'CV', flagUrl: 'https://flagcdn.com/w160/cv.png' },
    { id: '8', name: 'Cameroon', region: 'Central', stabilityIndex: 'Fragile', isoCode: 'CM', flagUrl: 'https://flagcdn.com/w160/cm.png' },
    { id: '9', name: 'Central African Republic', region: 'Central', stabilityIndex: 'Conflict', isoCode: 'CF', flagUrl: 'https://flagcdn.com/w160/cf.png' },
    { id: '10', name: 'Chad', region: 'Central', stabilityIndex: 'Conflict', isoCode: 'TD', flagUrl: 'https://flagcdn.com/w160/td.png' },
    { id: '11', name: 'Comoros', region: 'East', stabilityIndex: 'Fragile', isoCode: 'KM', flagUrl: 'https://flagcdn.com/w160/km.png' },
    { id: '12', name: 'DRC', region: 'Central', stabilityIndex: 'Conflict', isoCode: 'CD', flagUrl: 'https://flagcdn.com/w160/cd.png' },
    { id: '13', name: 'Djibouti', region: 'East', stabilityIndex: 'Stable', isoCode: 'DJ', flagUrl: 'https://flagcdn.com/w160/dj.png' },
    { id: '14', name: 'Egypt', region: 'North', stabilityIndex: 'Stable', isoCode: 'EG', flagUrl: 'https://flagcdn.com/w160/eg.png' },
    { id: '15', name: 'Equatorial Guinea', region: 'Central', stabilityIndex: 'Stable', isoCode: 'GQ', flagUrl: 'https://flagcdn.com/w160/gq.png' },
    { id: '16', name: 'Eritrea', region: 'East', stabilityIndex: 'Failing', isoCode: 'ER', flagUrl: 'https://flagcdn.com/w160/er.png' },
    { id: '17', name: 'Eswatini', region: 'South', stabilityIndex: 'Fragile', isoCode: 'SZ', flagUrl: 'https://flagcdn.com/w160/sz.png' },
    { id: '18', name: 'Ethiopia', region: 'East', stabilityIndex: 'Conflict', isoCode: 'ET', flagUrl: 'https://flagcdn.com/w160/et.png' },
    { id: '19', name: 'Gabon', region: 'Central', stabilityIndex: 'Fragile', isoCode: 'GA', flagUrl: 'https://flagcdn.com/w160/ga.png' },
    { id: '20', name: 'Gambia', region: 'West', stabilityIndex: 'Stable', isoCode: 'GM', flagUrl: 'https://flagcdn.com/w160/gm.png' },
    { id: '21', name: 'Ghana', region: 'West', stabilityIndex: 'Stable', isoCode: 'GH', flagUrl: 'https://flagcdn.com/w160/gh.png' },
    { id: '22', name: 'Guinea', region: 'West', stabilityIndex: 'Fragile', isoCode: 'GN', flagUrl: 'https://flagcdn.com/w160/gn.png' },
    { id: '23', name: 'Guinea-Bissau', region: 'West', stabilityIndex: 'Fragile', isoCode: 'GW', flagUrl: 'https://flagcdn.com/w160/gw.png' },
    { id: '24', name: 'Ivory Coast', region: 'West', stabilityIndex: 'Stable', isoCode: 'CI', flagUrl: 'https://flagcdn.com/w160/ci.png' },
    { id: '25', name: 'Kenya', region: 'East', stabilityIndex: 'Stable', isoCode: 'KE', flagUrl: 'https://flagcdn.com/w160/ke.png' },
    { id: '26', name: 'Lesotho', region: 'South', stabilityIndex: 'Stable', isoCode: 'LS', flagUrl: 'https://flagcdn.com/w160/ls.png' },
    { id: '27', name: 'Liberia', region: 'West', stabilityIndex: 'Stable', isoCode: 'LR', flagUrl: 'https://flagcdn.com/w160/lr.png' },
    { id: '28', name: 'Libya', region: 'North', stabilityIndex: 'Conflict', isoCode: 'LY', flagUrl: 'https://flagcdn.com/w160/ly.png' },
    { id: '29', name: 'Madagascar', region: 'East', stabilityIndex: 'Stable', isoCode: 'MG', flagUrl: 'https://flagcdn.com/w160/mg.png' },
    { id: '30', name: 'Malawi', region: 'South', stabilityIndex: 'Stable', isoCode: 'MW', flagUrl: 'https://flagcdn.com/w160/mw.png' },
    { id: '31', name: 'Mali', region: 'West', stabilityIndex: 'Conflict', isoCode: 'ML', flagUrl: 'https://flagcdn.com/w160/ml.png' },
    { id: '32', name: 'Mauritania', region: 'West', stabilityIndex: 'Stable', isoCode: 'MR', flagUrl: 'https://flagcdn.com/w160/mr.png' },
    { id: '33', name: 'Mauritius', region: 'East', stabilityIndex: 'Stable', isoCode: 'MU', flagUrl: 'https://flagcdn.com/w160/mu.png' },
    { id: '34', name: 'Morocco', region: 'North', stabilityIndex: 'Stable', isoCode: 'MA', flagUrl: 'https://flagcdn.com/w160/ma.png' },
    { id: '35', name: 'Mozambique', region: 'South', stabilityIndex: 'Conflict', isoCode: 'MZ', flagUrl: 'https://flagcdn.com/w160/mz.png' },
    { id: '36', name: 'Namibia', region: 'South', stabilityIndex: 'Stable', isoCode: 'NA', flagUrl: 'https://flagcdn.com/w160/na.png' },
    { id: '37', name: 'Niger', region: 'West', stabilityIndex: 'Conflict', isoCode: 'NE', flagUrl: 'https://flagcdn.com/w160/ne.png' },
    { id: '38', name: 'Nigeria', region: 'West', stabilityIndex: 'Fragile', isoCode: 'NG', flagUrl: 'https://flagcdn.com/w160/ng.png' },
    { id: '39', name: 'Rwanda', region: 'East', stabilityIndex: 'Stable', isoCode: 'RW', flagUrl: 'https://flagcdn.com/w160/rw.png' },
    { id: '40', name: 'Sao Tome and Principe', region: 'Central', stabilityIndex: 'Stable', isoCode: 'ST', flagUrl: 'https://flagcdn.com/w160/st.png' },
    { id: '41', name: 'Senegal', region: 'West', stabilityIndex: 'Stable', isoCode: 'SN', flagUrl: 'https://flagcdn.com/w160/sn.png' },
    { id: '42', name: 'Seychelles', region: 'East', stabilityIndex: 'Stable', isoCode: 'SC', flagUrl: 'https://flagcdn.com/w160/sc.png' },
    { id: '43', name: 'Sierra Leone', region: 'West', stabilityIndex: 'Stable', isoCode: 'SL', flagUrl: 'https://flagcdn.com/w160/sl.png' },
    { id: '44', name: 'Somalia', region: 'East', stabilityIndex: 'Conflict', isoCode: 'SO', flagUrl: 'https://flagcdn.com/w160/so.png' },
    { id: '45', name: 'South Africa', region: 'South', stabilityIndex: 'Stable', isoCode: 'ZA', flagUrl: 'https://flagcdn.com/w160/za.png' },
    { id: '46', name: 'South Sudan', region: 'East', stabilityIndex: 'Conflict', isoCode: 'SS', flagUrl: 'https://flagcdn.com/w160/ss.png' },
    { id: '47', name: 'Sudan', region: 'North', stabilityIndex: 'Conflict', isoCode: 'SD', flagUrl: 'https://flagcdn.com/w160/sd.png' },
    { id: '48', name: 'Tanzania', region: 'East', stabilityIndex: 'Stable', isoCode: 'TZ', flagUrl: 'https://flagcdn.com/w160/tz.png' },
    { id: '49', name: 'Togo', region: 'West', stabilityIndex: 'Stable', isoCode: 'TG', flagUrl: 'https://flagcdn.com/w160/tg.png' },
    { id: '50', name: 'Tunisia', region: 'North', stabilityIndex: 'Fragile', isoCode: 'TN', flagUrl: 'https://flagcdn.com/w160/tn.png' },
    { id: '51', name: 'Uganda', region: 'East', stabilityIndex: 'Stable', isoCode: 'UG', flagUrl: 'https://flagcdn.com/w160/ug.png' },
    { id: '52', name: 'Zambia', region: 'South', stabilityIndex: 'Stable', isoCode: 'ZM', flagUrl: 'https://flagcdn.com/w160/zm.png' },
    { id: '53', name: 'Zimbabwe', region: 'South', stabilityIndex: 'Fragile', isoCode: 'ZW', flagUrl: 'https://flagcdn.com/w160/zw.png' },
];

export const CountryLedger: React.FC<{ incidents: Incident[], peps: PEPProfile[], assets: StrategicAsset[] }> = ({ incidents, peps, assets }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState<string>('All');
    const [stabilityFilter, setStabilityFilter] = useState<string>('All');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [sitrep, setSitrep] = useState<CountrySitrep | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDeepMode, setIsDeepMode] = useState(false);
    const [viewMode, setViewMode] = useState<'Grid' | 'Analytics'>('Grid');
    const [analytics, setAnalytics] = useState<CountryAnalytics | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        if (viewMode === 'Analytics' && !analytics) {
            handleGenerateAnalytics();
        }
    }, [viewMode]);

    const handleGenerateAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const data = await generateCountryLedgerAnalytics(AFRICAN_COUNTRIES, incidents, peps, assets, isDeepMode);
            setAnalytics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const filteredCountries = useMemo(() => {
        return AFRICAN_COUNTRIES.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = regionFilter === 'All' || c.region === regionFilter;
            const matchesStability = stabilityFilter === 'All' || c.stabilityIndex === stabilityFilter;
            return matchesSearch && matchesRegion && matchesStability;
        });
    }, [searchTerm, regionFilter, stabilityFilter]);

    const handleCountryClick = async (country: Country) => {
        setSelectedCountry(country);
        setSitrep(null);
        setLoading(true);
        try {
            const result = await generateCountrySitrep(country.name, isDeepMode);
            setSitrep(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getStabilityColor = (index: string) => {
        switch (index) {
            case 'Stable': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'Fragile': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Conflict': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Failing': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getThreatLevelColor = (level: number) => {
        if (level >= 8) return 'text-red-500';
        if (level >= 5) return 'text-amber-500';
        return 'text-green-500';
    };

    return (
        <div className="h-full flex flex-col gap-8 animate-fade-in pb-10">
            {/* Asset Header */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Globe className="text-blue-500" size={36} />
                            Continental Asset Ledger
                        </h2>
                        <p className="text-slate-400 mt-2 text-lg">Nation-State intelligence tracking across all 54 African entities.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mr-2">
                             <button 
                                onClick={() => setViewMode('Grid')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'Grid' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                <Globe size={12} /> Entities
                             </button>
                             <button 
                                onClick={() => setViewMode('Analytics')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'Analytics' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                                <BarChart3 size={12} /> Analytics
                             </button>
                        </div>

                        {viewMode === 'Grid' && (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Locate entity..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:border-blue-500 outline-none w-64 transition-all"
                                    />
                                </div>
                                <select 
                                    value={regionFilter}
                                    onChange={e => setRegionFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 outline-none focus:border-blue-500"
                                >
                                    <option value="All">All Regions</option>
                                    <option value="North">North Africa</option>
                                    <option value="West">West Africa</option>
                                    <option value="East">East Africa</option>
                                    <option value="Central">Central Africa</option>
                                    <option value="South">Southern Africa</option>
                                </select>
                                <select 
                                    value={stabilityFilter}
                                    onChange={e => setStabilityFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 outline-none focus:border-blue-500"
                                >
                                    <option value="All">All Stability</option>
                                    <option value="Stable">Stable</option>
                                    <option value="Fragile">Fragile</option>
                                    <option value="Conflict">Active Conflict</option>
                                    <option value="Failing">Failing State</option>
                                </select>
                            </>
                        )}

                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button 
                                onClick={() => setIsDeepMode(false)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isDeepMode ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Tactical
                            </button>
                            <button 
                                onClick={() => setIsDeepMode(true)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isDeepMode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Zap size={10} /> Deep
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Switching */}
            {viewMode === 'Grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {filteredCountries.map(country => (
                        <button 
                            key={country.id}
                            onClick={() => handleCountryClick(country)}
                            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group text-left flex flex-col items-center"
                        >
                            <div className="relative mb-4">
                                <img src={country.flagUrl} alt={country.name} className="w-16 h-12 rounded object-cover shadow-lg border border-slate-700 group-hover:scale-105 transition-transform" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-950 rounded-full flex items-center justify-center border border-slate-700 text-[10px] font-bold text-slate-500">
                                    {country.isoCode}
                                </div>
                            </div>
                            <h4 className="text-white font-bold text-sm text-center mb-2 group-hover:text-blue-400 transition-colors">{country.name}</h4>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStabilityColor(country.stabilityIndex)}`}>
                                {country.stabilityIndex}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {loadingAnalytics ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-6 bg-slate-900 border border-slate-800 rounded-3xl">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-slate-800 border-t-red-500 rounded-full animate-spin"></div>
                                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 animate-pulse" size={40} />
                            </div>
                            <div className="text-center">
                                <h4 className="text-2xl font-bold text-white mb-2">Aggregating Global Intelligence...</h4>
                                <p className="text-slate-500 animate-pulse">Processing multi-domain stability metrics across 54 sovereign nodes</p>
                            </div>
                        </div>
                    ) : analytics ? (
                        <div className="space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <AnalyticsCard 
                                    title="Active Conflicts" 
                                    value={analytics.stabilityMetrics.conflict} 
                                    label="Entities"
                                    icon={Swords}
                                    color="red"
                                />
                                <AnalyticsCard 
                                    title="Stable Nodes" 
                                    value={analytics.stabilityMetrics.stable} 
                                    label="Entities"
                                    icon={Shield}
                                    color="green"
                                />
                                <AnalyticsCard 
                                    title="Fragile States" 
                                    value={analytics.stabilityMetrics.fragile} 
                                    label="Entities"
                                    icon={AlertTriangle}
                                    color="amber"
                                />
                                <AnalyticsCard 
                                    title="Failing Entities" 
                                    value={analytics.stabilityMetrics.failing} 
                                    label="Entities"
                                    icon={Activity}
                                    color="purple"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Risk Profile Chart */}
                                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                    <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp className="text-blue-500" size={20} /> Regional Risk Profile
                                    </h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics.regionalRiskProfile}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="region" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#3b82f6' }}
                                                />
                                                <Bar dataKey="avgThreatLevel" radius={[4, 4, 0, 0]}>
                                                    {analytics.regionalRiskProfile.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={
                                                            entry.volatility === 'Critical' ? '#ef4444' :
                                                            entry.volatility === 'High' ? '#f59e0b' :
                                                            '#3b82f6'
                                                        } />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        {analytics.regionalRiskProfile.map((region, i) => (
                                            <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                                <span className="text-slate-400 text-xs font-medium">{region.region}</span>
                                                <span className="text-white text-xs font-bold">{region.primaryForeignActor}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stability Pie Chart */}
                                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col">
                                    <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                                        <PieChart className="text-purple-500" size={20} /> Stability Composition
                                    </h4>
                                    <div className="flex-grow flex items-center justify-center">
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Stable', value: analytics.stabilityMetrics.stable, color: '#10b981' },
                                                            { name: 'Fragile', value: analytics.stabilityMetrics.fragile, color: '#f59e0b' },
                                                            { name: 'Conflict', value: analytics.stabilityMetrics.conflict, color: '#ef4444' },
                                                            { name: 'Failing', value: analytics.stabilityMetrics.failing, color: '#8b5cf6' },
                                                        ]}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {[
                                                            { color: '#10b981' },
                                                            { color: '#f59e0b' },
                                                            { color: '#ef4444' },
                                                            { color: '#8b5cf6' },
                                                        ].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                         <StabilityLegend color="bg-green-500" label="Stable" />
                                         <StabilityLegend color="bg-amber-500" label="Fragile" />
                                         <StabilityLegend color="bg-red-500" label="Conflict" />
                                         <StabilityLegend color="bg-purple-500" label="Failing" />
                                    </div>
                                </div>
                            </div>

                            {/* Strategic Synthesis */}
                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <BrainCircuit size={80} className="text-red-500/5 rotate-12" />
                                </div>
                                <h4 className="text-red-500 text-sm font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <Zap size={16} /> Global Strategic Synthesis
                                </h4>
                                <p className="text-white text-xl md:text-2xl font-serif italic leading-relaxed relative z-10">
                                    "{analytics.globalStrategicSynthesis}"
                                </p>
                                <div className="mt-8 flex items-center gap-4 border-t border-slate-800 pt-6">
                                    <div className="bg-red-600/10 p-2 rounded-lg">
                                        <Shield className="text-red-500" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm uppercase tracking-widest leading-none">U-ISMS // HIGH-COMMAND VERDICT</p>
                                        <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase">Node Analysis Complete // Signals Convergent</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center gap-6 bg-slate-900 border border-slate-800 rounded-3xl">
                            <AlertTriangle className="text-slate-700" size={64} />
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-slate-400">Intelligence Feed Unavailable</h4>
                                <p className="text-slate-600 mt-2">Failed to generate global analytics from the current dataset.</p>
                            </div>
                            <button 
                                onClick={handleGenerateAnalytics}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"
                            >
                                Re-initiate Analytics Sync
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Deep SITREP Modal */}
            {selectedCountry && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative overflow-hidden">
                        {/* High-Command Header */}
                        <div className="bg-slate-950/50 p-8 border-b border-slate-800 flex justify-between items-center relative">
                            <div className="flex items-center gap-6">
                                <img src={selectedCountry.flagUrl} alt={selectedCountry.name} className="w-24 h-16 rounded shadow-2xl border border-slate-700" />
                                <div>
                                    <h3 className="text-4xl font-bold text-white font-playfair tracking-tight">{selectedCountry.name}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-blue-400 text-sm font-mono tracking-widest uppercase">{selectedCountry.region} Asset // CLASSIFIED</span>
                                        <div className="h-4 w-px bg-slate-700"></div>
                                        <div className={`flex items-center gap-2 text-xs font-bold uppercase ${getStabilityColor(selectedCountry.stabilityIndex)}`}>
                                            <Shield size={14} /> {selectedCountry.stabilityIndex} INDEX
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCountry(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* SITREP Content */}
                        <div className="flex-grow p-10 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                                        <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" size={32} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold text-white mb-2">Mugi-Solo Grounding Protocol Active...</h4>
                                        <p className="text-slate-500 animate-pulse">Syncing nation-state military posture & financial concession loops</p>
                                    </div>
                                </div>
                            ) : sitrep ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
                                    {/* Intelligence Columns */}
                                    <div className="lg:col-span-2 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                <h4 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Landmark className="text-blue-400" size={16} /> Political Stability
                                                </h4>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base italic">"{sitrep.politicalStability}"</p>
                                            </div>
                                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                <h4 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Swords className="text-red-400" size={16} /> Military Posture
                                                </h4>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base italic">"{sitrep.militaryPosture}"</p>
                                            </div>
                                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                <h4 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Zap className="text-green-400" size={16} /> Financial Integrity
                                                </h4>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base italic">"{sitrep.financialIntegrity}"</p>
                                            </div>
                                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
                                                <h4 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Users className="text-purple-400" size={16} /> Tribal & Power Dynamics
                                                </h4>
                                                <p className="text-slate-300 leading-relaxed text-sm md:text-base italic">"{sitrep.tribalDynamics}"</p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-900/10 p-8 rounded-3xl border border-blue-500/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4">
                                                <BrainCircuit size={48} className="text-blue-500/10" />
                                            </div>
                                            <h4 className="text-blue-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">Strategist Verdict (Council of Mugi-Solo)</h4>
                                            <p className="text-white text-xl leading-relaxed font-serif italic relative z-10">
                                                "{sitrep.strategicVerdict}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* External Influences Sidebar */}
                                    <div className="space-y-8">
                                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                            <div className="flex justify-between items-end mb-4">
                                                <h4 className="text-slate-400 text-xs font-bold uppercase">Asset Threat Level</h4>
                                                <span className={`text-4xl font-bold ${getThreatLevelColor(sitrep.threatLevel)}`}>{sitrep.threatLevel}<span className="text-slate-600 text-lg">/10</span></span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full bg-current transition-all duration-1000 ${getThreatLevelColor(sitrep.threatLevel)}`} style={{ width: `${sitrep.threatLevel * 10}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/30 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
                                                <Activity size={18} className="text-orange-500" />
                                                <h4 className="text-white text-xs font-bold uppercase tracking-widest">Foreign Actor Tracking</h4>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                {Array.isArray(sitrep.foreignInfluence) && sitrep.foreignInfluence.map((influence, i) => (
                                                    <div key={i} className="pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-slate-200 font-bold text-sm">{influence.actor}</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                influence.level === 'High' ? 'text-red-400 bg-red-500/10' :
                                                                influence.level === 'Medium' ? 'text-amber-400 bg-amber-500/10' :
                                                                'text-blue-400 bg-blue-500/10'
                                                            }`}>
                                                                {influence.level} Impact
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 text-xs leading-relaxed">{influence.footprint}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 p-4 rounded-xl border border-slate-700 flex items-center justify-center gap-3 transition-all text-sm font-bold uppercase tracking-widest">
                                            Download Operational Dossier <ExternalLink size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <AlertTriangle size={64} className="text-slate-700 mx-auto mb-6" />
                                    <h4 className="text-xl font-bold text-slate-400">Sync Interrupted</h4>
                                    <p className="text-slate-600 mt-2">Failed to extract ground truth for this entity.</p>
                                    <button 
                                        onClick={() => handleCountryClick(selectedCountry)}
                                        className="mt-6 text-blue-500 hover:underline flex items-center gap-2 mx-auto"
                                    >
                                        Retry Grounding Sequence <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Status Bar */}
                        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center px-10">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED FEED ACTIVE</span>
                                </div>
                                <div className="h-3 w-px bg-slate-800"></div>
                                <span className="text-[10px] text-slate-600 font-mono">GROUND TRUTH PROTOCOL V4.2</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">U-ISMS INTERNATIONAL // CONTINENTAL OVERSIGHT</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AnalyticsCard = ({ title, value, label, icon: Icon, color }: any) => {
    const colorClasses: any = {
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl border ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-white mt-1">{value}</p>
                </div>
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-tighter">{label} Registered</p>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} />
            </div>
        </div>
    );
};

const StabilityLegend = ({ color, label }: any) => (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{label}</span>
    </div>
);
