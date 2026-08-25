import React, { useState, useEffect, useCallback } from "react";
import { Trash, Plus, MagnifyingGlass, Funnel, X, Phone, CalendarCheck } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";

// Inline SVG for Mail icon
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const statusColors = {
  New: "bg-amber-950/50 text-amber-400 border border-amber-900/30",
  Contacted: "bg-blue-950/50 text-blue-400 border border-blue-900/30",
  "In Progress": "bg-violet-950/50 text-violet-400 border border-violet-900/30",
  Converted: "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30",
  Lost: "bg-red-950/50 text-red-400 border border-red-900/30",
};

const statusOptions = ['New', 'Contacted', 'In Progress', 'Converted', 'Lost'];

export default function BusinessLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, new: 0, converted: 0, thisMonth: 0, byStatus: [] });
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', status: 'New', notes: '', source: 'website' });
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchLeads = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataService.getLeads({ page: pageNum, limit: 20, sort: 'desc' });
      setLeads(response.data);
      setTotalPages(response.pagination.pages);
      setPage(response.pagination.page);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await dataService.getLeadStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch lead stats:', err);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      setMeetings(await dataService.getAssistantMeetings());
    } catch (err) {
      console.error('Failed to fetch assistant meetings:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page);
    fetchStats();
    fetchMeetings();
  }, [page, fetchLeads, fetchStats, fetchMeetings]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('leads', (data) => {
      if (data.type === 'lead-new') {
        fetchLeads(1);
        fetchStats();
        fetchMeetings();
      } else if (data.type === 'lead-update') {
        setLeads(prev => prev.map(l => l._id === data.data._id ? data.data : l));
      } else if (data.type === 'lead-delete') {
        setLeads(prev => prev.filter(l => l._id !== data.data.id));
        setSelected(prev => prev?._id === data.data.id ? null : prev);
      }
    });

    // Refresh meetings when AI assistant reschedules or creates one
    const unsubscribeAI = dataService.subscribe('ai', (data) => {
      if (data.type === 'meeting-rescheduled' || data.type === 'workflow-lead') {
        fetchMeetings();
        fetchLeads(1);
        fetchStats();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAI();
    };
  }, [fetchLeads, fetchStats, fetchMeetings]);

  async function handleAdd() {
    if (!form.name || !form.email || !form.service) return;
    try {
      setError(null);
      const newLead = {
        ...form,
        name: apiService.sanitize(form.name),
        email: apiService.sanitize(form.email),
        service: apiService.sanitize(form.service),
        notes: apiService.sanitize(form.notes),
      };
      await dataService.createLead(newLead);
      setForm({ name: '', email: '', phone: '', service: '', status: 'New', notes: '', source: 'website' });
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(lead) {
    try {
      setError(null);
      await dataService.updateLead(lead._id, lead);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this lead?')) return;
    try {
      setError(null);
      await dataService.deleteLead(id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  const visibleLeads = leads.filter((lead) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [lead.name, lead.email, lead.phone, lead.service, lead.notes]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'ALL' || lead.status === statusFilter);
  });

  const meetingForLead = (leadId) => meetings.find(meeting => meeting.lead?._id === leadId || meeting.lead === leadId);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Business Leads</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden opacity-60">
          <div className="skeleton skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Business Leads</h2>

      <div className="flex flex-col md:flex-row gap-3">
        <label className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, service, or notes" className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2.5 text-sm" />
        </label>
        <label className="relative">
          <Funnel size={16} className="absolute left-3 top-3 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-700/50 rounded-xl pl-9 pr-8 py-2.5 text-sm">
            <option value="ALL">All statuses</option>
            {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-amber-400">{stats.new}</p>
          <p className="text-xs text-slate-400">New</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-green-400">{stats.converted}</p>
          <p className="text-xs text-slate-400">Converted</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-blue-400">{stats.thisMonth}</p>
          <p className="text-xs text-slate-400">This Month</p>
        </div>
      </div>

      {/* Add Lead Form */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg">Add New Lead</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1 ${showForm ? 'rotate-180' : ''}`}
          >
            <Plus size={16} /> {showForm ? 'Hide' : 'Show'} Form
          </button>
        </div>
        
        {showForm && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              type="tel"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              type="email"
            />
            <input
              placeholder="Service"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="md:col-span-4 flex gap-3">
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                rows={2}
              />
              <button
                onClick={handleAdd}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
              >
                <Plus size={14} /> Add Lead
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm mb-4">
          Lead saved successfully with real-time sync!
        </div>
      )}

      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/30 text-xs font-extrabold uppercase text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Service</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Gmail</th>
              <th className="text-left px-4 py-3">WhatsApp</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {visibleLeads.map((l) => (
              <tr key={l._id} onClick={() => setSelected(l)} className={`hover:bg-slate-800/20 transition cursor-pointer ${selected?._id === l._id ? 'bg-amber-500/10' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{l._id.slice(-8)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-[10px] text-amber-400/90 font-mono tracking-wider">{l.clientReference || '—'}</div>
                </td>
                <td className="px-4 py-3 text-slate-400">{l.email}</td>
                <td className="px-4 py-3 text-slate-400">{l.phone || '—'}</td>
                <td className="px-4 py-3">{l.service}</td>
                <td className="px-4 py-3">
                  <select
                    value={l.status}
                    onChange={(e) => handleUpdate({ ...l, status: e.target.value })}
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[l.status]}`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {l.notifications?.gmail?.sent ? (
                    <span className="text-green-400 text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-red-400 text-xs font-bold">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {l.notifications?.whatsapp?.sent ? (
                    <span className="text-green-400 text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-red-400 text-xs font-bold">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(l._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!visibleLeads.length && <tr><td colSpan="10" className="px-4 py-12 text-center text-slate-500">No leads match this filter.</td></tr>}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLeads(page - 1)}
                disabled={page === 1}
                className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLeads(page + 1)}
                disabled={page === totalPages}
                className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <button onClick={() => setSelected(null)} className="float-right text-slate-500 hover:text-white" aria-label="Close lead details"><X size={18} /></button>
          <h3 className="font-extrabold text-lg">Lead details</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <p><span className="text-slate-500">ID:</span> <code className="text-xs font-mono text-amber-400 bg-slate-950 px-2 py-1 rounded">{selected._id}</code></p>
            <p><span className="text-slate-500">Client Ref:</span> <code className="text-xs font-mono text-amber-400 bg-slate-950 px-2 py-1 rounded">{selected.clientReference || 'Not generated'}</code></p>
            <p><span className="text-slate-500">Client:</span> {selected.name}</p>
            <p><span className="text-slate-500">Email:</span> {selected.email}</p>
            <p><span className="text-slate-500">Phone:</span> {selected.phone || 'Not provided'}</p>
            <p><span className="text-slate-500">Service:</span> {selected.service}</p>
            <p><span className="text-slate-500">Status:</span> <span className={`px-2 py-1 rounded text-xs ${statusColors[selected.status] || 'bg-slate-800'}`}>{selected.status}</span></p>
          </div>
          
          {/* Notification Status */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h4 className="font-semibold text-xs text-slate-400 mb-2">NOTIFICATION STATUS</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 rounded-lg p-3">
                <p className="text-xs text-slate-400">Gmail</p>
                <p className={`text-sm font-bold ${selected.notifications?.gmail?.sent ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.notifications?.gmail?.sent ? '✓ Sent' : '✗ Not sent'}
                </p>
                {selected.notifications?.gmail?.sentAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selected.notifications.gmail.sentAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-slate-950 rounded-lg p-3">
                <p className="text-xs text-slate-400">WhatsApp</p>
                <p className={`text-sm font-bold ${selected.notifications?.whatsapp?.sent ? 'text-green-400' : 'text-red-400'}`}>
                  {selected.notifications?.whatsapp?.sent ? '✓ Sent' : '✗ Not sent'}
                </p>
                {selected.notifications?.whatsapp?.sentAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selected.notifications.whatsapp.sentAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950 rounded-xl text-sm text-slate-300 whitespace-pre-wrap">{selected.notes || 'No project requirements recorded.'}</div>
          {meetingForLead(selected._id) ? (
            <div className="mt-4 flex items-start gap-2 text-sm text-emerald-300"><CalendarCheck size={18} /> Meeting: {meetingForLead(selected._id).preferredDate} at {meetingForLead(selected._id).preferredTime} ({meetingForLead(selected._id).status})</div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><CalendarCheck size={18} /> No meeting requested</div>
          )}
        </div>
      )}
    </div>
  );
}