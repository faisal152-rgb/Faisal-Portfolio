import React, { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, Plus, Trash } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function TimelineSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getAdminTimeline();
      // Ensure we have an array
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  async function handleCreateItem() {
    try {
      setSaving(true);
      setError(null);
      const newItem = {
        title: 'New Timeline Item',
        description: 'Description here',
        order: items.length + 1,
      };
      await dataService.createTimeline(newItem);
      // Refresh the list after creation
      await fetchTimeline();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateItem(id, updatedItem) {
    try {
      setSaving(true);
      setError(null);
      await dataService.updateTimeline(id, updatedItem);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id) {
    if (!window.confirm('Delete this timeline item?')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteTimeline(id);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(idx, field, value) {
    const newItems = [...items];
    newItems[idx][field] = apiService.sanitize(value);
    setItems(newItems);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Timeline Settings</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }} />
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ marginBottom: '1rem', padding: '1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Timeline Settings</h2>
      
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={handleCreateItem} 
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Timeline Item
        </button>
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm self-center">
            Timeline saved successfully with real-time sync!
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {error}
        </div>
      )}

      {items.map((item, idx) => (
        <div key={item._id || idx} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-3 flex gap-4">
          <div className="flex-1 space-y-3">
            <input
              value={item.title}
              onChange={(e) => handleChange(idx, 'title', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm font-extrabold"
            />
            <textarea
              value={item.description || item.desc || ""}
              onChange={(e) => handleChange(idx, 'description', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleUpdateItem(item._id || idx, item)}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowUpRight size={14} weight="bold" /> Save
            </button>
            <button
              onClick={() => handleDeleteItem(item._id || idx)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}