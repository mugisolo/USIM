import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Plus, 
  RefreshCw, 
  LogOut, 
  Lock, 
  ShieldCheck, 
  FileText, 
  FolderOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Link as LinkIcon, 
  Sparkles,
  Layers,
  FileCode,
  User,
  Database
} from 'lucide-react';
import { googleSignIn, initAuth, getAccessToken, logout, auth } from '../services/googleAuthService';
import { Incident, PEPProfile, StrategicAsset } from '../types';

interface WorkspaceManagerProps {
  incidents: Incident[];
  peps: PEPProfile[];
  assets: StrategicAsset[];
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ peps, assets }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'calendar' | 'drive'>('tasks');
  const [error, setError] = useState<string | null>(null);

  // Google Tasks State
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Google Calendar State
  const [events, setEvents] = useState<any[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Google Picker / Drive state
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedPepId, setSelectedPepId] = useState('');
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  // Load script for Google Picker
  const loadPickerScript = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).google && (window as any).google.picker) {
        resolve((window as any).google);
        return;
      }

      // Check if already injected
      const existingScript = document.getElementById('google-api-script');
      if (existingScript) {
        // Wait until loaded
        const interval = setInterval(() => {
          if ((window as any).google?.picker) {
            clearInterval(interval);
            resolve((window as any).google);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('picker', {
          callback: () => {
            resolve((window as any).google);
          },
          onerror: () => {
            reject(new Error('Failed to load Google Picker via gapi.load'));
          }
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API bootstrap script'));
      document.body.appendChild(script);
    });
  }, []);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        setAccessToken(token);
        setCurrentUser(user);
        setIsLoading(false);
      },
      () => {
        setIsAuthenticated(false);
        setAccessToken(null);
        setCurrentUser(null);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsAuthenticated(true);
        setAccessToken(result.accessToken);
        setCurrentUser(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Disconnect from Google Workspace? Your active security session will end.');
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      await logout();
      setIsAuthenticated(false);
      setAccessToken(null);
      setCurrentUser(null);
      setTaskLists([]);
      setTasks([]);
      setEvents([]);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Tasks API integration
  const fetchTaskLists = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load task lists');
      const data = await response.json();
      setTaskLists(data.items || []);
      if (data.items && data.items.length > 0) {
        setSelectedTaskList(data.items[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Google Tasks API unavailable. Ensure you have allowed permissions.');
    }
  }, []);

  const fetchTasks = useCallback(async (token: string, listId: string) => {
    if (!listId) return;
    try {
      const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.items || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleToggleTask = async (task: any) => {
    if (!accessToken || !selectedTaskList) return;
    const isCompleted = task.status === 'completed';
    const newStatus = isCompleted ? 'needsAction' : 'completed';

    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedTaskList}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          completed: newStatus === 'completed' ? new Date().toISOString() : null
        })
      });
      if (!response.ok) throw new Error('Failed to update task status');
      fetchTasks(accessToken, selectedTaskList);
    } catch (err: any) {
      setError('Failed to update task. Reverting state.');
      fetchTasks(accessToken, selectedTaskList);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedTaskList || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedTaskList}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `[SFC ORDER] ${newTaskTitle}`,
          notes: newTaskNotes,
          due: new Date(Date.now() + 86400000 * 2).toISOString() // Default 2 days due
        })
      });
      if (!response.ok) throw new Error('Failed to insert new order');
      setNewTaskTitle('');
      setNewTaskNotes('');
      fetchTasks(accessToken, selectedTaskList);
    } catch (err: any) {
      setError('Failed to deploy operational order to Google Tasks.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Google Calendar API integration
  const fetchCalendarEvents = useCallback(async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load events');
      const data = await response.json();
      setEvents(data.items?.slice(0, 10) || []);
    } catch (err) {
      console.error(err);
      setError('Google Calendar API unavailable. Check scopes config.');
    }
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newEventTitle.trim() || !newEventDate || !newEventTime) return;

    // Direct User Confirmation Dialog
    const confirmed = window.confirm(`Schedule SFC Intelligence briefing: "${newEventTitle}" for ${newEventDate} at ${newEventTime}? This will modify your real Google Calendar.`);
    if (!confirmed) return;

    setIsCreatingEvent(true);
    try {
      const startDateTime = new Date(`${newEventDate}T${newEventTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 3600000); // Default 1 hour duration

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `🛡️ U-ISMS BRIEFING: ${newEventTitle}`,
          description: `UGANDA INTELLIGENCE NATIONAL SECURITY BRIEFING:\n\n${newEventDesc}\n\nGenerated via U-ISMS Tactical Hub.`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: 'SFC Joint Command Headquarters, Entebbe'
        })
      });

      if (!response.ok) throw new Error('Failed to insert event');
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventDate('');
      setNewEventTime('');
      fetchCalendarEvents(accessToken);
      alert('Security Briefing scheduled successfully on Google Calendar!');
    } catch (err: any) {
      setError('Failed to schedule security briefing on your calendar.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Google Picker integration
  const handleOpenPicker = async () => {
    if (!accessToken) return;
    setIsPickerLoading(true);
    setError(null);
    try {
      const google = await loadPickerScript();
      
      const pickerOrigin = window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setMimeTypes('image/jpeg,image/png,application/pdf,application/vnd.google-apps.document,text/plain');

      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .setOrigin(pickerOrigin)
        .setTitle('Select Tactical Intelligence Document / Signal Dossier')
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      setError('Google Picker could not be displayed. Ensure third-party cookies or popups are not blocked.');
      console.error(err);
    } finally {
      setIsPickerLoading(false);
    }
  };

  const pickerCallback = (data: any) => {
    if (data.action === 'picked') {
      const file = data.docs[0];
      const newAttachment = {
        id: file.id,
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
        size: file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : 'N/A',
        linkedAsset: selectedAssetId ? assets.find(a => a.id === selectedAssetId)?.name : null,
        linkedPep: selectedPepId ? peps.find(p => p.id === selectedPepId)?.name : null,
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Store in local list
      setAttachedFiles(prev => [newAttachment, ...prev]);

      // Reset dropdowns
      setSelectedAssetId('');
      setSelectedPepId('');
    }
  };

  // Sync state with selected list change
  useEffect(() => {
    if (accessToken && selectedTaskList) {
      fetchTasks(accessToken, selectedTaskList);
    }
  }, [selectedTaskList, accessToken, fetchTasks]);

  // Fetch all initially on tab switch
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      if (activeSubTab === 'tasks') {
        fetchTaskLists(accessToken);
      } else if (activeSubTab === 'calendar') {
        fetchCalendarEvents(accessToken);
      }
    }
  }, [activeSubTab, isAuthenticated, accessToken, fetchTaskLists, fetchCalendarEvents]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw size={32} className="text-crested-gold animate-spin mb-4" />
        <p className="text-xs font-mono text-crane-grey uppercase tracking-widest">Awaiting Security Ingress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Tab Header Banner */}
      <div className="stacked-precision-card p-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-crested-gold" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-crested-gold" size={18} />
              <h2 className="text-pearl-africa font-black tracking-tighter text-xl uppercase leading-none">Command Operations Hub</h2>
            </div>
            <p className="text-[9px] font-mono text-infra-steel uppercase tracking-widest mt-1.5">
              Secure Google Workspace Integrations (Tasks, Calendar & Picker)
            </p>
          </div>
          {isAuthenticated && currentUser && (
            <div className="flex items-center gap-3 bg-kampala-obsidian border border-white/5 p-2 rounded">
              <div className="w-8 h-8 rounded-sm bg-crested-gold/10 border border-crested-gold/30 flex items-center justify-center">
                <User size={16} className="text-crested-gold" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-pearl-africa tracking-wide max-w-[150px] truncate">{currentUser.displayName || currentUser.email}</p>
                <p className="text-[8px] font-mono text-savanna-sage uppercase tracking-wider">Level 5 Clearance</p>
              </div>
              <button 
                onClick={handleSignOut}
                title="Disconnect Workspace"
                className="p-1.5 text-crane-grey hover:text-brotherhood-crimson hover:bg-white/5 rounded transition-colors ml-2"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-brotherhood-crimson/10 border border-brotherhood-crimson/30 p-4 rounded text-xs flex gap-3 items-start animate-shake">
          <AlertCircle size={16} className="text-brotherhood-crimson shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-pearl-africa uppercase tracking-wider">System Exception Raised</p>
            <p className="text-crane-grey font-mono text-[10px] uppercase">{error}</p>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="stacked-precision-card p-12 text-center flex flex-col items-center justify-center space-y-6">
          <div className="p-4 rounded-full bg-crested-gold/5 border border-crested-gold/20 relative">
            <Lock size={36} className="text-crested-gold animate-pulse" />
            <div className="absolute inset-0 border border-crested-gold/20 rounded-full scale-110" />
          </div>
          
          <div className="space-y-2 max-w-sm">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-pearl-africa">WORKSPACE PERMISSION MANDATE</h3>
            <p className="text-[10px] text-crane-grey leading-relaxed uppercase font-mono">
              In order to map tactical tasks, schedule security briefings, and attach OSINT signal documents, you must establish an authorized link with your Google Workspace Account.
            </p>
          </div>

          <button 
            onClick={handleSignIn}
            className="gsi-material-button hover:scale-102 active:scale-98 transition-all"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">Sign in with Google</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub Tab Controls */}
          <div className="grid grid-cols-3 gap-1 bg-kampala-obsidian p-1 rounded border border-white/5">
            {[
              { id: 'tasks', label: 'Command Tasks', icon: CheckSquare },
              { id: 'calendar', label: 'Briefings Schedule', icon: CalendarIcon },
              { id: 'drive', label: 'Intel Dossier Upload', icon: FolderOpen }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center justify-center gap-2 py-3 rounded text-[10px] font-black uppercase tracking-wider transition-all ${activeSubTab === tab.id ? 'bg-crested-gold text-lake-victoria font-extrabold' : 'text-crane-grey hover:text-white'}`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* GOOGLE TASKS SUB TAB */}
              {activeSubTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Create New Task Form */}
                  <div className="stacked-precision-card p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="text-crested-gold animate-pulse" size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa">Issue Tactical Command Order</h3>
                    </div>
                    
                    <form onSubmit={handleCreateTask} className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Order Title</label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="e.g. Conduct border threat assessment at Albertine"
                          className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa font-medium placeholder-crane-grey/40 focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Operational Details (Notes)</label>
                        <textarea
                          rows={2}
                          value={newTaskNotes}
                          onChange={(e) => setNewTaskNotes(e.target.value)}
                          placeholder="Add mission logs, guidelines, or coordinate pointers..."
                          className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa font-medium placeholder-crane-grey/40 focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isCreatingTask}
                          className="px-5 py-2 bg-crested-gold text-lake-victoria text-[10px] font-black uppercase tracking-widest rounded hover:bg-crested-gold/90 transition-all flex items-center gap-1.5"
                        >
                          {isCreatingTask ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <CheckSquare size={12} />
                          )}
                          <span>Deploy Order</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Tasks List */}
                  <div className="stacked-precision-card p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="text-crested-gold" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa">Active Task Registers</h3>
                      </div>
                      
                      {taskLists.length > 0 && (
                        <select
                          value={selectedTaskList}
                          onChange={(e) => setSelectedTaskList(e.target.value)}
                          className="bg-kampala-obsidian border border-white/10 px-3 py-1.5 rounded text-[10px] font-black text-crested-gold uppercase tracking-wider focus:outline-none focus:border-crested-gold"
                        >
                          {taskLists.map(list => (
                            <option key={list.id} value={list.id}>{list.title}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {tasks.length === 0 ? (
                        <p className="text-center py-6 text-[10px] text-crane-grey font-mono uppercase tracking-widest">
                          No tactical tasks scheduled in this register.
                        </p>
                      ) : (
                        tasks.map(task => {
                          const isDone = task.status === 'completed';
                          return (
                            <div 
                              key={task.id}
                              onClick={() => handleToggleTask(task)}
                              className={`flex items-start gap-3 p-3 bg-kampala-obsidian/45 border rounded hover:border-white/15 transition-all cursor-pointer ${isDone ? 'border-savanna-sage/20 opacity-60' : 'border-white/5'}`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${isDone ? 'bg-savanna-sage/20 border-savanna-sage text-savanna-sage' : 'border-crane-grey/30 text-transparent'}`}>
                                <CheckCircle2 size={12} />
                              </div>
                              <div className="flex-grow space-y-1 text-left">
                                <p className={`text-xs font-bold leading-tight uppercase tracking-tight ${isDone ? 'line-through text-crane-grey' : 'text-pearl-africa font-mono'}`}>
                                  {task.title}
                                </p>
                                {task.notes && (
                                  <p className="text-[9px] text-crane-grey font-mono leading-relaxed max-w-sm truncate">
                                    {task.notes}
                                  </p>
                                )}
                                {task.due && (
                                  <div className="flex items-center gap-1 text-[8px] font-mono text-crane-grey">
                                    <Clock size={10} />
                                    <span>DUE: {new Date(task.due).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE CALENDAR SUB TAB */}
              {activeSubTab === 'calendar' && (
                <div className="space-y-6">
                  {/* Schedule Briefing Form */}
                  <div className="stacked-precision-card p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="text-crested-gold animate-pulse" size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa">Schedule SFC Briefing / Assembly</h3>
                    </div>

                    <form onSubmit={handleCreateEvent} className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Briefing Topic</label>
                        <input
                          type="text"
                          required
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. Regional Security Matrix Alignment"
                          className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa font-medium placeholder-crane-grey/40 focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Intelligence Objectives</label>
                        <textarea
                          rows={2}
                          value={newEventDesc}
                          onChange={(e) => setNewEventDesc(e.target.value)}
                          placeholder="List meeting goals, security criteria, or attendees..."
                          className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa font-medium placeholder-crane-grey/40 focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Briefing Date</label>
                          <input
                            type="date"
                            required
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1.5">Briefing Time</label>
                          <input
                            type="time"
                            required
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className="w-full bg-kampala-obsidian border border-white/10 p-3 rounded text-xs text-pearl-africa focus:border-crested-gold focus:outline-none focus:ring-1 focus:ring-crested-gold/30 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isCreatingEvent}
                          className="px-5 py-2 bg-crested-gold text-lake-victoria text-[10px] font-black uppercase tracking-widest rounded hover:bg-crested-gold/90 transition-all flex items-center gap-1.5"
                        >
                          {isCreatingEvent ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <CalendarIcon size={12} />
                          )}
                          <span>Sync Schedule</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Calendar Events List */}
                  <div className="stacked-precision-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="text-crested-gold" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa">High-Command Schedule</h3>
                      </div>
                      <button 
                        onClick={() => accessToken && fetchCalendarEvents(accessToken)}
                        title="Reload Calendar"
                        className="text-crane-grey hover:text-white transition-colors p-1"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {events.length === 0 ? (
                        <p className="text-center py-6 text-[10px] text-crane-grey font-mono uppercase tracking-widest">
                          No upcoming security briefings on record.
                        </p>
                      ) : (
                        events.map(event => {
                          const start = event.start?.dateTime || event.start?.date;
                          const dateStr = start ? new Date(start).toLocaleDateString() : '';
                          const timeStr = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day';
                          
                          return (
                            <div 
                              key={event.id}
                              className="p-3 bg-kampala-obsidian border border-white/5 rounded text-left space-y-2 group hover:border-crested-gold/20 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-pearl-africa uppercase tracking-tight font-mono">
                                    {event.summary}
                                  </p>
                                  {event.location && (
                                    <p className="text-[9px] text-crane-grey font-mono uppercase">
                                      📍 {event.location}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="inline-block bg-crested-gold/10 text-crested-gold text-[8px] font-mono px-2 py-0.5 rounded font-black uppercase">
                                    {dateStr}
                                  </span>
                                  <p className="text-[8px] font-mono text-infra-steel uppercase mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                              {event.description && (
                                <p className="text-[9px] text-crane-grey font-mono leading-relaxed border-t border-white/5 pt-2 max-h-16 overflow-y-auto custom-scrollbar">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE PICKER / DRIVE UPLOAD TAB */}
              {activeSubTab === 'drive' && (
                <div className="space-y-6">
                  {/* Intel Dossier Attacher Control */}
                  <div className="stacked-precision-card p-6 relative overflow-hidden text-center space-y-5">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-crested-gold" />
                    
                    <div className="flex justify-center">
                      <div className="p-3 rounded bg-crested-gold/5 border border-crested-gold/10 text-crested-gold">
                        <FolderOpen size={24} className="animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-sm mx-auto">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pearl-africa">Tactical Signal Attacher</h3>
                      <p className="text-[9px] text-crane-grey font-mono uppercase leading-relaxed">
                        Securely search and pull satellite imagery, PDF dossiers, or OSINT briefing transcripts directly from your Google Drive using the secure Google Picker API.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left pt-2">
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1">Link to Strategic Asset</label>
                        <select
                          value={selectedAssetId}
                          onChange={(e) => setSelectedAssetId(e.target.value)}
                          className="w-full bg-kampala-obsidian border border-white/10 px-3 py-2.5 rounded text-[10px] text-crested-gold font-mono uppercase tracking-wider focus:outline-none focus:border-crested-gold"
                        >
                          <option value="">-- No Asset Link --</option>
                          {assets.map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-infra-steel uppercase tracking-widest mb-1">Link to Actor Profile</label>
                        <select
                          value={selectedPepId}
                          onChange={(e) => setSelectedPepId(e.target.value)}
                          className="w-full bg-kampala-obsidian border border-white/10 px-3 py-2.5 rounded text-[10px] text-crested-gold font-mono uppercase tracking-wider focus:outline-none focus:border-crested-gold"
                        >
                          <option value="">-- No Actor Link --</option>
                          {peps.map(pep => (
                            <option key={pep.id} value={pep.id}>{pep.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleOpenPicker}
                        disabled={isPickerLoading}
                        className="px-6 py-3 bg-crested-gold text-lake-victoria text-[10px] font-black uppercase tracking-widest rounded hover:bg-crested-gold/90 transition-all flex items-center gap-2"
                      >
                        {isPickerLoading ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <FolderOpen size={14} />
                        )}
                        <span>Open Google Picker</span>
                      </button>
                    </div>
                  </div>

                  {/* Attached Files List */}
                  <div className="stacked-precision-card p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <FolderOpen className="text-crested-gold" size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest text-pearl-africa">Attached Tactical Dossiers</h3>
                    </div>

                    <div className="space-y-2">
                      {attachedFiles.length === 0 ? (
                        <p className="text-center py-6 text-[10px] text-crane-grey font-mono uppercase tracking-widest">
                          No intelligence documents linked in this session.
                        </p>
                      ) : (
                        attachedFiles.map(file => (
                          <div 
                            key={file.id}
                            className="p-3 bg-kampala-obsidian border border-white/5 rounded text-left flex items-start justify-between gap-4 group hover:border-crested-gold/20 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <FileText size={14} className="text-crested-gold" />
                                <span className="text-xs font-bold text-pearl-africa font-mono truncate max-w-[180px]">
                                  {file.name}
                                </span>
                              </div>
                              <p className="text-[8px] font-mono text-infra-steel uppercase">
                                Type: {file.mimeType.split('/').pop()} | Size: {file.size}
                              </p>
                              
                              {/* Metadata linkages */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {file.linkedAsset && (
                                  <span className="bg-lake-victoria text-crested-gold text-[7px] font-mono font-black uppercase px-2 py-0.5 rounded border border-crested-gold/10 flex items-center gap-1">
                                    <Database size={8} /> ASSET: {file.linkedAsset}
                                  </span>
                                )}
                                {file.linkedPep && (
                                  <span className="bg-lake-victoria text-savanna-sage text-[7px] font-mono font-black uppercase px-2 py-0.5 rounded border border-savanna-sage/10 flex items-center gap-1">
                                    <User size={8} /> ACTOR: {file.linkedPep}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between h-full min-h-[40px]">
                              <span className="text-[7px] font-mono text-infra-steel uppercase">{file.timestamp}</span>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer referrer"
                                className="text-[9px] font-mono font-black text-crested-gold uppercase flex items-center gap-0.5 hover:underline group-hover:translate-x-0.5 transition-transform mt-2"
                              >
                                View File <ArrowUpRight size={10} />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
