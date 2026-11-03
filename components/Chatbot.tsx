import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2,
  Mic,
  Square
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

export const Chatbot: React.FC<{ isInline?: boolean }> = ({ isInline }) => {
  const [isOpen, setIsOpen] = useState(isInline || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelTier>('gemini-3.8-flash');
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
      // Subscribe to real-time chat history persisted in Firestore
      const unsubHistory = subscribeToChatHistory(user.uid, (historyMsgs) => {
        if (Array.isArray(historyMsgs) && historyMsgs.length > 0) {
          const formattedMsgs: ChatMessage[] = historyMsgs.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'model',
            text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text),
            modelTier: m.modelTier || 'gemini-3.8-flash',
            timestamp: m.timestamp || new Date().toISOString()
          }));
          setMessages(formattedMsgs);
        }
      });

      // Subscribe to user metadata for super user status and privileges
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
    
    // Optimistic UI update
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      modelTier: selectedModel, 
      timestamp: new Date().toISOString() 
    }]);
    
    setLoading(true);

    // Operational audit logging
    logOperationalAction(
      `Intelligence Query [${selectedModel}]: "${userMsg.length > 60 ? userMsg.substring(0, 57) + '...' : userMsg}"`, 
      'USER_QUERY', 
      isSuperUser ? 'Comrade Mugisolo' : 'LIAISON_01'
    );

    // Save user message to Firestore if authenticated
    if (user) {
      saveChatMessage(user.uid, 'user', userMsg, selectedModel).catch(console.error);
    }

    const history = Array.isArray(currentMessages) ? currentMessages.map(m => ({
      role: m.role,
      parts: [{ text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text) }]
    })) : [];

    try {
      const response = await chatWithAnalyst(history, userMsg, selectedModel);
      
      // Update UI with model response
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response, 
        modelTier: selectedModel, 
        timestamp: new Date().toISOString() 
      }]);
      
      // Save model response to Firestore if authenticated
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
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[60] w-14 h-14 bg-crested-gold hover:bg-watch-gold text-lake-victoria rounded-sm shadow-[0_10px_30px_rgba(212,175,55,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-fade-in"
        title="Open U-ISMS Strategic Intelligence Chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const containerClasses = isInline 
    ? "h-full w-full flex flex-col overflow-hidden bg-lake-victoria"
    : `fixed z-[70] bg-lake-victoria border-t md:border border-white/5 md:rounded-xl shadow-2xl flex flex-col transition-all duration-500 overflow-hidden ${isMinimized ? 'bottom-20 right-4 md:bottom-6 md:right-6 w-72 h-14' : 'inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[500px] md:h-[750px]'}`;

  return (
    <div className={containerClasses}>
      {/* 1. Chat Header */}
      <div className="h-16 md:h-14 bg-kampala-obsidian border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-sm bg-crested-gold/10 flex items-center justify-center border border-crested-gold/20 ${loading ? 'animate-pulse' : ''}`}>
            <BrainCircuit size={18} className="text-crested-gold" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-[11px] uppercase tracking-[0.2em] leading-none">Intelligence Command</span>
              {isSuperUser ? (
                <span className="text-[8px] bg-crested-gold/10 text-crested-gold border border-crested-gold/30 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <ShieldCheck size={9} />
                  MUGISOLO
                </span>
              ) : (
                <span className="text-[8px] bg-savanna-sage/10 text-savanna-sage border border-savanna-sage/20 px-1.5 py-0.5 rounded font-mono font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <span className="text-[9px] text-crane-grey font-mono mt-0.5">
              Uganda Strategic Intelligence (U-ISMS)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button 
              onClick={handleClearHistory} 
              className="p-1.5 text-crane-grey hover:text-brotherhood-crimson transition-colors rounded hover:bg-white/5"
              title="Clear conversation"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <button 
              onClick={() => loginWithGoogle()}
              className="px-2 py-1 bg-crested-gold/20 hover:bg-crested-gold/30 text-crested-gold border border-crested-gold/40 rounded text-[9px] font-mono font-black flex items-center gap-1"
              title="Authenticate with Google to persist history"
            >
              <LogIn size={11} />
              SIGN IN
            </button>
          )}

          {!isInline && (
            <>
              <button onClick={() => setIsMinimized(!isMinimized)} className="hidden md:block text-crane-grey hover:text-white p-1">
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-crane-grey hover:text-white p-1 bg-white/5 rounded-full">
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {(!isMinimized || isInline) && (
        <>
          {/* 2. Model Tier Selection Bar */}
          <div className="px-3 py-2 bg-kampala-obsidian/90 border-b border-white/5 flex items-center justify-between text-[9px] font-mono">
            <span className="text-crane-grey font-bold uppercase tracking-wider hidden sm:inline">Engine:</span>
            <div className="flex items-center gap-1 w-full sm:w-auto justify-between">
              {/* Tier 1: Argon (Complex) */}
              <button
                onClick={() => setSelectedModel('gemini-4-argon')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 font-bold ${
                  selectedModel === 'gemini-4-argon'
                    ? 'bg-crested-gold text-lake-victoria shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                    : 'bg-white/5 text-crane-grey hover:text-white hover:bg-white/10'
                }`}
                title="gemini-4-argon: Complex strategic synthesis, deep reasoning, military statecraft"
              >
                <Sparkles size={11} />
                <span>gemini-4-argon</span>
              </button>

              {/* Tier 2: Flash (General) */}
              <button
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 font-bold ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-intel-blue text-white shadow-[0_0_10px_rgba(79,142,247,0.4)]'
                    : 'bg-white/5 text-crane-grey hover:text-white hover:bg-white/10'
                }`}
                title="gemini-3.8-flash: General situational analyst, multi-turn chat, SITREPs"
              >
                <Cpu size={11} />
                <span>gemini-3.8-flash</span>
              </button>

              {/* Tier 3: Flash-Lite (Fast) */}
              <button
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 font-bold ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-savanna-sage text-lake-victoria shadow-[0_0_10px_rgba(92,184,92,0.4)]'
                    : 'bg-white/5 text-crane-grey hover:text-white hover:bg-white/10'
                }`}
                title="gemini-3.1-flash-lite: Fast tactical telemetry, live stats, rapid triage"
              >
                <Zap size={11} />
                <span>gemini-3.1-flash-lite</span>
              </button>
            </div>
          </div>

          {/* 3. Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-lake-victoria/30 scroll-smooth custom-scrollbar">
            {messages.map((msg, idx) => (
              <motion.div 
                key={msg.id || idx} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[92%] md:max-w-[88%] p-3.5 rounded-sm border ${
                  msg.role === 'user' 
                    ? 'bg-crested-gold/10 border-crested-gold/30 text-pearl-africa shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                    : 'bg-kampala-obsidian/85 border-white/10 text-pearl-africa backdrop-blur-md'
                }`}>
                  <div className={`text-[8px] uppercase font-black tracking-[0.25em] mb-2 font-mono flex items-center justify-between ${
                    msg.role === 'user' ? 'text-crested-gold' : 'text-crane-grey'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {msg.role === 'user' ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-crested-gold animate-pulse" />
                          <span>COMRADE MUGISOLO</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-savanna-sage shadow-[0_0_5px_var(--color-savanna-sage)]" />
                          <span>U-ISMS HIGH COMMAND ANALYST</span>
                        </>
                      )}
                    </span>
                    {msg.modelTier && msg.role === 'model' && (
                      <span className="text-[7px] text-crane-grey/60 px-1 py-0.5 rounded bg-white/5 border border-white/5 font-mono">
                        {msg.modelTier}
                      </span>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed tracking-tight text-pearl-africa markdown-body">
                    <Markdown>{msg.text}</Markdown>
                  </div>

                  {msg.timestamp && (
                    <div className="text-[7px] font-mono text-crane-grey/40 text-right mt-1.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-kampala-obsidian border border-white/10 p-3.5 rounded-sm flex items-center gap-3 text-crane-grey text-[9px] font-black uppercase tracking-[0.25em]">
                  <Loader2 size={14} className="animate-spin text-crested-gold" />
                  <span>Synthesizing multi-domain telemetry [{selectedModel}]...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. Quick Strategic Intelligence Triggers */}
          <div className="px-3 py-1.5 bg-kampala-obsidian/70 border-t border-white/5 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0">
            <span className="text-[8px] font-mono font-bold text-crane-grey uppercase shrink-0">PRESETS:</span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedModel(qp.tier);
                  handleSend(qp.query);
                }}
                disabled={loading}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[8px] font-mono text-pearl-africa whitespace-nowrap transition-all hover:border-crested-gold/30 disabled:opacity-30"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* 5. Input Area */}
          <div className="p-3 bg-lake-victoria border-t border-white/5">
            <div className="relative group">
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
                    : `Brief U-ISMS High-Command via ${selectedModel}...`
                }
                className="w-full bg-kampala-obsidian border border-white/10 rounded px-3.5 py-3 pr-24 text-xs text-pearl-africa focus:outline-none focus:border-crested-gold/50 transition-all placeholder:text-crane-grey/40 resize-none min-h-[48px] max-h-28 custom-scrollbar font-mono tracking-tight"
                rows={1}
                disabled={loading || isTranscribing}
              />
              <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={loading || isTranscribing}
                  className={`w-9 h-full rounded transition-all flex items-center justify-center border ${
                    isRecording
                      ? 'bg-brotherhood-crimson text-white border-brotherhood-crimson animate-pulse shadow-[0_0_12px_rgba(196,30,58,0.5)]'
                      : isTranscribing
                      ? 'bg-intel-blue/20 text-intel-blue border-intel-blue/40'
                      : 'bg-white/5 hover:bg-white/10 text-crane-grey hover:text-crested-gold border-white/10'
                  }`}
                  title={isRecording ? 'Stop recording & transcribe (gemini-3.5-transcribe)' : 'Voice dictation (gemini-3.5-transcribe)'}
                >
                  {isTranscribing ? (
                    <Loader2 size={14} className="animate-spin text-intel-blue" />
                  ) : isRecording ? (
                    <Square size={13} />
                  ) : (
                    <Mic size={14} />
                  )}
                </button>
                <button 
                  onClick={() => handleSend()} 
                  disabled={!input.trim() || loading || isTranscribing}
                  className="w-9 h-full bg-crested-gold hover:bg-watch-gold text-lake-victoria rounded disabled:opacity-20 transition-all flex items-center justify-center shadow-md active:scale-90"
                  title="Transmit query"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-[8px] font-mono text-crane-grey uppercase tracking-[0.25em] px-1">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-savanna-sage' : 'bg-watch-gold'} animate-pulse`} />
                {user ? `FIRESTORE SYNC: ${user.email === 'mugisolo@gmail.com' ? 'MUGISOLO (ADMIN)' : user.email?.split('@')[0]}` : 'LOCAL MODE (SIGN IN TO SYNC)'}
              </span>
              <span className="opacity-50 select-none">U-ISMS // ENCRYPTED</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
