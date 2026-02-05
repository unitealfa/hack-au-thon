(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    apiBaseUrl: "/api/agricoole",
    title: "Agricoole",
    position: "right",
    autoInit: true,
    autoAnalyze: true,
    maxHistory: 50,
    maxImageMb: 6,
    maxImageWidth: 720,
    primaryColor: "#3D8B40",
    accentColor: "#8BC34A",
    bgColor: "#0a1f0c",
    panelBg: "#122415",
    textColor: "#e8f5e9"
  };

  const STORAGE_KEY = "agricoole_widget_sessions_v1";
  const ACTIVE_KEY = "agricoole_widget_active_session_v1";
  const THEME_KEY = "agricoole_widget_theme_v1";
  const ROOT_ID = "agricoole-widget-root";
  const STYLE_ID = "agricoole-widget-styles";

  // SVG Icons
  const ICONS = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
    paperclip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`
  };

  function safeRead(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) { }
  }

  function loadTheme() {
    return safeRead(THEME_KEY) || {};
  }

  function saveTheme(theme) {
    safeWrite(THEME_KEY, theme);
  }

  function newSession(title) {
    const id = "session-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    return {
      id,
      title: title || "Session " + new Date().toISOString().slice(0, 10),
      state: "CHAT",
      activePlantContext: "",
      pinnedImage: null,
      history: [],
      lastUpdated: Date.now()
    };
  }

  function loadSessions() {
    const stored = safeRead(STORAGE_KEY);
    if (Array.isArray(stored)) return stored;
    return [];
  }

  function saveSessions(sessions) {
    safeWrite(STORAGE_KEY, sessions);
  }

  function loadActiveSessionId(sessions) {
    const id = safeRead(ACTIVE_KEY);
    if (id && sessions.some((s) => s.id === id)) return id;
    return null;
  }

  function setActiveSessionId(id) {
    if (!id) {
      try { localStorage.removeItem(ACTIVE_KEY); } catch (err) { }
      return;
    }
    safeWrite(ACTIVE_KEY, id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
#${ROOT_ID} {
  --ag-primary: #10b981;
  --ag-accent: #f59e0b;
  --ag-bg: #0f172a;
  --ag-panel: #1e293b;
  --ag-surface: #334155;
  --ag-text: #f1f5f9;
  --ag-muted: #94a3b8;
  --ag-border: rgba(148, 163, 184, 0.15);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}
#${ROOT_ID}.agricoole-shell {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}
#${ROOT_ID}.agricoole-shell.agricoole-left {
  right: auto;
  left: 24px;
}
#${ROOT_ID} .agricoole-bubble {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
#${ROOT_ID} .agricoole-bubble:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.45);
}
#${ROOT_ID} .agricoole-bubble svg {
  width: 24px;
  height: 24px;
}
#${ROOT_ID} .agricoole-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  max-height: 75vh;
  background: var(--ag-panel);
  backdrop-filter: blur(20px);
  border: 1px solid var(--ag-border);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
#${ROOT_ID}.agricoole-shell.agricoole-left .agricoole-panel {
  right: auto;
  left: 24px;
}
#${ROOT_ID}.agricoole-shell.open .agricoole-panel {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
#${ROOT_ID} .agricoole-header {
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.12), transparent);
  border-bottom: 1px solid var(--ag-border);
  display: flex;
  align-items: center;
  gap: 10px;
}
#${ROOT_ID} .agricoole-logo {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
#${ROOT_ID} .agricoole-logo svg {
  width: 18px;
  height: 18px;
}
#${ROOT_ID} .agricoole-brand {
  flex: 1;
}
#${ROOT_ID} .agricoole-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-sub {
  font-size: 10px;
  color: var(--ag-muted);
}
#${ROOT_ID} .agricoole-header-actions {
  display: flex;
  gap: 4px;
}
#${ROOT_ID} .agricoole-icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: var(--ag-surface);
  color: var(--ag-muted);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-icon-btn:hover {
  background: var(--ag-primary);
  color: #fff;
}
#${ROOT_ID} .agricoole-icon-btn svg {
  width: 15px;
  height: 15px;
}
/* Drawer for sessions */
#${ROOT_ID} .agricoole-drawer {
  position: absolute;
  inset: 0;
  background: var(--ag-panel);
  border-radius: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
#${ROOT_ID} .agricoole-drawer.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
#${ROOT_ID} .agricoole-drawer-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--ag-border);
  display: flex;
  align-items: center;
  gap: 10px;
}
#${ROOT_ID} .agricoole-drawer-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-sessions {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}
#${ROOT_ID} .agricoole-sessions::-webkit-scrollbar {
  width: 4px;
}
#${ROOT_ID} .agricoole-sessions::-webkit-scrollbar-thumb {
  background: var(--ag-surface);
  border-radius: 4px;
}
#${ROOT_ID} .agricoole-session-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
#${ROOT_ID} .agricoole-session-item {
  flex: 1;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  color: var(--ag-text);
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-session-item:hover {
  border-color: var(--ag-primary);
}
#${ROOT_ID} .agricoole-session-item.active {
  border-color: var(--ag-primary);
  background: rgba(16, 185, 129, 0.15);
}
#${ROOT_ID} .agricoole-session-title {
  font-weight: 500;
  margin-bottom: 3px;
}
#${ROOT_ID} .agricoole-session-meta {
  color: var(--ag-muted);
  font-size: 11px;
}
#${ROOT_ID} .agricoole-session-delete {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--ag-muted);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-session-delete:hover {
  background: #ef4444;
  color: #fff;
}
#${ROOT_ID} .agricoole-session-delete svg {
  width: 15px;
  height: 15px;
}
#${ROOT_ID} .agricoole-session-empty {
  font-size: 13px;
  color: var(--ag-muted);
  text-align: center;
  padding: 40px 20px;
}
#${ROOT_ID} .agricoole-drawer-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--ag-border);
}
#${ROOT_ID} .agricoole-new-session-btn {
  width: 100%;
  border: none;
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-new-session-btn:hover {
  transform: translateY(-1px);
}
#${ROOT_ID} .agricoole-new-session-btn svg {
  width: 16px;
  height: 16px;
}
/* Messages area */
#${ROOT_ID} .agricoole-messages {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 220px;
}
#${ROOT_ID} .agricoole-messages::-webkit-scrollbar {
  width: 4px;
}
#${ROOT_ID} .agricoole-messages::-webkit-scrollbar-thumb {
  background: var(--ag-surface);
  border-radius: 4px;
}
#${ROOT_ID} .agricoole-msg {
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  max-width: 85%;
  white-space: pre-line;
}
#${ROOT_ID} .agricoole-msg-image {
  padding: 6px;
  max-width: 70%;
}
#${ROOT_ID} .agricoole-msg-image img {
  display: block;
  width: 100%;
  border-radius: 10px;
}
#${ROOT_ID} .agricoole-msg-user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  color: #fff;
}
#${ROOT_ID} .agricoole-msg-bot {
  align-self: flex-start;
  background: var(--ag-surface);
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-photo {
  padding: 14px 16px;
  border-top: 1px solid var(--ag-border);
  display: none;
  flex-direction: column;
  gap: 10px;
}
#${ROOT_ID} .agricoole-photo-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
#${ROOT_ID} .agricoole-photo-label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: var(--ag-surface);
  border: 1px dashed var(--ag-border);
  cursor: pointer;
  color: var(--ag-muted);
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-photo-label:hover {
  border-color: var(--ag-primary);
  color: var(--ag-primary);
}
#${ROOT_ID} .agricoole-photo-label input {
  display: none;
}
#${ROOT_ID} .agricoole-photo-label svg {
  width: 22px;
  height: 22px;
}
#${ROOT_ID} .agricoole-photo-btn {
  border: none;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--ag-accent);
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-photo-btn:hover {
  transform: scale(1.05);
}
#${ROOT_ID} .agricoole-photo-btn svg {
  width: 20px;
  height: 20px;
}
#${ROOT_ID} .agricoole-photo-preview {
  width: 100%;
  border-radius: 12px;
  display: none;
}
#${ROOT_ID} .agricoole-actions {
  padding: 0 16px 12px;
  display: none;
}
#${ROOT_ID} .agricoole-new-plant {
  width: 100%;
  border: 1px solid var(--ag-border);
  border-radius: 10px;
  background: var(--ag-surface);
  padding: 10px;
  cursor: pointer;
  color: var(--ag-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-new-plant:hover {
  border-color: var(--ag-primary);
  color: var(--ag-primary);
}
#${ROOT_ID} .agricoole-new-plant svg {
  width: 16px;
  height: 16px;
}
#${ROOT_ID} .agricoole-pin-indicator {
  padding: 8px 16px;
  display: none;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border-top: 1px solid var(--ag-border);
}
#${ROOT_ID} .agricoole-pin-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}
#${ROOT_ID} .agricoole-unpin-btn {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-unpin-btn:hover {
  background: #ef4444;
  color: #fff;
}
#${ROOT_ID} .agricoole-unpin-btn svg {
  width: 14px;
  height: 14px;
}
#${ROOT_ID} .agricoole-input {
  padding: 12px 16px 16px;
  display: none;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--ag-border);
}
#${ROOT_ID} .agricoole-input-photo {
  width: 44px;
  height: 44px;
  border: none;
  background: var(--ag-surface);
  color: var(--ag-muted);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-input-photo:hover {
  background: var(--ag-accent);
  color: #fff;
}
#${ROOT_ID} .agricoole-input-photo svg {
  width: 18px;
  height: 18px;
}
#${ROOT_ID} .agricoole-input-photo input {
  display: none;
}
#${ROOT_ID} .agricoole-text {
  flex: 1;
  border: 1px solid var(--ag-border);
  background: var(--ag-surface);
  color: var(--ag-text);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease;
}
#${ROOT_ID} .agricoole-text::placeholder {
  color: var(--ag-muted);
}
#${ROOT_ID} .agricoole-text:focus {
  border-color: var(--ag-primary);
}
#${ROOT_ID} .agricoole-send {
  border: none;
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-send:hover {
  transform: scale(1.05);
}
#${ROOT_ID} .agricoole-send svg {
  width: 18px;
  height: 18px;
}
#${ROOT_ID} .agricoole-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  display: none;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  z-index: 5;
  border-radius: 20px;
}
#${ROOT_ID}.agricoole-shell.open.agricoole-loading .agricoole-overlay {
  display: flex;
}
#${ROOT_ID} .agricoole-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--ag-surface);
  border-top-color: var(--ag-primary);
  animation: agricoole-spin 0.8s linear infinite;
}
@keyframes agricoole-spin {
  to { transform: rotate(360deg); }
}
#${ROOT_ID} .agricoole-overlay-text {
  font-size: 12px;
  color: var(--ag-muted);
}
/* Settings Panel */
#${ROOT_ID} .agricoole-settings {
  position: absolute;
  inset: 0;
  background: var(--ag-panel);
  border-radius: 20px;
  display: none;
  flex-direction: column;
  z-index: 10;
}
#${ROOT_ID} .agricoole-settings.open {
  display: flex;
}
#${ROOT_ID} .agricoole-settings-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--ag-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
#${ROOT_ID} .agricoole-settings-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-settings-body {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}
#${ROOT_ID} .agricoole-color-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
#${ROOT_ID} .agricoole-color-label {
  flex: 1;
  font-size: 13px;
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-color-picker {
  width: 40px;
  height: 40px;
  border: 2px solid var(--ag-border);
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  background: transparent;
}
#${ROOT_ID} .agricoole-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
#${ROOT_ID} .agricoole-color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 8px;
}
#${ROOT_ID} .agricoole-settings-footer {
  padding: 14px 16px;
  border-top: 1px solid var(--ag-border);
  display: flex;
  gap: 10px;
}
#${ROOT_ID} .agricoole-btn-reset,
#${ROOT_ID} .agricoole-btn-save {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}
#${ROOT_ID} .agricoole-btn-reset {
  background: var(--ag-surface);
  color: var(--ag-muted);
}
#${ROOT_ID} .agricoole-btn-reset:hover {
  color: var(--ag-text);
}
#${ROOT_ID} .agricoole-btn-save {
  background: linear-gradient(135deg, var(--ag-primary), #059669);
  color: #fff;
}
#${ROOT_ID} .agricoole-btn-reset svg,
#${ROOT_ID} .agricoole-btn-save svg {
  width: 16px;
  height: 16px;
}
@media (max-width: 480px) {
  #${ROOT_ID}.agricoole-shell {
    right: 12px;
    left: 12px;
  }
  #${ROOT_ID} .agricoole-panel {
    right: 12px;
    left: 12px;
    width: auto;
    bottom: 88px;
  }
}
`;
    document.head.appendChild(style);
  }

  function createRoot(config) {
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "agricoole-shell";
    root.innerHTML = `
      <button type="button" class="agricoole-bubble" aria-label="Open">
        ${ICONS.chat}
      </button>
      <div class="agricoole-panel" role="dialog" aria-live="polite" aria-hidden="true">
        <div class="agricoole-header">
          <div class="agricoole-logo">${ICONS.leaf}</div>
          <div class="agricoole-brand">
            <div class="agricoole-title">${escapeHtml(config.title)}</div>
            <div class="agricoole-sub">Assistant</div>
          </div>
          <div class="agricoole-header-actions">
            <button type="button" class="agricoole-icon-btn agricoole-menu-btn" title="Conversations">${ICONS.menu}</button>
            <button type="button" class="agricoole-icon-btn agricoole-settings-btn" title="Settings">${ICONS.settings}</button>
            <button type="button" class="agricoole-icon-btn agricoole-close" aria-label="Close">${ICONS.close}</button>
          </div>
        </div>
        <div class="agricoole-messages"></div>
        <div class="agricoole-photo">
          <div class="agricoole-photo-row">
            <label class="agricoole-photo-label">
              <input class="agricoole-photo-input" type="file" accept="image/*" capture="environment" />
              ${ICONS.camera}
            </label>
            <button type="button" class="agricoole-photo-btn">${ICONS.scan}</button>
          </div>
          <img class="agricoole-photo-preview" alt="Preview" />
        </div>
        <div class="agricoole-actions">
          <button type="button" class="agricoole-new-plant" title="Épingler une image comme contexte">${ICONS.camera}</button>
        </div>
        <div class="agricoole-pin-indicator" style="display:none;">
          <img class="agricoole-pin-preview" alt="Pinned" />
          <button type="button" class="agricoole-unpin-btn" title="Retirer l'image">${ICONS.close}</button>
        </div>
        <div class="agricoole-input">
          <label class="agricoole-input-photo" title="Joindre une image">
            <input class="agricoole-chat-photo-input" type="file" accept="image/*" capture="environment" />
            ${ICONS.paperclip}
          </label>
          <input class="agricoole-text" type="text" placeholder="Message..." />
          <button type="button" class="agricoole-send">${ICONS.send}</button>
        </div>
        <div class="agricoole-overlay" aria-hidden="true">
          <div class="agricoole-spinner"></div>
          <div class="agricoole-overlay-text"></div>
        </div>
        <!-- Sessions Drawer -->
        <div class="agricoole-drawer">
          <div class="agricoole-drawer-header">
            <button type="button" class="agricoole-icon-btn agricoole-drawer-close">${ICONS.back}</button>
            <span class="agricoole-drawer-title">Conversations</span>
          </div>
          <div class="agricoole-sessions"></div>
          <div class="agricoole-drawer-footer">
            <button type="button" class="agricoole-new-session-btn">${ICONS.plus} Nouveau chat</button>
          </div>
        </div>
        <!-- Settings Panel -->
        <div class="agricoole-settings">
          <div class="agricoole-settings-header">
            <span class="agricoole-settings-title">Couleurs</span>
            <button type="button" class="agricoole-icon-btn agricoole-settings-close">${ICONS.close}</button>
          </div>
          <div class="agricoole-settings-body">
            <div class="agricoole-color-row">
              <span class="agricoole-color-label">Primaire</span>
              <input type="color" class="agricoole-color-picker" data-var="primary" value="${config.primaryColor}" />
            </div>
            <div class="agricoole-color-row">
              <span class="agricoole-color-label">Accent</span>
              <input type="color" class="agricoole-color-picker" data-var="accent" value="${config.accentColor}" />
            </div>
            <div class="agricoole-color-row">
              <span class="agricoole-color-label">Fond</span>
              <input type="color" class="agricoole-color-picker" data-var="bg" value="${config.bgColor}" />
            </div>
            <div class="agricoole-color-row">
              <span class="agricoole-color-label">Panneau</span>
              <input type="color" class="agricoole-color-picker" data-var="panel" value="${config.panelBg}" />
            </div>
            <div class="agricoole-color-row">
              <span class="agricoole-color-label">Texte</span>
              <input type="color" class="agricoole-color-picker" data-var="text" value="${config.textColor}" />
            </div>
          </div>
          <div class="agricoole-settings-footer">
            <button type="button" class="agricoole-btn-reset">${ICONS.reset}</button>
            <button type="button" class="agricoole-btn-save">${ICONS.check}</button>
          </div>
        </div>
      </div>
    `;
    applyTheme(root, config);
    if (config.position === "left") {
      root.classList.add("agricoole-left");
    }
    return root;
  }

  function applyTheme(root, config) {
    const theme = loadTheme();
    root.style.setProperty("--ag-primary", theme.primary || config.primaryColor);
    root.style.setProperty("--ag-accent", theme.accent || config.accentColor);
    root.style.setProperty("--ag-bg", theme.bg || config.bgColor);
    root.style.setProperty("--ag-panel", theme.panel || config.panelBg);
    root.style.setProperty("--ag-text", theme.text || config.textColor);
    const panelColor = theme.panel || config.panelBg;
    root.style.setProperty("--ag-surface", lightenColor(panelColor, 15));
    root.style.setProperty("--ag-muted", lightenColor(theme.text || config.textColor, -30));
  }

  function lightenColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  function initWidget(config, root) {
    const elements = {
      bubble: root.querySelector(".agricoole-bubble"),
      panel: root.querySelector(".agricoole-panel"),
      close: root.querySelector(".agricoole-close"),
      messages: root.querySelector(".agricoole-messages"),
      photoSection: root.querySelector(".agricoole-photo"),
      photoInput: root.querySelector(".agricoole-photo-input"),
      photoBtn: root.querySelector(".agricoole-photo-btn"),
      photoPreview: root.querySelector(".agricoole-photo-preview"),
      textInput: root.querySelector(".agricoole-text"),
      sendBtn: root.querySelector(".agricoole-send"),
      newPlantBtn: root.querySelector(".agricoole-new-plant"),
      overlay: root.querySelector(".agricoole-overlay"),
      overlayText: root.querySelector(".agricoole-overlay-text"),
      actions: root.querySelector(".agricoole-actions"),
      inputWrap: root.querySelector(".agricoole-input"),
      // Drawer
      menuBtn: root.querySelector(".agricoole-menu-btn"),
      drawer: root.querySelector(".agricoole-drawer"),
      drawerClose: root.querySelector(".agricoole-drawer-close"),
      sessionsWrap: root.querySelector(".agricoole-sessions"),
      newSessionBtn: root.querySelector(".agricoole-new-session-btn"),
      // Settings
      settingsBtn: root.querySelector(".agricoole-settings-btn"),
      settingsPanel: root.querySelector(".agricoole-settings"),
      settingsClose: root.querySelector(".agricoole-settings-close"),
      colorPickers: root.querySelectorAll(".agricoole-color-picker"),
      btnReset: root.querySelector(".agricoole-btn-reset"),
      btnSave: root.querySelector(".agricoole-btn-save"),
      // Chat photo
      chatPhotoInput: root.querySelector(".agricoole-chat-photo-input")
    };

    const runtime = {
      pendingImageBySession: {},
      loading: false,
      loadingLabel: ""
    };

    let sessions = loadSessions();
    let activeSessionId = loadActiveSessionId(sessions);
    let activeSession = sessions.find((s) => s.id === activeSessionId) || null;

    // Auto-create first session if none exists
    if (!activeSession && sessions.length === 0) {
      activeSession = newSession("Chat 1");
      sessions.push(activeSession);
      activeSessionId = activeSession.id;
      setActiveSessionId(activeSession.id);
      ensureWelcomeMessage(activeSession);
      saveSessions(sessions);
    } else if (activeSession) {
      ensureWelcomeMessage(activeSession);
      saveSessions(sessions);
    }

    // Drawer handlers
    elements.menuBtn.addEventListener("click", () => {
      elements.drawer.classList.add("open");
      renderSessions();
    });

    elements.drawerClose.addEventListener("click", () => {
      elements.drawer.classList.remove("open");
    });

    elements.newSessionBtn.addEventListener("click", () => {
      createAndActivateSession(`Chat ${sessions.length + 1}`);
      elements.photoInput.value = "";
      elements.drawer.classList.remove("open");
      renderAll();
    });

    // Settings handlers
    elements.settingsBtn.addEventListener("click", () => {
      elements.settingsPanel.classList.add("open");
      syncColorPickers();
    });

    elements.settingsClose.addEventListener("click", () => {
      elements.settingsPanel.classList.remove("open");
    });

    elements.colorPickers.forEach((picker) => {
      picker.addEventListener("input", () => {
        const varName = picker.dataset.var;
        if (varName === "primary") root.style.setProperty("--ag-primary", picker.value);
        if (varName === "accent") root.style.setProperty("--ag-accent", picker.value);
        if (varName === "bg") root.style.setProperty("--ag-bg", picker.value);
        if (varName === "panel") {
          root.style.setProperty("--ag-panel", picker.value);
          root.style.setProperty("--ag-surface", lightenColor(picker.value, 15));
        }
        if (varName === "text") {
          root.style.setProperty("--ag-text", picker.value);
          root.style.setProperty("--ag-muted", lightenColor(picker.value, -30));
        }
      });
    });

    elements.btnSave.addEventListener("click", () => {
      const theme = {};
      elements.colorPickers.forEach((picker) => {
        theme[picker.dataset.var] = picker.value;
      });
      saveTheme(theme);
      elements.settingsPanel.classList.remove("open");
    });

    elements.btnReset.addEventListener("click", () => {
      saveTheme({});
      applyTheme(root, config);
      syncColorPickers();
    });

    function syncColorPickers() {
      const theme = loadTheme();
      elements.colorPickers.forEach((picker) => {
        const v = picker.dataset.var;
        if (v === "primary") picker.value = theme.primary || config.primaryColor;
        if (v === "accent") picker.value = theme.accent || config.accentColor;
        if (v === "bg") picker.value = theme.bg || config.bgColor;
        if (v === "panel") picker.value = theme.panel || config.panelBg;
        if (v === "text") picker.value = theme.text || config.textColor;
      });
    }

    function createAndActivateSession(title) {
      const name = title || `Chat ${sessions.length + 1}`;
      const s = newSession(name);
      ensureWelcomeMessage(s);
      sessions.push(s);
      saveSessions(sessions);
      activeSession = s;
      activeSessionId = s.id;
      setActiveSessionId(s.id);
      return s;
    }

    function setActiveSessionById(id) {
      const found = sessions.find((s) => s.id === id);
      if (found) {
        activeSession = found;
        activeSessionId = found.id;
        setActiveSessionId(found.id);
      }
    }

    function deleteSessionById(id) {
      const index = sessions.findIndex((s) => s.id === id);
      if (index === -1) return;
      sessions.splice(index, 1);
      delete runtime.pendingImageBySession[id];
      if (activeSessionId === id) {
        if (sessions.length) {
          const next = [...sessions].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))[0];
          activeSession = next;
          activeSessionId = next.id;
          setActiveSessionId(next.id);
          ensureWelcomeMessage(activeSession);
        } else {
          // Create new session if all deleted
          activeSession = newSession("Chat 1");
          sessions.push(activeSession);
          activeSessionId = activeSession.id;
          setActiveSessionId(activeSession.id);
          ensureWelcomeMessage(activeSession);
        }
      }
      saveSessions(sessions);
    }

    function ensureWelcomeMessage(session) {
      // No welcome message - start with empty conversation
    }

    function addMessage(session, role, text, tag, meta) {
      const type = meta && meta.type ? meta.type : "text";
      const dataUrl = meta && meta.dataUrl ? meta.dataUrl : null;
      session.history.push({
        role,
        text,
        ts: Date.now(),
        tag: tag || null,
        type,
        dataUrl
      });
      if (session.history.length > config.maxHistory) {
        session.history = session.history.slice(-config.maxHistory);
      }
      session.lastUpdated = Date.now();
      saveSessions(sessions);
    }

    function renderSessions() {
      elements.sessionsWrap.innerHTML = "";
      if (!sessions.length) {
        const empty = document.createElement("div");
        empty.className = "agricoole-session-empty";
        empty.textContent = "Aucune conversation";
        elements.sessionsWrap.appendChild(empty);
        return;
      }
      const ordered = [...sessions].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
      ordered.forEach((session) => {
        const row = document.createElement("div");
        row.className = "agricoole-session-row";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "agricoole-session-item" + (session.id === activeSessionId ? " active" : "");
        btn.dataset.sessionId = session.id;
        const title = document.createElement("div");
        title.className = "agricoole-session-title";
        title.textContent = session.title;
        const meta = document.createElement("div");
        meta.className = "agricoole-session-meta";
        const date = new Date(session.lastUpdated || Date.now());
        meta.textContent = date.toLocaleDateString();
        btn.appendChild(title);
        btn.appendChild(meta);
        const del = document.createElement("button");
        del.type = "button";
        del.className = "agricoole-session-delete";
        del.dataset.sessionId = session.id;
        del.innerHTML = ICONS.trash;
        row.appendChild(btn);
        row.appendChild(del);
        elements.sessionsWrap.appendChild(row);
      });
    }

    function renderMessages() {
      elements.messages.innerHTML = "";
      if (!activeSession) {
        return;
      }
      activeSession.history.forEach((msg) => {
        const div = document.createElement("div");
        div.className = "agricoole-msg " + (msg.role === "user" ? "agricoole-msg-user" : "agricoole-msg-bot");
        if (msg.type === "image" && msg.dataUrl) {
          div.className += " agricoole-msg-image";
          const img = document.createElement("img");
          img.src = msg.dataUrl;
          img.alt = "";
          div.appendChild(img);
        } else {
          div.textContent = msg.text;
        }
        elements.messages.appendChild(div);
      });
      elements.messages.scrollTop = elements.messages.scrollHeight;
    }

    function renderPhotoPreview() {
      const pending = activeSession ? runtime.pendingImageBySession[activeSession.id] : null;
      if (pending && pending.preview) {
        elements.photoPreview.src = pending.preview;
        elements.photoPreview.style.display = "block";
      } else {
        elements.photoPreview.removeAttribute("src");
        elements.photoPreview.style.display = "none";
      }
    }

    function renderPinnedImage() {
      // Show pinned image indicator in the input area if there's context
      const pinIndicator = root.querySelector(".agricoole-pin-indicator");
      if (!pinIndicator) return;
      if (activeSession && activeSession.pinnedImage) {
        pinIndicator.style.display = "flex";
        const img = pinIndicator.querySelector("img");
        if (img) img.src = activeSession.pinnedImage.preview;
      } else {
        pinIndicator.style.display = "none";
      }
    }

    function renderState() {
      const hasSession = !!activeSession;
      const pending = activeSession ? runtime.pendingImageBySession[activeSession.id] : null;
      const showAnalyze = !config.autoAnalyze && !!pending;
      // Always hide the old photo gate section - use chat input with pin instead
      elements.photoSection.style.display = "none";
      elements.actions.style.display = hasSession ? "flex" : "none";
      elements.inputWrap.style.display = hasSession ? "flex" : "none";
      elements.textInput.disabled = runtime.loading || !hasSession;
      elements.sendBtn.disabled = runtime.loading || !hasSession;
      elements.photoBtn.style.display = showAnalyze ? "inline-flex" : "none";
      elements.photoBtn.disabled = runtime.loading || !showAnalyze;
      elements.photoInput.disabled = runtime.loading;
      elements.panel.setAttribute("aria-busy", runtime.loading ? "true" : "false");
      elements.overlayText.textContent = runtime.loadingLabel || "...";
      if (runtime.loading) {
        root.classList.add("agricoole-loading");
      } else {
        root.classList.remove("agricoole-loading");
      }
      renderPhotoPreview();
      renderPinnedImage();
    }

    function renderAll() {
      renderMessages();
      renderState();
    }

    function summarizeHistory(session) {
      if (!session) return "";
      const tail = session.history.slice(-6);
      return tail.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");
    }

    function openPanel() {
      root.classList.add("open");
      elements.panel.setAttribute("aria-hidden", "false");
      if (activeSession && activeSession.state === "CHAT") {
        setTimeout(() => elements.textInput.focus(), 0);
      }
    }

    function closePanel() {
      root.classList.remove("open");
      elements.panel.setAttribute("aria-hidden", "true");
      elements.settingsPanel.classList.remove("open");
      elements.drawer.classList.remove("open");
    }

    function setLoading(value) {
      runtime.loading = value;
      renderState();
    }

    async function apiPost(path, payload) {
      const base = config.apiBaseUrl.replace(/\/$/, "");
      const res = await fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const message = data.error || "API Error";
        throw new Error(message);
      }
      return data;
    }

    function formatError(err) {
      const msg = err && err.message ? String(err.message) : "";
      const lower = msg.toLowerCase();
      if (lower.includes("failed to fetch") || lower.includes("network")) {
        return "Serveur indisponible. Reessaie plus tard.";
      }
      if (msg) return "Erreur: " + msg;
      return "Une erreur est survenue.";
    }

    function applyServerResponse(data) {
      if (!activeSession) return;
      if (data.assistant_message) {
        addMessage(activeSession, "assistant", data.assistant_message);
      }
      if (typeof data.active_plant_context === "string") {
        activeSession.activePlantContext = data.active_plant_context;
      }
      if (typeof data.state === "string") {
        activeSession.state = data.state === "ANALYSE" ? "CHAT" : data.state;
      }
      if (data.state === "PHOTO_GATE" || data.plant_ok === false) {
        runtime.pendingImageBySession[activeSession.id] = null;
        elements.photoInput.value = "";
      }
      saveSessions(sessions);
    }

    async function sendAnalyze() {
      if (!activeSession) {
        renderAll();
        return;
      }
      const pending = runtime.pendingImageBySession[activeSession.id];
      if (!pending) {
        ensureWelcomeMessage(activeSession);
        renderAll();
        return;
      }
      runtime.loadingLabel = "Analyse...";
      setLoading(true);
      const payload = {
        session_id: activeSession.id,
        session_title: activeSession.title,
        state: activeSession.state,
        image_present: true,
        plant_ok: "unknown",
        active_plant_context: activeSession.activePlantContext || "",
        user_intent: "NEW_PLANT_REQUEST",
        history_summary: summarizeHistory(activeSession),
        image: {
          mime_type: pending.mime,
          data: pending.data
        }
      };
      try {
        const data = await apiPost("/analyze", payload);
        applyServerResponse(data);
        if (data.state === "CHAT" || data.plant_ok === true) {
          runtime.pendingImageBySession[activeSession.id] = null;
          elements.photoInput.value = "";
        }
      } catch (err) {
        addMessage(activeSession, "assistant", formatError(err));
      } finally {
        setLoading(false);
        renderAll();
      }
    }

    async function sendChat(message) {
      if (!activeSession) {
        renderAll();
        return;
      }
      // Ensure session is in CHAT state
      activeSession.state = "CHAT";
      addMessage(activeSession, "user", message);
      runtime.loadingLabel = "Envoi...";
      setLoading(true);
      const payload = {
        session_id: activeSession.id,
        session_title: activeSession.title,
        state: activeSession.state,
        image_present: false,
        plant_ok: true,
        active_plant_context: activeSession.activePlantContext || "",
        user_intent: "GENERAL_CHAT",
        history_summary: summarizeHistory(activeSession),
        user_message: message
      };
      try {
        const data = await apiPost("/chat", payload);
        applyServerResponse(data);
      } catch (err) {
        addMessage(activeSession, "assistant", formatError(err));
      } finally {
        setLoading(false);
        renderAll();
      }
    }

    elements.bubble.addEventListener("click", () => {
      if (root.classList.contains("open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    elements.close.addEventListener("click", closePanel);

    elements.sessionsWrap.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest(".agricoole-session-delete");
      if (deleteBtn) {
        deleteSessionById(deleteBtn.dataset.sessionId);
        renderSessions();
        renderAll();
        return;
      }
      const item = event.target.closest(".agricoole-session-item");
      if (item) {
        setActiveSessionById(item.dataset.sessionId);
        if (activeSession) {
          ensureWelcomeMessage(activeSession);
        }
        elements.drawer.classList.remove("open");
        renderAll();
      }
    });

    elements.newPlantBtn.addEventListener("click", () => {
      if (!activeSession) return;
      // Trigger file picker to pin an image as context
      elements.chatPhotoInput.click();
    });

    // Unpin image button handler
    const unpinBtn = root.querySelector(".agricoole-unpin-btn");
    if (unpinBtn) {
      unpinBtn.addEventListener("click", () => {
        if (!activeSession) return;
        activeSession.pinnedImage = null;
        activeSession.activePlantContext = "";
        runtime.pendingImageBySession[activeSession.id] = null;
        saveSessions(sessions);
        renderAll();
      });
    }

    elements.photoInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (file.size > config.maxImageMb * 1024 * 1024) {
        addMessage(activeSession, "assistant", "Photo trop volumineuse.");
        elements.photoInput.value = "";
        renderAll();
        return;
      }
      const original = await readFileAsDataUrl(file).catch(() => null);
      if (!original) {
        addMessage(activeSession, "assistant", "Impossible de lire la photo.");
        renderAll();
        return;
      }
      const preview = await processImageFile(file, config.maxImageWidth).catch(() => null);
      const previewUrl = preview && preview.dataUrl ? preview.dataUrl : original;
      const parts = original.split(",");
      const meta = parts[0] || "";
      const base64 = parts[1] || "";
      const mimeMatch = /data:(.*?);base64/.exec(meta);
      const mime = file.type || (mimeMatch ? mimeMatch[1] : "image/jpeg");
      runtime.pendingImageBySession[activeSession.id] = {
        mime,
        data: base64,
        preview: previewUrl
      };
      addMessage(activeSession, "user", "", null, {
        type: "image",
        dataUrl: previewUrl
      });
      renderPhotoPreview();
      if (config.autoAnalyze) {
        sendAnalyze();
      }
    });

    elements.photoBtn.addEventListener("click", () => {
      sendAnalyze();
    });

    elements.sendBtn.addEventListener("click", () => {
      const value = elements.textInput.value.trim();
      if (!value) return;
      elements.textInput.value = "";
      sendChat(value);
    });

    elements.textInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        elements.sendBtn.click();
      }
    });

    // Chat photo input handler - pin image as context
    elements.chatPhotoInput.addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file || !activeSession) return;
      elements.chatPhotoInput.value = "";

      if (file.size > config.maxImageMb * 1024 * 1024) {
        addMessage(activeSession, "assistant", "Photo trop volumineuse.");
        renderAll();
        return;
      }
      const original = await readFileAsDataUrl(file).catch(() => null);
      if (!original) {
        addMessage(activeSession, "assistant", "Impossible de lire la photo.");
        renderAll();
        return;
      }
      const preview = await processImageFile(file, config.maxImageWidth).catch(() => null);
      const previewUrl = preview && preview.dataUrl ? preview.dataUrl : original;
      const parts = original.split(",");
      const meta = parts[0] || "";
      const base64 = parts[1] || "";
      const mimeMatch = /data:(.*?);base64/.exec(meta);
      const mime = file.type || (mimeMatch ? mimeMatch[1] : "image/jpeg");

      // Store as pinned image for context
      activeSession.pinnedImage = {
        mime,
        data: base64,
        preview: previewUrl
      };
      runtime.pendingImageBySession[activeSession.id] = activeSession.pinnedImage;
      
      // Add notification to chat
      addMessage(activeSession, "assistant", "📌 Image épinglée comme contexte. Que voulez-vous savoir ?");
      saveSessions(sessions);
      renderAll();

      // Analyze the pinned image to set context
      sendAnalyze();
    });

    renderAll();
  }

  function processImageFile(file, maxWidth) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, maxWidth / img.width);
          const width = Math.max(1, Math.round(img.width * ratio));
          const height = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("canvas"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve({ dataUrl });
        };
        img.onerror = () => reject(new Error("image"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function init(userConfig) {
    const config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});
    if (document.getElementById(ROOT_ID)) return;
    injectStyles();
    const root = createRoot(config);
    document.body.appendChild(root);
    initWidget(config, root);
  }

  window.AgricooleWidget = window.AgricooleWidget || {};
  window.AgricooleWidget.init = init;
  window.AgricooleWidget.__version = "2.1.0";

  function autoInit() {
    const cfg = window.AGRICOOLE_WIDGET_CONFIG || {};
    if (cfg.autoInit === false) return;
    init(cfg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
