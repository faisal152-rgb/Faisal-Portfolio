import React, { useState, useEffect, useCallback } from "react";
import { Code, Stack, Cpu, Rocket, Briefcase } from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import "./Timeline.css";

const iconMap = {
  "JavaScript & Web Development": Code,
  "MERN Stack": Stack,
  "AI Projects": Cpu,
  "Open for Opportunities": Rocket,
};

const tagMap = {
  "JavaScript & Web Development": "Foundation",
  "MERN Stack": "Specialization",
  "AI Projects": "Innovation",
  "Open for Opportunities": "Available",
};

export default function Timeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const timelineData = await dataService.getTimeline();
      setTimeline(timelineData);
      
      // Subscribe to real-time updates
      const unsubscribe = dataService.subscribe('timeline', (newTimeline) => {
        setTimeline(newTimeline);
      });
      
      return unsubscribe;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    fetchTimeline().then(unsub => { unsubscribe = unsub; });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchTimeline]);

  if (loading) {
    return (
      <section id="timeline" className="timeline-section">
        <div className="timeline-container">
          <div className="timeline-header">
            <div className="timeline-title-wrap">
              <span className="timeline-title-line" aria-hidden="true" />
              <h2 className="timeline-title">Experience Timeline</h2>
              <span className="timeline-title-line" aria-hidden="true" />
            </div>
            <p className="timeline-subtitle">My Journey So Far</p>
          </div>
          <div className="timeline-list">
            <div className="timeline-line" aria-hidden="true" />
            <ol className="timeline-items">
              {[1,2,3,4].map(i => (
                <li key={i} className="timeline-item skeleton-item" style={{ "--delay": `${i * 120}ms` }}>
                  <span className="timeline-node skeleton-node" aria-hidden="true" />
                  <div className="timeline-card skeleton-card">
                    <div className="timeline-card-head">
                      <div className="skeleton skeleton-text" style={{ width: '150px' }} />
                      <div className="skeleton skeleton-tag" />
                    </div>
                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
                    <div className="timeline-card-accent skeleton-accent" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="timeline" className="timeline-section">
        <div className="timeline-container">
          <div className="timeline-header">
            <div className="timeline-title-wrap">
              <span className="timeline-title-line" aria-hidden="true" />
              <h2 className="timeline-title">Experience Timeline</h2>
              <span className="timeline-title-line" aria-hidden="true" />
            </div>
            <p className="timeline-subtitle">My Journey So Far</p>
          </div>
          <div className="error-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Failed to load timeline: {error}</p>
            <button onClick={fetchTimeline} className="btn-primary" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="timeline" className="timeline-section">
      <div className="timeline-container">
        {/* ---------- Header ---------- */}
        <div className="timeline-header">
          <div className="timeline-title-wrap">
            <span className="timeline-title-line" aria-hidden="true" />
            <h2 className="timeline-title">Experience Timeline</h2>
            <span className="timeline-title-line" aria-hidden="true" />
          </div>
          <p className="timeline-subtitle">My Journey So Far</p>
        </div>

        {/* ---------- Timeline list ---------- */}
        <div className="timeline-list">
          {/* Vertical glowing spine line */}
          <div className="timeline-line" aria-hidden="true" />

          <ol className="timeline-items">
            {timeline.map((item, idx) => {
              const Icon = iconMap[item.title] || Briefcase;
              const tag = tagMap[item.title] || "Milestone";
              return (
                <li
                  key={item._id || item.title}
                  className="timeline-item"
                  style={{ "--delay": `${idx * 120}ms` }}
                >
                  {/* Icon node */}
                  <span className="timeline-node" aria-hidden="true">
                    <Icon size={16} weight="bold" />
                  </span>

                  {/* Card */}
                  <div className="timeline-card">
                    <div className="timeline-card-head">
                      <h4 className="timeline-card-title">{item.title}</h4>
                      <span className="timeline-tag">{tag}</span>
                    </div>
                    <p className="timeline-card-desc">{item.description || item.desc}</p>

                    {/* Accent line */}
                    <div className="timeline-card-accent" aria-hidden="true" />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}