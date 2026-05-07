
export interface OsintReport {
  sourceReliability: 'A - Completely Reliable' | 'B - Usually Reliable' | 'C - Fairly Reliable' | 'D - Not Usually Reliable' | 'E - Unreliable' | 'F - Cannot Be Judged';
  credibilityScore: number; // 0-100
  verifiedSources: string[];
  aiAnalysis: string;
  timeline: { time: string; event: string }[];
}

export interface Incident {
  id: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  type: 'Violence' | 'Protest' | 'Arrest' | 'Intimidation' | 'Rally' | 'Military Movement' | 'Border Tension' | 'Cyber Attack' | 'Strategic Sabotage';
  fatalities: number;
  injuries: number;
  description: string;
  verified: boolean;
  osintReport?: OsintReport;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StrategicAsset {
  id: string;
  name: string;
  type: 'Airbase' | 'Port' | 'Data Center' | 'Mine' | 'Oil Refined' | 'Power Plant' | 'Border Post';
  location: string;
  status: 'Operational' | 'Secured' | 'Compromised' | 'Under Observation';
  coordinates: [number, number];
  country: string;
  owner: string;
}

export interface PEPEntity {
  id: string;
  name: string;
  party: string;
  district: string;
  sentimentScore: number; // 0 to 100
  mentions: number;
  politicalInfluence: number;
  imageUrl: string;
  notes?: string;
}

export interface PEPProfile {
  id: string;
  name: string;
  constituency: string;
  party: string;
  country: string;
  category: 'Woman MP' | 'Constituency' | 'Special Interest' | 'Executive' | 'Judiciary' | 'Legislative Assembly' | 'Military Command' | 'Intelligence Services';
  rank?: string; // Military or Intelligence rank
  clearance?: string;
  sentimentScore: number; // 0-100
  influenceIndex?: number; // 0-100
  mentions: number;
  coordinates?: [number, number]; // Lat, Lng for map
  confidence?: '[TIER 5 — CONFIRMED]' | '[TIER 4 — HIGHLY PROBABLE]' | '[TIER 3 — PROBABLE]' | '[TIER 2 — POSSIBLE]' | '[TIER 1 — SPECULATIVE]';
  intelligenceDossier?: string;
}

export interface PEPCandidate extends Partial<PEPProfile> {
  id: string;
  name: string;
  constituency: string;
  party: string;
  category: PEPProfile['category'];
  projectedVoteShare?: number;
}

export interface ConstituencyProfile {
  constituency: string;
  region: string;
  demographics: {
    totalPopulation: string;
    registeredVoters: string;
    youthPercentage: number;
    urbanizationRate: number;
  };
  socioEconomic: {
    primaryActivity: string;
    povertyIndex: string;
    literacyRate: number;
    accessToElectricity: number;
  };
  historical: {
    previousWinner: string;
    margin2021: string;
    voterTurnout: string;
    incumbentStatus: string;
  };
  electionTrend: any[];
  candidateHistory: any[];
  socialMediaPoll: SocialMediaPoll;
  osintBackground: OSINTBackground;
  campaignStrategy: PoliticalStrategy;
}

export interface PartyResult {
  party: string;
  percentage: number;
}

export interface ElectionTrend {
  year: number;
  winningParty: string;
  voteShare: number;
  turnout: number;
  margin: number;
  results: PartyResult[];
}

export interface PEPPastResult {
  year: number;
  position: string;
  outcome: 'Won' | 'Lost' | 'Nominated';
  party: string;
  votes?: number;
}

export interface SocialMediaPoll {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  totalMentions: number;
  trendingTopics: string[];
}

export interface OSINTBackground {
  maritalStatus: string;
  education: string;
  lifestyle: string;
  controversies: string[];
  politicalAnalysis: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  date: string;
  snippet: string;
}

export interface PoliticalStrategy {
  latestNews: NewsItem[];
  keyChallenges: string[];
  strategicVerdict: string;
  grandStrategy?: string; // For the "Machiavelli/Sun Tzu" output
}

export interface PoliticalDossier {
  constituency: string;
  region: string;
  demographics: {
    totalPopulation: string;
    registeredVoters: string;
    youthPercentage: number;
    urbanizationRate: number;
  };
  socioEconomic: {
    primaryActivity: string;
    povertyIndex: string;
    literacyRate: number;
    accessToElectricity: number;
  };
  historical: {
    previousWinner: string; // Party
    margin2021: string;
    voterTurnout: string;
    incumbentStatus: 'Open Seat' | 'Defended' | 'Contested';
  };
  politicalTrend: ElectionTrend[];
  pepHistory: PEPPastResult[];
  socialMediaPulse: SocialMediaPoll;
  osintIntelligence: OSINTBackground;
  politicalStrategy: PoliticalStrategy;
}

export interface StrategicBriefing {
  pepName: string;
  party: string;
  nationalOverview: {
    totalRegisteredVoters: string;
    youthDemographic: string; // e.g. "75% under 30"
    keySwingRegions: string[];
    economicMood: string;
  };
  politicalStrategy: PoliticalStrategy;
  osintIntelligence: OSINTBackground;
  socialPulse: SocialMediaPoll;
  politicalHistory: PEPPastResult[];
  historicalPartyPerformance: ElectionTrend[]; // National trends for their party
  sources: GroundingChunk[];
}

export interface Country {
  id: string;
  name: string;
  region: 'North' | 'West' | 'East' | 'Central' | 'South';
  stabilityIndex: 'Stable' | 'Fragile' | 'Failing' | 'Conflict';
  isoCode: string;
  flagUrl: string;
}

export interface CountrySitrep {
  politicalStability: string;
  militaryPosture: string;
  financialIntegrity: string;
  tribalDynamics: string;
  foreignInfluence: {
    actor: string;
    footprint: string;
    level: 'High' | 'Medium' | 'Low';
  }[];
  strategicVerdict: string;
  threatLevel: number; // 1-10
}

export interface CountryAnalytics {
  totalMonitored: number;
  stabilityMetrics: {
    stable: number;
    fragile: number;
    conflict: number;
    failing: number;
  };
  regionalRiskProfile: {
    region: string;
    avgThreatLevel: number;
    primaryForeignActor: string;
    volatility: 'Low' | 'Moderate' | 'High' | 'Critical';
  }[];
  globalStrategicSynthesis: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  eventType: string;
  location: string;
  actors: string[];
  casualties: {
    deaths: number;
    injuries: number;
  };
  significanceScore: number;
  summary: string;
  sources?: GroundingChunk[];
}

export interface SearchAnalysisResult {
  markdown: string;
  sources: GroundingChunk[];
}

export enum ViewState {
  THEATER = 'THEATER',
  ASSETS = 'ASSETS',
  MAP = 'MAP',
  ACTORS = 'ACTORS',
  SYNTHESIS = 'SYNTHESIS',
  CHAT = 'CHAT',
}
