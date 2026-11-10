import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Check,
  X,
  Sparkles,
  CreditCard,
  Clock,
  Scale,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  SubscriptionPlanId,
  CalibrationMode,
  SubscriptionState,
  SUBSCRIPTION_TIERS,
  getInitialSubscriptionState,
  setSubscriptionPlan,
  subscribeToSubscriptionChanges,
  getSubscriptionStatusMeta
} from '../services/subscriptionService';
import { logOperationalAction } from './OperationalAuditPanel';

export type { SubscriptionPlanId, CalibrationMode, SubscriptionState };
export { getInitialSubscriptionState, getSubscriptionStatusMeta, SUBSCRIPTION_TIERS };

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  subscription: SubscriptionState;
  onSelectPlan?: (next: SubscriptionState) => void;
  onUpdateSubscription?: (next: SubscriptionState) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSelectPlan,
  onUpdateSubscription,
}) => {
  const [calibrationMode, setCalibrationMode] = useState<CalibrationMode>(
    subscription.calibrationMode || 'STANDARD_SCHEDULE'
  );
  const [currencyView, setCurrencyView] = useState<'DUAL' | 'USD' | 'UGX'>('DUAL');
  const [isUpdating, setIsUpdating] = useState<SubscriptionPlanId | null>(null);
  const [confirmationBanner, setConfirmationBanner] = useState<string | null>(null);

  const notifyParent = (next: SubscriptionState) => {
    onSelectPlan?.(next);
    onUpdateSubscription?.(next);
  };

  useEffect(() => {
    const unsub = subscribeToSubscriptionChanges((synced) => {
      notifyParent(synced);
    });
    return () => unsub();
  }, []);

  const meta = getSubscriptionStatusMeta(subscription);

  const handleActivatePlan = async (planId: SubscriptionPlanId) => {
    setIsUpdating(planId);
    const nextState = await setSubscriptionPlan(planId, calibrationMode);
    notifyParent(nextState);

    logOperationalAction(
      `Subscription tier updated to ${planId} (${nextState.priceDisplay} · First Week Free active)`,
      'SYSTEM'
    );

    setIsUpdating(null);
    setConfirmationBanner(
      planId === 'FREE_TRIAL'
        ? 'First Week Free (7-Day Command Trial) activated — $0 / 0 UGX billed today.'
        : `${nextState.planName} (${nextState.priceDisplay}) activated with First Week Free applied.`
    );
    setTimeout(() => setConfirmationBanner(null), 5000);
  };

  const formatUgx = (amount: number) => {
    if (amount >= 1000000) {
      const m = amount / 1000000;
      return `${Number.isInteger(m) ? m : m.toFixed(2)}m UGX (${amount.toLocaleString()} UGX)`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k UGX (${amount.toLocaleString()} UGX)`;
    }
    return `${amount.toLocaleString()} UGX`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-5xl bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-elevated/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-text-primary">
                      U-ISMS Command Subscription Tiers
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-accent text-accent-ink">
                      FIRST WEEK FREE
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary font-mono mt-0.5">
                    Daily: $20 / 100k UGX · Weekly: $150 / 700k UGX · Monthly: $500 / 2m UGX
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-xl transition-colors"
                title="Close subscription modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Prominent First Week Free Callout Card */}
              <div className="p-5 rounded-2xl bg-bg-elevated border border-accent/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-accent text-accent-ink flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={19} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-text-primary">
                        First Week Free — 7-Day Complimentary Command Evaluation
                      </span>
                      <span className="text-[11px] font-mono text-success bg-success/10 border border-success/30 px-2.5 py-0.5 rounded-full">
                        {meta.trialDaysLeft} days remaining in free window
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed report-justified text-justify">
                      All U-ISMS command accounts receive the first 7 days completely free ($0 USD / 0 UGX) with unrestricted access to Intel Chat, Synthesis Mind briefings, Actor Matrix forensics, and Threat Horizon telemetry. Choose any tier below to lock in your post-trial clearance.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleActivatePlan('FREE_TRIAL')}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-mono transition-colors ${
                      subscription.planId === 'FREE_TRIAL'
                        ? 'bg-success/15 border-success/40 text-success font-semibold'
                        : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {subscription.planId === 'FREE_TRIAL' ? 'Free Week Active' : 'Switch to Free Week'}
                  </button>
                </div>
              </div>

              {confirmationBanner && (
                <div className="p-3.5 rounded-xl bg-success/15 border border-success/30 text-xs font-mono text-success flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={15} />
                    <span>{confirmationBanner}</span>
                  </span>
                  <button onClick={() => setConfirmationBanner(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Calibration & Currency Controls */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-bg-base p-3.5 rounded-xl border border-border-subtle">
                <div className="flex flex-wrap items-center gap-2">
                  <Scale size={15} className="text-accent shrink-0" />
                  <span className="text-xs font-mono text-text-secondary uppercase">
                    USD / UGX Calibration:
                  </span>
                  <div className="flex flex-wrap gap-1 bg-bg-surface p-1 rounded-lg border border-border-subtle">
                    <button
                      onClick={() => setCalibrationMode('STANDARD_SCHEDULE')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        calibrationMode === 'STANDARD_SCHEDULE'
                          ? 'bg-accent text-accent-ink font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Standard ($20/100k · $150/700k · $500/2m)
                    </button>
                    <button
                      onClick={() => setCalibrationMode('CALIBRATED_PARITY')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        calibrationMode === 'CALIBRATED_PARITY'
                          ? 'bg-accent text-accent-ink font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Aligned Parity (1 USD = 4,000 UGX)
                    </button>
                    <button
                      onClick={() => setCalibrationMode('BOU_SPOT')}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        calibrationMode === 'BOU_SPOT'
                          ? 'bg-accent text-accent-ink font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      BoU Spot (1 USD = 3,800 UGX)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end lg:self-auto">
                  <span className="text-xs font-mono text-text-secondary mr-1">Display:</span>
                  {(['DUAL', 'USD', 'UGX'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setCurrencyView(curr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                        currencyView === curr
                          ? 'bg-bg-elevated text-accent border-accent/50 font-semibold'
                          : 'bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Three Subscription Tier Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {SUBSCRIPTION_TIERS.map((tier) => {
                  const active = subscription.planId === tier.id;
                  const c = tier.calibrated[calibrationMode];
                  return (
                    <div
                      key={tier.id}
                      className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                        tier.recommended
                          ? 'bg-bg-elevated/90 border-accent'
                          : 'bg-bg-base border-border-subtle'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                              tier.recommended
                                ? 'bg-accent text-accent-ink border-accent font-semibold'
                                : 'bg-bg-surface text-text-secondary border-border-subtle'
                            }`}
                          >
                            {tier.badge}
                          </span>
                          {active && (
                            <span className="text-[11px] font-mono text-success flex items-center gap-1">
                              <Check size={13} /> Active
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-display text-lg font-bold text-text-primary">
                            {tier.name}
                          </h3>
                          <p className="text-xs font-mono text-text-secondary">{tier.cadence}</p>
                        </div>

                        {/* Price Box */}
                        <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2">
                          {(currencyView === 'DUAL' || currencyView === 'USD') && (
                            <div className="flex items-baseline justify-between">
                              <span className="font-display text-3xl font-bold text-text-primary tabular-nums">
                                ${c.usd.toLocaleString()}{' '}
                                <span className="text-xs font-mono font-normal text-text-secondary">
                                  USD
                                </span>
                              </span>
                              <span className="text-xs font-mono text-success">
                                1st Week Free
                              </span>
                            </div>
                          )}

                          {(currencyView === 'DUAL' || currencyView === 'UGX') && (
                            <div className="flex items-baseline justify-between">
                              <span className="font-mono text-sm font-semibold text-accent tabular-nums">
                                {formatUgx(c.ugx)}
                              </span>
                              <span className="text-[11px] font-mono text-text-secondary tabular-nums">
                                Tier: {tier.statedDisplay}
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-secondary tabular-nums">
                            <span>Daily Equivalent:</span>
                            <span className="text-text-primary">
                              ${c.effectiveDailyUsd.toFixed(2)} · {Math.round(c.effectiveDailyUgx / 1000)}k UGX/day
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-success pt-0.5">
                            {c.savingsLabel}
                          </p>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-2.5 pt-1">
                          {tier.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-text-primary">
                              <Check size={14} className="text-accent shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6 mt-6 border-t border-border-subtle">
                        <button
                          onClick={() => handleActivatePlan(tier.id)}
                          disabled={isUpdating === tier.id}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-opacity ${
                            active
                              ? 'bg-success text-accent-ink'
                              : tier.recommended
                              ? 'bg-accent text-accent-ink hover:opacity-90'
                              : 'bg-bg-elevated hover:bg-accent hover:text-accent-ink text-text-primary border border-border-subtle'
                          }`}
                        >
                          <span>
                            {active
                              ? `Active Plan (${tier.statedDisplay})`
                              : `Select ${tier.shortLabel}`}
                          </span>
                          {!active && <ArrowRight size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calibration Alignment Breakdown Table */}
              <div className="bg-bg-base border border-border-subtle rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" />
                    <h4 className="font-display text-xs font-semibold text-text-primary uppercase tracking-wider">
                      USD / UGX Figure Calibration & Alignment Matrix
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-text-secondary">
                    First Week Free Applied Across All Tiers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-bg-surface text-text-secondary border-b border-border-subtle text-[11px]">
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">First Week</th>
                        <th className="py-3 px-4">Standard Schedule</th>
                        <th className="py-3 px-4">Calibrated Parity (4,000 UGX/USD)</th>
                        <th className="py-3 px-4 text-right">Effective Daily Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle tabular-nums">
                      <tr>
                        <td className="py-3 px-4 font-semibold text-success">First Week Free</td>
                        <td className="py-3 px-4 text-success font-semibold">Days 1–7 Free</td>
                        <td className="py-3 px-4 text-success font-semibold">$0 / 0 UGX</td>
                        <td className="py-3 px-4 text-success font-semibold">$0 / 0 UGX</td>
                        <td className="py-3 px-4 text-right text-success">$0.00 / day</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-text-primary">Daily Pass</td>
                        <td className="py-3 px-4 text-success">Included</td>
                        <td className="py-3 px-4 text-text-primary">$20 / 100k UGX</td>
                        <td className="py-3 px-4 text-accent">$20 (80k UGX) · $25 (100k UGX)</td>
                        <td className="py-3 px-4 text-right text-text-primary">$20.00 / 100k UGX</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-text-primary">Weekly Command</td>
                        <td className="py-3 px-4 text-success">Included ($0 Wk 1)</td>
                        <td className="py-3 px-4 text-text-primary">$150 / 700k UGX</td>
                        <td className="py-3 px-4 text-accent">$140 (560k UGX) · $150 (600k UGX)</td>
                        <td className="py-3 px-4 text-right text-text-primary">$21.43 / 100k UGX</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-accent">Monthly Sovereign</td>
                        <td className="py-3 px-4 text-success">Included (+7d Free)</td>
                        <td className="py-3 px-4 text-accent font-semibold">$500 / 2m UGX</td>
                        <td className="py-3 px-4 text-accent font-semibold">$500 / 2,000,000 UGX (Exact)</td>
                        <td className="py-3 px-4 text-right text-success font-semibold">$16.67 / 66.7k UGX</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
