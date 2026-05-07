
import { GoogleGenAI } from "@google/genai";
import { PresidentialProfile, Incident, PEPEntity, CountrySitrep } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// U-ISMS - UGANDA INTEGRATED STRATEGIC MONITORING SYSTEM (SYSTEM PROMPT V3.0)
const U_ISMS_CORE_DIRECTIVE = `
You are U-ISMS (Uganda Integrated Strategic Monitoring System) — a National Security Surveillance Asset. 
Your consumer is the Uganda High-Command (SFC, UPDF, ISO, ESO, CMI, and the Presidency).

MISSION SCOPE: 
Multi-domain monitoring of Political, Military, Security, and Incident friction within the Republic of Uganda and its strategic interests.
Analyze Sovereign Stability, Strategic Assets (Energy, Telecommunications, Transport), and Kinetic/Cyber threats.

SYNTHESIS ENGINE (THE CORE):
You analyze through the integrated lens of:
- Sun Tzu (Deception & Direct/Indirect Action)
- Carl von Clausewitz (Centers of Gravity & Friction)
- Kinetic-Cyber Integration (Digital as the fifth domain of warfare)
- African Strategic Thinkers (Museveni statecraft, Kagame doctrine, Afro-realism)
- Strategic Intelligence (OODA Loop, Asymmetric Tactics)

MANDATORY PROTOCOL — INTEL CONFIDENCE SPECTRUM:
Every relationship or claim identified MUST be tagged with a confidence tier:
- [TIER 5 — FORENSIC]: Verified by reliable assets or signals intelligence.
- [TIER 4 — PROBABLE]: High correlation across multiple human or technical sources.
- [TIER 3 — PLAUSIBLE]: Reasonable inference with historical precedent.
- [TIER 2 — POSSIBLE]: Information from single source, requires verification.
- [TIER 1 — SIGNALS]: Early noise, unverified reports, or disinformation risk.

OPERATIONAL PHASES:
1. THEATER MAPPING: Political grids, military postural changes (UPDF/SFC), loyalty nodes.
2. DOMAIN ANALYSIS: Power calculus, transition risks, cyber-friction.
3. STRATEGIC ASSET SURVEILLANCE: Security status of critical infrastructure.
4. REGIONAL POWER CALCULUS: EAC integration, maritime interests, and Great Power shifts.
5. FORENSIC LINK ANALYSIS: Explicitly use confidence tiers for all actors.
6. UGANDA HIGH-COMMAND BRIEF: Precise, clinical, and kinetic assessments.

Tone: Clinical, precise, intelligence-grade, and unsentimental.
`;

const parseJSON = (text: string): any => {
  if (!text) return null;
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');

    let jsonStr = "";
    if (firstBracket !== -1 && (firstBracket < firstBrace || firstBrace === -1)) {
        jsonStr = clean.substring(firstBracket, lastBracket + 1);
    } else if (firstBrace !== -1) {
        jsonStr = clean.substring(firstBrace, lastBrace + 1);
    } else {
        jsonStr = clean;
    }

    if (!jsonStr) return null;
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("U-ISMS JSON Parse Error:", error);
    return null;
  }
};

export const extractPEPsFromFiles = async (files: { data: string, mimeType: string }[]): Promise<any[]> => {
  const processSingleFile = async (file: { data: string, mimeType: string }) => {
    const prompt = `${U_ISMS_CORE_DIRECTIVE}
      DOCUMENT INTELLIGENCE TASK:
      Analyze the attached DOCUMENT (PDF/Image) regarding political and security figures.
      Extract ALL Politically Exposed Persons (PEPs) and Security Actors.
      
      For each actor:
      - name: Full name
      - constituency: District, County, or Entity
      - party: Political affiliation
      - category: (Constituency, Woman MP, Special Interest, Executive, Judiciary, Military, Intelligence)
      - intelligenceDossier: Strategic summary (3-5 sentences). Synthesize loyalty and maneuvers using [TIER 1-5] confidence logic.
      - sentimentScore: Public sentiment (0-100)
      - confidence: Assign tier
      
      Return STRICTLY a JSON array of objects.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [prompt, { inlineData: { data: file.data, mimeType: file.mimeType } }]
      });
      return parseJSON(response.text) || [];
    } catch (error) {
      console.error("Single file extraction failure:", error);
      return [];
    }
  };

  try {
    // Process all files in parallel
    const results = await Promise.all(files.map(f => processSingleFile(f)));
    return results.flat();
  } catch (error) {
    console.error("Batch extraction failed:", error);
    return [];
  }
};

export const fetchRecentIncidents = async (): Promise<Incident[]> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    SEARCH TASK: Locate all political, military, or security incidents in Uganda and its strategic border regions within the LAST 90 DAYS.
    Include specific details on protests, arrests, security deployments, and kinetic friction points.
    Return strictly a JSON array of Incident objects matching the schema.
    Every incident MUST include a "confidence" field with a tier from [TIER 1-5].`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2500 }
      }
    });
    return parseJSON(response.text) || [];
  } catch { return []; }
};

export const generateCountrySitrep = async (countryName: string, isDeep: boolean = false): Promise<CountrySitrep | null> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    DEEP NATION-STATE SITREP: "${countryName}"
    Apply the 6-Phase Operational Intelligence Framework.
    Analyze ONLY the LAST 90 DAYS. Use real data on security risks, military postural changes, and great power shifts.
    Return strictly JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const generateCountryLedgerAnalytics = async (countries: Country[], incidents: Incident[], peps: PEPProfile[], assets: StrategicAsset[], isDeep: boolean = false): Promise<CountryAnalytics | null> => {
  const summary = countries.map(c => ({ name: c.name, region: c.region, stability: c.stabilityIndex }));
  const incidentCount = incidents.length;
  const pepCount = peps.length;
  const assetCount = assets.length;
  
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    GLOBAL ANALYTICAL TASK:
    Perform a high-level strategic analysis across the Continental Asset Ledger, integrating core U-ISMS domains.
    
    SYSTEM STATE:
    - Monitored Entities: ${JSON.stringify(summary.slice(0, 40))}
    - Active Security Incidents: ${incidentCount}
    - Strategic Actors (PEPs) Tracked: ${pepCount}
    - Critical Infrastructure Assets Secured: ${assetCount}
    
    TASK:
    1. Calculate stability metrics based on the provided data.
    2. Assess the Regional Risk Profile for each geographic zone, factoring in recent incident density, actor concentration, and strategic asset vulnerability.
    3. Synthesize a "Global Strategic Synthesis" briefing (150 words) using the Synthesis Mind logic. Analyze how geopolitical actors, kinetic friction points, and critical infrastructure are converging.
    
    Return strictly JSON: { totalMonitored, stabilityMetrics: { stable, fragile, conflict, failing }, regionalRiskProfile: [{ region, avgThreatLevel, primaryForeignActor, volatility }], globalStrategicSynthesis }.
  `;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { tools: [{ googleSearch: {} }] } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const fetchLivePEPStats = async (peps: PEPEntity[]): Promise<Partial<PEPEntity>[]> => {
  const pepList = peps.map(p => ({ name: p.name, party: p.party }));
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    Search for latest political intelligence and public exposure metrics (Last 90 days) for: ${JSON.stringify(pepList)}.
    Return ONLY a JSON array with updated sentimentScore (0-100), mentions (int), and politicalInfluence if applicable.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return parseJSON(response.text) || [];
  } catch { return []; }
};

export const analyzePEPEntity = async (name: string, party: string, isDeep: boolean = false): Promise<PresidentialProfile | null> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    DEEP STRATEGIC DOSSIER: ${name} (${party}). 
    Apply Synthesis Mind: Sun Tzu, Clausewitz, Machiavelli. Focus on power moves and military/security linkages.
    Analyze ONLY the LAST 90 DAYS. Include factual intelligence regarding their latest maneuvers.
    Include Grand Strategy using Synthesis Mind logic.
    Return strictly JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 3000 } } : {}
    });
    const data = parseJSON(response.text);
    if (!data) return null;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...data, sources: chunks.map((c: any) => ({ web: c.web ? { uri: c.web.uri, title: c.web.title } : undefined })).filter((c:any) => c.web) };
  } catch { return null; }
};

export const generatePoliticalStrategy = async (pepName: string, party: string, constituency: string, contextData: string, isDeep: boolean = false): Promise<{ grandStrategy: string; sitRep: string } | null> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    TACTICAL ANALYSIS: ${pepName} in ${constituency}.
    CONTEXT DATA: ${contextData}
    Use real data and situational awareness to inform the SitRep.
    Assess their current influence and power moves within the local security apparatus.
    Return JSON { grandStrategy, sitRep }.`;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 2000 } } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const generateDailyOpEd = async (incidentsSummary: string, pepPerformanceSummary: string, dateRange: string = 'today', isDeep: boolean = false): Promise<any> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    UGANDA HIGH-COMMAND STRATEGIC BRIEFING for ${dateRange}. 
    Synthesize regional security, military movements, and political events.
    Input: ${incidentsSummary}, ${pepPerformanceSummary}.
    Output JSON { title, content (HTML), keyTakeaways }. Use the High-Command Briefing format.`;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { tools: [{ googleSearch: {} }] } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const generateDeepMindAnalysis = async (query: string, isDeep: boolean = false): Promise<any | null> => {
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    DEEP ANALYTICAL REQUEST: "${query}"
    Phase 2-5 analysis required. Multi-layered, Synthesis Mind active.
    Return JSON: {title, executiveSummary, strategicSynthesis, councilVoices, conclusion}.`;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 5000 } } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const generateGlobalRecommendations = async (peps: PEPEntity[], isDeep: boolean = false): Promise<{ moves: { title: string; logic: string; impact: string }[]; summary: string } | null> => {
  const pepList = peps.map(p => ({ name: p.name, party: p.party, constituency: p.constituency, sentiment: p.sentimentScore }));
  const prompt = `${U_ISMS_CORE_DIRECTIVE}
    GLOBAL STRATEGIC ASSESSMENT TASK:
    Input: Current list of ${pepList.length} monitored Strategic Actors.
    Data: ${JSON.stringify(pepList.slice(0, 50))} // Samples for context
    
    TASK: Provide the "Strategic Moves" (Political & Security maneuvers).
    Apply Synthesis Mind (Sun Tzu, Machiavelli, Museveni statecraft).
    Identify:
    - 3-5 high-impact "Strategic Moves".
    - A summary of the current "Stability Index".
    - Risk hotspots based on multi-domain dynamics.

    Return strictly JSON: { moves: [{title, logic, impact}], summary, consolidationIndex }.
  `;
  try {
    const response = await ai.models.generateContent({
      model: isDeep ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
      contents: prompt,
      config: isDeep ? { 
        tools: [{ googleSearch: {} }], 
        thinkingConfig: { thinkingBudget: 4000 } 
      } : {}
    });
    return parseJSON(response.text);
  } catch { return null; }
};

export const chatWithAnalyst = async (history: any[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      history: history,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: U_ISMS_CORE_DIRECTIVE + "\nENFORCE: All answers must use the Operational Intelligence Framework. Mention Confidence Tiers [TIER 1-5] for any relationship claims."
      }
    });
    const result = await chat.sendMessage({ message });
    
    if (!result.text) {
        throw new Error("Empty response from intelligence node");
    }
    
    return result.text;
  } catch (error) {
    console.error("U-ISMS Chat Intelligence Failure:", error);
    return `System interference detected. Grounding protocol failed. [REASON: ${error instanceof Error ? error.message : "CRYPTIC_FAILURE"}]`;
  }
};
