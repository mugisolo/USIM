import { auth } from './authService';
import { updateUserMetadata, subscribeToUserMetadata } from './firestoreService';

export type SubscriptionPlanId = 'FREE' | 'FREE_TRIAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type CalibrationMode = 'STANDARD_SCHEDULE' | 'CALIBRATED_PARITY' | 'BOU_SPOT';

export interface SubscriptionState {
  planId: SubscriptionPlanId;
  planName: string;
  priceUsd: number;
  priceUgx: number;
  priceDisplay: string;
  activatedAt: string;
  trialEndsAt: string;
  renewsAt: string;
  status: 'TRIAL_ACTIVE' | 'ACTIVE';
  firstWeekFreeApplied: boolean;
  calibrationMode: CalibrationMode;
}

export interface SubscriptionTierDefinition {
  id: SubscriptionPlanId;
  name: string;
  shortLabel: string;
  cadence: string;
  durationDays: number;
  badge: string;
  recommended?: boolean;
  statedUsd: number;
  statedUgx: number;
  statedDisplay: string;
  calibrated: {
    STANDARD_SCHEDULE: {
      usd: number;
      ugx: number;
      effectiveDailyUsd: number;
      effectiveDailyUgx: number;
      savingsLabel: string;
    };
    CALIBRATED_PARITY: {
      usd: number;
      ugx: number;
      effectiveDailyUsd: number;
      effectiveDailyUgx: number;
      savingsLabel: string;
    };
    BOU_SPOT: {
      usd: number;
      ugx: number;
      effectiveDailyUsd: number;
      effectiveDailyUgx: number;
      savingsLabel: string;
    };
  };
  features: string[];
}

const STORAGE_KEY = 'uisms_subscription_state_v2';
const listeners = new Set<(state: SubscriptionState) => void>();

export const SUBSCRIPTION_TIERS: SubscriptionTierDefinition[] = [
  {
    id: 'DAILY',
    name: 'Daily Tactical Pass',
    shortLabel: 'Daily ($20 / 100k UGX)',
    cadence: 'per day (24 hours)',
    durationDays: 1,
    badge: '24-Hour SitRep Access',
    statedUsd: 20,
    statedUgx: 100000,
    statedDisplay: '$20 / 100k UGX',
    calibrated: {
      STANDARD_SCHEDULE: {
        usd: 20,
        ugx: 100000,
        effectiveDailyUsd: 20,
        effectiveDailyUgx: 100000,
        savingsLabel: 'Standard Daily Pass ($20 / 100k UGX)',
      },
      CALIBRATED_PARITY: {
        usd: 20,
        ugx: 80000,
        effectiveDailyUsd: 20,
        effectiveDailyUgx: 80000,
        savingsLabel: 'Calibrated @ 1 USD = 4,000 UGX ($20 = 80k UGX · $25 = 100k UGX)',
      },
      BOU_SPOT: {
        usd: 20,
        ugx: 76000,
        effectiveDailyUsd: 20,
        effectiveDailyUgx: 76000,
        savingsLabel: 'Calibrated @ 3,800 UGX/USD Spot',
      },
    },
    features: [
      'First Week Free (7-day complimentary command evaluation)',
      '24-hour full access to Intel Chat (gemini-3.8-flash & gemini-3.1-flash-lite)',
      'Real-time Kinetic Incident Feed & Threat Horizon probability curves',
      'Justified-margin PDF SitRep & briefing exports',
    ],
  },
  {
    id: 'WEEKLY',
    name: 'Weekly Theater Command',
    cadence: 'per week (7 days)',
    shortLabel: 'Weekly ($150 / 700k UGX)',
    durationDays: 7,
    badge: 'First Week Free ($0 Today)',
    statedUsd: 150,
    statedUgx: 700000,
    statedDisplay: '$150 / 700k UGX',
    calibrated: {
      STANDARD_SCHEDULE: {
        usd: 150,
        ugx: 700000,
        effectiveDailyUsd: 21.43,
        effectiveDailyUgx: 100000,
        savingsLabel: 'Weekly Command Pass ($150 / 700k UGX · 1st Week Free)',
      },
      CALIBRATED_PARITY: {
        usd: 140,
        ugx: 560000,
        effectiveDailyUsd: 20.0,
        effectiveDailyUgx: 80000,
        savingsLabel: 'Calibrated 7×$20 = $140 (560k UGX) · $150 = 600k UGX (14% off 700k)',
      },
      BOU_SPOT: {
        usd: 140,
        ugx: 532000,
        effectiveDailyUsd: 20.0,
        effectiveDailyUgx: 76000,
        savingsLabel: 'Calibrated 7-Day Pass @ 3,800 UGX/USD',
      },
    },
    features: [
      'First Week Free — $0 / 0 UGX billed for the initial 7 days',
      'Synthesis Mind Executive Briefing Paper generation',
      'Full Actor Matrix (PEP) & Relational Forensics Ledger',
      'Live Google Maps & OSINT Search Grounding sweeps',
    ],
  },
  {
    id: 'MONTHLY',
    name: 'Monthly Sovereign Oversight',
    shortLabel: 'Monthly ($500 / 2m UGX)',
    cadence: 'per month (30 days)',
    durationDays: 30,
    badge: 'Recommended · Best Value',
    recommended: true,
    statedUsd: 500,
    statedUgx: 2000000,
    statedDisplay: '$500 / 2m UGX',
    calibrated: {
      STANDARD_SCHEDULE: {
        usd: 500,
        ugx: 2000000,
        effectiveDailyUsd: 16.67,
        effectiveDailyUgx: 66667,
        savingsLabel: 'Save 17% USD / 33% UGX vs. Daily Pass',
      },
      CALIBRATED_PARITY: {
        usd: 500,
        ugx: 2000000,
        effectiveDailyUsd: 16.67,
        effectiveDailyUgx: 66667,
        savingsLabel: 'Exact 1 USD = 4,000 UGX Parity · Save $100 USD / 1M UGX monthly',
      },
      BOU_SPOT: {
        usd: 500,
        ugx: 1900000,
        effectiveDailyUsd: 16.67,
        effectiveDailyUgx: 63333,
        savingsLabel: 'Calibrated @ 3,800 UGX/USD Spot (Save 17%)',
      },
    },
    features: [
      'Includes First Week Free (37 days total initial command coverage)',
      'Unlimited Deep Strategic Reasoning (gemini-4-argon)',
      'Multi-Domain Asset Ledger bulk JSON/CSV/PDF protocols',
      'Presidential Dossier exports with justified margins & priority link',
    ],
  },
];

function createDefaultTrialState(): SubscriptionState {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    planId: 'FREE_TRIAL',
    planName: 'First Week Free Trial',
    priceUsd: 0,
    priceUgx: 0,
    priceDisplay: '$0 / 0 UGX (First Week Free)',
    activatedAt: now.toISOString(),
    trialEndsAt: trialEnd.toISOString(),
    renewsAt: trialEnd.toISOString(),
    status: 'TRIAL_ACTIVE',
    firstWeekFreeApplied: true,
    calibrationMode: 'STANDARD_SCHEDULE',
  };
}

function notifyListeners(state: SubscriptionState) {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.warn('Subscription listener error:', err);
    }
  });
}

export function getSubscriptionState(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SubscriptionState;
      if (parsed && parsed.planId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read subscription state from localStorage:', err);
  }

  const initial = createDefaultTrialState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore storage errors
  }
  return initial;
}

export const getInitialSubscriptionState = getSubscriptionState;

export async function setSubscriptionPlan(
  planId: SubscriptionPlanId,
  calibrationMode: CalibrationMode = 'STANDARD_SCHEDULE'
): Promise<SubscriptionState> {
  const current = getSubscriptionState();
  const now = new Date();
  const trialEnd = current.trialEndsAt
    ? new Date(current.trialEndsAt)
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let nextState: SubscriptionState;

  if (planId === 'FREE_TRIAL' || planId === 'FREE') {
    const freshTrialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    nextState = {
      planId: 'FREE_TRIAL',
      planName: 'First Week Free Trial',
      priceUsd: 0,
      priceUgx: 0,
      priceDisplay: '$0 / 0 UGX (First Week Free)',
      activatedAt: now.toISOString(),
      trialEndsAt: freshTrialEnd.toISOString(),
      renewsAt: freshTrialEnd.toISOString(),
      status: 'TRIAL_ACTIVE',
      firstWeekFreeApplied: true,
      calibrationMode,
    };
  } else {
    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === planId) || SUBSCRIPTION_TIERS[0];
    const pricing = tier.calibrated[calibrationMode];
    const renewsAt = new Date(
      Math.max(now.getTime(), trialEnd.getTime()) + tier.durationDays * 24 * 60 * 60 * 1000
    );

    nextState = {
      planId: tier.id,
      planName: tier.name,
      priceUsd: pricing.usd,
      priceUgx: pricing.ugx,
      priceDisplay: tier.statedDisplay,
      activatedAt: now.toISOString(),
      trialEndsAt: trialEnd.toISOString(),
      renewsAt: renewsAt.toISOString(),
      status: 'ACTIVE',
      firstWeekFreeApplied: true,
      calibrationMode,
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // ignore storage errors
  }

  notifyListeners(nextState);

  if (auth.currentUser) {
    try {
      await updateUserMetadata(auth.currentUser.uid, {
        subscription: nextState,
      });
    } catch (err) {
      console.warn('Could not sync subscription to Firestore:', err);
    }
  }

  return nextState;
}

export function subscribeToSubscriptionChanges(
  callback: (state: SubscriptionState) => void
): () => void {
  listeners.add(callback);

  let unsubFirestore: (() => void) | null = null;
  if (auth.currentUser) {
    unsubFirestore = subscribeToUserMetadata(auth.currentUser.uid, (data) => {
      if (data?.subscription && data.subscription.planId) {
        const synced = data.subscription as SubscriptionState;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        } catch {
          // ignore
        }
        callback(synced);
      }
    });
  }

  return () => {
    listeners.delete(callback);
    if (unsubFirestore) unsubFirestore();
  };
}

export function getSubscriptionStatusMeta(state: SubscriptionState) {
  const now = Date.now();
  const trialEndMs = new Date(state.trialEndsAt).getTime();
  const renewMs = new Date(state.renewsAt).getTime();
  const trialDaysLeft = Math.max(0, Math.min(7, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24))));
  const cycleDaysLeft = Math.max(1, Math.ceil((renewMs - now) / (1000 * 60 * 60 * 24)));

  const badgeLabel =
    state.planId === 'FREE_TRIAL' || state.planId === 'FREE'
      ? `Free Trial · ${trialDaysLeft}d left`
      : state.planId === 'DAILY'
      ? 'Daily · $20 / 100k UGX'
      : state.planId === 'WEEKLY'
      ? 'Weekly · $150 / 700k UGX'
      : 'Monthly · $500 / 2m UGX';

  return {
    trialDaysLeft,
    cycleDaysLeft,
    badgeLabel,
    isTrialActive: state.planId === 'FREE_TRIAL' || state.planId === 'FREE' || trialDaysLeft > 0,
  };
}
