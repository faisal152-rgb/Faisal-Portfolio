import React, { useState, useEffect, useCallback, useRef } from "react";
import { ArrowUpRight, Plus, Trash } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

const defaultTechStacks = [
  {
    title: 'Primary Tech Stack',
    skills: ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Express.js'],
  },
  {
    title: 'Secondary Tech Stack',
    skills: ['Python', 'PostgreSQL', 'Firebase', 'Redux', 'GitHub', 'Git', 'Vercel', 'Deployment'],
  },
];

export default function SkillsSettings() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const techInitializationRef = useRef(null);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getAdminSkills();
      const currentSkills = Array.isArray(data) ? data : [];
      const missingTechStacks = defaultTechStacks.filter((stack) => (
        !currentSkills.some((group) => group.title === stack.title)
      ));

      if (missingTechStacks.length > 0) {
        if (!techInitializationRef.current) {
          techInitializationRef.current = Promise.all(missingTechStacks.map((stack, index) => (
            dataService.createSkill({
              title: stack.title,
              category: 'technology',
              skills: stack.skills.map((name) => ({ name, value: 100 })),
              order: index + 1,
            })
          ))).finally(() => {
            techInitializationRef.current = null;
          });
        }
        await techInitializationRef.current;
      }

      const latestSkills = missingTechStacks.length > 0
        ? await dataService.getAdminSkills()
        : currentSkills;
      const techTitles = new Set(defaultTechStacks.map((stack) => stack.title));
      const seenTechTitles = new Set();
      const duplicateTechIds = [];
      const uniqueSkills = latestSkills.filter((group) => {
        if (!techTitles.has(group.title)) return true;
        if (seenTechTitles.has(group.title)) {
          if (group._id) duplicateTechIds.push(group._id);
          return false;
        }
        seenTechTitles.add(group.title);
        return true;
      });

      if (duplicateTechIds.length > 0) {
        await Promise.all(duplicateTechIds.map((id) => dataService.deleteSkill(id)));
      }
      setSkills(uniqueSkills);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch skills:', err);
      setSkills([]); // reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  async function handleSave() {
    // Skills are saved individually via create/update/delete
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleCreateSkill() {
    try {
      setSaving(true);
      setError(null);
      const newSkill = {
        title: 'New Category',
        skills: [{ name: 'New Skill', value: 50 }],
        order: skills.length + 1,
      };
      const result = await dataService.createSkill(newSkill);
      setSkills(Array.isArray(result) ? result : []);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSkill(id, updatedSkill) {
    try {
      setSaving(true);
      setError(null);
      await dataService.updateSkill(id, updatedSkill);
      // DataService will notify subscribers, but we can also refetch
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSkill(id) {
    if (!window.confirm('Delete this skill category?')) return;
    try {
      setSaving(true);
      setError(null);
      await dataService.deleteSkill(id);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTechStack(title) {
    try {
      setSaving(true);
      setError(null);
      await dataService.createSkill({
        title,
        category: 'technology',
        skills: [{ name: 'New Technology', value: 100 }],
        order: skills.length + 1,
      });
      await fetchSkills();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteSkillItem(groupIdx, skillIdx) {
    if (!window.confirm('Delete this skill?')) return;
    const newSkills = [...skills];
    if (Array.isArray(newSkills[groupIdx]?.skills)) {
      newSkills[groupIdx].skills.splice(skillIdx, 1);
      setSkills(newSkills);
    }
  }

  function isTechStack(group) {
    return group.category === 'technology' || group.title === 'Primary Tech Stack' || group.title === 'Secondary Tech Stack';
  }

  function handleSkillChange(groupIdx, skillIdx, field, value) {
    if (!Array.isArray(skills)) return;
    const newSkills = [...skills];
    if (field === 'title') {
      newSkills[groupIdx].title = apiService.sanitize(value);
    } else if (field === 'name') {
      newSkills[groupIdx].skills[skillIdx].name = apiService.sanitize(value);
    } else if (field === 'value') {
      newSkills[groupIdx].skills[skillIdx].value = parseInt(value) || 0;
    }
    setSkills(newSkills);
  }

  function handleAddSkill(groupIdx) {
    if (!Array.isArray(skills)) return;
    const newSkills = [...skills];
    if (Array.isArray(newSkills[groupIdx]?.skills)) {
      newSkills[groupIdx].skills.push({ name: 'New Skill', value: 50 });
      setSkills(newSkills);
    }
  }

  function handleAddSkillToGroup(groupIdx, isPrimary) {
    if (!Array.isArray(skills)) return;
    const newSkills = [...skills];
    if (groupIdx === -1) {
      // Create a new group
      const newGroup = {
        title: isPrimary ? 'Primary Skills' : 'Secondary Skills',
        skills: [{ name: 'New Skill', value: isPrimary ? 90 : 60 }],
        order: skills.length + 1,
      };
      newSkills.push(newGroup);
      setSkills(newSkills);
    } else {
      // Add to existing group
      if (Array.isArray(newSkills[groupIdx]?.skills)) {
        newSkills[groupIdx].skills.push({ name: 'New Skill', value: isPrimary ? 90 : 60 });
        setSkills(newSkills);
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Skills Settings</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1rem' }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton skeleton-skill-bar" style={{ marginBottom: '0.5rem' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Skills Settings</h2>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCreateSkill}
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Skill Category
        </button>
        <button
          onClick={() => handleCreateTechStack('Primary Tech Stack')}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Primary Tech Stack
        </button>
        <button
          onClick={() => handleCreateTechStack('Secondary Tech Stack')}
          disabled={saving}
          className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add Secondary Tech Stack
        </button>
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm self-center">
            Skills saved successfully with real-time sync!
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {error}
        </div>
      )}

      {Array.isArray(skills) ? skills.map((group, gIdx) => (
        <div key={group._id || gIdx} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <input
              value={group.title}
              onChange={(e) => handleSkillChange(gIdx, 0, 'title', e.target.value)}
              className="font-extrabold text-lg bg-transparent border-none focus:ring-2 focus:ring-amber-500 w-64"
            />
            <button
              onClick={() => {
                if (group._id) {
                  handleDeleteSkill(group._id);
                } else {
                  alert('Skill category ID missing');
                }
              }}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              <Trash size={16} /> Delete Category
            </button>
          </div>
          <div className="space-y-2">
            {Array.isArray(group.skills) ? group.skills.map((skill, sIdx) => (
              <div key={skill._id || sIdx} className="flex gap-3 items-center">
                <input
                  value={skill.name}
                  onChange={(e) => handleSkillChange(gIdx, sIdx, 'name', e.target.value)}
                  className="flex-1 max-w-md bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                />
                {!isTechStack(group) && (
                  <input
                    type="number"
                    value={skill.value}
                    onChange={(e) => handleSkillChange(gIdx, sIdx, 'value', e.target.value)}
                    min="0"
                    max="100"
                    className="w-20 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm"
                  />
                )}
                <button
                  onClick={() => handleDeleteSkillItem(gIdx, sIdx)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash size={16} />
                </button>
              </div>
            )) : []}
            <button
              onClick={() => handleAddSkill(gIdx)}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={14} /> {isTechStack(group) ? 'Add Technology' : 'Add Skill'}
            </button>
            {group._id && (
              <button
                onClick={() => handleUpdateSkill(group._id, group)}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowUpRight size={14} weight="bold" /> Save Changes
              </button>
            )}
          </div>
        </div>
      )) : []}
    </div>
  );
}