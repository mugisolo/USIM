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
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import { Incident } from '../types';

interface ThreatHorizonProps {
  incidents: Incident[];
}

export const ThreatHorizon: React.FC<ThreatHorizonProps> = ({ incidents }) => {
  // We use the local time from additional metadata: 2026-07-01 as the current anchor date (T+0)
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
      const rawRisk = riskByDate[dStr] !== undefined ? riskByDate[dStr] : 1.2; // Ambient friction is 1.2
      return {
        date: dStr,
        displayDate: dStr.split('-').slice(1).join('/'), // MM/DD
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
      // Look back up to 3 days (inclusive of current)
      for (let i = 0; i < 3; i++) {
        if (idx - i >= 0) {
          sum += historicalPoints[idx - i].rawRisk;
          count++;
        }
      }
      pt.movingAverage = parseFloat((sum / count).toFixed(1));
    });

    // 6. Project future risk using autoregressive moving average logic
    // We maintain a sliding window of the last 3 days to predict the next
    const rollingRisks = [...historicalPoints.map(p => p.rawRisk)];
    const rollingMAs = [...historicalPoints.map(p => p.movingAverage)];

    const futurePoints = futureDateList.map((dStr, idx) => {
      // Predict raw risk as moving average of the last 3 elements in rollingRisks
      const last3 = rollingRisks.slice(-3);
      const predictedRisk = last3.reduce((a, b) => a + b, 0) / Math.min(3, last3.length);
      
      // Inject slight trend decay/amplification based on the final historical direction
      const finalMAChange = rollingMAs[rollingMAs.length - 1] - rollingMAs[rollingMAs.length - 2];
      const trendMultiplier = 1 + (finalMAChange * 0.04 * (idx + 1));
      const rawPredicted = Math.max(1.0, predictedRisk * trendMultiplier);
      
      rollingRisks.push(rawPredicted);

      // Compute moving average for the forecasted point
      const nextLast3 = rollingRisks.slice(-3);
      const nextMA = nextLast3.reduce((a, b) => a + b, 0) / Math.min(3, nextLast3.length);
      rollingMAs.push(nextMA);

      // Add forecast dispersion bounds (confidence interval expands as we project further out)
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
      return { change: 0, status: 'STABLE', color: 'text-savanna-sage' };
    }

    const currentMA = historical[historical.length - 1].movingAverage;
    const finalProjectedMA = forecasted[forecasted.length - 1].movingAverage;
    const changePct = ((finalProjectedMA - currentMA) / (currentMA || 1)) * 100;

    let status = 'STABLE';
    let color = 'text-savanna-sage';
    if (changePct > 10) {
      status = 'AMPLIFYING RISK SECTOR';
      color = 'text-brotherhood-crimson';
    } else if (changePct < -10) {
      status = 'DE-ESCALATING TRACK';
      color = 'text-stable-sage';
    } else if (changePct > 0) {
      status = 'MODERATE FRICTION';
      color = 'text-nile-amber';
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
        <div className="bg-kampala-obsidian border border-white/10 p-3 rounded text-[10px] font-mono shadow-2xl space-y-1.5">
          <p className="text-crested-gold font-bold uppercase tracking-wider">
            {label} {dataPoint.isForecast ? '• FORECASTED' : '• ACTUAL'}
          </p>
          <div className="space-y-0.5 divide-y divide-white/5">
            <p className="text-pearl-africa flex justify-between gap-6 py-0.5">
              <span>Risk Metric Index:</span>
              <span className="font-bold">{dataPoint.rawRisk} pts</span>
            </p>
            <p className="text-nile-amber flex justify-between gap-6 py-0.5">
              <span>3-Day Moving Average:</span>
              <span className="font-bold">{dataPoint.movingAverage} pts</span>
            </p>
            {dataPoint.isForecast && (
              <>
                <p className="text-brotherhood-crimson flex justify-between gap-6 py-0.5">
                  <span>Dispersion Ceiling:</span>
                  <span className="font-bold">{dataPoint.upperBound} pts</span>
                </p>
                <p className="text-stable-sage flex justify-between gap-6 py-0.5">
                  <span>Dispersion Floor:</span>
                  <span className="font-bold">{dataPoint.lowerBound} pts</span>
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
    <div className="stacked-precision-card p-5 bg-gradient-to-br from-lake-victoria to-kampala-obsidian border border-white/5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-crested-gold" />
            Threat Horizon & Risk Forecast
          </h3>
          <p className="text-[9px] font-mono text-crane-grey uppercase tracking-widest mt-1">
            Predictive Moving Average Matrix • T+5 Horizon
          </p>
        </div>
        <div className="text-right">
          <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border border-white/5 ${trendMetrics.color} bg-black/40`}>
            {trendMetrics.status} ({trendMetrics.change >= 0 ? '+' : ''}{trendMetrics.change.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Recharts Forecast Plot */}
      <div className="h-[220px] w-full font-mono text-[9px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              {/* Confidence interval area fill */}
              <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#C41E3A" stopOpacity={0.02} />
              </linearGradient>
              {/* Risk actual index gradient */}
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis 
              dataKey="displayDate" 
              stroke="#7A8699" 
              tickLine={false} 
              tickFormatter={(val) => val}
            />
            <YAxis 
              stroke="#7A8699" 
              tickLine={false} 
              label={{ 
                value: 'RISK INDEX', 
                angle: -90, 
                position: 'insideLeft', 
                offset: 10, 
                fill: '#7A8699', 
                fontSize: 8, 
                fontWeight: 'bold' 
              }} 
            />
            <Tooltip content={<CustomHorizonTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="plainline" />
            
            {/* Shaded Confidence Bounds for forecasted region */}
            <Area
              name="Uncertainty Bound"
              type="monotone"
              dataKey="upperBound"
              stroke="transparent"
              fill="url(#uncertaintyGrad)"
              connectNulls
            />
            
            {/* Hidden field for area lower bound to correctly bound the range */}
            <Area
              name="Uncertainty Range"
              type="monotone"
              dataKey="lowerBound"
              stroke="transparent"
              fill="transparent"
              connectNulls
            />

            {/* Historical Risk actual curve */}
            <Area
              name="Risk Index"
              type="monotone"
              dataKey="rawRisk"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#riskGrad)"
              dot={{ stroke: '#D4AF37', strokeWidth: 1, r: 1 }}
            />

            {/* 3-day simple moving average trendline */}
            <Line
              name="3-Day SMA"
              type="monotone"
              dataKey="movingAverage"
              stroke="#C41E3A"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />

            {/* Vertical Threshold line to separate historical and future forecasted timeline */}
            <ReferenceLine 
              x={forecastData.find(d => d.date === anchorDateStr)?.displayDate} 
              stroke="#ffffff33" 
              strokeDasharray="3 3"
              label={{ 
                value: 'FORECAST HORIZON', 
                position: 'top', 
                fill: '#7A8699', 
                fontSize: 7, 
                fontWeight: 'bold', 
                letterSpacing: '0.1em' 
              }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical description panel */}
      <div className="p-3 bg-black/30 rounded border border-white/5 flex gap-3 items-start">
        <AlertOctagon size={16} className="text-crested-gold flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold text-pearl-africa uppercase">Tactical Predictive Analysis</h4>
          <p className="text-[9px] font-mono leading-relaxed text-crane-grey">
            Using a multi-node rolling Simple Moving Average (SMA-3) extrapolation algorithm, the model identifies a {trendMetrics.change >= 0 ? 'heightened' : 'decelerating'} stability trajectory in the upcoming 120-hour cycle. Actionable response protocols suggest aligning surveillance assets to key boundary domains.
          </p>
        </div>
      </div>
    </div>
  );
};
