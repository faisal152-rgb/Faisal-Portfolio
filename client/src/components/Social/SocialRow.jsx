import React, { useState, useEffect, useCallback } from "react";
import { dataService } from "../../services/DataService";
import "./SocialRow.css";

export const SOCIAL_LINKS = [
  { key: "github", label: "GitHub", icon: "GithubLogo", url: "https://github.com/faisal" },
  { key: "linkedin", label: "LinkedIn", icon: "LinkedinLogo", url: "https://linkedin.com/in/faisal" },
  { key: "x-twitter", label: "X / Twitter", icon: "TwitterLogo", url: "https://twitter.com/faisal" },
  { key: "instagram", label: "Instagram", icon: "InstagramLogo", url: "https://instagram.com/faisal" },
  { key: "tiktok", label: "TikTok", icon: "TikTokLogo", url: "https://www.tiktok.com/@faisal" },
  { key: "whatsapp", label: "WhatsApp", icon: "WhatsappLogo", url: "https://wa.me/923000000000" },
  { key: "email", label: "Email", icon: "Envelope", url: "mailto:faisalabbas@gmail.com" },
];

export const SOCIAL_LINK_INDEX = Object.fromEntries(
  SOCIAL_LINKS.map((social, index) => [social.key, index])
);

const DEFAULT_SOCIALS = SOCIAL_LINKS.map(({ key, label, icon, url }) => ({ key, label, icon, url }));

const normalizePlatformKey = (platform = "") => {
  const normalized = String(platform).trim().toLowerCase().replace(/\s+/g, "-");

  if (["x", "x-twitter", "twitter", "x/twitter"].includes(normalized)) return "x-twitter";
  if (["tiktok", "tiktok-@", "tt"].includes(normalized)) return "tiktok";
  return normalized;
};

const sortSocials = (socials) =>
  [...socials].sort((a, b) => {
    const leftIndex = SOCIAL_LINK_INDEX[a.key] ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = SOCIAL_LINK_INDEX[b.key] ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });

export default function SocialRow({ className = "" }) {
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);
  const [loading, setLoading] = useState(true);

  const fetchSocials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dataService.getHero();

      if (Array.isArray(data?.socialLinks)) {
        const configuredSocials = data.socialLinks
          .map(({ platform, url }) => {
            const key = normalizePlatformKey(platform);
            const matchedSocial = SOCIAL_LINKS.find((social) => social.key === key);

            if (!matchedSocial || !url) return null;

            return {
              key: matchedSocial.key,
              label: matchedSocial.label,
              icon: matchedSocial.icon,
              url,
            };
          })
          .filter(Boolean);

        if (configuredSocials.length) {
          setSocials(sortSocials(configuredSocials));
        } else {
          setSocials(DEFAULT_SOCIALS);
        }
      } else {
        setSocials(DEFAULT_SOCIALS);
      }
    } catch (err) {
      console.error('Failed to fetch socials:', err);
      setSocials(DEFAULT_SOCIALS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocials();
  }, [fetchSocials]);

  // Dynamic icon mapping
  const iconMap = {
    GithubLogo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    LinkedinLogo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    TwitterLogo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
      </svg>
    ),
    InstagramLogo: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    TikTokLogo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 11-2-2.77V9.4a6.34 6.34 0 10 5.45 6.27V8.26a8.16 8.16 0 004.77 1.52V6.34a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
    WhatsappLogo: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M20.52 3.48A11.84 11.84 0 0012.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.59 5.93L.12 24l6.35-1.66a11.85 11.85 0 005.61 1.43h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.15-3.43-8.43zM12.09 21.8h-.01a9.88 9.88 0 01-5.03-1.38l-.36-.21-3.77.99 1-3.67-.23-.38a9.88 9.88 0 01-1.51-5.29C2.18 6.42 6.62 1.98 12.08 1.98c2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 012.89 6.99c0 5.46-4.44 9.9-9.86 9.93zm5.43-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
      </svg>
    ),
    Envelope: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  };

  const platformClassMap = {
    GithubLogo: "social-github",
    LinkedinLogo: "social-linkedin",
    TwitterLogo: "social-twitter",
    InstagramLogo: "social-instagram",
    TikTokLogo: "social-tiktok",
    WhatsappLogo: "social-whatsapp",
    Envelope: "social-email",
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="skeleton skeleton-social" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {socials.map(({ icon, label, url }) => {
        const IconComponent = iconMap[icon];
        return (
          <a
            key={label}
            href={url}
            aria-label={label}
            className={`social-icon ${platformClassMap[icon] || "social-default"} flex h-9 w-9 items-center justify-center rounded-full border transition`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {IconComponent ? <IconComponent /> : <span>{icon}</span>}
          </a>
        );
      })}
    </div>
  );
}