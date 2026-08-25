import React, { useState, useEffect } from "react";
import { ArrowUpRight, Users, TrendUp, EnvelopeOpen, ChatCircleDots, Pulse, Wrench } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { useSystemStatus } from "../../context/SystemStatusContext";

export default function AdminDashboard() {
  const { isOperational, statusText, statusLabel } = useSystemStatus();
  const [statCards, setStatCards] = useState([
    { label: "Visitors", value: "0", icon: Users, color: "from-blue-500 to-cyan-400" },
    { label: "New Leads", value: "0", icon: TrendUp, color: "from-emerald-500 to-teal-400" },
    { label: "Messages", value: "0", icon: EnvelopeOpen, color: "from-amber-500 to-orange-400" },
    { label: "AI Conversations", value: "0", icon: ChatCircleDots, color: "from-violet-500 to-fuchsia-400" },
  ]);
  const [systemStatus, setSystemStatus] = useState([
    { service: "AI Assistant", status: "Checking...", connected: false },
    { service: "Gmail", status: "Checking...", connected: false },
    { service: "Calendar", status: "Checking...", connected: false },
    { service: "WhatsApp", status: "Checking...", connected: false },
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [
          messageStats,
          leadStats,
          securityDashboard,
          aiSettings
        ] = await Promise.all([
          dataService.getMessageStats(),
          dataService.getLeadStats(),
          dataService.getSecurityDashboard(),
          dataService.getAISettings()
        ]);
        
        // Update stats with real data
        setStatCards([
          { 
            label: "Visitors", 
            value: securityDashboard?.users?.total?.toString() || "0", 
            icon: Users, 
            color: "from-blue-500 to-cyan-400" 
          },
          { 
            label: "New Leads", 
            value: leadStats?.New?.toString() || "0", 
            icon: TrendUp, 
            color: "from-emerald-500 to-teal-400" 
          },
          { 
            label: "Messages", 
            value: messageStats?.NEW?.toString() || "0", 
            icon: EnvelopeOpen, 
            color: "from-amber-500 to-orange-400" 
          },
          { 
            label: "AI Conversations", 
            value: aiSettings?.totalConversations?.toString() || "0", 
            icon: ChatCircleDots, 
            color: "from-violet-500 to-fuchsia-400" 
          }
        ]);
        
        // Update system status based on actual configuration
        setSystemStatus([
          { 
            service: "AI Assistant", 
            status: aiSettings?.assistantEnabled ? "Online" : "Offline", 
            connected: !!aiSettings?.assistantEnabled 
          },
          { 
            service: "Gmail", 
            status: aiSettings?.integrations?.gmail?.enabled ? "Connected" : "Disconnected", 
            connected: !!aiSettings?.integrations?.gmail?.enabled 
          },
          { 
            service: "Calendar", 
            status: aiSettings?.integrations?.calendar?.enabled ? "Connected" : "Disconnected", 
            connected: !!aiSettings?.integrations?.calendar?.enabled 
          },
          { 
            service: "WhatsApp", 
            status: aiSettings?.integrations?.whatsapp?.enabled ? "Connected" : "Disconnected", 
            connected: !!aiSettings?.integrations?.whatsapp?.enabled 
          }
        ]);
        
        // Generate analytics data from security dashboard or use empty array
        // For now, we'll use a simple approach - in a real app, this would come from analytics endpoint
        setAnalyticsData(Array.from({ length: 12 }).map((_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          value: Math.floor(Math.random() * 100) // Placeholder until real analytics endpoint exists
        })));
        
        // For recent activity, we'll use a placeholder until we have a real activity logging system
        setRecentActivity([
          { text: "Dashboard loaded", time: "Just now" }
        ]);
        
      } catch (err) {
        setError(err.message);
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time updates for stats that can be updated via socket
    const unsubscribeStats = dataService.subscribe('stats', (statsData) => {
      // Handle real-time stats updates if needed
    });
    
    return () => {
      // unsubscribeStats();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Overview of portfolio performance and system status.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-900/30 px-3 py-1.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} /> {isOperational ? "System Operational" : "System Offline"}
          </div>
        </div>
        
        {/* Loading skeletons for stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 shadow-lg shadow-black/10">
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 opacity-10 blur-2xl" />
              <div className="flex items-center justify-between">
                <Users size={22} weight="fill" className="text-gradient bg-gradient-to-br from-blue-500 to-cyan-400" />
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">
                <span className="animate-pulse inline-block h-8 w-24" />
              </p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span className="animate-pulse inline-block h-4 w-24" />
              </p>
            </div>
          ))}
        </div>
        
        {/* Loading skeletons for analytics and system status */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
            <h3 className="text-base font-extrabold mb-4 flex items-center gap-2">
              <TrendUp size={18} weight="bold" className="text-amber-400" /> Visitor Analytics
            </h3>
            <div className="h-48 flex items-end gap-3 px-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-amber-600/40 to-amber-300/80 rounded-t-md" style={{ height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
          
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
            <h3 className="text-base font-extrabold mb-4 flex items-center gap-2">
              <Wrench size={18} weight="bold" className="text-amber-400" /> System Status
            </h3>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Service {i + 1}</span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                    <span className="animate-pulse" /> Connecting...
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading skeletons for recent activity */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
          <h3 className="text-base font-extrabold mb-4 flex items-center gap-2">
            <Pulse size={18} weight="bold" className="text-amber-400" /> Recent Activity
          </h3>
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 animate-pulse">
                    <span className="animate-pulse inline-block h-4 w-32" />
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium animate-pulse">
                    <span className="animate-pulse inline-block h-4 w-16" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Overview of portfolio performance and system status.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-900/30 px-3 py-1.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} /> {statusLabel === 'Available' ? 'System Operational' : 'System Offline'}
          </div>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-medium">Error loading dashboard data: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 btn-sm btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of portfolio performance and system status.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-900/30 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> System Operational
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 shadow-lg shadow-black/10 hover:border-slate-700/60 transition">
            <div className={`${s.color} absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 blur-2xl`} />
            <div className="flex items-center justify-between">
              <s.icon size={22} weight="fill" className={`text-gradient bg-gradient-to-br ${s.color}`} />
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Analytics + System Status */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
          <h3 className="text-base font-extrabold mb-4 flex items-center gap-2">
            <TrendUp size={18} weight="bold" className="text-amber-400" /> Visitor Analytics
          </h3>
          <div className="h-48 flex items-end gap-3 px-2">
            {analyticsData.map((data, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-amber-600/40 to-amber-300/80 rounded-t-md" style={{ height: `${data.value}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
          <h3 className="text-base font-extrabod mb-4 flex items-center gap-2">
            <Wrench size={18} weight="bold" className="text-amber-400" /> System Status
          </h3>
          <div className="space-y-3">
            {systemStatus.map((s) => (
              <div key={s.service} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">{s.service}</span>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${s.connected ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30" : "bg-red-950/50 text-red-400 border border-red-900/30"}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 shadow-lg shadow-black/10">
        <h3 className="text-base font-extrabod mb-4 flex items-center gap-2">
          <Pulse size={18} weight="bold" className="text-amber-400" /> Recent Activity
        </h3>
        <div className="divide-y divide-slate-800/50">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{a.text}</p>
                <p className="text-[10px] text-slate-500 font-medium">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}