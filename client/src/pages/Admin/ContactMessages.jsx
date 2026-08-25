import React, { useState, useEffect, useCallback } from "react";
import { Trash, MagnifyingGlass, Funnel, X } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";

const statusColors = {
  NEW: "bg-amber-950/50 text-amber-400 border border-amber-900/30",
  READ: "bg-blue-950/50 text-blue-400 border border-blue-900/30",
  REPLIED: "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30",
  ARCHIVED: "bg-slate-950/50 text-slate-400 border border-slate-900/30",
};

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0, byStatus: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMessages = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataService.getMessages({ page: pageNum, limit: 20, sort: 'desc' });
      setMessages(response.data);
      setTotalPages(response.pagination.pages);
      setPage(response.pagination.page);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await dataService.getMessageStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch message stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchMessages(page);
    fetchStats();
  }, [page, fetchMessages, fetchStats]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('messages', (data) => {
      if (data.type === 'message-new') {
        fetchMessages(1);
        fetchStats();
      } else if (data.type === 'message-read' || data.type === 'message-update') {
        setMessages(prev => prev.map(m => m._id === data.data._id ? data.data : m));
        if (selected && selected._id === data.data._id) {
          setSelected(data.data);
        }
      } else if (data.type === 'message-delete') {
        setMessages(prev => prev.filter(m => m._id !== data.data.id));
        if (selected && selected._id === data.data.id) {
          setSelected(null);
        }
      }
    });
    return () => unsubscribe();
  }, [fetchMessages, fetchStats, selected]);

  async function handleStatusChange(messageId, newStatus) {
    try {
      const updated = await dataService.updateMessage(messageId, { status: newStatus });
      setMessages(prev => prev.map(m => m._id === messageId ? updated : m));
      if (selected && selected._id === messageId) {
        setSelected(updated);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(messageId) {
    if (!window.confirm('Delete this message?')) return;
    try {
      await dataService.deleteMessage(messageId);
      // Real-time will handle removal
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  const visibleMessages = messages.filter((message) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [message.name, message.email, message.subject, message.message]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'ALL' || message.status === statusFilter);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Contact Messages</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden opacity-60">
          <div className="skeleton skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Contact Messages</h2>

      <div className="flex flex-col md:flex-row gap-3">
        <label className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, subject, or message" className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2.5 text-sm" />
        </label>
        <label className="relative">
          <Funnel size={16} className="absolute left-3 top-3 text-slate-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-700/50 rounded-xl pl-9 pr-8 py-2.5 text-sm">
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="REPLIED">Replied</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-amber-400">{stats.unread}</p>
          <p className="text-xs text-slate-400">Unread</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-green-400">
            {stats.byStatus.find(s => s.status === 'REPLIED')?.count || 0}
          </p>
          <p className="text-xs text-slate-400">Replied</p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-blue-400">{stats.today}</p>
          <p className="text-xs text-slate-400">Today</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/40 text-xs text-slate-500">Showing {visibleMessages.length} of {messages.length} loaded messages</div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/30 text-xs font-extrabold uppercase text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Subject</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Gmail</th>
                <th className="text-left px-4 py-3">WhatsApp</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {visibleMessages.map((m) => (
                <tr key={m._id} className={`hover:bg-slate-800/20 transition cursor-pointer ${selected?._id === m._id ? 'bg-amber-500/10' : ''}`} onClick={() => setSelected(m)}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{m._id.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-slate-400">{m.email}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{m.subject}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m._id, e.target.value)}
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[m.status]}`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="READ">READ</option>
                      <option value="REPLIED">REPLIED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.notifications?.gmail?.sent ? (
                      <span className="text-green-400 text-xs font-bold">✓</span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.notifications?.whatsapp?.sent ? (
                      <span className="text-green-400 text-xs font-bold">✓</span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelected(m); }}
                      className="text-amber-400 hover:text-amber-300 font-bold text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleMessages.length && <tr><td colSpan="9" className="px-4 py-12 text-center text-slate-500">No messages match this filter.</td></tr>}
            </tbody>
          </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchMessages(page - 1)}
                  disabled={page === 1}
                  className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchMessages(page + 1)}
                  disabled={page === totalPages}
                  className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5">
          <h3 className="font-extrabold mb-3">Message Details</h3>
          {selected ? (
            <>
              <button onClick={() => setSelected(null)} className="float-right text-slate-500 hover:text-white" aria-label="Close selected message"><X size={18} /></button>
              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-500">ID: <code className="font-mono text-amber-400 bg-slate-950 px-2 py-1 rounded">{selected._id}</code></p>
                <p className="text-xs text-slate-500">From: {selected.name}</p>
                <p className="text-xs text-slate-500">Email: {selected.email}</p>
                <p className="text-xs text-slate-500">Date: {formatDate(selected.createdAt)}</p>
                <p className="text-xs text-slate-500">Status: {selected.status}</p>
              </div>
              
              {/* Notification Status */}
              <div className="mb-4 pt-4 border-t border-slate-700/50">
                <h4 className="font-semibold text-xs text-slate-400 mb-2">NOTIFICATION STATUS</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Gmail</p>
                    <p className={`text-xs font-bold ${selected.notifications?.gmail?.sent ? 'text-green-400' : 'text-red-400'}`}>
                      {selected.notifications?.gmail?.sent ? '✓ Sent' : '✗ Not sent'}
                    </p>
                    {selected.notifications?.gmail?.sentAt && (
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(selected.notifications.gmail.sentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-950 rounded-lg p-2">
                    <p className="text-xs text-slate-400">WhatsApp</p>
                    <p className={`text-xs font-bold ${selected.notifications?.whatsapp?.sent ? 'text-green-400' : 'text-red-400'}`}>
                      {selected.notifications?.whatsapp?.sent ? '✓ Sent' : '✗ Not sent'}
                    </p>
                    {selected.notifications?.whatsapp?.sentAt && (
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(selected.notifications.whatsapp.sentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-slate-950 rounded-xl">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="mt-3 flex gap-2">
                {['READ', 'REPLIED', 'ARCHIVED'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selected._id, status)}
                    className={`text-xs font-bold px-2 py-1 rounded ${selected.status === status 
                      ? 'bg-amber-500 text-slate-950' 
                      : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {status}
                  </button>
                ))}
                <button
                  onClick={() => handleDelete(selected._id)}
                  className="text-xs font-bold px-2 py-1 rounded bg-red-950/50 text-red-400 hover:bg-red-950/70"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center py-8">Select a message to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}