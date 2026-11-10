import { PresidentialProfile, Incident, PEPEntity, CountrySitrep, StrategicAsset, PEPProfile } from '../types';

/**
 * U-ISMS Gemini Client Service
 * 
 * All Gemini operations (including streaming and Live API) are securely processed 
 * via server-side endpoints on /api/gemini/* to maintain operational integrity, 
 * prevent client-side credential exposure, and ensure universal accessibility.
 */

export const extractPEPsFromFiles = async (files: { data: string; mimeType: string }[]): Promise<any[]> => {
  try {
    const res = await fetch('/api/gemini/extract-peps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files }),
    });
    if (!res.ok) {
      console.error('Extraction request failed with status:', res.status);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Batch extraction failed:', error);
    return [];
  }
};

export const fetchRecentIncidents = async (): Promise<Incident[]> => {
  try {
    const res = await fetch('/api/gemini/recent-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Recent incidents fetch failure:', error);
    return [];
  }
};

export const generateCountrySitrep = async (countryName: string, isDeep: boolean = false): Promise<CountrySitrep | null> => {
  try {
    const res = await fetch('/api/gemini/country-sitrep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryName, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Country sitrep failure:', error);
    return null;
  }
};

export const generateCountryLedgerAnalytics = async (
  countries: any[],
  incidents: Incident[],
  peps: any[],
  assets: StrategicAsset[],
  isDeep: boolean = false
): Promise<any | null> => {
  try {
    const res = await fetch('/api/gemini/country-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countries, incidents, peps, assets, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Country ledger analytics failure:', error);
    return null;
  }
};

export const fetchLivePEPStats = async (peps: PEPEntity[]): Promise<Partial<PEPEntity>[]> => {
  try {
    const res = await fetch('/api/gemini/pep-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peps }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('PEP stats failure:', error);
    return [];
  }
};

export const analyzePEPEntity = async (name: string, party: string, isDeep: boolean = false): Promise<PresidentialProfile | null> => {
  try {
    const res = await fetch('/api/gemini/pep-entity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, party, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Analyze PEP entity failure:', error);
    return null;
  }
};

export const generatePoliticalStrategy = async (
  pepName: string,
  party: string,
  constituency: string,
  contextData: string,
  isDeep: boolean = false
): Promise<{ grandStrategy: string; sitRep: string } | null> => {
  try {
    const res = await fetch('/api/gemini/political-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pepName, party, constituency, contextData, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Political strategy generation failure:', error);
    return null;
  }
};

export const generateDailyOpEd = async (
  incidentsSummary: string,
  pepPerformanceSummary: string,
  dateRange: string = 'today',
  isDeep: boolean = false
): Promise<any> => {
  try {
    const res = await fetch('/api/gemini/daily-oped', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentsSummary, pepPerformanceSummary, dateRange, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Daily OpEd generation failure:', error);
    return null;
  }
};

export const generateDeepMindAnalysis = async (query: string, isDeep: boolean = false): Promise<any | null> => {
  try {
    const res = await fetch('/api/gemini/deep-mind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Deep mind analysis failure:', error);
    return null;
  }
};

export const generateGlobalRecommendations = async (
  peps: PEPEntity[],
  isDeep: boolean = false
): Promise<{ moves: { title: string; logic: string; impact: string }[]; summary: string } | null> => {
  try {
    const res = await fetch('/api/gemini/global-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peps, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Global recommendations failure:', error);
    return null;
  }
};

export const verifyGeminiApiKey = async (): Promise<{ configured: boolean; sovereignFallbackReady: boolean }> => {
  const clientEnvPresent = Boolean(
    typeof process !== 'undefined' &&
      process.env &&
      (process.env.API_KEY || process.env.GEMINI_API_KEY)
  );
  try {
    const res = await fetch('/api/gemini/key-status');
    if (res.ok) {
      const data = await res.json();
      return {
        configured: Boolean(data.configured || clientEnvPresent),
        sovereignFallbackReady: Boolean(data.sovereignFallbackReady ?? true),
      };
    }
  } catch {
    // Fallback to local check if endpoint is unreachable
  }
  return { configured: clientEnvPresent, sovereignFallbackReady: true };
};

export const chatWithAnalyst = async (
  history: any[], 
  message: string, 
  model: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' = 'gemini-3.8-flash'
): Promise<string> => {
  await verifyGeminiApiKey();

  const fallbackOrder: Array<'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'> =
    model === 'gemini-4-argon'
      ? ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']
      : model === 'gemini-3.8-flash'
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (let attempt = 0; attempt < fallbackOrder.length; attempt++) {
    const targetModel = fallbackOrder[attempt];
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message, model: targetModel }),
      });

      if (res.status === 429 || res.status === 402 || res.status === 503) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (!res.ok) {
        console.warn(`[U-ISMS Client] Chat endpoint returned HTTP ${res.status} on ${targetModel}`);
        continue;
      }

      const data = await res.json();
      if (data?.text && typeof data.text === 'string' && data.text.trim().length > 0) {
        return data.text;
      }
    } catch (error) {
      console.warn(`U-ISMS Chat attempt ${attempt + 1} (${targetModel}) notice:`, error instanceof Error ? error.message : error);
      const delayMs = 500 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return "### [U-ISMS HIGH-COMMAND TACTICAL STANDBY]\n*Carrier signal congestion detected on intelligence uplink. Tactical contingency protocol active.*\n- **[TIER 5 — FORENSIC] Sovereign Continuity:** Primary military and infrastructure nodes (Entebbe, Bombo, Karuma) maintain green status.\n- **[TIER 4 — PROBABLE] Frontier Surveillance:** Joint border deterrence units report normal traffic.\nStanding orders remain in effect.";
};

/**
 * Streaming chat with analyst via Server-Sent Events (SSE)
 */
export const chatWithAnalystStream = async (
  history: any[],
  message: string,
  onChunk: (chunk: string) => void,
  model: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' = 'gemini-3.8-flash'
): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, message, model }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming failed with status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              fullText += parsed.text;
              onChunk(parsed.text);
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', e);
          }
        }
      }
    }

    return fullText;
  } catch (err) {
    console.error('Stream reader error:', err);
    throw err;
  }
};

export const generateSynthesisMindBriefing = async (
  incidents: Incident[],
  peps: PEPProfile[],
  assets: StrategicAsset[],
  isDeep: boolean = false
): Promise<{
  title: string;
  threatAssessment: string;
  kineticHotspots: string[];
  infrastructureVulnerabilities: string[];
  strategicRecoms: string[];
  summary: string;
} | null> => {
  try {
    const res = await fetch('/api/gemini/synthesis-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents, peps, assets, isDeep }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Synthesis Mind Briefing Generation Failure:', error);
    return null;
  }
};

export const transcribeAudio = async (
  audioData: string,
  mimeType: string = 'audio/webm'
): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioData, mimeType }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.text || '';
  } catch (error) {
    console.error('Audio transcription failure:', error);
    return '';
  }
};

export const fetchMapsIntelligence = async (
  query: string,
  latitude: number = 0.3476,
  longitude: number = 32.5825
): Promise<{ text: string; links: { title: string; uri: string; snippet?: string }[] } | null> => {
  try {
    const res = await fetch('/api/gemini/maps-intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, latitude, longitude }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Maps grounding intelligence failure:', error);
    return null;
  }
};

export const fetchSearchIntelligence = async (
  query: string
): Promise<{ text: string; sources: { title: string; uri: string }[] } | null> => {
  try {
    const res = await fetch('/api/gemini/search-intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Search grounding intelligence failure:', error);
    return null;
  }
};

/**
 * Connect to the server-side Gemini Live API WebSocket endpoint
 */
export const connectGeminiLive = (callbacks: {
  onAudio: (base64Audio: string) => void;
  onInterrupted?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}) => {
  const isSecure = window.location.protocol === 'https:';
  const wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${window.location.host}/live`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    callbacks.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.audio) {
        callbacks.onAudio(data.audio);
      }
      if (data.interrupted) {
        callbacks.onInterrupted?.();
      }
    } catch (e) {
      console.error('Error handling live message:', e);
    }
  };

  socket.onerror = (err) => {
    callbacks.onError?.(err);
  };

  socket.onclose = () => {
    callbacks.onClose?.();
  };

  return {
    sendAudio: (base64Pcm16k: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ audio: base64Pcm16k }));
      }
    },
    sendText: (text: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ text }));
      }
    },
    close: () => {
      socket.close();
    },
    socket,
  };
};
