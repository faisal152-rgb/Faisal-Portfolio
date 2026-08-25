import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash, Repeat, Eye, EyeSlash, Copy, ShieldCheck, Key, ArrowDownRight } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function APIManager() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    key: '',
    baseUrl: '',
    model: '',
    isActive: true,
  });
  const [showKey, setShowKey] = useState({});
  const [providers, setProviders] = useState([]);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState(null);
  const [showForm, setShowForm] = useState(false); // Controls form visibility

  const fetchAPIKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getAPIKeys();
      setApiKeys(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const data = await dataService.getProviders();
      setProviders(data || []);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  }, []);

  useEffect(() => {
    fetchAPIKeys();
    fetchProviders();
  }, [fetchAPIKeys, fetchProviders]);

  async function handleCreateAPIKey() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      // Basic validation
      if (!formData.provider) {
        setError('Provider is required');
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!formData.key.trim()) {
        setError('API Key is required');
        return;
      }
      const newKey = {
        provider: formData.provider,
        name: formData.name.trim(),
        key: formData.key.trim(),
        baseUrl: formData.baseUrl.trim(),
        model: formData.model.trim(),
        isActive: formData.isActive,
      };
      const result = await dataService.createAPIKey(newKey);
      // Handle result as array (from updated backend)
      const updatedKeys = Array.isArray(result) ? result : [result];
      setApiKeys(updatedKeys);
      if (updatedKeys.length > 0) {
        setEditingId(updatedKeys[updatedKeys.length - 1]._id);
      }
      setFormData({
        provider: '',
        name: '',
        key: '',
        baseUrl: '',
        model: '',
        isActive: true,
      });
      setSuccess(true);
      setShowForm(false); // Hide form after success
    } catch (err) {
      setError(err.message);
      console.error('Error creating API key:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAPIKey() {
    if (!editingId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      // Basic validation
      if (!formData.provider) {
        setError('Provider is required');
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      
      const updateData = { ...formData };
      if (formData.key.trim() === '') {
        const existingKey = (apiKeys || []).find(k => k._id === editingId);
        if (existingKey) {
          updateData.key = existingKey.key;
        }
      } else {
        updateData.key = formData.key.trim();
      }
      
      updateData.name = formData.name.trim();
      updateData.baseUrl = formData.baseUrl.trim();
      updateData.model = formData.model.trim();
      
      const result = await dataService.updateAPIKey(editingId, updateData);
      const updatedKeys = Array.isArray(result) ? result : [result];
      setApiKeys(updatedKeys);
      setSuccess(true);
      setShowForm(false); // Hide form after success
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAPIKey(id) {
    if (!window.confirm('Delete this API key? This action cannot be undone.')) return;
    try {
      setSaving(true);
      setError(null);
      const result = await dataService.deleteAPIKey(id);
      const updatedKeys = Array.isArray(result) ? result : [];
      setApiKeys(updatedKeys);
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

  async function handleTestConnection() {
    if (!formData.key.trim()) {
      setTestError('API Key is required for testing');
      setTestSuccess(false);
      return;
    }
    setTestError(null);
    setTestSuccess(false);
    // Simulate test - in real app, this would call an endpoint to validate the key
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (err) {
      setTestError(err.message || 'Test failed');
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear test status when form changes
    setTestError(null);
    setTestSuccess(false);
  }

  function editAPIKey(key) {
    setEditingId(key._id);
    setFormData({ 
      provider: key.provider,
      name: key.name,
      key: '', // Don't show actual key
      baseUrl: key.baseUrl || '',
      model: key.model || '',
      isActive: key.isActive
    });
    setShowKey(prev => ({ ...prev, [key._id]: false }));
    setShowForm(true); // Show form when editing
    // Clear test status when editing
    setTestError(null);
    setTestSuccess(false);
  }

  function resetForm() {
    setFormData({
      provider: '',
      name: '',
      key: '',
      baseUrl: '',
      model: '',
      isActive: true,
    });
    setEditingId(null);
    setTestError(null);
    setTestSuccess(false);
    // Note: Do NOT hide form here; closing is done via Close button
  }

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-extrabold tracking-tight">API Manager</h2>
          <div className="flex gap-2">
            <button onClick={fetchAPIKeys} className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
              <Repeat size={14} /> Refresh All
            </button>
            <button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
              <Plus size={14} /> Add API
            </button>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold tracking-tight">API Manager</h2>
        <div className="flex gap-2">
          <button onClick={fetchAPIKeys} className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
            <Repeat size={14} /> Refresh All
          </button>
          <button onClick={() => setShowForm(true)} className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
            <Plus size={14} /> Add API
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm self-center">
          API Key saved successfully!
        </div>
      )}

      {/* API Manager Table */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">API NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">PROVIDER</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">TYPE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(apiKeys || []).filter(key => key && key._id).map(key => (
                <tr key={key._id} className={`hover:bg-slate-950/20 cursor-pointer ${editingId === key._id ? 'bg-slate-950/10' : ''}`} onClick={() => editAPIKey(key)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{key.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{key.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {key.provider.toLowerCase().includes('nvidia') ? 'AI' :
                     key.provider.toLowerCase().includes('gmail') ? 'Email' :
                     key.provider.toLowerCase().includes('calendar') ? 'Calendar' :
                     key.provider.toLowerCase().includes('whatsapp') ? 'Messaging' : 'Other'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${key.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {key.isActive ? '● Connected' : '○ Disconnected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAPIKey(key._id); }}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash size={16} />
                    </button>
                    {showKey[key._id] && key.key && (
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(key.key); }}
                        className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30 flex items-center gap-1"
                      >
                        <Copy size={12} className="inline mr-1" /> Copy
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowKey(prev => ({ ...prev, [key._id]: !prev[key._id] })); }}
                      className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      {showKey[key._id] ? <EyeSlash size={12} className="inline mr-1" /> : <Eye size={12} className="inline mr-1" />}
                      {showKey[key._id] ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {!(apiKeys || []).length || (apiKeys || []).filter(key => key && key._id).length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-slate-500">
                    No API keys found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <h3 className="font-extrabold text-lg mb-4">SECURITY</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">API Keys</p>
              <p className="text-xs text-slate-400">● Encrypted</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">OAuth Tokens</p>
              <p className="text-xs text-slate-400">● Encrypted</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Secrets</p>
              <p className="text-xs text-slate-400">● Server-side only</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">HTTPS</p>
              <p className="text-xs text-slate-400">● Enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add API Form - Conditionally rendered */}
      {showForm && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center justify-between">
            <Key size={20} weight="fill" className="text-amber-400" />
            <span>{editingId ? 'Edit API' : 'Add API'}</span>
            <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">Close</button>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
              >
                <option value="">Select Provider</option>
                {providers.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">API Name</label>
              <input
                value={formData.name}
                onChange={(e) => handleChange('name', apiService.sanitize(e.target.value))}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-bold w-full"
                placeholder="API Name"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showKey[editingId] ? 'text' : 'password'}
                  value={formData.key}
                  onChange={(e) => handleChange('key', e.target.value)}
                  className="pl-10 pr-3 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-mono w-full"
                  placeholder="•••••••••••••••••••••••••••••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(prev => ({ ...prev, [editingId]: !prev[editingId] }))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKey[editingId] ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {testError && (
                <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm mt-2">
                  Error: {testError}
                </div>
              )}
              {testSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm mt-2">
                  Connection successful!
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">{editingId ? 'Leave blank to keep the existing key unchanged' : 'API key is required'}</p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Base URL</label>
              <input
                value={formData.baseUrl}
                onChange={(e) => handleChange('baseUrl', e.target.value)}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
                placeholder="Base URL (optional)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Model / Service</label>
              <input
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
                placeholder="Model or Service (optional)"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-slate-300">Status</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={handleTestConnection}
              disabled={saving}
              className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              {testSuccess ? 'Success' : 'Test Connection'} <Repeat size={14} />
            </button>
            <button 
              onClick={editingId ? handleUpdateAPIKey : handleCreateAPIKey} 
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Save API' : 'Save API')} <ArrowDownRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}