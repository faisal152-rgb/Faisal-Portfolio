import React, { useEffect, useState } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { useSystemStatus } from "../../context/SystemStatusContext";
import SocialRow from "../Social/SocialRow";
import "./Footer.css";

export default function Footer({ onNavigate }) {
  const [profileImage, setProfileImage] = useState("");
  const { isOperational, statusText } = useSystemStatus();

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

  return (
    <footer className="site-footer-bg text-white py-8 border-t border-white/20">
      <div className="max-w-5xl mx-auto px-5 flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 ring-2 ring-white shadow-lg shadow-purple-500/20">
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
          </div>
          <span
            className={`footer-status-dot ${isOperational ? "footer-status-dot-online" : "footer-status-dot-offline"}`}
            title={statusText}
            aria-label={isOperational ? 'System operational' : 'System offline'}
          />
        </div>
        <SocialRow />
        <p className="text-xs text-white/50">
          © 2026 Faisal Abbas. All Rights Reserved. Built & Designed by
          Faisal Abbas.
        </p>
        <button
          onClick={() => onNavigate?.("top")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 transition"
          aria-label="Back to top"
        >
          <ArrowUp size={15} weight="bold" />
        </button>
      </div>
    </footer>
  );
}
