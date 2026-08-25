import { useState, useEffect, useCallback } from "react";
import { MapPin, Envelope, DownloadSimple, GraduationCap } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { apiService } from "../../services/apiService";
import { useSystemStatus } from "../../context/SystemStatusContext";
import "./About.css";

export default function About() {
  const { isOperational, statusText } = useSystemStatus();
  const [data, setData] = useState({
    name: "Faisal Abbas",
    role: "Full Stack MERN Developer",
    university: "The Islamia University of Bahawalpur",
    degree: "BS Information Technology",
    years: "2022-2026",
    location: "Bahawalpur, Punjab",
    email: "faisalabbas@gmail.com",
    profileImage: "",
    resume: "",
    stats: [
      ["12+", "Projects Completed"],
      ["2+", "Years of Learning"],
      ["100%", "Commitment & Dedication"],
    ],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      const aboutData = await dataService.getAbout();
      setData(prev => ({ ...prev, ...aboutData, loading: false }));

      // Subscribe to real-time updates
      const unsubscribe = dataService.subscribe('about', (newData) => {
        setData(prev => ({ ...prev, ...newData }));
      });

      return unsubscribe;
    } catch (error) {
      setData(prev => ({ ...prev, loading: false, error: error.message }));
      console.error('Failed to fetch about data:', error);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    fetchData().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchData]);

  function handleDownloadResume() {
    if (data.resume) {
      const link = document.createElement('a');
      link.href = data.resume;
      link.download = `${data.name || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Resume not available');
    }
  }

  if (data.loading) {
    return (
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-card" style={{ opacity: 0.6 }}>
            <div className="about-avatar-wrap">
              <div className="about-avatar skeleton" />
            </div>
            <div className="skeleton skeleton-text" style={{ width: '60%', margin: '1rem auto' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0.5rem auto' }} />
            <div className="about-stats">
              {[1, 2, 3].map(i => (
                <div key={i} className="about-stat">
                  <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto' }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0.5rem auto 0' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (data.error) {
    return (
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-card error-state">
            <p>Failed to load data: {data.error}</p>
            <button onClick={fetchData} className="about-resume-btn">Retry</button>
          </div>
        </div>
      </section>
    );
  }

  const stats = Array.isArray(data.stats)
    ? data.stats
      .map((stat) => {
        if (Array.isArray(stat)) {
          const [value, label] = stat;
          return { value: String(value ?? ""), label: String(label ?? "") };
        }

        if (stat && typeof stat === "object") {
          return {
            value: String(stat.value ?? ""),
            label: String(stat.label ?? ""),
          };
        }

        return { value: "", label: "" };
      })
      .filter((stat) => stat.value || stat.label)
    : [];

  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-header">
          <div className="about-title-wrap">
            <span className="about-title-line" aria-hidden="true" />
            <h2 className="about-title">About Me</h2>
            <span className="about-title-line" aria-hidden="true" />
          </div>
          <p className="about-subtitle">Get To Know Me</p>
        </div>
        <div className="about-card">
          <div className="about-avatar-wrap">
            <a
              href="#contact"
              className="about-avatar-link"
              aria-label="Go to contact section"
              title="Contact Faisal"
            >
              <img
                src={data.profileImage || "/Faisal.png"}
                alt={data.name || "Profile"}
                className="about-avatar"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/Faisal.png";
                }}
              />
              <span
                className={`about-avatar-status ${isOperational ? "about-avatar-status-online" : "about-avatar-status-offline"}`}
                aria-label={isOperational ? "Available for opportunities" : "Currently offline"}
              />
            </a>
          </div>
          <h3 className="about-name">{data.name}</h3>
          <p className="about-role">{data.role}</p>
          <div className="about-meta">
            <div className="about-meta-pill about-meta-education">
              <GraduationCap size={16} weight="bold" className="about-meta-icon" aria-hidden="true" />
              <div className="about-meta-text">
                <span className="about-meta-primary">{data.university}</span>
                <span className="about-education-card">
                  <span className="about-meta-secondary">{data.degree}</span>
                  <span className="about-meta-secondary">{data.years}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="about-stats">
            {stats.map(({ value, label }) => (
              <div key={`${label}-${value}`} className="about-stat">
                <p className="about-stat-num">{value}</p>
                <p className="about-stat-label">{label}</p>
              </div>
            ))}
          </div>
          <div className="about-info">
            <p className="about-info-row">
              <MapPin size={15} weight="fill" /> {data.location}
            </p>
            <p className="about-info-row">
              <Envelope size={15} weight="fill" /> {data.email}
            </p>
            <p className="about-info-row">
              <span className={`about-status-dot ${isOperational ? "about-status-dot-online" : "about-status-dot-offline"}`} /> {statusText}
            </p>
          </div>
          <button
            className="about-resume-btn"
            onClick={handleDownloadResume}
            disabled={!data.resume}
            title={data.resume ? "Download your resume" : "Resume not available"}
          >
            Download Resume <DownloadSimple size={15} weight="bold" />
          </button>
        </div>
      </div>
    </section>
  );
}
