import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowSquareOut, X } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import "./Services.css";

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

const isPersistedImage = (url) => typeof url === "string" && url.trim() !== "" && !url.startsWith("blob:");

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let active = true;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const projects = await dataService.getProjects();
        const match = projects.filter(isLiveProject).find((item) => {
          const itemId = item?._id || item?.id;
          return String(itemId) === String(id);
        });

        if (!active) return;
        setProject(match || null);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load project details.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProject();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedImage]);

  if (loading) {
    return (
      <section className="project-details-section">
        <div className="project-details-shell">
          <div className="project-details-skeleton" />
        </div>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="project-details-section">
        <div className="project-details-shell project-details-empty">
          <h2>Project not found</h2>
          <p>{error || "The requested project is unavailable or has been removed."}</p>
          <Link to="/" className="project-back-link">
            <ArrowLeft size={16} weight="bold" />
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const galleryImages = Array.from(new Set([
    project.coverImage,
    ...(Array.isArray(project.images) ? project.images : []),
  ].filter(isPersistedImage)));
  const coverImage = isPersistedImage(project.coverImage) ? project.coverImage : galleryImages[0];

  return (
    <section className="project-details-section">
      <div className="project-details-shell">
        <Link to="/" className="project-back-link">
          <ArrowLeft size={16} weight="bold" />
          Back to Portfolio
        </Link>

        <div className="project-detail-hero">
          <div className="project-detail-copy">
            <div className="project-detail-meta">
              <span className="project-detail-badge">Case Study</span>
              {project.clientName && (
                <span className="project-detail-client-badge">Client: <strong>{project.clientName}</strong></span>
              )}
            </div>
            <h1>{project.name}</h1>
            <p>{project.tagline}</p>

            <div className="tech-pills">
              {(project.tech || []).map((tech) => (
                <span key={tech} className="tech-pill">{tech}</span>
              ))}
            </div>

            <div className="project-detail-actions">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="btn-primary project-detail-btn">
                  Live Demo
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
              )}
              {project.codeUrl && (
                <a href={project.codeUrl} target="_blank" rel="noreferrer" className="btn-outline project-detail-btn">
                  Source Code
                </a>
              )}
              {project.document?.url && (
                <a href={project.document.url} target="_blank" rel="noreferrer" className="btn-outline project-detail-btn">
                  Project Document
                  <ArrowSquareOut size={16} weight="bold" />
                </a>
              )}
            </div>
          </div>

          <div className="project-detail-cover-wrap">
            {coverImage ? (
              <img
                src={coverImage}
                alt={project.name}
                style={{
                  objectFit: project.coverImageSettings?.fit || 'cover',
                  objectPosition: `${project.coverImageSettings?.positionX ?? 50}% ${project.coverImageSettings?.positionY ?? 50}%`,
                  transform: `scale(${(project.coverImageSettings?.scale ?? 100) / 100}) rotate(${project.coverImageSettings?.rotation ?? 0}deg) scaleX(${project.coverImageSettings?.flipX ? -1 : 1}) scaleY(${project.coverImageSettings?.flipY ? -1 : 1})`,
                  filter: `brightness(${project.coverImageSettings?.brightness ?? 100}%) contrast(${project.coverImageSettings?.contrast ?? 100}%) saturate(${project.coverImageSettings?.saturation ?? 100}%) grayscale(${project.coverImageSettings?.grayscale ?? 0}%)`,
                }}
                className="project-detail-cover"
              />
            ) : (
              <div className="project-detail-cover project-detail-cover-empty">No cover image available</div>
            )}
          </div>
        </div>

        <div className="project-detail-grid">
          <div className="project-detail-card">
            <h3>Overview</h3>
            <p>{project.subText || project.tagline}</p>
          </div>

          {project.keyFeatures && project.keyFeatures.length > 0 && (
            <div className="project-detail-card">
              <h3>Key Features</h3>
              <ul className="project-features-list">
                {project.keyFeatures.map((feature, idx) => (
                  <li key={idx}>
                    <span style={{ color: '#4f46e5', marginRight: '4px' }}>✦</span> {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="project-detail-card">
            <h3>Impact</h3>
            <div className="project-stat-grid">
              {(project.stats || []).map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="project-stat-item">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {galleryImages.length > 1 && (
          <div className="project-gallery-section">
            <h3>Project Gallery</h3>
            <div className="project-gallery-grid">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className="project-gallery-item"
                  onClick={() => setSelectedImage(image)}
                  aria-label={`Open ${project.name} image ${index + 1}`}
                >
                  <img src={image} alt={`${project.name} view ${index + 1}`} className="project-gallery-image" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="project-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full project image"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="project-image-lightbox-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close full image"
          >
            <X size={22} weight="bold" />
          </button>
          <img
            src={selectedImage}
            alt={`${project.name} full view`}
            className="project-image-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
