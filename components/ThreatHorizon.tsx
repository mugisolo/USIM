import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { AlertOctagon, ShieldAlert, Layers } from 'lucide-react';
import { Incident } from '../types';

interface ThreatHorizonProps {
  incidents: Incident[];
}

const CONFIDENCE_TIERS = [
  { tier: 'TIER 5', label: 'FORENSIC', desc: 'Multi-source cryptographic & SIGINT verification', active: true },
  { tier: 'TIER 4', label: 'HIGHLY PROBABLE', desc: 'Corroborated across two independent field nodes', active: true },
  { tier: 'TIER 3', label: 'PROBABLE', desc: 'Single reliable telemetry node + historical baseline', active: true },
  { tier: 'TIER 2', label: 'PLAUSIBLE', desc: 'Unverified OSINT intercept matching regional pattern', active: false },
  { tier: 'TIER 1', label: 'SPECULATIVE', desc: 'Preliminary chatter awaiting ground confirmation', active: false },
];

export const ThreatHorizon: React.FC<ThreatHorizonProps> = ({ incidents }) => {
  // Anchor date (T+0)
  const anchorDateStr = '2026-07-01';

  const forecastData = useMemo(() => {
    const anchorDate = new Date(anchorDateStr);
    const dateList: string[] = [];

    // 1. Generate historical date strings (14 days prior to anchor)
    for (let i = 14; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - i);
      dateList.push(d.toISOString().split('T')[0]);
    }

    // 2. Generate future forecast date strings (5 days ahead)
    const forecastDays = 5;
    const futureDateList: string[] = [];
    for (let i = 1; i <= forecastDays; i++) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() + i);
      futureDateList.push(d.toISOString().split('T')[0]);
    }

    // 3. Group actual incidents by date and calculate Raw Risk Index
    const riskByDate: { [key: string]: number } = {};
    incidents.forEach(incident => {
      if (!incident.date) return;
      const dStr = incident.date.split('T')[0];
      
      let severityWeight = 1.5;
      if (incident.severity === 'CRITICAL') severityWeight = 10;
      else if (incident.severity === 'HIGH') severityWeight = 6;
      else if (incident.severity === 'MEDIUM') severityWeight = 3;
      else if (incident.severity === 'LOW') severityWeight = 1;

      const incidentScore = severityWeight + (incident.fatalities * 2.5) + (incident.injuries * 1.0);
      riskByDate[dStr] = (riskByDate[dStr] || 0) + incidentScore;
    });

    // 4. Fill in historical risk indexes (with base/ambient risk if no incidents)
    const historicalPoints = dateList.map(dStr => {
      const rawRisk = riskByDate[dStr] !== undefined ? riskByDate[dStr] : 1.2;
      return {
        date: dStr,
        displayDate: dStr.split('-').slice(1).join('/'),
        rawRisk: parseFloat(rawRisk.toFixed(1)),
        isForecast: false,
        movingAverage: 0,
        upperBound: null as number | null,
        lowerBound: null as number | null,
      };
    });

    // 5. Calculate historical moving average (3-day SMA)
    historicalPoints.forEach((pt, idx) => {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < 3; i++) {
        if (idx - i >= 0) {
          sum += historicalPoints[idx - i].rawRisk;
          count++;
        }
      }
      pt.movingAverage = parseFloat((sum / count).toFixed(1));
    });

    // 6. Project future risk using autoregressive moving average logic
    const rollingRisks = [...historicalPoints.map(p => p.rawRisk)];
    const rollingMAs = [...historicalPoints.map(p => p.movingAverage)];

    const futurePoints = futureDateList.map((dStr, idx) => {
      const last3 = rollingRisks.slice(-3);
      const predictedRisk = last3.reduce((a, b) => a + b, 0) / Math.min(3, last3.length);
      
      const finalMAChange = rollingMAs[rollingMAs.length - 1] - rollingMAs[rollingMAs.length - 2];
      const trendMultiplier = 1 + (finalMAChange * 0.04 * (idx + 1));
      const rawPredicted = Math.max(1.0, predictedRisk * trendMultiplier);
      
      rollingRisks.push(rawPredicted);

      const nextLast3 = rollingRisks.slice(-3);
      const nextMA = nextLast3.reduce((a, b) => a + b, 0) / Math.min(3, nextLast3.length);
      rollingMAs.push(nextMA);

      const uncertaintyOffset = (idx + 1) * 1.8;
      const upperBound = Math.max(rawPredicted, rawPredicted + uncertaintyOffset);
      const lowerBound = Math.max(0.5, rawPredicted - uncertaintyOffset);

      return {
        date: dStr,
        displayDate: `${dStr.split('-').slice(1).join('/')} [F]`,
        rawRisk: parseFloat(rawPredicted.toFixed(1)),
        isForecast: true,
        movingAverage: parseFloat(nextMA.toFixed(1)),
        upperBound: parseFloat(upperBound.toFixed(1)),
        lowerBound: parseFloat(lowerBound.toFixed(1)),
      };
    });

    return [...historicalPoints, ...futurePoints];
  }, [incidents]);

  // Determine current forecast alert level based on projected risk trend
  const trendMetrics = useMemo(() => {
    const historical = forecastData.filter(d => !d.isForecast);
    const forecasted = forecastData.filter(d => d.isForecast);
    
    if (historical.length === 0 || forecasted.length === 0) {
      return { change: 0, status: 'STABLE', color: 'text-success border-success/30 bg-success/10' };
    }

    const currentMA = historical[historical.length - 1].movingAverage;
    const finalProjectedMA = forecasted[forecasted.length - 1].movingAverage;
    const changePct = ((finalProjectedMA - currentMA) / (currentMA || 1)) * 100;

    let status = 'STABLE';
    let color = 'text-success border-success/30 bg-success/10';
    if (changePct > 10) {
      status = 'AMPLIFYING RISK SECTOR';
      color = 'text-danger border-danger/30 bg-danger/10';
    } else if (changePct < -10) {
      status = 'DE-ESCALATING TRACK';
      color = 'text-success border-success/30 bg-success/10';
    } else if (changePct > 0) {
      status = 'MODERATE FRICTION';
      color = 'text-warning border-warning/30 bg-warning/10';
    }

    return {
      change: changePct,
      status,
      color
    };
  }, [forecastData]);

  const CustomHorizonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-bg-elevated border border-border-subtle p-3 rounded-xl text-xs font-mono shadow-xl space-y-1.5">
          <p className="text-accent font-semibold uppercase tracking-wider">
            {label} {dataPoint.isForecast ? '• FORECASTED' : '• ACTUAL'}
          </p>
          <div className="space-y-1 divide-y divide-border-subtle">
            <p className="text-text-primary flex justify-between gap-6 py-0.5 tabular-nums">
              <span className="text-text-secondary">Risk Metric Index:</span>
              <span className="font-semibold">{dataPoint.rawRisk} pts</span>
            </p>
            <p className="text-danger flex justify-between gap-6 py-0.5 tabular-nums">
              <span className="text-text-secondary">3-Day Moving Average:</span>
              <span className="font-semibold">{dataPoint.movingAverage} pts</span>
            </p>
            {dataPoint.isForecast && (
              <>
                <p className="text-warning flex justify-between gap-6 py-0.5 tabular-nums">
                  <span className="text-text-secondary">Dispersion Ceiling:</span>
                  <span className="font-semibold">{dataPoint.upperBound} pts</span>
                </p>
                <p className="text-success flex justify-between gap-6 py-0.5 tabular-nums">
                  <span className="text-text-secondary">Dispersion Floor:</span>
                  <span className="font-semibold">{dataPoint.lowerBound} pts</span>
                </p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Probability Curve Card */}
      <div className="lg:col-span-2 bg-bg-surface p-6 rounded-2xl border border-border-subtle space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-text-primary flex items-center gap-2">
              <ShieldAlert size={16} className="text-accent" />
              <span>Threat Horizon & Risk Forecast</span>
            </h3>
            <p className="text-xs font-mono text-text-secondary uppercase tracking-wider mt-0.5">
              Predictive Moving Average Matrix • T+5 Horizon
            </p>
          </div>
          <span className={`text-xs font-mono font-medium uppercase px-2.5 py-1 rounded-md border tabular-nums ${trendMetrics.color}`}>
            {trendMetrics.status} ({trendMetrics.change >= 0 ? '+' : ''}{trendMetrics.change.toFixed(1)}%)
          </span>
        </div>

        {/* Recharts Forecast Plot — Clean Lines, Thin Grid, No Heavy Gradients */}
        <div className="h-[240px] w-full font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="var(--text-secondary)" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val}
              />
              <YAxis 
                stroke="var(--text-secondary)" 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CustomHorizonTooltip />} />
              <Legend verticalAlign="top" height={32} iconType="plainline" />
              
              {/* Subtle Uncertainty Bound */}
              <Area
                name="Uncertainty Bound"
                type="monotone"
                dataKey="upperBound"
                stroke="var(--danger)"
                strokeWidth={1}
                strokeDasharray="2 2"
                fill="var(--danger)"
                fillOpacity={0.06}
                connectNulls
              />
              
              <Area
                name="Uncertainty Range"
                type="monotone"
                dataKey="lowerBound"
                stroke="transparent"
                fill="transparent"
                connectNulls
              />

              {/* Historical Risk actual curve (--accent yellow) */}
              <Line
                name="Risk Index"
                type="monotone"
                dataKey="rawRisk"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ stroke: 'var(--accent)', strokeWidth: 1.5, r: 2 }}
              />

              {/* 3-day simple moving average trendline (--danger red) */}
              <Line
                name="3-Day SMA"
                type="monotone"
                dataKey="movingAverage"
                stroke="var(--danger)"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                dot={false}
              />

              {/* Vertical Threshold line */}
              <ReferenceLine 
                x={forecastData.find(d => d.date === anchorDateStr)?.displayDate} 
                stroke="var(--border)" 
                strokeDasharray="3 3"
                label={{ 
                  value: 'T+0 HORIZON', 
                  position: 'top', 
                  fill: 'var(--text-secondary)', 
                  fontSize: 9
                }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Analytical description panel */}
        <div className="p-4 bg-bg-elevated/50 rounded-xl border border-border-subtle flex gap-3 items-start report-justified">
          <AlertOctagon size={16} className="text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-text-primary">Tactical Predictive Analysis</h4>
            <p className="text-xs leading-relaxed text-text-secondary text-justify">
              Using a multi-node rolling Simple Moving Average (SMA-3) extrapolation algorithm, the model identifies a {trendMetrics.change >= 0 ? 'heightened' : 'decelerating'} stability trajectory in the upcoming 120-hour cycle. Actionable response protocols suggest aligning surveillance assets to key boundary domains.
            </p>
          </div>
        </div>
      </div>

      {/* Intel Confidence TIER 1–5 Vertical Stepper Ladder */}
      <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={16} className="text-accent" />
            <h3 className="font-display text-base font-semibold text-text-primary">Intel Confidence Ladder</h3>
          </div>
          <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">
            Verification Standard [TIER 1–5]
          </p>
        </div>

        <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border-subtle">
          {CONFIDENCE_TIERS.map((item) => (
            <div key={item.tier} className="relative flex items-start gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 -ml-[13px] ${
                  item.active
                    ? 'bg-accent border-accent'
                    : 'bg-bg-surface border-border-subtle'
                }`}
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    [{item.tier} — {item.label}]
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
          <span>ACTIVE THRESHOLD</span>
          <span className="text-accent font-medium">≥ TIER 3</span>
        </div>
      </div>
    </div>
  );
};
