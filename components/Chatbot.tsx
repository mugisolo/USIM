
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, X, Minimize2, Maximize2, BrainCircuit, Loader2, ShieldCheck } from 'lucide-react';
import { chatWithAnalyst } from '../services/geminiService';
import { auth, loginWithGoogle } from '../services/authService';
import { saveChatMessage, subscribeToChatHistory, updateUserMetadata, subscribeToUserMetadata } from '../services/firestoreService';
import { onAuthStateChanged } from 'firebase/auth';

import Markdown from 'react-markdown';

export const Chatbot: React.FC<{ isInline?: boolean }> = ({ isInline }) => {
  const [isOpen, setIsOpen] = useState(isInline || false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: any}[]>([
    { role: 'model', text: "U-ISMS Intelligence Analyst online. Our strategic monitoring systems are active. Mention Confidence Tiers [TIER 1-5] for any relationship claims. How can I assist the High-Command today?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Subscribe to chat history
      const unsubHistory = subscribeToChatHistory(user.uid, (historyMsgs) => {
        if (Array.isArray(historyMsgs) && historyMsgs.length > 0) {
          const formattedMsgs = historyMsgs.map(m => ({
            role: m.role as 'user' | 'model',
            text: m.text
          }));
          setMessages(formattedMsgs);
        }
      });

      // Subscribe to user metadata for super user status
      const unsubMeta = subscribeToUserMetadata(user.uid, (meta) => {
        if (meta?.isSuperUser) {
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

  const renderContent = (content: any, role: string) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    return (
      <div className="markdown-body text-inherit">
        <Markdown>{text}</Markdown>
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Super User Access Trigger
    if (input.trim() === "mugisolo 917846") {
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
                displayName: "Mugisa Solomon Byakutaaga"
            });
            setInput('');
            setMessages(prev => [...prev, { role: 'model', text: "Access Granted. Identity verified: Mugisa Solomon Byakutaaga. Super User status activated across all intelligence nodes." }]);
            return;
        }
    }

    const userMsg = input;
    const currentMessages = [...messages]; // Capture current state for history
    setInput('');
    
    // Always update UI optimistically
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setLoading(true);
    setIsTyping(true);

    // Save user message to Firestore if logged in (non-blocking)
    if (user) {
        saveChatMessage(user.uid, 'user', userMsg).catch(console.error);
    }

    const history = Array.isArray(currentMessages) ? currentMessages.map(m => ({
        role: m.role,
        parts: [{ text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text) }]
    })) : [];

    try {
        const response = await chatWithAnalyst(history, userMsg);
        
        // Update UI with model response
        setMessages(prev => [...prev, { role: 'model', text: response }]);
        
        // Save model response to Firestore if logged in
        if (user) {
            saveChatMessage(user.uid, 'model', response).catch(console.error);
        }
    } catch (error) {
        console.error("Chat error", error);
        setMessages(prev => [...prev, { role: 'model', text: "INTELLIGENCE_LEAK detected. Secure channel compromised or API limit reached. [LOCAL_OVERRIDE_ENABLED]" }]);
    } finally {
        setLoading(false);
        setIsTyping(false);
    }
  };

  if (!isOpen && !isInline) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[60] w-14 h-14 bg-crested-gold hover:bg-watch-gold text-lake-victoria rounded-sm shadow-[0_10px_30px_rgba(212,175,55,0.3)] flex items-center justify-center transition-all hover:scale-110 animate-fade-in"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const containerClasses = isInline 
    ? "h-full w-full flex flex-col overflow-hidden bg-lake-victoria"
    : `fixed z-[70] bg-lake-victoria border-t md:border border-white/5 md:rounded-xl shadow-2xl flex flex-col transition-all duration-500 overflow-hidden ${isMinimized ? 'bottom-20 right-4 md:bottom-6 md:right-6 w-72 h-14' : 'inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[480px] md:h-[730px]'}`;

  return (
    <div className={containerClasses}>
      
      {!isInline && (
        <div className={`h-16 md:h-14 bg-kampala-obsidian border-b border-white/5 flex items-center justify-between px-5 md:px-4 shrink-0 ${!isInline ? 'cursor-pointer' : ''}`} onClick={() => !isInline && isMinimized && setIsMinimized(false)}>
          <div className="flex items-center gap-3 md:gap-2">
            <div className={`w-8 h-8 rounded-sm bg-crested-gold/10 flex items-center justify-center border border-crested-gold/20 ${loading ? 'animate-pulse' : ''}`}>
              <BrainCircuit size={20} className="text-crested-gold" />
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-white text-[10px] uppercase tracking-[0.2em] leading-none ${loading ? 'glitch-text' : ''}`} data-text="Intelligence Node">Intelligence Node</span>
              <div className="flex items-center gap-1 mt-1">
                 {isSuperUser ? (
                   <>
                     <ShieldCheck size={10} className="text-savanna-sage" />
                     <span className="text-[9px] text-savanna-sage uppercase font-black tracking-tighter">Super User Verified</span>
                   </>
                 ) : (
                   <>
                     <span className="w-1.5 h-1.5 rounded-full bg-savanna-sage animate-pulse"></span>
                     <span className="text-[9px] text-savanna-sage uppercase font-bold tracking-tighter shadow-[0_0_5px_var(--color-savanna-sage)]">Hyper-Local Sync Active</span>
                   </>
                 )}
              </div>
            </div>
          </div>
          {!isInline && (
            <div className="flex items-center gap-4 md:gap-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => setIsMinimized(!isMinimized)} className="hidden md:block text-crane-grey hover:text-white p-1">
                 {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-crane-grey hover:text-white p-2 md:p-1 bg-white/5 rounded-full">
                 <X size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {(!isMinimized || isInline) && (
        <>
          <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-lake-victoria/20 scroll-smooth custom-scrollbar`}>
            {Array.isArray(messages) && messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[92%] md:max-w-[85%] p-4 rounded-sm border ${
                  msg.role === 'user' 
                    ? 'bg-crested-gold/10 border-crested-gold/30 text-pearl-africa shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                    : 'bg-kampala-obsidian/80 border-white/5 text-pearl-africa backdrop-blur-md'
                }`}>
                  <div className={`text-[8px] uppercase font-black tracking-[0.3em] mb-2 font-mono flex items-center gap-2 ${msg.role === 'user' ? 'justify-end text-crested-gold' : 'justify-start text-crane-grey'}`}>
                    {msg.role === 'user' ? (
                      <>COMMAND_LIAISON <div className="w-1 h-1 rounded-full bg-crested-gold animate-pulse" /></>
                    ) : (
                      <><div className="w-1 h-1 rounded-full bg-savanna-sage shadow-[0_0_5px_var(--color-savanna-sage)]" /> STRATEGIST_AI</>
                    )}
                  </div>
                  <div className={`whitespace-pre-wrap font-sans text-[13px] leading-relaxed tracking-tight ${msg.role === 'user' ? 'text-crested-gold' : 'text-pearl-africa'}`}>
                    {renderContent(msg.text, msg.role)}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
               <div className="flex justify-start animate-pulse">
                 <div className="bg-kampala-obsidian border border-white/5 p-4 rounded-sm flex items-center gap-4 text-crane-grey text-[9px] font-black uppercase tracking-[0.3em]">
                    <div className="flex gap-1.5">
                        <span className="w-1 h-1 bg-crested-gold rounded-full animate-bounce [animation-delay:0ms]"></span>
                        <span className="w-1 h-1 bg-crested-gold rounded-full animate-bounce [animation-delay:200ms]"></span>
                        <span className="w-1 h-1 bg-crested-gold rounded-full animate-bounce [animation-delay:400ms]"></span>
                    </div>
                    Recalculating theater logic...
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-lake-victoria border-t border-white/5">
            <div className="max-w-lg mx-auto relative group">
               <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                  }}
                  placeholder="Ask mugi-solo to transmit strategic protocols"
                  className="w-full bg-kampala-obsidian border border-white/10 rounded-sm px-4 py-4 pr-14 text-sm text-pearl-africa focus:outline-none focus:border-crested-gold/50 transition-all placeholder:text-crane-grey/40 resize-none min-h-[56px] max-h-32 custom-scrollbar font-mono uppercase tracking-tight"
                  rows={1}
                  disabled={loading}
               />
               <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-crested-gold text-lake-victoria rounded-sm disabled:opacity-20 transition-all flex items-center justify-center shadow-lg active:scale-90"
               >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
               </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-[8px] font-mono text-crane-grey uppercase tracking-[0.3em] px-1 max-w-lg mx-auto">
                <span className="flex items-center gap-1.5">
                   <div className="w-1 h-1 rounded-full bg-savanna-sage animate-pulse" />
                   SECURE_TUNNEL_01
                </span>
                <span className="opacity-40 select-none">V4.2_TACTICAL_CHAT</span>
            </div>
          </div>
        </>
      )}
    </div>

  );
};
