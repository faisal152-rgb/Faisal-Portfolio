import React, { useState, useEffect, useCallback } from "react";
import { Brain, Plus, Trash, ArrowUpRight, Sparkle } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function AIPersona() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    timeSetting: '',
    role: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 4096,
    emotion: 'auto',
    isActive: true,
    avatar: '',
    voice: '',
  });

  const fetchPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getAIPersonas();
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch personas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  async function handleCreatePersona() {
    try {
      setSaving(true);
      setError(null);
      const newPersona = {
        name: 'New Persona',
        timeSetting: '',
        role: '',
        systemPrompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 4096,
        emotion: 'auto',
        isActive: true,
        avatar: '',
        voice: '',
      };
      const result = await dataService.createAIPersona(newPersona);
      setPersonas(prev => [...prev, result]);
      setEditingId(result._id);
      setFormData(result);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      console.error('Error creating persona:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePersona() {
    if (!editingId) return;
    try {
      setSaving(true);
      setError(null);
      const result = await dataService.updateAIPersona(editingId, formData);
      setPersonas(prev => prev.map(p => p._id === editingId ? result : p));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePersona(id) {
    if (!window.confirm('Delete this persona?')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteAIPersona(id);
      setPersonas(prev => prev.filter(p => p._id !== id));
      if (editingId === id) {
        setEditingId(null);
        resetForm();
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function editPersona(persona) {
    setEditingId(persona._id);
    setFormData({
      name: persona.name || '',
      timeSetting: persona.timeSetting || '',
      role: persona.role || '',
      systemPrompt: persona.systemPrompt || '',
      temperature: persona.temperature ?? 0.7,
      maxTokens: persona.maxTokens ?? 4096,
      emotion: persona.emotion || 'auto',
      isActive: persona.isActive ?? true,
      avatar: persona.avatar || '',
      voice: persona.voice || '',
    });
  }

  function resetForm() {
    setFormData({
      name: '',
      timeSetting: '',
      role: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
      emotion: 'auto',
      isActive: true,
      avatar: '',
      voice: '',
    });
    setEditingId(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">AI Persona</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '100px', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '150px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">AI Persona</h2>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleCreatePersona}
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Persona
        </button>
        <button
          onClick={() => alert('Test persona functionality not implemented yet')}
          disabled={saving || !editingId}
          className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Brain size={14} /> Test Persona
        </button>
        {editingId && !saving && (
          <button
            onClick={resetForm}
            className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <Trash size={14} /> Clear Form
          </button>
        )}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm self-center">
            Persona saved successfully with real-time sync!
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {error}
        </div>
      )}
      
      {/* Persona List */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
        <h3 className="font-extrabold text-lg mb-4">Personas</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {personas.map(persona => (
            <div 
              key={persona._id}
              className={`bg-slate-950 border rounded-xl p-4 transition cursor-pointer ${editingId === persona._id ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800/50 hover:border-amber-500/30'}`}
              onClick={() => editPersona(persona)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkle size={20} weight="fill" className="text-amber-400" />
                  <h4 className="font-bold text-white">{persona.name}</h4>
                  {persona.isDefault && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Default</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePersona(persona._id); }}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  <Trash size={16} />
                </button>
              </div>
              <p className="text-slate-400 text-sm line-clamp-2">Emotion: {persona.emotion}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className={`px-2 py-0.5 rounded ${persona.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {persona.isActive ? 'Active' : 'Inactive'}
                </span>
                <span>Temp: {persona.temperature}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Edit Form */}
      {editingId && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center justify-between">
            <Sparkle size={20} weight="fill" className="text-amber-400" />
            <span>{personas.find(p => p._id === editingId) ? 'Edit Persona' : 'New Persona'}</span>
            <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">Close</button>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={formData.name}
              onChange={(e) => handleChange('name', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-bold"
              placeholder="Persona Name"
            />
            <select
              value={formData.emotion}
              onChange={(e) => handleChange('emotion', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
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
          
          <input
            value={formData.timeSetting}
            onChange={(e) => handleChange('timeSetting', apiService.sanitize(e.target.value))}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            placeholder="e.g. Night Shift 12:00 AM - 11:59 AM or Day Shift 12:00 PM - 11:59 PM"
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Temperature</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Tokens</label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 4096)}
                min="1"
                max="128000"
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
              >
                <option value="">Select Role</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
          
          <label className="block text-xs font-medium text-slate-400 mb-1">System Prompt</label>
          <textarea
            value={formData.systemPrompt}
            onChange={(e) => handleChange('systemPrompt', apiService.sanitize(e.target.value))}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm min-h-[120px] w-full font-mono text-xs"
            placeholder="System prompt for the AI..."
          />
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Avatar URL</label>
              <input
                value={formData.avatar}
                onChange={(e) => handleChange('avatar', apiService.sanitize(e.target.value))}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
                placeholder="Avatar image URL"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Voice</label>
              <input
                value={formData.voice}
                onChange={(e) => handleChange('voice', apiService.sanitize(e.target.value))}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
                placeholder="Voice identifier (e.g., alloy, echo, fable)"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-slate-300">Active</span>
          </label>
          
          <button 
            onClick={handleUpdatePersona} 
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Persona'} <ArrowUpRight size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}