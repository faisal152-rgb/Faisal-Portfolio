import React, { useState, useEffect, useCallback } from "react";
import { Robot, SpeakerHigh, UploadSimple, Brain, ArrowUpRight } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";

export default function AIAssistantControl() {
  const [settings, setSettings] = useState({
    assistantEnabled: true,
    chatEnabled: true,
    voiceEnabled: true,
    fileUploadEnabled: false,
    autoDetectEnabled: true,
    emotionEnabled: true,
    defaultMode: "Chat",
    language: "Auto Detect",
    emotionDetect: "Auto Detect",
    assistantName: "AI Assistant",
    assistantSubtitle: "Online • Voice",
    workingHours: "Mon-Fri 9:00 AM - 6:00 PM",
    statusText: "Online",
    availability: "Available now",
    loading: true,
    saving: false,
    error: null,
    success: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getAISettings();
      if (data) {
        setSettings(prev => ({ ...prev, ...data, loading: false }));
      } else {
        setSettings(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setSettings(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch AI settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    try {
      setSettings(prev => ({ ...prev, saving: true, error: null, success: false }));
      const updateData = {
        assistantEnabled: settings.assistantEnabled,
        chatEnabled: settings.chatEnabled,
        voiceEnabled: settings.voiceEnabled,
        fileUploadEnabled: settings.fileUploadEnabled,
        autoDetectEnabled: settings.autoDetectEnabled,
        emotionEnabled: settings.emotionEnabled,
        defaultMode: settings.defaultMode,
        language: settings.language,
        emotionDetect: settings.emotionDetect,
      };
      const result = await dataService.updateAISettings(updateData);
      setSettings(prev => ({ ...prev, ...result, saving: false, success: true }));
      setTimeout(() => setSettings(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setSettings(prev => ({ ...prev, saving: false, error: error.message }));
      console.error('Failed to save AI settings:', error);
    }
  }

  function toggle(key) {
    setSettings({ ...settings, [key]: !settings[key] });
  }

  if (settings.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">AI Assistant Control</h2>
        <div className="grid md:grid-cols-2 gap-6 opacity-60">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-5">
            <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '1.5rem' }} />
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton skeleton-toggle" />
            ))}
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-5">
            <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '1.5rem' }} />
            {[1,2,3].map(i => (
              <div key={i} className="skeleton skeleton-select" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">AI Assistant Control</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-5">
          <h3 className="font-extrabold text-lg">AI Status</h3>
          {[
            { key: "assistantEnabled", label: "AI Assistant", icon: Robot },
            { key: "chatEnabled", label: "Chat", icon: SpeakerHigh },
            { key: "voiceEnabled", label: "Voice", icon: Brain },
            { key: "fileUploadEnabled", label: "File Upload", icon: UploadSimple },
            { key: "autoDetectEnabled", label: "Auto Detect" },
            { key: "emotionEnabled", label: "Emotion" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {s.icon && <s.icon size={18} weight="bold" className="text-amber-400" />}
                <span className="text-sm font-medium text-slate-200">{s.label}</span>
              </div>
              <button 
                onClick={() => toggle(s.key)} 
                className={`w-11 h-6 rounded-full relative transition ${settings[s.key] ? "bg-amber-500" : "bg-slate-700"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition ${settings[s.key] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-5">
          <h3 className="font-extrabold text-lg">Default Mode</h3>
          <select 
            value={settings.defaultMode} 
            onChange={(e) => setSettings({ ...settings, defaultMode: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          >
            <option>Auto Detect</option>
            <option>Chat</option>
            <option>Voice</option>
          </select>
          <h3 className="font-extrabold text-lg">Language</h3>
          <select 
            value={settings.language} 
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          >
            <option>Auto Detect</option>
            <option>English</option>
            <option>Urdu</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Chinese</option>
            <option>Japanese</option>
            <option>Russian</option>
            <option>Arabic</option>
            <option>Portuguese</option>
            <option>Hindi</option>
            <option>Bengali</option>
          </select>
          <h3 className="font-extrabold text-lg">Emotion Detect</h3>
          <select 
            value={settings.emotionDetect} 
            onChange={(e) => setSettings({ ...settings, emotionDetect: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="auto">Auto</option>
              
              <optgroup label="Positive">
                <option value="happy">Happy</option>
                <option value="excited">Excited</option>
                <option value="friendly">Friendly</option>
                <option value="cheerful">Cheerful</option>
                <option value="confident">Confident</option>
                <option value="playful">Playful</option>
                <option value="motivational">Motivational</option>
              </optgroup>
              
              <optgroup label="Professional">
                <option value="neutral">Neutral</option>
                <option value="professional">Professional</option>
                <option value="calm">Calm</option>
                <option value="serious">Serious</option>
                <option value="thoughtful">Thoughtful</option>
                <option value="curious">Curious</option>
              </optgroup>
              
              <optgroup label="Empathetic">
                <option value="empathetic">Empathetic</option>
                <option value="supportive">Supportive</option>
                <option value="caring">Caring</option>
                <option value="concerned">Concerned</option>
                <option value="apologetic">Apologetic</option>
              </optgroup>
              
              <optgroup label="Negative">
                <option value="sad">Sad</option>
                <option value="frustrated">Frustrated</option>
                <option value="angry">Angry</option>
                <option value="fearful">Fearful</option>
              </optgroup>
              
              <optgroup label="Special">
                <option value="surprised">Surprised</option>
                <option value="urgent">Urgent</option>
                <option value="romantic">Romantic</option>
                <option value="other">Other</option>
              </optgroup>
          </select>
        </div>
      </div>
      
      {settings.error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {settings.error}
        </div>
      )}
      {settings.success && (
        <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm">
          AI settings saved successfully with real-time sync!
        </div>
      )}
      <button 
        onClick={handleSave} 
        disabled={settings.saving}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
      >
        {settings.saving ? 'Saving...' : 'Save Settings'} <ArrowUpRight size={14} weight="bold" />
      </button>
    </div>
  );
}