
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType = 'neutral', icon: Icon, color = "blue" }) => {
  const getColorClass = () => {
    switch (color) {
      case 'red': return 'text-red-500 bg-red-500/10';
      case 'green': return 'text-green-500 bg-green-500/10';
      case 'orange': return 'text-orange-500 bg-orange-500/10';
      case 'purple': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-400';
    if (changeType === 'negative') return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-base font-medium mb-2">{title}</p>
          <h3 className="text-4xl font-bold text-white">{value}</h3>
        </div>
        <div className={`p-4 rounded-lg ${getColorClass()}`}>
          <Icon size={28} />
        </div>
      </div>
      {change && (
        <div className="flex items-center text-sm">
          <span className={`font-medium ${getChangeColor()} mr-2`}>
            {change}
          </span>
          <span className="text-slate-500">vs last 30 days</span>
        </div>
      )}
    </div>
  );
};
