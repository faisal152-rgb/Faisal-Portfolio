import React, { useState, useEffect, useCallback } from "react";
import { BookOpenText, Plus, Trash, ArrowUpRight, Tag } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

// Inline SVG for Search icon
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// Inline SVG for Filter icon
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

// Inline SVG for ArrowUp icon
const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>
);

// Inline SVG for ArrowDown icon
const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>
);

export default function AIKnowledgeBase() {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    source: 'manual',
    sourceUrl: '',
    isActive: true,
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const fetchKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getKnowledgeBase({ search, category: categoryFilter });
      setKnowledge(data || []);
      
      // Extract unique categories
      const allCategories = [...new Set(data.map(k => k.category).filter(Boolean))];
      setCategories(allCategories);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('knowledge', (data) => {
      fetchKnowledge();
    });
    return () => unsubscribe();
  }, [fetchKnowledge]);

  async function handleCreateEntry() {
    try {
      setSaving(true);
      setError(null);
      const newEntry = {
        title: 'New Knowledge Entry',
        content: 'Content here...',
        category: '',
        tags: [],
        source: 'manual',
        sourceUrl: null,
        isActive: true,
      };
      const result = await dataService.createKnowledgeEntry(newEntry);
      setKnowledge(prev => [...prev, result]);
      setEditingId(result._id);
      setFormData({
        ...result,
        tags: result.tags || [],
        sourceUrl: result.sourceUrl || '',
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEntry() {
    if (!editingId) return;
    try {
      setSaving(true);
      setError(null);
      // Sanitize formData - convert empty sourceUrl to null
      const dataToSend = { ...formData, tags: formData.tags || [] };
      if (formData.sourceUrl.trim()) {
        dataToSend.sourceUrl = formData.sourceUrl.trim();
      } else {
        delete dataToSend.sourceUrl;
      }
      const result = await dataService.updateKnowledgeEntry(editingId, dataToSend);
      setKnowledge(prev => prev.map(k => k._id === editingId ? result : k));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(id) {
    if (!window.confirm('Delete this knowledge entry?')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteKnowledgeEntry(id);
      setKnowledge(prev => prev.filter(k => k._id !== id));
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
    if (field === 'tags') {
      setFormData(prev => ({ ...prev, tags: value.split(',').map(t => t.trim()).filter(Boolean) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }

  function editEntry(entry) {
    setEditingId(entry._id);
    setFormData({
      title: entry.title || '',
      content: entry.content || '',
      category: entry.category || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      source: entry.source || 'manual',
      sourceUrl: entry.sourceUrl || '',
      isActive: entry.isActive ?? true,
    });
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      source: 'manual',
      sourceUrl: '',
      isActive: true,
    });
    setEditingId(null);
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  function handleCategoryChange(e) {
    setCategoryFilter(e.target.value);
  }

  const sources = ['manual', 'website', 'document', 'api'];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">AI Knowledge Base</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">AI Knowledge Base</h2>
      
      {/* Search & Filter */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search knowledge base..."
              className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-10 py-2.5 text-sm pl-10"
            />
          </div>
          <div className="min-w-[180px]">
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={handleCreateEntry} 
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Entry
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
            Entry saved successfully with real-time sync!
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {/* Knowledge List */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
        <h3 className="font-extrabold text-lg mb-4">Knowledge Entries ({knowledge.length})</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {knowledge.map(entry => (
            <div 
              key={entry._id}
              className={`group bg-slate-950 border rounded-xl p-4 transition cursor-pointer ${editingId === entry._id ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800/50 hover:border-amber-500/30'}`}
              onClick={() => editEntry(entry)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpenText size={18} weight="fill" className="text-amber-400" />
                    <h4 className="font-bold text-white truncate">{entry.title}</h4>
                    {entry.category && (
                      <Tag size={12} weight="fill" className="text-amber-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-2">{entry.content}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags?.slice(0, 5).map(tag => (
                      <span key={tag} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                    {entry.tags?.length > 5 && (
                      <span className="text-xs text-slate-500 px-2 py-0.5">+{entry.tags.length - 5}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded ${entry.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {entry.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="capitalize">{entry.source}</span>
                    {entry.sourceUrl && (
                      <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                        Source
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry._id); }}
                  type="button"
                  title="Delete entry"
                  aria-label={`Delete ${entry.title}`}
                  className="text-red-400 hover:text-red-300 transition shrink-0"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {knowledge.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpenText size={48} className="mx-auto mb-4 text-slate-700" />
            <p>No knowledge entries found. Click "Add Entry" to create one.</p>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editingId && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center justify-between">
            <BookOpenText size={20} weight="fill" className="text-amber-400" />
            <span>{knowledge.find(k => k._id === editingId) ? 'Edit Entry' : 'New Entry'}</span>
            <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">Close</button>
          </h3>
          
          <input
            value={formData.title}
            onChange={(e) => handleChange('title', apiService.sanitize(e.target.value))}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-bold"
            placeholder="Entry Title"
          />
          
          <label className="block text-xs font-medium text-slate-400 mb-1">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', apiService.sanitize(e.target.value))}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm min-h-[150px] w-full"
            placeholder="Knowledge content for AI..."
          />
          
          <div className="grid md:grid-cols-3 gap-4">
            <input
              value={formData.category}
              onChange={(e) => handleChange('category', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Category"
              list="categories"
            />
            <datalist id="categories">
              {categories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            >
              {sources.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            
            <input
              value={formData.sourceUrl}
              onChange={(e) => handleChange('sourceUrl', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Source URL (optional)"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
            <input
              value={formData.tags.join(', ')}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm w-full"
              placeholder="tag1, tag2, tag3"
            />
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
            onClick={handleUpdateEntry} 
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Entry'} <ArrowUpRight size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}