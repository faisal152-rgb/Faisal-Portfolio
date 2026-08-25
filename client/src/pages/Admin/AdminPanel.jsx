import React, { useState, useEffect, useContext } from "react";
import { Shield, ChartBar, Wrench, Envelope, Building, Brain, Robot, Key, Database, Lock, ShieldCheck, ListChecks, Clock, EnvelopeSimple, WhatsappLogo, CalendarCheck, BookOpenText, ChartLineUp, List, X } from "@phosphor-icons/react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import HeroSettings from "./HeroSettings";
import AboutSettings from "./AboutSettings";
import SkillsSettings from "./SkillsSettings";
import TimelineSettings from "./TimelineSettings";
import ServicesSettings from "./ServicesSettings";
import FeaturedProject from "./FeaturedProject";
import ContactMessages from "./ContactMessages";
import BusinessLeads from "./BusinessLeads";
import AIAssistantControl from "./AIAssistantControl";
import AIPersona from "./AIPersona";
import APIManager from "./APIManager";
import AIModelManager from "./AIModelManager";
import GmailIntegration from "./GmailIntegration";
import CalendarIntegration from "./CalendarIntegration";
import WhatsAppIntegration from "./WhatsAppIntegration";
import AIKnowledgeBase from "./AIKnowledgeBase";
import SecurityCenter from "./SecurityCenter";
import { authService } from "../../services/authService";
import { apiService } from "../../services/apiService";
import { useSecurity } from "../../context/SecurityContext";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: ChartBar },
  { id: "hero", label: "Hero Section", icon: Shield },
  { id: "about", label: "About Me", icon: ShieldCheck },
  { id: "skills", label: "Skills & Technologies", icon: Wrench },
  { id: "timeline", label: "Experience Timeline", icon: Clock },
  { id: "services", label: "Services", icon: ListChecks },
  { id: "featured", label: "Featured Project", icon: Database },
  { id: "leads", label: "Business Leads", icon: Building },
  { id: "messages", label: "Contact Messages", icon: EnvelopeSimple },
  { id: "ai-control", label: "AI Assistant Control", icon: Robot },
  { id: "ai-persona", label: "AI Persona", icon: Brain },
  { id: "api-manager", label: "API Manager", icon: Key },
  { id: "ai-models", label: "AI Model Manager", icon: Database },
  { id: "gmail", label: "Gmail", icon: Envelope },
  { id: "calendar", label: "Calendar", icon: CalendarCheck },
  { id: "whatsapp", label: "WhatsApp", icon: WhatsappLogo },
  { id: "knowledge", label: "AI Knowledge Base", icon: BookOpenText },
  { id: "security", label: "Security Center", icon: Lock },
];

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, user } = useSecurity();

  useEffect(() => {
    // Check if user is already authenticated via token
    const checkAuth = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      try {
        // Verify token with backend
        const response = await apiService.adminGet('/hero');
        if (response.success) {
          setAuthenticated(true);
        } else {
          authService.logout();
        }
      } catch (err) {
        authService.logout();
      }
      setLoading(false);
    };
    checkAuth();
  }, [token, user]);

  async function handleLogin(email, password) {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setAuthenticated(true);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      // Error will be shown in AdminLogin component
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    authService.logout();
    setAuthenticated(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} loading={loading} />;
  }

  function renderContent() {
    switch (activeTab) {
      case "dashboard": return <AdminDashboard />;
      case "hero": return <HeroSettings />;
      case "about": return <AboutSettings />;
      case "skills": return <SkillsSettings />;
      case "timeline": return <TimelineSettings />;
      case "services": return <ServicesSettings />;
      case "featured": return <FeaturedProject />;
      case "messages": return <ContactMessages />;
      case "leads": return <BusinessLeads />;
      case "ai-control": return <AIAssistantControl />;
      case "ai-persona": return <AIPersona />;
      case "api-manager": return <APIManager />;
      case "ai-models": return <AIModelManager />;
      case "gmail": return <GmailIntegration />;
      case "calendar": return <CalendarIntegration />;
      case "whatsapp": return <WhatsAppIntegration />;
      case "knowledge": return <AIKnowledgeBase />;
      case "security": return <SecurityCenter />;
      default: return <AdminDashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield size={18} weight="bold" className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Admin <span className="text-amber-400">Panel</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-400">Faisal</span>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 transition"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
              aria-label={sidebarOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      <div className="max-w-7xl mx-auto flex gap-6 px-4 sm:px-6 py-6">
        <aside className={`w-64 shrink-0 ${sidebarOpen ? "fixed inset-y-0 left-0 top-16 z-40 block overflow-y-auto" : "hidden"} lg:sticky lg:top-24 lg:block lg:self-start`}>
          <nav className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl shadow-black/20">
            <div className="p-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-4 pt-4 pb-1">Portfolio</div>
            {navItems.slice(0, 10).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-amber-500/10 text-amber-400 border-r-2 border-amber-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <item.icon size={16} weight={activeTab === item.id ? "fill" : "regular"} />
                <span className="truncate">{item.label}</span>
              </button>
            ))}

            <div className="p-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-4 pt-4 pb-1">AI Settings</div>
            {navItems.slice(10, 16).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-amber-500/10 text-amber-400 border-r-2 border-amber-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <item.icon size={16} weight={activeTab === item.id ? "fill" : "regular"} />
                <span className="truncate">{item.label}</span>
              </button>
            ))}

            <div className="p-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-4 pt-4 pb-1">Business & System</div>
            {navItems.slice(16).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-amber-500/10 text-amber-400 border-r-2 border-amber-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <item.icon size={16} weight={activeTab === item.id ? "fill" : "regular"} />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 backdrop-blur-sm min-h-[80vh]">
            <div className="p-6 sm:p-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
