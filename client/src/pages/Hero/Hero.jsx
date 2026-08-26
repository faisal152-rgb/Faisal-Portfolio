import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  Sparkle,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";
import SocialRow from "../../components/Social/SocialRow";
import PhoneAIChat from "../../pages/Phone AI Chat/PhoneAIChat";
import { useSystemStatus } from "../../context/SystemStatusContext";
import "./Hero.css";

const PLATFORM_STYLES = {
  upwork: {
    wrapper: "flex items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3 text-white hover:bg-emerald-600 hover:-translate-y-0.5 transition shadow-lg shadow-emerald-900/30",
    tile: "upwork-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm",
    tileText: "up",
    subText: "text-[10px] opacity-90",
  },
  fiverr: {
    wrapper: "flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-teal-700 hover:bg-teal-50 hover:-translate-y-0.5 transition shadow-lg shadow-black/20",
    tile: "fiverr-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm",
    tileText: "fi",
    subText: "text-[10px] text-slate-500",
  },
  default: {
    wrapper: "flex items-center gap-3 rounded-2xl bg-purple-600 px-4 py-3 text-white hover:bg-purple-500 hover:-translate-y-0.5 transition shadow-lg shadow-purple-900/30",
    tile: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm bg-white/20",
    tileText: "🔗",
    subText: "text-[10px] opacity-90",
  },
};

function getPlatformStyle(platformName) {
  const key = (platformName || '').toLowerCase();
  if (key.includes('upwork')) return PLATFORM_STYLES.upwork;
  if (key.includes('fiverr')) return PLATFORM_STYLES.fiverr;
  return PLATFORM_STYLES.default;
}

function PhoneFreelanceView(props) {
  var onOpenAI = props.onOpenAI;
  const { socialLinks, freelance } = props;

  const freelanceLinks = (freelance && freelance.length > 0)
    ? freelance
    : [
        { platform: 'Upwork', url: 'https://upwork.com/freelancers/', label: 'Upwork Profile' },
        { platform: 'Fiverr', url: 'https://fiverr.com/', label: 'Fiverr Gig' },
      ];

  return (
    <div className="phone-freelance-view">
      <div className="phone-available-card" role="status" aria-live="polite">
        <div className="phone-available-head">
          <span className="phone-available-pulse" aria-hidden="true">
            <span className="phone-available-dot" />
         </span>
          <span className="phone-available-badge">Available for</span>
        </div>
        <p className="phone-available-meta">
          <span className="phone-available-meta-dot" aria-hidden="true" />
          Open to new opportunities
       </p>
    </div>

      <h3 className="mt-4 text-xl font-bold">Freelance Projects</h3>
      <div className="phone-accent-bar mt-2 h-1 w-14 rounded-full" />
      <p className="mt-4 text-xs text-purple-100/90 leading-relaxed">
        Let's build something amazing together. Connect with me on
        professional platforms:
     </p>

      <div className="mt-6 w-full flex flex-col gap-3">
        {freelanceLinks.map((link, idx) => {
          const style = getPlatformStyle(link.platform);
          return (
            <a
              key={idx}
              href={link.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={style.wrapper}
            >
              <span className={style.tile}>
                {style.tileText}
              </span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">{link.label || link.platform}</p>
                <p className={style.subText}>
                  {link.platform.toLowerCase().includes('upwork')
                    ? 'View my Upwork profile'
                    : link.platform.toLowerCase().includes('fiverr')
                    ? 'Check out my Fiverr gigs'
                    : `Visit ${link.platform}`}
                </p>
              </div>
              <ArrowSquareOut size={16} weight="bold" />
            </a>
          );
        })}
     </div>

      <div className="mt-auto pt-6 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenAI}
          className="phone-ai-trigger flex flex-col items-center gap-1"
          aria-label="Open AI Business Assistant"
        >
          <ChatCircleDots
            size={28}
            weight="duotone"
            className="phone-ai-chat-icon"
          />
          <p className="text-xs text-purple-100/90 leading-relaxed">
          Want to explore more? Try my AI Business Assistant for quick insights
       </p>
      </button>
    </div>
   </div>
  );
}

export default function Hero({ onNavigate }) {
  var viewState = useState("freelance");
  var view = viewState[0];
  var setView = viewState[1];
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const { isOperational, statusText, statusLabel } = useSystemStatus();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [heroData, setHeroData] = useState({
    title: "Creative Solutions for Modern Web Experiences, Innovative AI Applications and Seamless User Interfaces.",
    subtitle: "Software Engineer & Web Developer & Designer | Freelance & Full-Time",
    description: "I build modern, responsive and scalable web applications & AI Integration solutions with clean code and great user experience.Let's collaborate to bring your ideas to life.",
    freelance: [
      { platform: "Upwork", url: "https://upwork.com/freelancers/", label: "Upwork Profile" },
      { platform: "Fiverr", url: "https://fiverr.com/", label: "Fiverr Gig" },
    ],
    socialLinks: [
      { platform: "GitHub", url: "https://github.com/faisal" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/faisal" },
      { platform: "Twitter", url: "https://twitter.com/faisal" },
      { platform: "Instagram", url: "https://instagram.com/faisal" },
      { platform: "TikTok", url: "https://www.tiktok.com/@faisal" },
      { platform: "WhatsApp", url: "https://wa.me/923000000000" },
      { platform: "Email", url: "mailto:faisalabbas@gmail.com" },
    ],
    loading: true,
    error: null,
  });

  const fetchHeroData = useCallback(async () => {
    try {
      setHeroData(prev => ({ ...prev, loading: true, error: null }));
      const data = await dataService.getHero();
      setHeroData(prev => ({ ...prev, ...data, loading: false }));
      
      // Subscribe to real-time updates
      const unsubscribe = dataService.subscribe('hero', (newData) => {
        setHeroData(prev => ({ ...prev, ...newData }));
      });
      
      return unsubscribe;
    } catch (error) {
      setHeroData(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch hero data:', error);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    fetchHeroData().then(unsub => { unsubscribe = unsub; });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchHeroData]);

  function openAI() {
    setView("ai");
  }

  function backToFreelance() {
    setView("freelance");
  }

  if (heroData.loading) {
    return (
      <section id="top" className="gradient-hero">
        <div className="hero-band hero-band-1" />
        <div className="hero-band hero-band-2" />
        <div className="hero-glow" />
        <div className="z-content">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-5 pb-16 lg:pb-24">
            <div>
              <div className="skeleton skeleton-text" style={{ fontSize: '3.5rem', fontWeight: '800', width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ fontSize: '1.25rem', width: '50%', marginTop: '1rem' }} />
              <div className="skeleton skeleton-text" style={{ width: '80%', marginTop: '1.5rem', height: '60px' }} />
              <div className="skeleton skeleton-button" style={{ marginTop: '2rem', width: '140px' }} />
              <div className="skeleton skeleton-button" style={{ marginTop: '1rem', width: '160px' }} />
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="phone-frame skeleton-phone" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (heroData.error) {
    return (
      <section id="top" className="gradient-hero">
        <div className="hero-band hero-band-1" />
        <div className="hero-band hero-band-2" />
        <div className="hero-glow" />
        <div className="z-content">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-5 pb-16 lg:pb-24">
            <div className="error-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Failed to load hero data: {heroData.error}</p>
              <button onClick={fetchHeroData} className="btn-primary" style={{ marginTop: '1rem' }}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="top" className="gradient-hero">
      {/* Diagonal shadow bands */}
      <div className="hero-band hero-band-1" />
      <div className="hero-band hero-band-2" />

      {/* Central soft glow */}
      <div className="hero-glow" />

      {/* Content layer (sits above decorative layers) */}
      <div className="z-content">
        {/* Available for New Projects — status card */}
        <div className="max-w-6xl mx-auto flex justify-start px-5 pt-6">
          <div className="hero-available-card" role="status" aria-live="polite">
            <div className="hero-available-head">
              <span className="hero-available-pulse" aria-hidden="true">
                <span className={`hero-available-dot ${isOperational ? "hero-available-dot-online" : "hero-available-dot-offline"}`} />
              </span>
              <span className="hero-available-badge">{statusText}</span>
            </div>

            <div className="hero-available-body">
              <h3 className="hero-available-title">Let's Build Something Great</h3>
              <p className="hero-available-desc">
                {isOperational
                  ? `Open for freelance work, full-time roles, and collaboration on modern web products.`
                  : `The portfolio is temporarily unavailable. Please check back shortly.`}
              </p>
            </div>

            <div className="hero-available-foot">
              <button
                type="button"
                onClick={function () { onNavigate && onNavigate("contact"); }}
                className="hero-available-cta"
              >
                Get in Touch
                <ArrowRight size={14} weight="bold" />
              </button>
              <span className="hero-available-meta">{statusLabel === 'Available' ? 'Replies within 24h' : 'Currently offline'}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-5 pb-16 lg:pb-24">
          {/* LEFT — text content */}
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              {heroData.title}
           </h1>
            <p className="mt-3 text-lg sm:text-xl text-purple-100 font-medium leading-snug">
              {heroData.subtitle}
           </p>
            <p className="mt-4 max-w-md text-purple-100/90 leading-relaxed">
              {heroData.description}
           </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={function () { onNavigate && onNavigate("contact"); }}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50 transition"
              >
                Hire Me
                <ArrowRight size={16} weight="bold" />
             </button>
              <button
                onClick={function () { onNavigate && onNavigate("project"); }}
                className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-6 py-3 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition"
              >
                View My Work
                <ArrowRight size={16} weight="bold" />
             </button>
           </div>

            <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-purple-100">
              Connect with me
           </p>
            <SocialRow className="mt-3" />
         </div>

          {/* RIGHT — phone mockup with toggleable views */}
          <div className="flex justify-center lg:justify-end">
            <div className="phone-frame">
              <div className="phone-notch" />

              {/* Status bar */}
              <div className="phone-status">
                <span>
                  {`${(currentTime.getHours() % 12 || 12)}:${String(currentTime.getMinutes()).padStart(2, '0')}`}
                </span>
                <div className="phone-status-icons">
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                    <rect x="0" y="6" width="2" height="4" rx="0.5" />
                    <rect x="3.5" y="4" width="2" height="6" rx="0.5" />
                    <rect x="7" y="2" width="2" height="8" rx="0.5" />
                    <rect x="10.5" y="0" width="2" height="10" rx="0.5" />
                 </svg>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                    <path d="M7 9.5C4 9.5 1.5 7.5 0 6 1.5 4.5 4 2.5 7 2.5S12.5 4.5 14 6c-1.5 1.5-4 3.5-7 3.5z" />
                    <circle cx="7" cy="6" r="1.5" fill="#6b21a8" />
                 </svg>
                  <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
                    <rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="white" strokeOpacity="0.6" />
                    <rect x="2" y="2" width="15" height="6" rx="1" fill="white" />
                    <rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="white" fillOpacity="0.6" />
                 </svg>
               </div>
             </div>

              {/* Phone screen content — toggles between Freelance Project and AI Assistant */}
              <div
                className={
                  "phone-screen " +
                  (view === "ai"
                    ? "phone-screen-chat"
                    : "phone-screen-freelance")
                }
              >
                {view === "ai" ? (
                                  <PhoneAIChat onBack={backToFreelance} />
                                ) : (
                                  <PhoneFreelanceView onOpenAI={openAI} socialLinks={heroData.socialLinks} freelance={heroData.freelance} />
                                )}
             </div>
           </div>
         </div>
       </div>
     </div>
   </section>
  );
}
