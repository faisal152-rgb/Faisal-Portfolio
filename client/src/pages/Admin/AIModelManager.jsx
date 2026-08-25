import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Plus,
  Trash,
  ArrowUpRight,
  CheckCircle,
  Sparkle,
  ArrowDownRight,
  ArrowCounterClockwise,
  Eye,
  EyeSlash,
  Copy,
} from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function AIModelManager() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalModelId, setOriginalModelId] = useState('');
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [useExistingKey, setUseExistingKey] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    modelId: '',
    apiKey: '',
    endpoint: '',
    isActive: false,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    capabilities: [],
  });
  const [showKey, setShowKey] = useState({});
  const [activeModels, setActiveModels] = useState({
    chat: '',
    vision: '',
    stt: '',
    tts: '',
  });
  const [nvidiaCatalog, setNvidiaCatalog] = useState({
    LLM: [],
    VISION: [],
    STT: [],
    TTS: [],
  });
  const [categoryCounts, setCategoryCounts] = useState({
    LLM: 0,
    VISION: 0,
    STT: 0,
    TTS: 0,
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  const fetchModels = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataService.getAIModels();
        setModels(data || []);
      } catch (err) {
        setError(err.message);
        alert('Failed to fetch AI models: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, []);

  const fetchAPIKeys = useCallback(async () => {
    try {
      setApiKeysLoading(true);
      const data = await dataService.getAPIKeysWithValues();
      setApiKeys(data || []);
    } catch (err) {
      setApiKeys([]);
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  const fetchNVIDIACatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const response = await apiService.adminGet('/ai/nvidia/models');
      if (response.success) {
        const { categories, counts } = response.data;
        setNvidiaCatalog(categories);
        setCategoryCounts(counts);
      } else {
        throw new Error(response.message || 'Failed to fetch NVIDIA catalog');
      }
    } catch (err) {
      setCatalogError(err.message);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // Subscribe to AI updates for real-time data integrity
  useEffect(() => {
    const unsubscribeModels = dataService.subscribe('ai', (data) => {
      if (data.type === 'models') {
        setModels(data.data || []);
      }
      if (data.type === 'active-models') {
        setActiveModels(data.data);
      }
    });
    return () => unsubscribeModels();
  }, []);

  const fetchActiveModels = useCallback(async () => {
    try {
      const response = await apiService.adminGet('/ai/settings/active-models');
      if (response.success) {
        setActiveModels(response.data || {});
      }
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchNVIDIACatalog();
    fetchActiveModels();
    fetchAPIKeys();
  }, [fetchModels, fetchNVIDIACatalog, fetchActiveModels, fetchAPIKeys]);

  async function handleCreateModel() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validation
      if (!formData.provider) {
        setError('Provider is required');
        setSaving(false);
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        setSaving(false);
        return;
      }
      if (!formData.modelId.trim()) {
        setError('Model ID is required');
        setSaving(false);
        return;
      }
      if (formData.capabilities.length === 0) {
        setError('Select at least one capability');
        setSaving(false);
        return;
      }
      
      const newModel = {
        name: formData.name.trim(),
        provider: formData.provider.toLowerCase(),
        modelId: formData.modelId.trim(),
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        maxTokens: formData.maxTokens || 4096,
        temperature: formData.temperature || 0.7,
        capabilities: [...formData.capabilities],
      };
      
      // Only include endpoint if user has entered a value
      if (formData.endpoint && formData.endpoint.trim() !== '') {
        newModel.endpoint = formData.endpoint.trim();
      }
      
      // Only include apiKey if user has entered a value
      if (formData.apiKey && formData.apiKey.trim() !== '') {
        newModel.apiKey = formData.apiKey;
      }
      
      const result = await dataService.createAIModel(newModel);
      
      // Refresh list to ensure we have latest data from server
      const updated = await dataService.getAIModels();
      setModels(updated || []);
      
      // Show success and reset form
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      resetForm();
      
    } catch (err) {
      setError(err.message || 'Failed to create model');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateModel() {
    if (!editingId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validation
      if (!formData.provider) {
        setError('Provider is required');
        setSaving(false);
        return;
      }
      if (!formData.name.trim()) {
        setError('Name is required');
        setSaving(false);
        return;
      }
      if (!formData.modelId.trim()) {
        setError('Model ID is required');
        setSaving(false);
        return;
      }
      if (formData.capabilities.length === 0) {
        setError('Select at least one capability');
        setSaving(false);
        return;
      }
      
      const updateData = {
        name: formData.name.trim(),
        provider: formData.provider.toLowerCase(),
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        maxTokens: formData.maxTokens || 4096,
        temperature: formData.temperature || 0.7,
        capabilities: [...formData.capabilities],
      };

      if (formData.modelId.trim() !== originalModelId) {
        updateData.modelId = formData.modelId.trim();
      }
      
      // Only include endpoint if user has entered a value
      if (formData.endpoint && formData.endpoint.trim() !== '') {
        updateData.endpoint = formData.endpoint.trim();
      }
      
      // Only include apiKey if user has entered a value (for updates)
      if (formData.apiKey && formData.apiKey.trim() !== '') {
        updateData.apiKey = formData.apiKey;
      }
      
      const result = await dataService.updateAIModel(editingId, updateData);
      
      // Refresh list
      const updated = await dataService.getAIModels();
      setModels(updated || []);
      
      // Show success and reset form
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      resetForm();
      
    } catch (err) {
      setError(err.message || 'Failed to update model');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModel(id) {
    if (!window.confirm('Delete this model? This action cannot be undone.')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteAIModel(id);
      setModels(prev => prev.filter(m => m._id !== id));
      if (editingId === id) {
        setEditingId(null);
        resetForm();
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id) {
    try {
      setSaving(true);
      setError(null);
      await dataService.setDefaultAIModel(id);
      const updated = await dataService.getAIModels();
      setModels(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    // Reset selected API key and clear API key field when provider changes
    if (field === 'provider') {
      setSelectedKeyId('');
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        apiKey: useExistingKey ? '' : prev.apiKey  // Clear if in existing key mode
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }

  function handleCapabilitiesChange(capability) {
    const newCapabilities = formData.capabilities.includes(capability)
      ? formData.capabilities.filter(c => c !== capability)
      : [...formData.capabilities, capability];
    setFormData(prev => ({ ...prev, capabilities: newCapabilities }));
  }

  function editModel(model) {
    setEditingId(model._id);
    setOriginalModelId(model.modelId || '');
    setFormData({
      ...model,
      apiKey: model.apiKey || ''
    });
    setShowKey(prev => ({ ...prev, [model._id]: false }));
    setUseExistingKey(true);
    setSelectedKeyId('');
  }

  function resetForm() {
    setFormData({
      name: '',
      provider: 'nvidia',
      modelId: '',
      apiKey: '',
      endpoint: '',
      isActive: true,
      isDefault: false,
      maxTokens: 4096,
      temperature: 0.7,
      capabilities: ['chat'],
    });
    setEditingId(null);
    setOriginalModelId('');
    setShowKey({});
    setError(null);
    setSuccess(false);
    setUseExistingKey(true);
    setSelectedKeyId('');
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  }

  // Get API keys filtered by provider
  const getKeysByProvider = (provider) => {
    if (!provider) return [];
    return apiKeys.filter(k => k.provider.toLowerCase() === provider.toLowerCase() && k.isActive);
  };

  // Handle key selection from dropdown
  const handleSelectExistingKey = (keyId) => {
    // Skip if empty selection
    if (!keyId || keyId.trim() === '') {
      return;
    }
    
    // Find the selected API key
    const selectedKey = apiKeys.find(k => k._id === keyId);
    
    if (selectedKey) {
      // Auto-populate the API key field
      const keyValue = selectedKey.key || '';
      setFormData(prev => ({ 
        ...prev, 
        apiKey: keyValue
      }));
      setSelectedKeyId(keyId);
    }
  };

  // Toggle between using existing key or manual entry
  const handleToggleKeyMode = (useExisting) => {
    setUseExistingKey(useExisting);
    if (!useExisting) {
      setSelectedKeyId('');
    } else {
      setFormData(prev => ({ ...prev, apiKey: '' }));
    }
  };

  // Unique providers from models
  const uniqueProviders = React.useMemo(() => {
    const commonProviders = ['nvidia', 'openai', 'anthropic', 'google', 'local', 'custom', 'huggingface', 'mistral', 'cohere', 'xenon', 'other'];
    const modelProviders = [...new Set(
      models
        .filter(model => model.provider && model.provider.trim() !== '')
        .map(model => model.provider.trim())
    )];
    return [...modelProviders, ...commonProviders.filter(p => !modelProviders.includes(p))];
  }, [models]);

  // Handle active model changes
  const handleActiveModelChange = (type, value) => {
    setActiveModels(prev => ({ ...prev, [type]: value }));
  };

  // Save active models
  const handleSaveActiveModels = async () => {
    try {
      setSaving(true);
      await apiService.adminPut('/ai/settings/active-models', activeModels);
      // Refresh models list to ensure UI is up-to-date
      const updatedModels = await dataService.getAIModels();
      setModels(updatedModels);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save active models: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-extrabold tracking-tight">AI Model Manager</h2>
          <div className="flex gap-2">
            <button onClick={fetchModels} className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2">
              <ArrowCounterClockwise size={14} /> Refresh
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
        <h2 className="text-2xl font-extrabold tracking-tight">AI Model Manager</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              resetForm();
              // Show form by setting a marker that we're creating (not editing)
              setEditingId('__new__');
              setFormData({
                name: '',
                provider: 'nvidia',
                modelId: '',
                apiKey: '',
                endpoint: '',
                isActive: true,
                isDefault: false,
                maxTokens: 4096,
                temperature: 0.7,
                capabilities: ['chat'],
              });
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <Plus size={16} weight="bold" /> Add Model
          </button>
          <button 
            onClick={fetchModels} 
            className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <ArrowCounterClockwise size={14} /> Refresh
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
          Model saved successfully!
        </div>
      )}

      {/* API Key Management Info */}
      {apiKeys.length === 0 && !apiKeysLoading && (
        <div className="bg-blue-950/30 border border-blue-900/30 text-blue-400 rounded-xl p-4 text-sm">
          💡 No API keys found. Go to <span className="font-semibold">API Manager</span> to add API keys for providers.
          Keys added there will auto-populate here when creating/editing models.
        </div>
      )}

      {/* Provider and Table Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-400">PROVIDER</label>
            <select
              value={formData.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            >
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>

          {/* Model Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950">
                <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">MODEL</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">PROVIDER</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">TYPE</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">CAPABILITY</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">STATUS</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-slate-800">
                 {models.filter(model => model && model._id).map(model => (
                   <tr key={model._id} className={`hover:bg-slate-950/20 cursor-pointer ${editingId === model._id ? 'bg-slate-950/10' : ''}`} onClick={() => editModel(model)}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{model.name}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 capitalize">{model.provider}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                       {model.capabilities.includes('chat') || model.capabilities.includes('completion') ? 'LLM' : 
                        model.capabilities.includes('vision') ? 'Vision' : 
                        model.capabilities.includes('audio') || model.capabilities.includes('speech-to-text') || model.capabilities.includes('stt') ? 'STT' : 
                        model.capabilities.includes('tts') || model.capabilities.includes('text-to-speech') ? 'TTS' : 'Other'}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                       {model.capabilities.map(cap => (
                         <span key={cap} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded mr-1">{cap}</span>
                       ))}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${model.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                         {model.isActive ? '● Active' : '○ Available'}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                       <button
                         onClick={(e) => { e.stopPropagation(); handleDeleteModel(model._id); }}
                         className="text-red-400 hover:text-red-300 transition"
                       >
                         <Trash size={16} />
                       </button>
                       {showKey[model._id] && model.apiKey && (
                         <button
                           onClick={(e) => { e.stopPropagation(); copyToClipboard(model.apiKey); }}
                           className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30 flex items-center gap-1"
                         >
                           <Copy size={12} className="inline mr-1" /> Copy
                         </button>
                       )}
                       <button
                         onClick={(e) => { e.stopPropagation(); setShowKey(prev => ({ ...prev, [model._id]: !prev[model._id] })); }}
                         className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                       >
                         {showKey[model._id] ? <EyeSlash size={12} className="inline mr-1" /> : <Eye size={12} className="inline mr-1" />}
                         {showKey[model._id] ? 'Hide' : 'Show'}
                       </button>
                     </td>
                   </tr>
                 ))}
                 {!models.length || models.filter(model => model && model._id).length === 0 && (
                               <tr>
                                 <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                                   No models found
                                 </td>
                               </tr>
                             )}
               </tbody>
             </table>
           </div>
         </div>
       </div>

       {/* Categories Section */}
       <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
         <h3 className="font-extrabold text-lg mb-4">CATEGORIES</h3>
         {catalogLoading ? (
           <div className="grid grid-cols-4 gap-4 text-center">
             {[['LLM', 0], ['VISION', 0], ['STT', 0], ['TTS', 0]].map(([label, count]) => (
               <div key={label}>
                 <p className="font-medium text-white">{label}</p>
                 <p className="text-xs text-slate-400">{count}</p>
               </div>
             ))}
           </div>
         ) : catalogError ? (
           <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
             Error loading categories: {catalogError}
           </div>
         ) : (
           <div className="grid grid-cols-4 gap-4 text-center">
             <div>
               <p className="font-medium text-white">LLM</p>
               <p className="text-xs text-slate-400">{categoryCounts.LLM}</p>
             </div>
             <div>
               <p className="font-medium text-white">VISION</p>
               <p className="text-xs text-slate-400">{categoryCounts.VISION}</p>
             </div>
             <div>
               <p className="font-medium text-white">STT</p>
               <p className="text-xs text-slate-400">{categoryCounts.STT}</p>
             </div>
             <div>
               <p className="font-medium text-white">TTS</p>
               <p className="text-xs text-slate-400">{categoryCounts.TTS}</p>
             </div>
           </div>
         )}
       </div>

       {/* Active Model Section */}
       <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
         <h3 className="font-extrabold text-lg mb-4">ACTIVE MODEL</h3>
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-400">Chat Model</label>
               <select
                 value={activeModels.chat || ''}
                 onChange={(e) => handleActiveModelChange('chat', e.target.value)}
                 className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
               >
                 <option value="">Select Chat Model</option>
                 {nvidiaCatalog.LLM.map(model => (
                   <option key={model.id} value={model.id}>
                     {model.name}
                   </option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400">Vision Model</label>
               <select
                 value={activeModels.vision || ''}
                 onChange={(e) => handleActiveModelChange('vision', e.target.value)}
                 className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
               >
                 <option value="">Select Vision Model</option>
                 {nvidiaCatalog.VISION.map(model => (
                   <option key={model.id} value={model.id}>
                     {model.name}
                   </option>
                 ))}
               </select>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-400">STT Model</label>
               <select
                 value={activeModels.stt || ''}
                 onChange={(e) => handleActiveModelChange('stt', e.target.value)}
                 className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
               >
                 <option value="">Select STT Model</option>
                 {nvidiaCatalog.STT.length > 0 ? (
                   nvidiaCatalog.STT.map(model => (
                     <option key={model.id} value={model.id}>
                       {model.name}
                     </option>
                   ))
                 ) : (
                   <option value="" disabled>No configured NVIDIA STT models available</option>
                 )}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400">TTS Model</label>
               <select
                 value={activeModels.tts || ''}
                 onChange={(e) => handleActiveModelChange('tts', e.target.value)}
                 className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
               >
                 <option value="">Select TTS Model</option>
                 {nvidiaCatalog.TTS.length > 0 ? (
                   nvidiaCatalog.TTS.map(model => (
                     <option key={model.id} value={model.id}>
                       {model.name}
                     </option>
                   ))
                 ) : (
                   <option value="" disabled>No NVIDIA TTS models available</option>
                 )}
               </select>
             </div>
           </div>
           <div className="flex justify-end">
             <button 
               onClick={handleSaveActiveModels}
               disabled={saving}
               className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
             >
               <span>
                 {saving ? 'Saving...' : 'Save Model'}
                 <ArrowUpRight size={14} weight="bold" className="ml-1" />
               </span>
             </button>
           </div>
         </div>
       </div>

       {/* Edit Form (conditional) */}
       {editingId && (
         <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
           <h3 className="font-extrabold text-lg flex items-center justify-between">
             <Sparkle size={20} weight="fill" className="text-amber-400" />
             <span>{editingId === '__new__' ? 'Add New Model' : 'Edit Model'}</span>
             <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">Close</button>
           </h3>
           
           <div className="grid md:grid-cols-2 gap-4">
             <input
               value={formData.name}
               onChange={(e) => handleChange('name', apiService.sanitize(e.target.value))}
               className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-bold"
               placeholder="Model Name (e.g., GPT-4 Turbo)"
             />
             <select
               value={formData.provider}
               onChange={(e) => handleChange('provider', e.target.value)}
               className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
             >
               {uniqueProviders.map(provider => (
                 <option key={provider} value={provider}>{provider}</option>
               ))}
             </select>
           </div>
           
           <div className="grid md:grid-cols-2 gap-4">
             <input
               value={formData.modelId}
               onChange={(e) => handleChange('modelId', apiService.sanitize(e.target.value))}
               className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-mono"
               placeholder="Model ID (e.g., gpt-4-turbo-preview)"
             />
             <input
               value={formData.endpoint}
               onChange={(e) => handleChange('endpoint', apiService.sanitize(e.target.value))}
               className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
               placeholder="Custom Endpoint URL (optional)"
             />
           </div>
           
           <div className="grid md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-slate-400 mb-2">API Key</label>
               
               {/* Toggle between existing and manual */}
               <div className="flex gap-2 mb-2">
                 <button
                   type="button"
                   onClick={() => handleToggleKeyMode(true)}
                   className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                     useExistingKey
                       ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                       : 'bg-slate-700 text-slate-400 border border-slate-600'
                   }`}
                 >
                   Use Existing
                 </button>
                 <button
                   type="button"
                   onClick={() => handleToggleKeyMode(false)}
                   className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                     !useExistingKey
                       ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                       : 'bg-slate-700 text-slate-400 border border-slate-600'
                   }`}
                 >
                   Enter New
                 </button>
               </div>

               {useExistingKey ? (
                 <>
                   {apiKeysLoading ? (
                     <div className="text-xs text-slate-400">Loading API keys...</div>
                   ) : getKeysByProvider(formData.provider).length > 0 ? (
                     <select
                       value={selectedKeyId}
                       onChange={(e) => handleSelectExistingKey(e.target.value)}
                       className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
                     >
                       <option value="">-- Select API Key --</option>
                       {getKeysByProvider(formData.provider).map(key => (
                         <option key={key._id} value={key._id}>
                           {key.name} ({key.provider})
                         </option>
                       ))}
                     </select>
                   ) : (
                     <div className="text-xs text-slate-400 bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5">
                       No API keys found for {formData.provider || 'selected provider'}
                     </div>
                   )}
                   <p className="text-xs text-slate-500 mt-1">Select from saved API keys in API Manager</p>
                 </>
               ) : (
                 <>
                   <div className="relative">
                     <input
                       type={showKey[editingId] ? 'text' : 'password'}
                       value={formData.apiKey}
                       onChange={(e) => handleChange('apiKey', e.target.value)}
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
                   <p className="text-xs text-slate-500 mt-1">{editingId !== '__new__' ? 'Leave blank to keep existing' : 'Enter API key manually'}</p>
                 </>
               )}
             </div>
             <div className="flex items-center">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input
                   type="checkbox"
                   checked={formData.isActive}
                   onChange={(e) => handleChange('isActive', e.target.checked)}
                   className="w-4 h-4 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
                 />
                 <span className="text-sm text-slate-300">Active</span>
               </label>
             </div>
           </div>
           
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
           
           <div>
             <label className="block text-xs font-medium text-slate-400 mb-1">Capabilities</label>
             <div className="flex flex-wrap gap-2">
               {['chat', 'completion', 'embedding', 'vision', 'audio', 'function-calling'].map(cap => (
                 <label key={cap} className="flex items-center gap-1 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={formData.capabilities.includes(cap)}
                     onChange={() => handleCapabilitiesChange(cap)}
                     className="w-4 h-4 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
                   />
                   <span className="text-sm text-slate-300 capitalize">{cap}</span>
                 </label>
               ))}
             </div>
           </div>
           
           <div className="flex items-center">
             <label className="flex items-center gap-2 cursor-pointer">
               <input
                 type="checkbox"
                 checked={formData.isDefault}
                 onChange={(e) => handleChange('isDefault', e.target.checked)}
                 className="w-4 h-4 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
               />
               <span className="text-sm text-slate-300">Default</span>
             </label>
           </div>
           
           <div className="flex justify-end gap-2">
             <button 
               onClick={resetForm}
               className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition"
             >
               Cancel
             </button>
             <button 
               onClick={editingId === '__new__' ? handleCreateModel : handleUpdateModel}
               disabled={saving}
               className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
             >
               <span>
                 {saving ? 'Saving...' : 'Save Model'}
                 <ArrowUpRight size={14} weight="bold" className="ml-1" />
               </span>
             </button>
           </div>
         </div>
       )}
    </div>
  );
}
