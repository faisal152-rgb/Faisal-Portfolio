import React, { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, UploadSimple, Download, Trash } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

export default function AboutSettings() {
  const [about, setAbout] = useState({
    name: "",
    role: "",
    university: "",
    degree: "",
    years: "",
    location: "",
    email: "",
    profileImage: "",
    resume: "",
    stats: [
      ["", ""],
      ["", ""],
      ["", ""],
    ],
    loading: true,
    saving: false,
    error: null,
    success: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setAbout(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getAdminAbout();
      if (data) {
        setAbout(prev => ({ ...prev, ...data, loading: false }));
      } else {
        setAbout(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setAbout(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch about data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    try {
      setAbout(prev => ({ ...prev, saving: true, error: null, success: false }));
      const result = await dataService.updateAbout(about);
      setAbout(prev => ({ ...prev, ...result, saving: false, success: true }));
      setTimeout(() => setAbout(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setAbout(prev => ({ ...prev, saving: false, error: error.message }));
      console.error('Failed to save about:', error);
    }
  }

  async function handleProfileImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAbout(prev => ({ ...prev, error: 'Please select an image file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAbout(prev => ({ ...prev, error: 'Profile image must be 5 MB or smaller' }));
      return;
    }

    try {
      setAbout(prev => ({ ...prev, saving: true, error: null }));
      const profileImage = await dataService.uploadAboutProfileImage(file);
      setAbout(prev => ({ ...prev, profileImage, saving: false }));
    } catch (error) {
      setAbout(prev => ({ ...prev, saving: false, error: error.message }));
    } finally {
      event.target.value = '';
    }
  }

  async function handleResumeChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setAbout(prev => ({ ...prev, error: 'Please select a PDF file' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAbout(prev => ({ ...prev, error: 'Resume must be 10 MB or smaller' }));
      return;
    }

    try {
      setAbout(prev => ({ ...prev, saving: true, error: null }));
      const resume = await dataService.uploadAboutResume(file);
      setAbout(prev => ({ ...prev, resume, saving: false }));
    } catch (error) {
      setAbout(prev => ({ ...prev, saving: false, error: error.message }));
    } finally {
      event.target.value = '';
    }
  }

  function handleRemoveResume() {
    setAbout(prev => ({ ...prev, resume: '' }));
  }

  function handleDownloadResume() {
    if (about.resume) {
      const link = document.createElement('a');
      link.href = about.resume;
      link.download = `${about.name || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  if (about.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">About Me Settings</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">About Me Settings</h2>
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={about.profileImage || "/Faisal.png"}
            alt="Profile preview"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-amber-400/70"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/Faisal.png";
            }}
          />
          <div>
            <p className="font-medium text-slate-300">Profile image</p>
            <p className="text-xs text-slate-500">JPG, PNG, WEBP, or GIF up to 5 MB</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400">
              <UploadSimple size={16} weight="bold" />
              Change image
              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="sr-only" />
            </label>
          </div>
        </div>
        <input
          value={about.name}
          onChange={(e) => setAbout({ ...about, name: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-lg font-extrabold"
          placeholder="Name"
        />
        <input
          value={about.role}
          onChange={(e) => setAbout({ ...about, role: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Role"
        />
        <input
          value={about.university || ""}
          onChange={(e) => setAbout({ ...about, university: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="University"
        />
        <input
          value={about.degree || ""}
          onChange={(e) => setAbout({ ...about, degree: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Degree"
        />
        <input
          value={about.years || ""}
          onChange={(e) => setAbout({ ...about, years: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Years (e.g., 2022-26)"
        />
        <input
          value={about.location || ""}
          onChange={(e) => setAbout({ ...about, location: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Location"
        />
        <input
          value={about.email || ""}
          onChange={(e) => setAbout({ ...about, email: apiService.sanitize(e.target.value) })}
          className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Email"
          type="email"
        />
        <div className="border-t border-slate-700/50 pt-4">
          <p className="font-medium text-slate-300 mb-2">CV / Resume</p>
          {about.resume ? (
            <div className="flex items-center justify-between bg-slate-950/50 border border-slate-700/30 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-amber-400">Resume uploaded</p>
                <p className="text-xs text-slate-500 mt-1">Click download to view the file</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadResume}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Download size={14} weight="bold" />
                  Download
                </button>
                <button
                  onClick={handleRemoveResume}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-2">PDF up to 10 MB</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400">
                <UploadSimple size={16} weight="bold" />
                Upload Resume
                <input type="file" accept="application/pdf" onChange={handleResumeChange} className="sr-only" />
              </label>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-slate-300">Stats</h4>
          {about.stats.map((stat, idx) => (
            <div key={idx} className="flex gap-3">
              <input
                value={stat[0]}
                onChange={(e) => {
                  const arr = [...about.stats];
                  arr[idx][0] = apiService.sanitize(e.target.value);
                  setAbout({ ...about, stats: arr });
                }}
                className="w-24 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                placeholder="Value"
              />
              <input
                value={stat[1]}
                onChange={(e) => {
                  const arr = [...about.stats];
                  arr[idx][1] = apiService.sanitize(e.target.value);
                  setAbout({ ...about, stats: arr });
                }}
                className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </div>
      {about.error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {about.error}
        </div>
      )}
      {about.success && (
        <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm">
          About settings saved successfully with real-time sync!
        </div>
      )}
      <button 
        onClick={handleSave} 
        disabled={about.saving}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
      >
        {about.saving ? 'Saving...' : 'Save'} <ArrowUpRight size={14} weight="bold" />
      </button>
    </div>
  );
}
