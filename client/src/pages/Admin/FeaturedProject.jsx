import React, { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, Plus, Trash, Image } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

const PROJECT_LIMITS = {
  tech: 200,
  // subText limit removed — unlimited description allowed
};

function validateProjectForm(data) {
  const errors = [];
  const tech = Array.isArray(data.tech) ? data.tech : [];

  const longTech = tech.find((item) => item.length > PROJECT_LIMITS.tech);
  if (longTech) errors.push(`Technology names must be ${PROJECT_LIMITS.tech} characters or fewer.`);
  if (data.liveUrl && !/^https?:\/\/\S+$/i.test(data.liveUrl)) {
    errors.push('Live Demo URL must start with http:// or https://.');
  }
  if (data.codeUrl && !/^https?:\/\/\S+$/i.test(data.codeUrl)) {
    errors.push('GitHub URL must start with http:// or https://.');
  }

  return errors;
}

function normalizeProjectForm(data) {
  return {
    ...data,
    tech: (Array.isArray(data.tech) ? data.tech : [])
      .map((item) => String(item).trim().slice(0, PROJECT_LIMITS.tech))
      .filter(Boolean),
    subText: String(data.subText || ''),
    clientName: String(data.clientName || ''),
    keyFeatures: Array.isArray(data.keyFeatures) ? data.keyFeatures : [],
    coverImageSettings: {
      fit: data.coverImageSettings?.fit === 'contain' ? 'contain' : 'cover',
      positionX: Number(data.coverImageSettings?.positionX ?? 50),
      positionY: Number(data.coverImageSettings?.positionY ?? 50),
      scale: Number(data.coverImageSettings?.scale ?? 100),
      rotation: Number(data.coverImageSettings?.rotation ?? 0),
      brightness: Number(data.coverImageSettings?.brightness ?? 100),
      contrast: Number(data.coverImageSettings?.contrast ?? 100),
      saturation: Number(data.coverImageSettings?.saturation ?? 100),
      grayscale: Number(data.coverImageSettings?.grayscale ?? 0),
      flipX: Boolean(data.coverImageSettings?.flipX),
      flipY: Boolean(data.coverImageSettings?.flipY),
    },
  };
}

export default function FeaturedProject() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [projectImageFiles, setProjectImageFiles] = useState([]);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState('');
  const [coverDrag, setCoverDrag] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tagline: '',
    tech: [],
    liveUrl: '',
    codeUrl: '',
    brandIcon: 'sparkle',
    brandColor: '#a855f7',
    subText: '',
    clientName: '',
    keyFeatures: [],
    stats: [],
    coverImage: '',
    images: [],
    coverImageSettings: { fit: 'cover', positionX: 50, positionY: 50, scale: 100, rotation: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, flipX: false, flipY: false },
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getAdminProjects();
      setProjects(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreateProject() {
    try {
      setSaving(true);
      setError(null);
      // Use formData as base, ensuring required fields have sensible defaults
      const techArray = Array.isArray(formData.tech) ? formData.tech : [];
      const statsArray = Array.isArray(formData.stats) ? formData.stats : [];
      const newProject = {
        id: crypto.randomUUID(),
        name: formData.name?.trim(),
        tagline: formData.tagline?.trim(),
        tech: techArray,
        brandIcon: formData.brandIcon?.trim() || 'sparkle',
        brandColor: formData.brandColor?.trim() || '#a855f7',
        subText: formData.subText?.trim(),
        clientName: formData.clientName?.trim() || '',
        keyFeatures: Array.isArray(formData.keyFeatures) ? formData.keyFeatures : [],
        stats: statsArray,
        order: projects.length + 1,
        coverImageSettings: formData.coverImageSettings,
      };
      // Only add URLs if they are non-empty to avoid validation errors
      if (formData.liveUrl?.trim()) {
        newProject.liveUrl = formData.liveUrl.trim();
      }
      if (formData.codeUrl?.trim()) {
        newProject.codeUrl = formData.codeUrl.trim();
      }
      const validationErrors = validateProjectForm(newProject);
      if (!newProject.name || !newProject.tagline) {
        validationErrors.unshift('Project name and tagline are required.');
      }
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
        return;
      }
      // Add cover image and additional images
      if (formData.coverImage) {
        newProject.coverImage = formData.coverImage;
      }
      if (Array.isArray(formData.images) && formData.images.length > 0) {
        newProject.images = formData.images;
      }
      const createdProject = await dataService.createProject(newProject);
      for (const imageEntry of projectImageFiles) {
        const kind = imageEntry.preview === selectedCoverUrl ? 'cover' : 'gallery';
        await dataService.uploadProjectImage(createdProject._id, imageEntry.file, kind);
      }
      if (documentFile) {
        await dataService.uploadProjectDocument(createdProject._id, documentFile);
      }
      // Refresh the list after creation
      await fetchProjects();
      setSuccess(true);
    } catch (err) {
      console.error('Create project error:', err);
      if (err.response) {
        console.error('Server response:', err.response);
        setError(err.response.message || 'Validation failed');
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const handleClearForm = () => {
    setFormData({
      id: '',
      name: '',
      tagline: '',
      tech: [],
      liveUrl: '',
      codeUrl: '',
      brandIcon: 'sparkle',
      brandColor: '#a855f7',
      subText: '',
      clientName: '',
      keyFeatures: [],
      stats: [],
      coverImage: '',
      images: [],
      coverImageSettings: { fit: 'cover', positionX: 50, positionY: 50, scale: 100, rotation: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, flipX: false, flipY: false },
    });
    setDocumentFile(null);
    setProjectImageFiles([]);
    setSelectedCoverUrl('');
    setEditingId(null);
  };

  async function handleUpdateProject() {
    if (!editingId) return;
    try {
      setSaving(true);
      setError(null);
      const updateData = { ...formData };
      if (!updateData.liveUrl?.trim()) delete updateData.liveUrl;
      if (!updateData.codeUrl?.trim()) delete updateData.codeUrl;
      if (isTemporaryUrl(updateData.coverImage)) updateData.coverImage = '';
      updateData.images = Array.isArray(updateData.images)
        ? updateData.images.filter((image) => !isTemporaryUrl(image))
        : [];
      updateData.coverImageSettings = formData.coverImageSettings;
      if (selectedCoverUrl && !isTemporaryUrl(selectedCoverUrl)) {
        updateData.coverImage = selectedCoverUrl;
      }
      const validationErrors = validateProjectForm(updateData);
      if (!updateData.name?.trim() || !updateData.tagline?.trim()) {
        validationErrors.unshift('Project name and tagline are required.');
      }
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
        return;
      }
      const result = await dataService.updateProject(editingId, updateData);
      if (documentFile && editingId !== 'new') {
        await dataService.uploadProjectDocument(editingId, documentFile);
      }
      for (const imageEntry of projectImageFiles) {
        const kind = imageEntry.preview === selectedCoverUrl ? 'cover' : 'gallery';
        await dataService.uploadProjectImage(editingId, imageEntry.file, kind);
      }
      setProjects(prev => prev.map(p => (p._id === editingId || p.id === editingId) ? result : p));
      if (documentFile || projectImageFiles.length > 0) await fetchProjects();
      setDocumentFile(null);
      setProjectImageFiles([]);
      setSelectedCoverUrl('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(id) {
    if (!window.confirm('Delete this project?')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteProject(id);
      setProjects(prev => prev.filter(p => p._id !== id && p.id !== id));
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
    if (field === 'subText') {
      value = value.slice(0, PROJECT_LIMITS.subText);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleTechChange(value) {
    const techArray = value.split(',')
      .map(s => s.trim().slice(0, PROJECT_LIMITS.tech))
      .filter(Boolean);
    setFormData(prev => ({ ...prev, tech: techArray }));
  }

  function handleCoverSettingChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      coverImageSettings: { ...prev.coverImageSettings, [field]: value },
    }));
  }

  function handleCoverPointerDown(event) {
    if (!selectedCoverUrl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCoverDrag({
      startX: event.clientX,
      startY: event.clientY,
      positionX: formData.coverImageSettings.positionX,
      positionY: formData.coverImageSettings.positionY,
    });
  }

  function handleCoverPointerMove(event) {
    if (!coverDrag) return;
    setFormData((prev) => ({
      ...prev,
      coverImageSettings: {
        ...prev.coverImageSettings,
        positionX: Math.max(0, Math.min(100, coverDrag.positionX + (event.clientX - coverDrag.startX) * 0.25)),
        positionY: Math.max(0, Math.min(100, coverDrag.positionY + (event.clientY - coverDrag.startY) * 0.25)),
      },
    }));
  }

  function resetCoverAdjustments() {
    setFormData((prev) => ({
      ...prev,
      coverImageSettings: { fit: 'cover', positionX: 50, positionY: 50, scale: 100, rotation: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, flipX: false, flipY: false },
    }));
  }

  const coverPreviewStyle = {
    objectFit: formData.coverImageSettings.fit,
    objectPosition: `${formData.coverImageSettings.positionX}% ${formData.coverImageSettings.positionY}%`,
    transform: `scale(${formData.coverImageSettings.scale / 100}) rotate(${formData.coverImageSettings.rotation}deg) scaleX(${formData.coverImageSettings.flipX ? -1 : 1}) scaleY(${formData.coverImageSettings.flipY ? -1 : 1})`,
    filter: `brightness(${formData.coverImageSettings.brightness}%) contrast(${formData.coverImageSettings.contrast}%) saturate(${formData.coverImageSettings.saturation}%) grayscale(${formData.coverImageSettings.grayscale}%)`,
  };

  function handleStatChange(index, field, value) {
    const newStats = [...formData.stats];
    newStats[index][field] = value;
    setFormData(prev => ({ ...prev, stats: newStats }));
  }

  function handleProjectImagesChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const entries = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setProjectImageFiles((previousFiles) => [...previousFiles, ...entries]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...entries.map((entry) => entry.preview)],
    }));
    if (!selectedCoverUrl) setSelectedCoverUrl(entries[0].preview);
    e.target.value = '';
  }

  function handleDocumentChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Project document must be 10 MB or smaller.');
      e.target.value = '';
      return;
    }
    setError(null);
    setDocumentFile(file);
  }

  async function handleRemoveProjectImage(imageUrl) {
    const remainingImages = Array.from(new Set([
      formData.coverImage,
      ...formData.images,
    ].filter(Boolean))).filter((image) => image !== imageUrl);

    try {
      setSaving(true);
      setError(null);
      if (editingId && editingId !== 'new' && !isTemporaryUrl(imageUrl)) {
        await dataService.deleteProjectImage(editingId, imageUrl);
      }
      setProjectImageFiles((previousFiles) => previousFiles.filter((entry) => entry.preview !== imageUrl));
      setFormData((prev) => ({
        ...prev,
        coverImage: prev.coverImage === imageUrl ? (remainingImages[0] || '') : prev.coverImage,
        images: prev.images.filter((image) => image !== imageUrl),
      }));
      if (selectedCoverUrl === imageUrl) setSelectedCoverUrl(remainingImages[0] || '');
      if (editingId && editingId !== 'new' && !isTemporaryUrl(imageUrl)) await fetchProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addStat() {
    setFormData(prev => ({
      ...prev,
      stats: [...prev.stats, { value: '', label: '' }]
    }));
  }

  function removeStat(index) {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  }

  function editProject(project) {
    setEditingId(project._id || project.id);
    setFormData(normalizeProjectForm({
      id: project.id || '',
      name: project.name || '',
      tagline: project.tagline || '',
      tech: project.tech || [],
      liveUrl: project.liveUrl || '',
      codeUrl: project.codeUrl || '',
      brandIcon: project.brandIcon || 'sparkle',
      brandColor: project.brandColor || '#a855f7',
      subText: project.subText || '',
      clientName: project.clientName || '',
      keyFeatures: Array.isArray(project.keyFeatures) ? project.keyFeatures : [],
      stats: project.stats || [],
      coverImage: project.coverImage || '',
      images: Array.isArray(project.images) ? project.images : [],
      coverImageSettings: project.coverImageSettings,
    }));
    setDocumentFile(null);
    setProjectImageFiles([]);
    setSelectedCoverUrl(project.coverImage || project.images?.[0] || '');
  }

  function resetForm() {
    setFormData({
      id: '',
      name: '',
      tagline: '',
      tech: [],
      liveUrl: '',
      codeUrl: '',
      brandIcon: 'sparkle',
      brandColor: '#a855f7',
      subText: '',
      clientName: '',
      keyFeatures: [],
      stats: [],
      coverImage: '',
      images: [],
      coverImageSettings: { fit: 'cover', positionX: 50, positionY: 50, scale: 100 },
    });
    setDocumentFile(null);
    setProjectImageFiles([]);
    setSelectedCoverUrl('');
    setEditingId(null);
  }

  const icons = ['drop', 'bag', 'sparkle', 'code', 'database', 'cloud', 'cpu', 'mobile', 'rocket', 'star', 'heart', 'shield'];
  const imageUrls = Array.from(new Set([formData.coverImage, ...formData.images].filter(Boolean)));

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Featured Project</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Featured Project</h2>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { handleClearForm(); setEditingId('new'); }}
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Project
        </button>
        {!saving && (
          <button
            onClick={handleClearForm}
            className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <Trash size={14} /> Clear Form
          </button>
        )}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm self-center">
            Project saved successfully with real-time sync!
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {error}
        </div>
      )}

      {/* Project List */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
        <h3 className="font-extrabold text-lg mb-4">Projects</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div 
              key={project._id || project.id}
              className={`bg-slate-950 border rounded-xl p-4 transition cursor-pointer ${editingId === (project._id || project.id) ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800/50 hover:border-amber-500/30'}`}
              onClick={() => editProject(project)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">{project.name}</h4>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(project._id || project.id); }}
                  className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash size={16} />
                </button>
              </div>
              <p className="text-slate-400 text-sm line-clamp-2">{project.tagline}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {(Array.isArray(project.tech) ? project.tech : []).slice(0, 3).map(t => (
                  <span key={t} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{t}</span>
                ))}
                {Array.isArray(project.tech) && project.tech.length > 3 && (
                  <span className="text-xs text-slate-500 px-2 py-0.5">+{project.tech.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      {editingId && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-extrabold text-lg flex items-center justify-between">
            {projects.find(p => (p._id || p.id) === editingId) ? 'Edit Project' : 'New Project'}
            <div className="flex items-center gap-2">
              {editingId !== 'new' && (
                <button
                  onClick={() => handleDeleteProject(editingId)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  <Trash size={16} />
                </button>
              )}
              <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={formData.name}
              onChange={(e) => handleChange('name', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-lg font-extrabold"
              placeholder="Project Name"
            />
            <input
              value={formData.tagline}
              onChange={(e) => handleChange('tagline', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Tagline"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={formData.clientName}
              onChange={(e) => handleChange('clientName', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Client Name"
            />
            <input
              value={formData.keyFeatures.join(', ')}
              onChange={(e) => {
                const features = e.target.value.split(',').map(s => s.trim());
                handleChange('keyFeatures', features);
              }}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Key Features (comma separated)"
            />
          </div>
          
          <textarea
            value={formData.tech.join(', ')}
            onChange={(e) => handleTechChange(e.target.value)}
            maxLength={PROJECT_LIMITS.tech * 10}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm min-h-15"
            placeholder="Technologies (comma separated)"
          />
          
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="url"
              value={formData.liveUrl}
              onChange={(e) => handleChange('liveUrl', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="Live Demo URL (https://...)"
            />
            <input
              type="url"
              value={formData.codeUrl}
              onChange={(e) => handleChange('codeUrl', apiService.sanitize(e.target.value))}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              placeholder="GitHub URL (https://...)"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-3">
            <select
              value={formData.brandIcon}
              onChange={(e) => handleChange('brandIcon', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            >
              {icons.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
            <input
              type="color"
              value={formData.brandColor}
              onChange={(e) => handleChange('brandColor', e.target.value)}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm h-10 w-20 cursor-pointer"
            />
          </div>
          
          <textarea
            value={formData.subText}
            onChange={(e) => handleChange('subText', apiService.sanitize(e.target.value))}
            className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm min-h-15"
            placeholder="Sub Text / Overview (unlimited)"
          />
          
          <div className="space-y-3">
            <h4 className="font-medium text-slate-300">Images</h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Upload Project Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleProjectImagesChange}
                className="block w-full text-sm text-slate-500"
              />
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-3">
                  {imageUrls.slice(0, 6).map((img, idx) => (
                    <div key={`${img}-${idx}`} className="space-y-1">
                      {isTemporaryUrl(img) || img ? (
                        <img
                          src={img}
                          alt={`Project view ${idx + 1}`}
                          style={selectedCoverUrl === img ? coverPreviewStyle : undefined}
                          className="h-24 w-full object-cover rounded border border-slate-600"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setSelectedCoverUrl(img)}
                        className={`w-full rounded px-2 py-1 text-xs ${selectedCoverUrl === img ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      >
                        {selectedCoverUrl === img ? 'Cover Image' : 'Use as Cover'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProjectImage(img)}
                        disabled={saving}
                        className="w-full rounded px-2 py-1 text-xs text-red-300 hover:bg-red-950/50 disabled:opacity-50"
                      >
                        Remove image
                      </button>
                    </div>
                  ))}
                  {imageUrls.length > 6 && (
                    <span className="col-start-1 col-end-6 flex h-24 w-24 items-center justify-center bg-slate-600/50 rounded text-sm">
                      +{imageUrls.length - 6}
                    </span>
                  )}
                </div>
              )}
              {selectedCoverUrl && (
                <div
                  className="relative mt-3 aspect-16/10 w-full max-w-117.5 overflow-hidden rounded-2xl border-8 border-slate-800 bg-slate-900 cursor-grab touch-none active:cursor-grabbing"
                  onPointerDown={handleCoverPointerDown}
                  onPointerMove={handleCoverPointerMove}
                  onPointerUp={() => setCoverDrag(null)}
                  onPointerCancel={() => setCoverDrag(null)}
                  title="Drag image to reposition"
                >
                  <img
                    src={selectedCoverUrl}
                    alt="Selected cover preview"
                    style={coverPreviewStyle}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5.5 border-b border-white/10 bg-slate-900/95" />
                  <span className="pointer-events-none absolute left-1/2 top-1.25 z-20 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                  <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-xs text-white">
                    Drag to reposition
                  </span>
                </div>
              )}

              <div className="grid gap-3 rounded-xl border border-slate-700/50 bg-slate-950 p-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Image fit
                  <select
                    value={formData.coverImageSettings.fit}
                    onChange={(e) => handleCoverSettingChange('fit', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="cover">Fill screen</option>
                    <option value="contain">Show full image</option>
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  Zoom: {formData.coverImageSettings.scale}%
                  <input type="range" min="100" max="200" value={formData.coverImageSettings.scale} onChange={(e) => handleCoverSettingChange('scale', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Horizontal focus: {formData.coverImageSettings.positionX}%
                  <input type="range" min="0" max="100" value={formData.coverImageSettings.positionX} onChange={(e) => handleCoverSettingChange('positionX', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Vertical focus: {formData.coverImageSettings.positionY}%
                  <input type="range" min="0" max="100" value={formData.coverImageSettings.positionY} onChange={(e) => handleCoverSettingChange('positionY', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Rotation: {formData.coverImageSettings.rotation}deg
                  <input type="range" min="-180" max="180" value={formData.coverImageSettings.rotation} onChange={(e) => handleCoverSettingChange('rotation', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Brightness: {formData.coverImageSettings.brightness}%
                  <input type="range" min="0" max="200" value={formData.coverImageSettings.brightness} onChange={(e) => handleCoverSettingChange('brightness', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Contrast: {formData.coverImageSettings.contrast}%
                  <input type="range" min="0" max="200" value={formData.coverImageSettings.contrast} onChange={(e) => handleCoverSettingChange('contrast', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Saturation: {formData.coverImageSettings.saturation}%
                  <input type="range" min="0" max="200" value={formData.coverImageSettings.saturation} onChange={(e) => handleCoverSettingChange('saturation', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <label className="text-sm text-slate-300">
                  Grayscale: {formData.coverImageSettings.grayscale}%
                  <input type="range" min="0" max="100" value={formData.coverImageSettings.grayscale} onChange={(e) => handleCoverSettingChange('grayscale', Number(e.target.value))} className="mt-2 block w-full" />
                </label>
                <div className="flex gap-2 self-end">
                  <button type="button" onClick={() => handleCoverSettingChange('flipX', !formData.coverImageSettings.flipX)} className={`rounded-lg border px-3 py-2 text-sm ${formData.coverImageSettings.flipX ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-300'}`}>Flip horizontal</button>
                  <button type="button" onClick={() => handleCoverSettingChange('flipY', !formData.coverImageSettings.flipY)} className={`rounded-lg border px-3 py-2 text-sm ${formData.coverImageSettings.flipY ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-300'}`}>Flip vertical</button>
                </div>
                <button type="button" onClick={resetCoverAdjustments} className="self-end rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  Reset adjustments
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Project Document</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleDocumentChange}
                className="block w-full text-sm text-slate-500"
              />
              {documentFile && (
                <p className="text-sm text-amber-400">Selected: {documentFile.name}</p>
              )}
              {editingId !== 'new' && projects.find((project) => (project._id || project.id) === editingId)?.document?.url && (
                <a
                  href={projects.find((project) => (project._id || project.id) === editingId).document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Open current document
                </a>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-300">Stats</h4>
            {formData.stats.map((stat, idx) => (
              <div key={idx} className="flex gap-3">
                <input
                  value={stat.value}
                  onChange={(e) => handleStatChange(idx, 'value', apiService.sanitize(e.target.value))}
                  className="w-24 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                  placeholder="Value"
                />
                <input
                  value={stat.label}
                  onChange={(e) => handleStatChange(idx, 'label', apiService.sanitize(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                  placeholder="Label"
                />
                <button
                  onClick={() => removeStat(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addStat}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Add Stat
            </button>
          </div>
          
          <button 
            onClick={editingId === 'new' ? handleCreateProject : handleUpdateProject} 
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Project'} <ArrowUpRight size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

function isTemporaryUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && url.startsWith('blob:');
}
