import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Message {
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  tag?: string | null;
  type: 'text' | 'image';
  dataUrl?: string | null;
}

interface Session {
  id: string;
  title: string;
  history: Message[];
  state: 'PHOTO_GATE' | 'CHAT';
  activePlantContext: string;
  lastUpdated: number;
}

interface PendingImage {
  mime: string;
  data: string;
  preview: string;
}

interface Theme {
  primary?: string;
  accent?: string;
  bg?: string;
  panel?: string;
  text?: string;
}

// Config
const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:8787',
  title: 'Agricoole',
  position: 'right' as 'left' | 'right',
  primaryColor: '#10b981',
  accentColor: '#f59e0b',
  bgColor: '#0f172a',
  panelBg: '#1e293b',
  textColor: '#f1f5f9',
  autoAnalyze: true,
  maxHistory: 50,
  maxImageMb: 5,
  maxImageWidth: 1200,
};

// Storage keys
const STORAGE_KEY_SESSIONS = 'agricoole_sessions';
const STORAGE_KEY_ACTIVE = 'agricoole_active_session';
const STORAGE_KEY_THEME = 'agricoole_theme';

// Icons as SVG strings
const ICONS = {
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  scan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  leaf: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22c1-6 4-12 10-14 6 2 9 8 10 14"/><path d="M12 8c-4 1-6 4-7 8"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  paperclip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  reset: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

// Utility functions
function newSession(title: string): Session {
  return {
    id: 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    title,
    history: [],
    state: 'PHOTO_GATE',
    activePlantContext: '',
    lastUpdated: Date.now(),
  };
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions', e);
  }
  return [];
}

function saveSessions(sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

function loadActiveSessionId(sessions: Session[]): string | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (id && sessions.some(s => s.id === id)) return id;
    if (sessions.length) {
      const sorted = [...sessions].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      return sorted[0].id;
    }
  } catch (e) {
    console.error('Failed to load active session ID', e);
  }
  return null;
}

function setActiveSessionId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch (e) {
    console.error('Failed to set active session ID', e);
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load theme', e);
  }
  return {};
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
  } catch (e) {
    console.error('Failed to save theme', e);
  }
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function processImageFile(file: File, maxWidth: number): Promise<{ dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({ dataUrl });
      };
      img.onerror = () => reject(new Error('image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Main Widget Component
export function AgricooleWidget() {
  const config = DEFAULT_CONFIG;
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [pendingImages, setPendingImages] = useState<Record<string, PendingImage>>({});
  const [textInput, setTextInput] = useState('');
  const [theme, setTheme] = useState<Theme>({});
  
  // Refs
  const messagesRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const chatPhotoInputRef = useRef<HTMLInputElement>(null);
  
  // Derived state
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const pendingImage = activeSession ? pendingImages[activeSession.id] : null;
  const inChat = activeSession?.state === 'CHAT';
  
  // Theme colors
  const colors = {
    primary: theme.primary || config.primaryColor,
    accent: theme.accent || config.accentColor,
    bg: theme.bg || config.bgColor,
    panel: theme.panel || config.panelBg,
    text: theme.text || config.textColor,
    surface: lightenColor(theme.panel || config.panelBg, 15),
    muted: lightenColor(theme.text || config.textColor, -30),
    border: lightenColor(theme.panel || config.panelBg, 10),
  };
  
  // Initialize on mount
  useEffect(() => {
    const savedSessions = loadSessions();
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    
    if (savedSessions.length === 0) {
      const firstSession = newSession('Chat 1');
      firstSession.history.push({
        role: 'assistant',
        text: 'Envoie une photo pour commencer.',
        ts: Date.now(),
        tag: 'photo_gate_hint',
        type: 'text',
      });
      setSessions([firstSession]);
      setActiveSessionIdState(firstSession.id);
      setActiveSessionId(firstSession.id);
      saveSessions([firstSession]);
    } else {
      setSessions(savedSessions);
      const activeId = loadActiveSessionId(savedSessions);
      setActiveSessionIdState(activeId);
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [activeSession?.history]);
  
  // Helper to add message
  const addMessage = useCallback((session: Session, role: 'user' | 'assistant', text: string, tag?: string | null, meta?: { type?: 'text' | 'image'; dataUrl?: string }) => {
    const newMessage: Message = {
      role,
      text,
      ts: Date.now(),
      tag: tag || null,
      type: meta?.type || 'text',
      dataUrl: meta?.dataUrl || null,
    };
    
    session.history.push(newMessage);
    if (session.history.length > config.maxHistory) {
      session.history = session.history.slice(-config.maxHistory);
    }
    session.lastUpdated = Date.now();
    
    setSessions(prev => {
      const updated = prev.map(s => s.id === session.id ? { ...session } : s);
      saveSessions(updated);
      return updated;
    });
  }, [config.maxHistory]);
  
  // API call helper
  const apiPost = async (path: string, payload: Record<string, unknown>) => {
    const base = config.apiBaseUrl.replace(/\/$/, '');
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data.error || 'API Error';
      throw new Error(message);
    }
    return data;
  };
  
  const formatError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : '';
    const lower = msg.toLowerCase();
    if (lower.includes('failed to fetch') || lower.includes('network')) {
      return 'Serveur indisponible. Réessaie plus tard.';
    }
    if (msg) return 'Erreur: ' + msg;
    return 'Une erreur est survenue.';
  };
  
  const summarizeHistory = (session: Session) => {
    const tail = session.history.slice(-6);
    return tail.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  };
  
  // Send analyze
  const sendAnalyze = async () => {
    if (!activeSession) return;
    const pending = pendingImages[activeSession.id];
    if (!pending) return;
    
    setLoadingLabel('Analyse...');
    setLoading(true);
    
    const payload = {
      session_id: activeSession.id,
      session_title: activeSession.title,
      state: activeSession.state,
      image_present: true,
      plant_ok: 'unknown',
      active_plant_context: activeSession.activePlantContext || '',
      user_intent: 'NEW_PLANT_REQUEST',
      history_summary: summarizeHistory(activeSession),
      image: {
        mime_type: pending.mime,
        data: pending.data,
      },
    };
    
    try {
      const data = await apiPost('/api/agricoole/analyze', payload);
      
      // Apply server response
      if (data.assistant_message) {
        addMessage(activeSession, 'assistant', data.assistant_message);
      }
      if (typeof data.active_plant_context === 'string') {
        activeSession.activePlantContext = data.active_plant_context;
      }
      if (typeof data.state === 'string') {
        activeSession.state = data.state === 'ANALYSE' ? 'CHAT' : data.state;
      }
      if (data.state === 'PHOTO_GATE' || data.plant_ok === false) {
        setPendingImages(prev => ({ ...prev, [activeSession.id]: undefined as unknown as PendingImage }));
      }
      
      if (data.state === 'CHAT' || data.plant_ok === true) {
        setPendingImages(prev => {
          const copy = { ...prev };
          delete copy[activeSession.id];
          return copy;
        });
      }
      
      setSessions(prev => {
        const updated = prev.map(s => s.id === activeSession.id ? { ...activeSession } : s);
        saveSessions(updated);
        return updated;
      });
    } catch (err) {
      addMessage(activeSession, 'assistant', formatError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Send chat
  const sendChat = async (message: string) => {
    if (!activeSession || activeSession.state !== 'CHAT') return;
    
    addMessage(activeSession, 'user', message);
    setLoadingLabel('Envoi...');
    setLoading(true);
    
    const payload = {
      session_id: activeSession.id,
      session_title: activeSession.title,
      state: activeSession.state,
      image_present: false,
      plant_ok: true,
      active_plant_context: activeSession.activePlantContext || '',
      user_intent: 'GENERAL_CHAT',
      history_summary: summarizeHistory(activeSession),
      user_message: message,
    };
    
    try {
      const data = await apiPost('/api/agricoole/chat', payload);
      
      if (data.assistant_message) {
        addMessage(activeSession, 'assistant', data.assistant_message);
      }
      if (typeof data.active_plant_context === 'string') {
        activeSession.activePlantContext = data.active_plant_context;
      }
      if (typeof data.state === 'string') {
        activeSession.state = data.state === 'ANALYSE' ? 'CHAT' : data.state;
      }
      
      setSessions(prev => {
        const updated = prev.map(s => s.id === activeSession.id ? { ...activeSession } : s);
        saveSessions(updated);
        return updated;
      });
    } catch (err) {
      addMessage(activeSession, 'assistant', formatError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle photo input
  const handlePhotoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    
    if (file.size > config.maxImageMb * 1024 * 1024) {
      addMessage(activeSession, 'assistant', 'Photo trop volumineuse.');
      return;
    }
    
    try {
      const original = await readFileAsDataUrl(file);
      const preview = await processImageFile(file, config.maxImageWidth).catch(() => null);
      const previewUrl = preview?.dataUrl || original;
      
      const parts = original.split(',');
      const meta = parts[0] || '';
      const base64 = parts[1] || '';
      const mimeMatch = /data:(.*?);base64/.exec(meta);
      const mime = file.type || (mimeMatch ? mimeMatch[1] : 'image/jpeg');
      
      setPendingImages(prev => ({
        ...prev,
        [activeSession.id]: { mime, data: base64, preview: previewUrl },
      }));
      
      addMessage(activeSession, 'user', '', null, { type: 'image', dataUrl: previewUrl });
      
      if (config.autoAnalyze) {
        // Need to wait for state update, use setTimeout
        setTimeout(() => sendAnalyze(), 100);
      }
    } catch {
      addMessage(activeSession, 'assistant', 'Impossible de lire la photo.');
    }
    
    // Reset input
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (chatPhotoInputRef.current) chatPhotoInputRef.current.value = '';
  };
  
  // Create new session
  const createNewSession = () => {
    const session = newSession(`Chat ${sessions.length + 1}`);
    session.history.push({
      role: 'assistant',
      text: 'Envoie une photo pour commencer.',
      ts: Date.now(),
      tag: 'photo_gate_hint',
      type: 'text',
    });
    
    setSessions(prev => {
      const updated = [...prev, session];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionIdState(session.id);
    setActiveSessionId(session.id);
    setShowDrawer(false);
  };
  
  // Delete session
  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      
      if (filtered.length === 0) {
        const newSess = newSession('Chat 1');
        newSess.history.push({
          role: 'assistant',
          text: 'Envoie une photo pour commencer.',
          ts: Date.now(),
          tag: 'photo_gate_hint',
          type: 'text',
        });
        saveSessions([newSess]);
        setActiveSessionIdState(newSess.id);
        setActiveSessionId(newSess.id);
        return [newSess];
      }
      
      if (activeSessionId === id) {
        const sorted = [...filtered].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
        setActiveSessionIdState(sorted[0].id);
        setActiveSessionId(sorted[0].id);
      }
      
      saveSessions(filtered);
      return filtered;
    });
    
    setPendingImages(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };
  
  // Switch session
  const switchSession = (id: string) => {
    setActiveSessionIdState(id);
    setActiveSessionId(id);
    setShowDrawer(false);
  };
  
  // New plant (reset to photo gate)
  const newPlant = () => {
    if (!activeSession) return;
    activeSession.state = 'PHOTO_GATE';
    activeSession.activePlantContext = '';
    
    const hasHint = activeSession.history.some(m => m.tag === 'photo_gate_hint');
    if (!hasHint) {
      activeSession.history.push({
        role: 'assistant',
        text: 'Envoie une photo pour commencer.',
        ts: Date.now(),
        tag: 'photo_gate_hint',
        type: 'text',
      });
    }
    
    setSessions(prev => {
      const updated = prev.map(s => s.id === activeSession.id ? { ...activeSession } : s);
      saveSessions(updated);
      return updated;
    });
    
    setPendingImages(prev => {
      const copy = { ...prev };
      delete copy[activeSession.id];
      return copy;
    });
  };
  
  // Save theme
  const handleSaveTheme = () => {
    saveTheme(theme);
    setShowSettings(false);
  };
  
  // Reset theme
  const handleResetTheme = () => {
    setTheme({});
    saveTheme({});
  };
  
  // Styles
  const styles: Record<string, React.CSSProperties> = {
    root: {
      position: 'fixed',
      bottom: '24px',
      right: config.position === 'right' ? '24px' : 'auto',
      left: config.position === 'left' ? '24px' : 'auto',
      zIndex: 999999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    bubble: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      boxShadow: `0 8px 32px rgba(16, 185, 129, 0.35)`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    panel: {
      position: 'fixed',
      bottom: '96px',
      right: config.position === 'right' ? '24px' : 'auto',
      left: config.position === 'left' ? '24px' : 'auto',
      width: '380px',
      maxHeight: '75vh',
      background: colors.panel,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${colors.border}`,
      borderRadius: '20px',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    header: {
      padding: '14px 16px',
      background: `linear-gradient(180deg, rgba(16, 185, 129, 0.12), transparent)`,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    logo: {
      width: '34px',
      height: '34px',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
    },
    brand: {
      flex: 1,
    },
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: colors.text,
    },
    sub: {
      fontSize: '10px',
      color: colors.muted,
    },
    headerActions: {
      display: 'flex',
      gap: '4px',
    },
    iconBtn: {
      width: '30px',
      height: '30px',
      border: 'none',
      background: colors.surface,
      color: colors.muted,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    messages: {
      flex: 1,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      overflowY: 'auto',
      minHeight: '220px',
    },
    msgBase: {
      padding: '11px 14px',
      borderRadius: '14px',
      fontSize: '13px',
      lineHeight: 1.5,
      maxWidth: '85%',
      whiteSpace: 'pre-line' as const,
    },
    msgUser: {
      alignSelf: 'flex-end',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      color: '#fff',
    },
    msgBot: {
      alignSelf: 'flex-start',
      background: colors.surface,
      color: colors.text,
    },
    msgImage: {
      padding: '6px',
      maxWidth: '70%',
    },
    photoSection: {
      padding: '14px 16px',
      borderTop: `1px solid ${colors.border}`,
      display: inChat ? 'none' : 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    photoLabel: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '14px',
      borderRadius: '12px',
      background: colors.surface,
      border: `1px dashed ${colors.border}`,
      cursor: 'pointer',
      color: colors.muted,
      transition: 'all 0.2s ease',
    },
    photoPreview: {
      width: '100%',
      borderRadius: '12px',
      display: pendingImage ? 'block' : 'none',
    },
    actions: {
      padding: '0 16px 12px',
      display: inChat ? 'flex' : 'none',
    },
    newPlantBtn: {
      width: '100%',
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      background: colors.surface,
      padding: '10px',
      cursor: 'pointer',
      color: colors.muted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
    },
    inputSection: {
      padding: '12px 16px 16px',
      display: inChat ? 'flex' : 'none',
      gap: '8px',
      alignItems: 'center',
      borderTop: `1px solid ${colors.border}`,
    },
    inputPhoto: {
      width: '44px',
      height: '44px',
      border: 'none',
      background: colors.surface,
      color: colors.muted,
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    textInput: {
      flex: 1,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      color: colors.text,
      borderRadius: '12px',
      padding: '12px 14px',
      fontSize: '13px',
      outline: 'none',
    },
    sendBtn: {
      border: 'none',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      color: '#fff',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    overlay: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)',
      display: loading ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 5,
      borderRadius: '20px',
    },
    spinner: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: `3px solid ${colors.surface}`,
      borderTopColor: colors.primary,
      animation: 'agricoole-spin 0.8s linear infinite',
    },
    overlayText: {
      fontSize: '12px',
      color: colors.muted,
    },
    drawer: {
      position: 'absolute',
      inset: 0,
      background: colors.panel,
      borderRadius: '20px',
      zIndex: 15,
      display: 'flex',
      flexDirection: 'column',
      transform: showDrawer ? 'translateX(0)' : 'translateX(-100%)',
      opacity: showDrawer ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: showDrawer ? 'auto' : 'none',
    },
    drawerHeader: {
      padding: '14px 16px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    drawerTitle: {
      flex: 1,
      fontSize: '14px',
      fontWeight: 600,
      color: colors.text,
    },
    sessionsWrap: {
      flex: 1,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflowY: 'auto',
    },
    sessionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    sessionItem: {
      flex: 1,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      borderRadius: '12px',
      padding: '12px 14px',
      fontSize: '13px',
      textAlign: 'left' as const,
      cursor: 'pointer',
      color: colors.text,
      transition: 'all 0.2s ease',
    },
    sessionItemActive: {
      borderColor: colors.primary,
      background: 'rgba(16, 185, 129, 0.15)',
    },
    sessionTitle: {
      fontWeight: 500,
      marginBottom: '3px',
    },
    sessionMeta: {
      color: colors.muted,
      fontSize: '11px',
    },
    sessionDelete: {
      width: '32px',
      height: '32px',
      border: 'none',
      background: 'transparent',
      color: colors.muted,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    drawerFooter: {
      padding: '12px 16px',
      borderTop: `1px solid ${colors.border}`,
    },
    newSessionBtn: {
      width: '100%',
      border: 'none',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      color: '#fff',
      padding: '12px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    settings: {
      position: 'absolute',
      inset: 0,
      background: colors.panel,
      borderRadius: '20px',
      display: showSettings ? 'flex' : 'none',
      flexDirection: 'column',
      zIndex: 10,
    },
    settingsHeader: {
      padding: '14px 16px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingsTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: colors.text,
    },
    settingsBody: {
      flex: 1,
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      overflowY: 'auto',
    },
    colorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    colorLabel: {
      flex: 1,
      fontSize: '13px',
      color: colors.text,
    },
    colorPicker: {
      width: '40px',
      height: '40px',
      border: `2px solid ${colors.border}`,
      borderRadius: '10px',
      cursor: 'pointer',
      overflow: 'hidden',
      padding: 0,
      background: 'transparent',
    },
    settingsFooter: {
      padding: '14px 16px',
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      gap: '10px',
    },
    btnReset: {
      flex: 1,
      border: 'none',
      borderRadius: '10px',
      padding: '12px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      background: colors.surface,
      color: colors.muted,
    },
    btnSave: {
      flex: 1,
      border: 'none',
      borderRadius: '10px',
      padding: '12px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      background: `linear-gradient(135deg, ${colors.primary}, #059669)`,
      color: '#fff',
    },
  };
  
  return (
    <>
      <style>{`
        @keyframes agricoole-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={styles.root}>
        {/* Bubble Button */}
        <button
          type="button"
          style={styles.bubble}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close' : 'Open'}
        >
          <span style={{ width: '24px', height: '24px' }}>
            {isOpen ? ICONS.close : ICONS.chat}
          </span>
        </button>
        
        {/* Panel */}
        <div style={styles.panel} role="dialog" aria-hidden={!isOpen}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>
              <span style={{ width: '18px', height: '18px' }}>{ICONS.leaf}</span>
            </div>
            <div style={styles.brand}>
              <div style={styles.title}>{config.title}</div>
              <div style={styles.sub}>Assistant</div>
            </div>
            <div style={styles.headerActions}>
              <button type="button" style={styles.iconBtn} title="Conversations" onClick={() => setShowDrawer(true)}>
                <span style={{ width: '15px', height: '15px' }}>{ICONS.menu}</span>
              </button>
              <button type="button" style={styles.iconBtn} title="Settings" onClick={() => setShowSettings(true)}>
                <span style={{ width: '15px', height: '15px' }}>{ICONS.settings}</span>
              </button>
              <button type="button" style={styles.iconBtn} onClick={() => setIsOpen(false)} aria-label="Close">
                <span style={{ width: '15px', height: '15px' }}>{ICONS.close}</span>
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div style={styles.messages} ref={messagesRef}>
            {activeSession?.history.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgBase,
                  ...(msg.role === 'user' ? styles.msgUser : styles.msgBot),
                  ...(msg.type === 'image' ? styles.msgImage : {}),
                }}
              >
                {msg.type === 'image' && msg.dataUrl ? (
                  <img src={msg.dataUrl} alt="" style={{ display: 'block', width: '100%', borderRadius: '10px' }} />
                ) : (
                  msg.text
                )}
              </div>
            ))}
          </div>
          
          {/* Photo Section */}
          <div style={styles.photoSection}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={styles.photoLabel}>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handlePhotoInput}
                  disabled={loading}
                />
                <span style={{ width: '22px', height: '22px' }}>{ICONS.camera}</span>
              </label>
              {!config.autoAnalyze && pendingImage && (
                <button
                  type="button"
                  style={{
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: colors.accent,
                    color: '#fff',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={sendAnalyze}
                  disabled={loading}
                >
                  <span style={{ width: '20px', height: '20px' }}>{ICONS.scan}</span>
                </button>
              )}
            </div>
            {pendingImage && (
              <img src={pendingImage.preview} alt="Preview" style={styles.photoPreview} />
            )}
          </div>
          
          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" style={styles.newPlantBtn} onClick={newPlant}>
              <span style={{ width: '16px', height: '16px' }}>{ICONS.leaf}</span>
              <span style={{ width: '16px', height: '16px' }}>{ICONS.plus}</span>
            </button>
          </div>
          
          {/* Input Section */}
          <div style={styles.inputSection}>
            <label style={styles.inputPhoto}>
              <input
                ref={chatPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoInput}
                disabled={loading}
              />
              <span style={{ width: '18px', height: '18px' }}>{ICONS.paperclip}</span>
            </label>
            <input
              type="text"
              placeholder="Message..."
              style={styles.textInput}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (textInput.trim()) {
                    sendChat(textInput.trim());
                    setTextInput('');
                  }
                }
              }}
              disabled={loading || !inChat}
            />
            <button
              type="button"
              style={styles.sendBtn}
              onClick={() => {
                if (textInput.trim()) {
                  sendChat(textInput.trim());
                  setTextInput('');
                }
              }}
              disabled={loading || !inChat}
            >
              <span style={{ width: '18px', height: '18px' }}>{ICONS.send}</span>
            </button>
          </div>
          
          {/* Loading Overlay */}
          <div style={styles.overlay}>
            <div style={styles.spinner} />
            <div style={styles.overlayText}>{loadingLabel || '...'}</div>
          </div>
          
          {/* Sessions Drawer */}
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <button type="button" style={styles.iconBtn} onClick={() => setShowDrawer(false)}>
                <span style={{ width: '15px', height: '15px' }}>{ICONS.back}</span>
              </button>
              <span style={styles.drawerTitle}>Conversations</span>
            </div>
            <div style={styles.sessionsWrap}>
              {sessions.length === 0 ? (
                <div style={{ fontSize: '13px', color: colors.muted, textAlign: 'center', padding: '40px 20px' }}>
                  Aucune conversation
                </div>
              ) : (
                [...sessions]
                  .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
                  .map(session => (
                    <div key={session.id} style={styles.sessionRow}>
                      <button
                        type="button"
                        style={{
                          ...styles.sessionItem,
                          ...(session.id === activeSessionId ? styles.sessionItemActive : {}),
                        }}
                        onClick={() => switchSession(session.id)}
                      >
                        <div style={styles.sessionTitle}>{session.title}</div>
                        <div style={styles.sessionMeta}>
                          {new Date(session.lastUpdated || Date.now()).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        type="button"
                        style={styles.sessionDelete}
                        onClick={() => deleteSession(session.id)}
                      >
                        <span style={{ width: '15px', height: '15px' }}>{ICONS.trash}</span>
                      </button>
                    </div>
                  ))
              )}
            </div>
            <div style={styles.drawerFooter}>
              <button type="button" style={styles.newSessionBtn} onClick={createNewSession}>
                <span style={{ width: '16px', height: '16px' }}>{ICONS.plus}</span>
                Nouveau chat
              </button>
            </div>
          </div>
          
          {/* Settings Panel */}
          <div style={styles.settings}>
            <div style={styles.settingsHeader}>
              <span style={styles.settingsTitle}>Couleurs</span>
              <button type="button" style={styles.iconBtn} onClick={() => setShowSettings(false)}>
                <span style={{ width: '15px', height: '15px' }}>{ICONS.close}</span>
              </button>
            </div>
            <div style={styles.settingsBody}>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Primaire</span>
                <input
                  type="color"
                  style={styles.colorPicker}
                  value={theme.primary || config.primaryColor}
                  onChange={e => setTheme(prev => ({ ...prev, primary: e.target.value }))}
                />
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Accent</span>
                <input
                  type="color"
                  style={styles.colorPicker}
                  value={theme.accent || config.accentColor}
                  onChange={e => setTheme(prev => ({ ...prev, accent: e.target.value }))}
                />
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Fond</span>
                <input
                  type="color"
                  style={styles.colorPicker}
                  value={theme.bg || config.bgColor}
                  onChange={e => setTheme(prev => ({ ...prev, bg: e.target.value }))}
                />
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Panneau</span>
                <input
                  type="color"
                  style={styles.colorPicker}
                  value={theme.panel || config.panelBg}
                  onChange={e => setTheme(prev => ({ ...prev, panel: e.target.value }))}
                />
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Texte</span>
                <input
                  type="color"
                  style={styles.colorPicker}
                  value={theme.text || config.textColor}
                  onChange={e => setTheme(prev => ({ ...prev, text: e.target.value }))}
                />
              </div>
            </div>
            <div style={styles.settingsFooter}>
              <button type="button" style={styles.btnReset} onClick={handleResetTheme}>
                <span style={{ width: '16px', height: '16px' }}>{ICONS.reset}</span>
              </button>
              <button type="button" style={styles.btnSave} onClick={handleSaveTheme}>
                <span style={{ width: '16px', height: '16px' }}>{ICONS.check}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AgricooleWidget;
