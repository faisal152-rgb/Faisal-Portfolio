import React, { useState, useEffect, useCallback } from "react";
import { Envelope, Trash, ArrowUpRight } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";

const RefreshCwIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);

export default function GmailIntegration() {
  const [integration, setIntegration] = useState({
    enabled: false,
    email: '',
    loading: true,
    saving: false,
    error: null,
    success: false,
    connected: false,
  });

  const fetchIntegration = useCallback(async () => {
    try {
      setIntegration(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getIntegrations();
      if (data?.gmail) {
        setIntegration(prev => ({
          ...prev,
          ...data.gmail,
          loading: false,
          connected: !!(data.gmail.enabled && data.gmail.email),
        }));
      } else {
        setIntegration(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setIntegration(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch Gmail integration:', error);
    }
  }, []);

  useEffect(() => {
    fetchIntegration();
    
    // Check for OAuth callback status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('integration') === 'gmail' && params.get('status') === 'connected') {
      setIntegration(prev => ({ ...prev, success: true }));
      setTimeout(() => {
        fetchIntegration();
        setIntegration(prev => ({ ...prev, success: false }));
      }, 500);
    }
  }, [fetchIntegration]);

  async function handleConnectGoogle() {
    try {
      setIntegration(prev => ({ ...prev, saving: true, error: null }));
      const authUrl = await dataService.getGoogleAuthUrl('gmail');
      window.location.href = authUrl;
    } catch (error) {
      setIntegration(prev => ({ ...prev, saving: false, error: error.message }));
    }
  }

  async function handleTestConnection() {
    try {
      setIntegration(prev => ({ ...prev, saving: true, error: null }));
      const result = await dataService.testGoogleIntegration('gmail');
      setIntegration(prev => ({ ...prev, saving: false, connected: true, success: true, email: result.email || prev.email }));
      setTimeout(() => setIntegration(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setIntegration(prev => ({ ...prev, saving: false, error: error.message, connected: false }));
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Gmail access?')) return;
    try {
      setIntegration(prev => ({ ...prev, saving: true, error: null }));
      await dataService.disconnectGoogleIntegration('gmail');
      setIntegration(prev => ({ ...prev, saving: false, connected: false, email: '', enabled: false, success: true }));
      setTimeout(() => setIntegration(prev => ({ ...prev, success: false })), 3000);
    } catch (error) {
      setIntegration(prev => ({ ...prev, saving: false, error: error.message }));
    }
  }

  if (integration.loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Gmail Integration</h2>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 opacity-60">
          <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '1.5rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold tracking-tight">Gmail Integration</h2>
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Envelope size={20} weight="fill" className="text-red-400" />
            Gmail Settings
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${integration.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {integration.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {integration.email && (
          <div className="text-sm text-slate-300">
            Connected account: <span className="font-semibold text-white">{integration.email}</span>
          </div>
        )}

        {integration.error && (
          <div className="bg-red-950/30 border border-red-900/30 text-red-400 rounded-xl p-4 text-sm">
            Error: {integration.error}
          </div>
        )}
        {integration.success && (
          <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-xl p-4 text-sm">
            Gmail connection is active.
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800/50">
          {!integration.connected ? (
            <button
              onClick={handleConnectGoogle}
              disabled={integration.saving}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {integration.saving ? 'Connecting...' : 'Connect'} <ArrowUpRight size={14} weight="bold" />
            </button>
          ) : (
            <>
              <button
                onClick={handleTestConnection}
                disabled={integration.saving}
                className="bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCwIcon /> Test Connection
              </button>
              <button
                onClick={handleDisconnect}
                disabled={integration.saving}
                className="bg-red-500 hover:bg-red-400 text-white font-extrabold text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <Trash size={14} /> Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}