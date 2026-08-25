import React, { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, Plus, Trash } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function HeroSettings() {
  const [hero, setHero] = useState({
    title: "Creative",
    subtitle: "Web Developer & Designer",
    description: "I build modern, responsive and scalable web applications with clean code and great user experience.",
    freelance: [
      { platform: "Upwork", url: "https://upwork.com/freelancers/", label: "Upwork Profile" },
      { platform: "Fiverr", url: "https://fiverr.com/", label: "Fiverr Gig" },
    ],
    socialLinks: [
      { platform: "GitHub", url: "https://github.com/" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/" },
      { platform: "Instagram", url: "https://instagram.com/" },
      { platform: "Twitter", url: "https://twitter.com/" },
      { platform: "TikTok", url: "https://www.tiktok.com/@" },
      { platform: "WhatsApp", url: "https://wa.me/923000000000" },
      { platform: "Email", url: "mailto:myemail@gmail.com" },
    ],
    loading: true,
    saving: false,
    error: null,
    success: false,
  });
  const [freelance, setFreelance] = useState([
    { platform: "Upwork", url: "https://upwork.com/freelancers/", label: "Upwork Profile" },
    { platform: "Fiverr", url: "https://fiverr.com/", label: "Fiverr Gig" },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setHero(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getAdminHero();
      if (data) {
        setHero(prev => ({ ...prev, ...data, loading: false }));
        // Use fetched freelance data if available, otherwise keep default
        if (data.freelance && data.freelance.length > 0) {
          setFreelance(data.freelance);
        }
      } else {
        setHero(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setHero(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch hero data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    try {
      setHero(prev => ({ ...prev, saving: true, error: null, success: false }));
      const payload = {
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        freelance: freelance.map(({ platform, url, label }) => ({ platform, url, label })),
        socialLinks: hero.socialLinks.map(({ platform, url }) => ({ platform, url })),
      };
      const result = await dataService.updateHero(payload);
      setHero(prev => ({ ...prev, ...result, saving: false, success: true }));
      setTimeout(() => setHero(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setHero(prev => ({ ...prev, saving: false, error: error.message }));
      console.error('Failed to save hero:', error);
    }
  }

  function handleSocialChange(idx, field, value) {
    const newLinks = [...hero.socialLinks];
    newLinks[idx][field] = apiService.sanitize(value);
    setHero(prev => ({ ...prev, socialLinks: newLinks }));
  }

  function addSocialLink() {
    setHero(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: '', url: '' }]
    }));
  }

  function removeSocialLink(idx) {
    setHero(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== idx)
    }));
  }

  function addFreelanceLink() {
    setFreelance([...freelance, { platform: '', url: '', label: '' }]);
  }

  function removeFreelanceLink(idx) {
    setFreelance(freelance.filter((_, i) => i !== idx));
  }

  function handleFreelanceChange(idx, field, value) {
    const arr = [...freelance];
    arr[idx][field] = apiService.sanitize(value);
    setFreelance(arr);
  }

  if (hero.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Hero Section</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '80px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Hero Section</h2>
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
        <h3 className="font-extrabold text-lg">Hero Content</h3>
        <input
          value={hero.title}
          onChange={(e) => {
            const val = apiService.sanitize(e.target.value);
            setHero({ ...hero, title: val });
          }}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm font-extrabold text-xl"
          placeholder="Hero Title"
        />
        <input
          value={hero.subtitle}
          onChange={(e) => setHero({ ...hero, subtitle: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Subtitle"
        />
        <textarea
          value={hero.description}
          onChange={(e) => setHero({ ...hero, description: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm min-h-[80px]"
          placeholder="Description"
        />
      </div>
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Freelance Platforms</h3>
          <button
            onClick={addFreelanceLink}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {freelance && freelance.length > 0 ? (
          freelance.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <input
                value={link.platform || ""}
                onChange={(e) => handleFreelanceChange(idx, 'platform', e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs font-medium"
                placeholder="Platform"
              />
              <input
                value={link.url || ""}
                onChange={(e) => handleFreelanceChange(idx, 'url', e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs"
                placeholder="URL"
              />
              <input
                value={link.label || ""}
                onChange={(e) => handleFreelanceChange(idx, 'label', e.target.value)}
                className="w-32 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs"
                placeholder="Label"
              />
              <button
                onClick={() => removeFreelanceLink(idx)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash size={16} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500">No platforms</p>
        )}
      </div>
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Social Links</h3>
          <button
            onClick={addSocialLink}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
          >
            <Plus size={14} /> Add Link
          </button>
        </div>
        {hero.socialLinks.map((link, idx) => (
          <div key={idx} className="flex gap-3">
            <input
              value={link.platform}
              onChange={(e) => handleSocialChange(idx, 'platform', e.target.value)}
              className="w-32 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Platform"
            />
            <input
              value={link.url}
              onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="URL"
            />
            <button
              onClick={() => removeSocialLink(idx)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>
      {hero.error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {hero.error}
        </div>
      )}
      {hero.success && (
        <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm">
          Hero settings saved successfully with real-time sync!
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={hero.saving}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
      >
        {hero.saving ? 'Saving...' : 'Save Settings'} <ArrowUpRight size={14} weight="bold" />
      </button>
    </div>
  );
}
