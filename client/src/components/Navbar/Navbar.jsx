import React, { useState, useEffect } from "react";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { useSystemStatus } from "../../context/SystemStatusContext";
import "./Navbar.css";

export default function Navbar({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { isOperational, statusText, statusLabel } = useSystemStatus();

  useEffect(() => {
    let unsubscribe;
    dataService.getAbout().then((about) => {
      setProfileImage(about?.profileImage || "");
      unsubscribe = dataService.subscribe("about", (updatedAbout) => {
        setProfileImage(updatedAbout?.profileImage || "");
      });
    }).catch(() => { });

    return () => unsubscribe?.();
  }, []);

  const handleNav = (id) => {
    setMenuOpen(false);
    onNavigate?.(id);
  };

  return (
    <header className="site-header-bg sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <button
            onClick={() => handleNav("top")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white ring-2 ring-white shadow-lg shadow-purple-500/20"
            aria-label="Go to top"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Faisal Abbas"
                className="h-9 w-9 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/Faisal.png";
                }}
              />
            ) : (
              <img src="/Faisal.png" alt="Faisal Abbas" className="h-9 w-9 rounded-full object-cover" />
            )}
          </button>
          <span
            className={`navbar-status-dot ${isOperational ? "navbar-status-dot-online" : "navbar-status-dot-offline"}`}
            aria-label={isOperational ? `${statusLabel} system status` : `System ${statusLabel.toLowerCase()}`}
            title={statusText}
          />
        </div>

        <button
          onClick={() => handleNav("contact")}
          className="hidden md:flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
        >
          Hire Me <ArrowRight size={14} weight="bold" />
        </button>

        <button
          className="md:hidden text-slate-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 border-t border-purple-100 bg-white px-5 py-4 text-sm font-medium text-slate-600">
          <button
            onClick={() => handleNav("contact")}
            className="flex items-center justify-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
          >
            Hire Me <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}
    </header>
  );
}
