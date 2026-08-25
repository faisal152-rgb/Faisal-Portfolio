import React, { useState, useEffect, useCallback } from "react";
import { Lock, Shield, User, ShieldCheck, CheckCircle, Trash, Plus, ArrowUpRight, Key } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";

// Inline SVG for AlertTriangle icon
const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// Inline SVG for RefreshCw icon
const RefreshCwIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

// Inline SVG for BookOpenText icon
const BookOpenTextIcon = ({ className, size = 16 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    <path d="M6 8h12"/>
    <path d="M6 12h12"/>
    <path d="M6 16h12"/>
  </svg>
);

export default function SecurityCenter() {
  const [dashboard, setDashboard] = useState({
    users: { total: 0, active: 0, locked: 0 },
    recentLogins: [],
    failedLogins: [],
    messageStats: [],
    leadStats: [],
    securitySettings: {},
    loading: true,
    error: null,
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [auditLog, setAuditLog] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [newBlockedIP, setNewBlockedIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [rateLimits, setRateLimits] = useState({});
  const [visitorLimits, setVisitorLimits] = useState({
    maxFileUploads: 2,
    maxImageUploads: 3,
    maxChatMessages: 50,
    windowHours: 24,
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchDashboard = useCallback(async () => {
    try {
      setDashboard(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getSecurityDashboard();
      setDashboard(prev => ({ ...prev, ...data, loading: false }));
      setRateLimits(data.securitySettings?.rateLimit || {});
      setBlockedIPs(data.securitySettings?.blockedIps || []);
    } catch (err) {
      setDashboard(prev => ({ ...prev, loading: false, error: err.message }));
      console.error('Failed to fetch security dashboard:', err);
    }
  }, []);

  const fetchUsers = useCallback(async (pageNum = 1) => {
    try {
      const response = await dataService.getSecurityUsers({ 
        page: pageNum, 
        limit: 20, 
        search: userSearch, 
        status: userStatus 
      });
      setUsers(response.data);
      setTotalUserPages(response.pagination.pages);
      setUserPage(response.pagination.page);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [userSearch, userStatus]);

  const fetchAuditLog = useCallback(async () => {
    try {
      const data = await dataService.getAuditLog();
      setAuditLog(data);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  }, []);

  const fetchRateLimits = useCallback(async () => {
    try {
      const data = await dataService.getRateLimits();
      setRateLimits(data);
    } catch (err) {
      console.error('Failed to fetch rate limits:', err);
    }
  }, []);

  const fetchVisitorLimits = useCallback(async () => {
    try {
      const data = await dataService.getAISettings();
      if (data?.uploadLimits) setVisitorLimits(data.uploadLimits);
    } catch (err) {
      console.error('Failed to fetch visitor limits:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchAuditLog();
    fetchRateLimits();
    fetchVisitorLimits();
  }, [fetchDashboard, fetchUsers, fetchAuditLog, fetchRateLimits, fetchVisitorLimits]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('security', (data) => {
      if (data.type === 'user-unlock' || data.type === 'user-deactivate' || data.type === 'user-activate' || data.type === 'password-reset') {
        fetchDashboard();
        fetchUsers(userPage);
      } else if (data.type === 'ip-blocked' || data.type === 'ip-unblocked') {
        fetchDashboard();
      } else if (data.type === 'rate-limits' || data.type === 'security-settings') {
        fetchRateLimits();
      }
    });
    return () => unsubscribe();
  }, [fetchDashboard, fetchUsers, fetchRateLimits, userPage]);

  async function handleUnlockUser(userId) {
    if (!window.confirm('Unlock this user account?')) return;
    try {
      setSaving(true);
      await dataService.unlockUser(userId);
      fetchDashboard();
      fetchUsers(userPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateUser(userId) {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      setSaving(true);
      await dataService.deactivateUser(userId);
      fetchDashboard();
      fetchUsers(userPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateUser(userId) {
    try {
      setSaving(true);
      await dataService.activateUser(userId);
      fetchDashboard();
      fetchUsers(userPage);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(userId) {
    const newPassword = prompt('Enter new password (min 8 chars, uppercase, lowercase, number, special):');
    if (!newPassword) return;
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    try {
      setSaving(true);
      await dataService.adminResetPassword(userId, newPassword);
      alert('Password reset successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBlockIP() {
    if (!newBlockedIP.trim()) return;
    try {
      setSaving(true);
      await dataService.blockIP(newBlockedIP.trim(), blockReason.trim());
      setNewBlockedIP('');
      setBlockReason('');
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnblockIP(ip) {
    if (!window.confirm(`Unblock IP ${ip}?`)) return;
    try {
      setSaving(true);
      await dataService.unblockIP(ip);
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRateLimits() {
    try {
      setSaving(true);
      await dataService.updateRateLimits(rateLimits);
      fetchRateLimits();
      alert('Rate limits updated successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateVisitorLimits() {
    try {
      setSaving(true);
      await dataService.updateAISettings({ uploadLimits: visitorLimits });
      await fetchVisitorLimits();
      alert('Visitor limits updated successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSecuritySettings() {
    try {
      setSaving(true);
      await dataService.updateSecuritySettings(dashboard.securitySettings);
      fetchDashboard();
      alert('Security settings updated successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  const statusColors = {
    active: 'bg-green-500/20 text-green-400',
    locked: 'bg-red-500/20 text-red-400',
    inactive: 'bg-slate-500/20 text-slate-400',
  };

  const getUserStatus = (user) => {
    if (!user.isActive) return 'inactive';
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) return 'locked';
    return 'active';
  };

  if (dashboard.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Security Center</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1.5rem' }} />
          <div className="skeleton skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/50 pb-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Shield },
          { id: 'users', label: 'Users', icon: User },
          { id: 'audit', label: 'Audit Log', icon: BookOpenTextIcon },
          { id: 'ips', label: 'Blocked IPs', icon: ShieldCheck },
          { id: 'ratelimits', label: 'Rate Limits', icon: Key },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <tab.icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
            {tab.label}
          </button>
        ))}
      </div>

      {dashboard.error && (
        <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
          Error: {dashboard.error}
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-extrabold text-white">{dashboard.users.total}</p>
                </div>
                <User size={32} className="text-amber-400" />
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Active Users</p>
                  <p className="text-3xl font-extrabold text-green-400">{dashboard.users.active}</p>
                </div>
                <CheckCircle size={32} className="text-green-400" />
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Locked Accounts</p>
                  <p className="text-3xl font-extrabold text-red-400">{dashboard.users.locked}</p>
                </div>
                <Lock size={32} className="text-red-400" />
              </div>
            </div>
          </div>

          {/* Recent Logins */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                          <RefreshCwIcon size={18} weight="bold" className="text-amber-400" />
                          Recent Logins
                        </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs font-extrabold uppercase text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {dashboard.recentLogins.slice(0, 10).map((login, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                      <td className="px-4 py-3 font-medium">{login.name}</td>
                      <td className="px-4 py-3 text-slate-400">{login.email}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{login.lastLogin ? formatDate(login.lastLogin) : 'Never'}</td>
                    </tr>
                  ))}
                  {dashboard.recentLogins.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No recent logins</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Logins */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                          <AlertTriangleIcon size={18} weight="bold" className="text-red-400" />
                          Failed Login Attempts
                        </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs font-extrabold uppercase text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Attempts</th>
                    <th className="text-left px-4 py-3">Locked Until</th>
                    <th className="text-left px-4 py-3">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {dashboard.failedLogins.slice(0, 10).map((login, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition">
                      <td className="px-4 py-3 font-medium">{login.email}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">{login.loginAttempts}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{login.lockUntil ? formatDate(login.lockUntil) : 'Not locked'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{login.lastLogin ? formatDate(login.lastLogin) : 'Never'}</td>
                    </tr>
                  ))}
                  {dashboard.failedLogins.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No failed login attempts</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search & Filter */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-10 py-2.5 text-sm"
                />
              </div>
              <select
                value={userStatus}
                onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }}
                className="min-w-[150px] bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => { setUserSearch(''); setUserStatus('all'); fetchUsers(1); }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/30 text-xs font-extrabold uppercase text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Last Login</th>
                  <th className="text-left px-4 py-3">Attempts</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {users.map((user) => {
                  const status = getUserStatus(user);
                  return (
                    <tr key={user._id} className="hover:bg-slate-800/20 transition">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-slate-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColors[status]}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                      <td className="px-4 py-3">
                        {user.loginAttempts > 0 && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">{user.loginAttempts}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {status === 'locked' && (
                            <button
                              onClick={() => handleUnlockUser(user._id)}
                              disabled={saving}
                              className="text-green-400 hover:text-green-300 text-xs font-bold px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50"
                            >
                              <Lock size={12} className="inline mr-1" /> Unlock
                            </button>
                          )}
                          {user.isActive && user._id !== 'current-user-id' && (
                            <button
                              onClick={() => handleDeactivateUser(user._id)}
                              disabled={saving}
                              className="text-amber-400 hover:text-amber-300 text-xs font-bold px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50"
                            >
                              <User size={12} className="inline mr-1" /> Deactivate
                            </button>
                          )}
                          {!user.isActive && (
                            <button
                              onClick={() => handleActivateUser(user._id)}
                              disabled={saving}
                              className="text-green-400 hover:text-green-300 text-xs font-bold px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50"
                            >
                              <CheckCircle size={12} className="inline mr-1" /> Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleResetPassword(user._id)}
                            disabled={saving}
                            className="text-blue-400 hover:text-blue-300 text-xs font-bold px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50"
                          >
                            <Key size={12} className="inline mr-1" /> Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/40">
                <span className="text-sm text-slate-400">Page {userPage} of {totalUserPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchUsers(userPage - 1)}
                    disabled={userPage === 1 || saving}
                    className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchUsers(userPage + 1)}
                    disabled={userPage === totalUserPages || saving}
                    className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <BookOpenTextIcon className="text-amber-400" size={18} />
            Security Audit Log
          </h3>
          <div className="space-y-3">
            {auditLog.map((event, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400">{event.type}</span>
                    <p className="text-slate-200">{event.message}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(event.timestamp)}</span>
                </div>
              </div>
            ))}
            {auditLog.length === 0 && (
              <div className="text-center py-8 text-slate-500">No audit log entries</div>
            )}
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === 'ips' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
            <h3 className="font-extrabold text-lg mb-4">Block IP Address</h3>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                value={newBlockedIP}
                onChange={(e) => setNewBlockedIP(e.target.value)}
                placeholder="IP Address (e.g., 192.168.1.100)"
                className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 min-w-[200px] bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleBlockIP}
                disabled={saving || !newBlockedIP.trim()}
                className="bg-red-500 hover:bg-red-400 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} /> Block IP
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-4">Blocked IPs ({blockedIPs.length})</h3>
            {blockedIPs.length > 0 ? (
              <ul className="space-y-2">
                {blockedIPs.map(ip => (
                  <li key={ip} className="flex items-center justify-between bg-slate-950 border border-slate-800/50 rounded-xl p-4">
                    <code className="text-slate-200 font-mono">{ip}</code>
                    <button
                      onClick={() => handleUnblockIP(ip)}
                      disabled={saving}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash size={14} className="inline mr-1" /> Unblock
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-slate-500">No blocked IPs</div>
            )}
          </div>
        </div>
      )}

      {/* Rate Limits Tab */}
      {activeTab === 'ratelimits' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-4">Rate Limit Configuration</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Requests per Minute</label>
                <input
                  type="number"
                  value={rateLimits.requestsPerMinute || 30}
                  onChange={(e) => setRateLimits(prev => ({ ...prev, requestsPerMinute: parseInt(e.target.value) || 30 }))}
                  min="1"
                  max="1000"
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Requests per Hour</label>
                <input
                  type="number"
                  value={rateLimits.requestsPerHour || 200}
                  onChange={(e) => setRateLimits(prev => ({ ...prev, requestsPerHour: parseInt(e.target.value) || 200 }))}
                  min="1"
                  max="10000"
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Requests per Day</label>
                <input
                  type="number"
                  value={rateLimits.requestsPerDay || 1000}
                  onChange={(e) => setRateLimits(prev => ({ ...prev, requestsPerDay: parseInt(e.target.value) || 1000 }))}
                  min="1"
                  max="100000"
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateRateLimits}
              disabled={saving}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Rate Limits'} <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-2">Visitor Limits</h3>
            <p className="text-xs text-slate-400 mb-4">Limits apply per IP address and reset after the selected window. Use 0 for unlimited.</p>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                ['maxFileUploads', 'Files per window', 0],
                ['maxImageUploads', 'Images per window', 0],
                ['maxChatMessages', 'Chat messages per window', 0],
                ['windowHours', 'Window (hours)', 1],
              ].map(([key, label, min]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    value={visitorLimits[key] ?? 0}
                    onChange={(e) => setVisitorLimits(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    min={min}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdateVisitorLimits}
              disabled={saving}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Visitor Limits'} <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg mb-4">Security Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dashboard.securitySettings.requireAuth}
                  onChange={(e) => setDashboard(prev => ({ ...prev, securitySettings: { ...prev.securitySettings, requireAuth: e.target.checked } }))}
                  className="w-5 h-5 text-amber-500 border-slate-700 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-slate-300">Require Authentication for AI</span>
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Session Timeout (seconds)</label>
                  <input
                    type="number"
                    value={dashboard.securitySettings.sessionTimeout || 3600}
                    onChange={(e) => setDashboard(prev => ({ ...prev, securitySettings: { ...prev.securitySettings, sessionTimeout: parseInt(e.target.value) || 3600 } }))}
                    min="60"
                    max="86400"
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleUpdateSecuritySettings}
              disabled={saving}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Security Settings'} <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}