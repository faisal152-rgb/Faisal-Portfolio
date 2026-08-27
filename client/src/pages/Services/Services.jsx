import React, { useState, useEffect, useCallback } from "react";
import {
  Code,
  Stack,
  CloudArrowUp,
  Cpu,
  DeviceMobile,
  Database,
  Drop,
  Sparkle,
  ShoppingBag,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";

/*
  FIXED IMAGE PATH HANDLING - Images stored in server/uploads/ need proper URL prefix
  When referencing uploaded images in frontend, prepend '/uploads/' to ensure correct path resolution
*/
const getImageUrl = (imagePath) => {
  if (!imagePath) return undefined;
  // If already an absolute URL with protocol, return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  // If path starts with '/uploads/', return as-is (already correct format)
  if (imagePath.startsWith("/uploads/")) return imagePath;
  // Otherwise prepend '/uploads/' for server static file serving
  return `/uploads/${imagePath}`;
};

// Map icon name strings to actual phosphor icon components
const iconMap = {
  Code,
  Stack,
  CloudArrowUp,
  Cpu,
  DeviceMobile,
  Database,
  Drop,
  Sparkle,
  ShoppingBag,
  CaretLeft,
  CaretRight,
};

const DEFAULT_PROJECT_PLACEHOLDERS = new Set([
  "new project",
  "project tagline",
  "project description",
  "first line",
  "second line",
  "hello world",
]);

const isLiveProject = (project) => {
  if (!project || typeof project !== "object") return false;
  const name = String(project.name || "").trim();
  const tagline = String(project.tagline || "").trim();
  const subText = String(project.subText || "").trim();

  if (!name || !tagline) return false;
  if (DEFAULT_PROJECT_PLACEHOLDERS.has(name.toLowerCase())) return false;
  if (DEFAULT_PROJECT_PLACEHOLDERS.has(tagline.toLowerCase())) return false;
  if (DEFAULT_PROJECT_PLACEHOLDERS.has(subText.toLowerCase())) return false;

  return true;
};

const isPersistedImage = (url) => typeof url === "string" && !url.startsWith("blob:");

export default function Services() {
  const [idx, setIdx] = useState(0);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const liveProjects = projects.filter(isLiveProject);

  useEffect(() => {
    setIdx((currentIndex) => {
      if (liveProjects.length === 0) return 0;
      return Math.min(currentIndex, liveProjects.length - 1);
    });
  }, [liveProjects.length]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, projectsData] = await Promise.all([
        dataService.getServices(),
        dataService.getProjects(),
      ]);
      setServices(servicesData);
      setProjects(projectsData);

      // Subscribe to real-time updates
      const unsubscribeServices = dataService.subscribe('services', (newServices) => {
        setServices(newServices);
      });
      const unsubscribeProjects = dataService.subscribe('projects', (newProjects) => {
        setProjects(newProjects);
      });

      return () => {
        unsubscribeServices();
        unsubscribeProjects();
      };
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch services/projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cleanup;
    fetchData().then(c => { cleanup = c; });
    return () => { if (cleanup) cleanup(); };
  }, [fetchData]);

  const total = liveProjects.length;
  const project = liveProjects[idx] || null;

  const prev = () => {
    setIdx((i) => (i - 1 + total) % total);
  };
  const next = () => {
    setIdx((i) => (i + 1) % total);
  };

  if (loading) {
    return (
      <section id="services" className="services-section">
        <div className="services-container">
          <div className="services-header">
            <div className="services-title-wrap">
              <span className="services-title-line" aria-hidden="true" />
              <h2 className="services-title">My Services</h2>
              <span className="services-title-line" aria-hidden="true" />
            </div>
            <p className="services-subtitle">What I Offer</p>
          </div>
          <div className="services-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="service-card skeleton-card">
                <div className="service-icon-wrap">
                  <div className="skeleton skeleton-icon" />
                </div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '100%' }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="services" className="services-section">
        <div className="services-container">
          <div className="services-header">
            <div className="services-title-wrap">
              <span className="services-title-line" aria-hidden="true" />
              <h2 className="services-title">My Services</h2>
              <span className="services-title-line" aria-hidden="true" />
            </div>
            <p className="services-subtitle">What I Offer</p>
          </div>
          <div className="error-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Failed to load data: {error}</p>
            <button onClick={fetchData} className="btn-primary" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="services-section">
      <div className="services-container">
        {/* ---------- Header ---------- */}
        <div className="services-header">
          <div className="services-title-wrap">
            <span className="services-title-line" aria-hidden="true" />
            <h2 className="services-title">My Services</h2>
            <span className="services-title-line" aria-hidden="true" />
          </div>
          <p className="services-subtitle">What I Offer</p>
        </div>

        {/* ---------- Service Cards ---------- */}
        <div className="services-grid">
          {services.map(function (s) {
            var Icon = iconMap[s.icon] || Code;
            return (
              <div key={s._id || s.title} className="service-card">
                <div className="service-icon-wrap">
                  <Icon size={26} weight="duotone" className="service-icon" />
                </div>
                <h4 className="service-name">{s.title}</h4>
                <p className="service-desc">{s.description || s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* ---------- Featured Project Carousel ---------- */}
        <div id="project" className="featured-project-wrap scroll-mt-20">
          {liveProjects.length > 0 && project && (
            <div className="featured-project" key={project._id || project.id}>
              {/* Left info */}
              <div className="featured-info">
                <div className="featured-layout-group">
                  <div className="featured-title-col">
                    <h3 className="featured-label">
                      <span>Featured</span>
                      <span>Project</span>
                    </h3>
                  </div>
                  
                  <div
                    className="featured-glow-line"
                    aria-hidden="true"
                    style={project.brandColor ? {
                      background: `linear-gradient(180deg, ${project.brandColor}cc 0%, ${project.brandColor} 50%, ${project.brandColor}99 100%)`,
                      boxShadow: `0 0 16px 2px ${project.brandColor}aa, 0 0 32px 4px ${project.brandColor}55`,
                    } : undefined}
                  />
                  
                  <div className="featured-body-col">
                    {/* Fixed Project Name Section */}
                    <h4 className="featured-name">{project.name}</h4>
                    
                    {/* Fixed Tagline Section */}
                    <p className="featured-tagline">{project.tagline}</p>
                    
                    {/* Scrollable Tech Pills Section */}
                    <div className="featured-tech-scroll-area">
                      <div className="tech-pills">
                        {(Array.isArray(project.tech) ? project.tech : []).map(function (t) {
                          return (
                            <span key={t} className="tech-pill">{t}</span>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Fixed Action Buttons Section */}
                    <div className="featured-actions">
                      {project.liveUrl && (
                        <a href={project.liveUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">Live Demo</a>
                      )}
                      {project.codeUrl && (
                        <a href={project.codeUrl} className="btn-outline" target="_blank" rel="noopener noreferrer">GitHub</a>
                      )}
                      <a href={`/project/${project._id || project.id}`} className="btn-outline project-details-link" target="_self" rel="noopener noreferrer">View Details</a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right laptop mockup */}
              <div className="featured-mockup" aria-hidden="true">
                <div className="laptop">
                  {/* Screen lid with notch */}
                  <div className="laptop-lid">
                    <div className="laptop-notch" />
                    <div className="laptop-screen">
                      {isPersistedImage(project.coverImage) && (
                        <img
                          src={getImageUrl(project.coverImage)}
                          alt={project.name}
                          style={{
                            objectFit: project.coverImageSettings?.fit || 'cover',
                            objectPosition: `${project.coverImageSettings?.positionX ?? 50}% ${project.coverImageSettings?.positionY ?? 50}%`,
                            transform: `scale(${(project.coverImageSettings?.scale ?? 100) / 100}) rotate(${project.coverImageSettings?.rotation ?? 0}deg) scaleX(${project.coverImageSettings?.flipX ? -1 : 1}) scaleY(${project.coverImageSettings?.flipY ? -1 : 1})`,
                            filter: `brightness(${project.coverImageSettings?.brightness ?? 100}%) contrast(${project.coverImageSettings?.contrast ?? 100}%) saturate(${project.coverImageSettings?.saturation ?? 100}%) grayscale(${project.coverImageSettings?.grayscale ?? 0}%)`,
                          }}
                          className="project-cover-image"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {liveProjects.length === 0 && (
            <div className="featured-project-empty">
              <h3 className="featured-label">Featured Project</h3>
              <p>Add a complete project from the admin panel to display it here.</p>
            </div>
          )}
          
          {/* Side arrows */}
          {liveProjects.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-arrow carousel-arrow-left"
                onClick={prev}
                aria-label="Previous project"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                type="button"
                className="carousel-arrow carousel-arrow-right"
                onClick={next}
                aria-label="Next project"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </>
          )}
          
          {/* Dot indicators */}
          {liveProjects.length > 0 && (
            <div className="carousel-dots" role="tablist" aria-label="Projects">
              {liveProjects.map(function (p, i) {
                return (
                  <button
                    key={p._id || p.id}
                    type="button"
                    className={"carousel-dot" + (i === idx ? " is-active" : "")}
                    onClick={function () { setIdx(i); }}
                    aria-label={"Go to " + p.name}
                    aria-selected={i === idx}
                    role="tab"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
