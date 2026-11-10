import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  BrainCircuit, 
  Loader2, 
  ShieldCheck, 
  Trash2, 
  Sparkles, 
  Zap, 
  Cpu, 
  LogIn,
  Mic,
  Square,
  ChevronDown
} from 'lucide-react';
import { chatWithAnalyst, transcribeAudio } from '../services/geminiService';
import { auth, loginWithGoogle } from '../services/authService';
import { 
  saveChatMessage, 
  subscribeToChatHistory, 
  updateUserMetadata, 
  subscribeToUserMetadata, 
  clearChatHistory 
} from '../services/firestoreService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { logOperationalAction } from './OperationalAuditPanel';
import Markdown from 'react-markdown';

type ModelTier = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  text: string;
  modelTier?: ModelTier | string;
  timestamp?: string;
}

const QUICK_PROMPTS = [
  {
    label: "Infrastructure Defense",
    query: "Execute a vulnerability assessment for Karuma Hydroelectric, Entebbe Aviation depot, and strategic national energy nodes.",
    tier: 'gemini-4-argon' as ModelTier,
  },
  {
    label: "Western Frontier Deterrence",
    query: "Provide real-time operational posture for Operation Shujaa and joint UPDF border commands in the Rwenzori/DRC sector.",
    tier: 'gemini-3.8-flash' as ModelTier,
  },
  {
    label: "PEP Power Matrix",
    query: "Synthesize high-command loyalty and influence vectors for top political actors in the 2026 political transition.",
    tier: 'gemini-4-argon' as ModelTier,
  },
  {
    label: "Fast Threat Triage",
    query: "Run rapid kinetic incident triage across all Ugandan border crossings within the past 72 hours.",
    tier: 'gemini-3.1-flash-lite' as ModelTier,
  }
];

const MODEL_META: Record<ModelTier, { label: string; desc: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  'gemini-4-argon': {
    label: 'gemini-4-argon',
    desc: 'Deep Strategic Reasoning',
    icon: Sparkles,
  },
  'gemini-3.8-flash': {
    label: 'gemini-3.8-flash',
    desc: 'Balanced Situational Analyst',
    icon: Cpu,
  },
  'gemini-3.1-flash-lite': {
    label: 'gemini-3.1-flash-lite',
    desc: 'Rapid Tactical Triage',
    icon: Zap,
  },
};

/**
 * Cleans and normalizes intelligence report markdown so raw CSS/HTML scrape artifacts
 * (such as .np-hot-topics or navigation menus) are completely stripped and headings render cleanly.
 */
const formatIntelligenceReportText = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    // Remove any leaked "[TIER 5 — FIELD PRESS INTERCEPT]: News All News ..." scrape blocks
    .replace(/\[TIER 5\s*—\s*FIELD PRESS INTERCEPT\]:\s*News All News[\s\S]*?(?=\n\n|\n###|\n\*\*\[TIER|$)/gi, '')
    // Remove inline CSS rules or @media queries if any leaked into historical messages
    .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '')
    .replace(/@media[^{]+\{([\s\S]*?\})\s*\}/g, '')
    .replace(/#[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '')
    // Normalize plain-text uppercase section headers from older reports into clean Markdown H3 headers
    .replace(/^EXECUTIVE INTELLIGENCE SYNTHESIS$/gm, '### Executive Intelligence Synthesis')
    .replace(/^PHASE (\d+):\s*(.+)$/gm, '### 0$1. $2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
};

/**
 * Verifies process.env.API_KEY / server key readiness and executes the Gemini analyst query
 * with exponential backoff and model-tier retry protection against 429/402 errors.
 */
const executeAnalystQueryWithRetry = async (
  history: any[],
  query: string,
  preferredModel: ModelTier,
  maxRetries: number = 3
): Promise<string> => {
  // Verify presence of process.env.API_KEY (client-side define or server-side key status)
  const hasProcessEnvKey = Boolean(
    typeof process !== 'undefined' &&
      process.env &&
      (process.env.API_KEY || process.env.GEMINI_API_KEY)
  );

  if (!hasProcessEnvKey) {
    try {
      const statusRes = await fetch('/api/gemini/key-status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (!statusData.configured && !statusData.sovereignFallbackReady) {
          console.warn('[U-ISMS] API_KEY not detected in environment; engaging sovereign intelligence engine.');
        }
      }
    } catch {
      // Proceed to retry loop
    }
  }

  const tierFallbackSequence: ModelTier[] =
    preferredModel === 'gemini-4-argon'
      ? ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']
      : preferredModel === 'gemini-3.8-flash'
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const modelForAttempt = tierFallbackSequence[attempt % tierFallbackSequence.length];
    try {
      const responseText = await chatWithAnalyst(history, query, modelForAttempt);
      const isRateLimitedStub =
        responseText.includes('Rate Limit 429') ||
        responseText.includes('CONTINGENCY PROTOCOL') ||
        responseText.includes('TACTICAL STANDBY');

      if (!isRateLimitedStub && responseText.trim().length > 0) {
        return formatIntelligenceReportText(responseText);
      }

      if (attempt < maxRetries - 1) {
        const backoffMs = 500 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        return formatIntelligenceReportText(responseText);
      }
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const backoffMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  if (lastError) {
    console.warn('Retry wrapper exhausted attempts:', lastError);
  }
  const finalFallback = await chatWithAnalyst(history, query, 'gemini-3.8-flash');
  return formatIntelligenceReportText(finalFallback);
};

export const Chatbot: React.FC<{ isInline?: boolean }> = ({ isInline }) => {
  const [isOpen, setIsOpen] = useState(isInline || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelTier>('gemini-3.8-flash');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: "### [U-ISMS STRATEGIC INTELLIGENCE COMMAND ACTIVE]\nComrade Mugisolo, standing orders acknowledged. The national intelligence matrix is fully synchronized across kinetic, political, and infrastructure vectors.\n\n- **Role:** High-Command Strategic Oversight Analyst\n- **Protocols:** Sun Tzu center-of-gravity defense, Afro-realism statecraft, and full [TIER 1-5] confidence validation.\n- **Model Tiering:** Select below between Strategic Reasoning (`gemini-4-argon`), General Analyst (`gemini-3.8-flash`), or Fast Triage (`gemini-3.1-flash-lite`).\n\nHow may the intelligence node assist High-Command today?",
      modelTier: 'gemini-3.8-flash',
      timestamp: new Date().toISOString()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email === 'mugisolo@gmail.com') {
        setIsSuperUser(true);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubHistory = subscribeToChatHistory(user.uid, (historyMsgs) => {
        if (Array.isArray(historyMsgs) && historyMsgs.length > 0) {
          const formattedMsgs: ChatMessage[] = historyMsgs.map(m => {
            const rawText = typeof m.text === 'string' ? m.text : JSON.stringify(m.text);
            return {
              id: m.id,
              role: m.role as 'user' | 'model',
              text: m.role === 'model' ? formatIntelligenceReportText(rawText) : rawText,
              modelTier: m.modelTier || 'gemini-3.8-flash',
              timestamp: m.timestamp || new Date().toISOString()
            };
          });
          setMessages(formattedMsgs);
        }
      });

      const unsubMeta = subscribeToUserMetadata(user.uid, (meta) => {
        if (meta?.isSuperUser || user.email === 'mugisolo@gmail.com') {
          setIsSuperUser(true);
        }
      });

      return () => {
        unsubHistory();
        unsubMeta();
      };
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, loading]);

  const handleToggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setIsTranscribing(true);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const transcript = await transcribeAudio(base64Audio, mimeType);
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
            logOperationalAction('Voice dictation transcribed via gemini-3.5-transcribe', 'USER_QUERY');
          }
          setIsTranscribing(false);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      setIsRecording(false);
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      await clearChatHistory(user.uid);
    }
    setMessages([
      { 
        role: 'model', 
        text: "Tactical conversation history purged. Standing by for fresh High-Command directives.",
        modelTier: selectedModel,
        timestamp: new Date().toISOString()
      }
    ]);
    logOperationalAction("Operator cleared tactical conversation logs.", 'SYSTEM', isSuperUser ? 'Mugisa Solomon Byakutaaga' : 'UC_01');
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || loading) return;

    // Super User Secret Access Trigger override
    if (messageToSend.trim() === "mugisolo 917846") {
      if (!user) {
        try {
          await loginWithGoogle();
        } catch (err) {
          console.error("Auth required for super user activation", err);
          return;
        }
      }
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateUserMetadata(currentUser.uid, {
          isSuperUser: true,
          accessCodeUsed: "mugisolo 917846",
          displayName: "Comrade Mugisolo",
          role: "Director of Strategic Oversight"
        });
        setInput('');
        setMessages(prev => [
          ...prev, 
          { 
            role: 'model', 
            text: "Access Verified: Comrade Mugisolo. Director of Strategic Oversight clearance authorized across all national intelligence nodes.",
            modelTier: selectedModel,
            timestamp: new Date().toISOString()
          }
        ]);
        return;
      }
    }

    const userMsg = messageToSend;
    const currentMessages = [...messages];
    if (!customMessage) setInput('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      modelTier: selectedModel, 
      timestamp: new Date().toISOString() 
    }]);
    
    setLoading(true);

    logOperationalAction(
      `Intelligence Query [${selectedModel}]: "${userMsg.length > 60 ? userMsg.substring(0, 57) + '...' : userMsg}"`, 
      'USER_QUERY', 
      isSuperUser ? 'Comrade Mugisolo' : 'LIAISON_01'
    );

    if (user) {
      saveChatMessage(user.uid, 'user', userMsg, selectedModel).catch(console.error);
    }

    const history = Array.isArray(currentMessages) ? currentMessages.map(m => ({
      role: m.role,
      parts: [{ text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text) }]
    })) : [];

    try {
      const response = await executeAnalystQueryWithRetry(history, userMsg, selectedModel);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response, 
        modelTier: selectedModel, 
        timestamp: new Date().toISOString() 
      }]);
      
      if (user) {
        saveChatMessage(user.uid, 'model', response, selectedModel).catch(console.error);
      }
    } catch (error) {
      console.warn("Chat notice:", error instanceof Error ? error.message : error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "### [TACTICAL STANDBY — CARRIER INTERFERENCE]\nU-ISMS secure line experiencing telemetry congestion. Local contingency protocol active. Primary command nodes remain operational.",
        modelTier: selectedModel,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isInline) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-accent hover:opacity-90 text-accent-ink rounded-full shadow-lg flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95"
        title="Open U-ISMS Strategic Intelligence Assistant"
      >
        <MessageSquare size={22} />
      </button>
    );
  }

  const ActiveModelIcon = MODEL_META[selectedModel]?.icon || Cpu;

  const containerClasses = isInline 
    ? "h-full w-full flex flex-col overflow-hidden bg-bg-base"
    : `fixed z-[70] bg-bg-surface border-l border-border-subtle shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-14 rounded-2xl border' 
          : 'inset-y-0 right-0 w-full sm:w-[460px] h-full'
      }`;

  return (
    <div className={containerClasses}>
      {/* Slide-over Header (shown when floating or as compact status strip) */}
      <div className="h-14 px-5 border-b border-border-subtle bg-bg-surface/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent">
            <BrainCircuit size={17} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-display font-semibold text-sm text-text-primary tracking-tight">
              Intelligence Command
            </span>
            {isSuperUser ? (
              <span className="text-[11px] font-mono text-text-secondary flex items-center gap-1">
                <ShieldCheck size={12} className="text-accent" />
                <span>Mugisolo</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-text-secondary">
                Active
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button 
              onClick={handleClearHistory} 
              className="px-2.5 py-1.5 text-xs text-text-secondary hover:text-danger transition-colors duration-150 rounded-lg hover:bg-bg-elevated flex items-center gap-1.5"
              title="Clear conversation history"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          ) : (
            <button 
              onClick={() => loginWithGoogle()}
              className="px-3 py-1.5 bg-bg-elevated hover:border-accent/50 text-text-primary border border-border-subtle rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
              title="Sign in with Google to persist chat history"
            >
              <LogIn size={13} />
              <span>Sign in to sync</span>
            </button>
          )}

          {!isInline && (
            <div className="flex items-center gap-1 ml-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)} 
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
                title="Close panel"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {(!isMinimized || isInline) && (
        <>
          {/* Centered Kimi/Gemini Message Surface */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={msg.id || idx} 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={msg.role === 'user' ? 'flex justify-end' : 'w-full'}
                >
                  {msg.role === 'user' ? (
                    /* User Message — Subtle Filled Bubble Aligned Right */
                    <div className="max-w-[85%] sm:max-w-[75%] bg-bg-elevated border border-border-subtle rounded-2xl rounded-tr-sm px-4 py-3 text-text-primary">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                      {msg.timestamp && (
                        <div className="mt-1.5 text-[11px] font-mono text-text-secondary text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* AI Response — Full-Width Unbubbled with Clean Typography */
                    <div className="w-full py-2 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-bg-surface border border-border-subtle flex items-center justify-center text-accent">
                            <BrainCircuit size={12} />
                          </span>
                          <span className="font-medium text-text-primary">U-ISMS Intelligence</span>
                          {msg.modelTier && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[11px] text-text-secondary">
                                {msg.modelTier}
                              </span>
                            </>
                          )}
                        </div>
                        {msg.timestamp && (
                          <span className="font-mono text-[11px] text-text-secondary">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="pl-7 text-sm leading-[1.65] text-text-primary space-y-3 markdown-body report-justified text-justify">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="w-full py-2 pl-7 flex items-center gap-2.5 text-xs font-mono text-text-secondary">
                  <Loader2 size={14} className="animate-spin text-accent" />
                  <span>Synthesizing telemetry with {selectedModel}...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer & Suggestion Chips Area */}
          <div className="px-4 sm:px-6 pb-5 pt-2 bg-bg-base/90 backdrop-blur-md">
            <div className="max-w-3xl mx-auto w-full space-y-3">
              {/* Top Row above Composer: Model-Tier Dropdown Chip + Quick Tactical Prompts */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Model-Tier Switcher Chip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="h-8 px-3 rounded-full bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-xs font-mono text-text-primary flex items-center gap-2 transition-colors duration-150"
                    title="Select Gemini Intelligence Model Tier"
                  >
                    <ActiveModelIcon size={13} className="text-accent" />
                    <span>{selectedModel}</span>
                    <ChevronDown size={13} className="text-text-secondary" />
                  </button>

                  {isModelMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-bg-elevated border border-border-subtle rounded-xl p-1.5 shadow-xl z-30 space-y-1">
                      {(['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'] as ModelTier[]).map((tier) => {
                        const meta = MODEL_META[tier];
                        const Icon = meta.icon;
                        const active = selectedModel === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => {
                              setSelectedModel(tier);
                              setIsModelMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors duration-150 ${
                              active
                                ? 'bg-accent text-accent-ink font-semibold'
                                : 'text-text-primary hover:bg-bg-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon size={14} className={active ? 'text-accent-ink' : 'text-accent'} />
                              <div>
                                <div className="text-xs font-mono leading-tight">{meta.label}</div>
                                <div className={`text-[11px] ${active ? 'text-accent-ink/80' : 'text-text-secondary'}`}>
                                  {meta.desc}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Tactical Prompt Suggestion Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedModel(qp.tier);
                        handleSend(qp.query);
                      }}
                      disabled={loading}
                      className="h-8 px-3 rounded-full bg-bg-surface hover:bg-bg-elevated border border-border-subtle hover:border-accent/50 text-xs text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors duration-150 disabled:opacity-40"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Large Rounded (24px) Composer */}
              <div className="relative bg-bg-elevated border border-border-subtle focus-within:border-accent rounded-[24px] px-4 py-3 transition-colors duration-150">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isRecording
                      ? 'Recording encrypted voice dispatch... Click stop to transcribe'
                      : isTranscribing
                      ? 'Transcribing audio via gemini-3.5-transcribe...'
                      : `Ask U-ISMS Intelligence (${selectedModel})...`
                  }
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none resize-none min-h-[44px] max-h-36 pr-24 leading-relaxed"
                  rows={2}
                  disabled={loading || isTranscribing}
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    disabled={loading || isTranscribing}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 border ${
                      isRecording
                        ? 'bg-danger text-white border-danger'
                        : isTranscribing
                        ? 'bg-bg-surface text-info border-info/40'
                        : 'bg-bg-surface hover:bg-bg-base text-text-secondary hover:text-text-primary border-border-subtle'
                    }`}
                    title={isRecording ? 'Stop recording & transcribe' : 'Voice dictation'}
                  >
                    {isTranscribing ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : isRecording ? (
                      <Square size={13} />
                    ) : (
                      <Mic size={15} />
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || loading || isTranscribing}
                    className="w-9 h-9 rounded-full bg-accent hover:opacity-90 text-accent-ink disabled:opacity-30 transition-all duration-150 flex items-center justify-center"
                    title="Send message"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>

              {/* Subtle Sync Footnote */}
              <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary px-2">
                <span>
                  {user
                    ? `Synced · ${user.email === 'mugisolo@gmail.com' ? 'Director Mugisolo' : user.email}`
                    : 'Local session · Sign in to persist history'}
                </span>
                <span>Confidence protocol [TIER 1–5] enforced</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
