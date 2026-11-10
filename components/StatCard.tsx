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
      case 'red': return 'text-danger bg-danger/10 border-danger/30';
      case 'green': return 'text-success bg-success/10 border-success/30';
      case 'orange': return 'text-warning bg-warning/10 border-warning/30';
      case 'purple': return 'text-accent bg-accent/10 border-accent/30';
      default: return 'text-info bg-info/10 border-info/30';
    }
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-danger';
    return 'text-text-secondary';
  };

  return (
    <div className="bg-bg-surface rounded-2xl p-6 border border-border-subtle">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-1">{title}</p>
          <h3 className="font-display text-3xl font-bold text-text-primary tabular-nums">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${getColorClass()}`}>
          <Icon size={20} />
        </div>
      </div>
      {change && (
        <div className="flex items-center text-xs font-mono">
          <span className={`font-semibold ${getChangeColor()} mr-2 tabular-nums`}>
            {change}
          </span>
          <span className="text-text-secondary">vs last 30 days</span>
        </div>
      )}
    </div>
  );
};
