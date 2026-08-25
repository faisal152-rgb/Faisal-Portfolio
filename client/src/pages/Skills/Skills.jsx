import React, { useState, useEffect, useCallback } from "react";
import { dataService } from "../../services/DataService";
import SkillBar from "./SkillBar";
import "./Skills.css";

const defaultSkillGroups = [
  {
    title: "Frontend",
    skills: [
      { name: "JavaScript", value: 90 },
      { name: "React.js", value: 85 },
      { name: "Tailwind CSS", value: 85 },
      { name: "Redux", value: 80 },
      { name: "Responsive UI", value: 90 },
    ],
  },
  {
    title: "Backend",
    skills: [
      { name: "Node.js", value: 80 },
      { name: "Express.js", value: 88 },
      { name: "MongoDB", value: 82 },
      { name: "REST APIs", value: 85 },
      { name: "FastAPI", value: 85 },
      { name: "Python", value: 78 },
      { name: "PostgreSQL", value: 82 },
    ],
  },
  {
    title: "DevOps & Deployment",
    skills: [
      { name: "Git", value: 90 },
      { name: "GitHub", value: 90 },
      { name: "Deployment", value: 80 },
      { name: "DevOps", value: 75 },
      { name: "Vercel", value: 85 },
      { name: "Netlify", value: 80 },
      { name: "Render", value: 80 },
      { name: "Firebase", value: 80 },
    ],
  },
];

const defaultTechStacks = [
  {
    title: "Primary Tech Stack",
    skills: ["HTML5", "CSS3", "Tailwind CSS", "JavaScript", "React.js", "Node.js", "MongoDB", "Express.js"],
  },
  {
    title: "Secondary Tech Stack",
    skills: ["Python", "PostgreSQL", "Firebase", "Redux", "GitHub", "Git", "Vercel", "Deployment"],
  },
];

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const techStacks = defaultTechStacks.map((defaultStack) => {
    const savedStack = skills.find((group) => group.title === defaultStack.title);
    return savedStack || {
      ...defaultStack,
      skills: defaultStack.skills.map((name) => ({ name, value: 100 })),
    };
  });
  const savedRegularSkills = skills.filter((group) => (
    !defaultTechStacks.some((stack) => stack.title === group.title)
  ));
  const regularSkills = defaultSkillGroups.map((defaultGroup) => {
    const savedGroup = savedRegularSkills.find((group) => group.title === defaultGroup.title);
    return savedGroup || {
      ...defaultGroup,
      skills: defaultGroup.skills.map((skill) => ({ ...skill })),
    };
  });
  const additionalSkills = savedRegularSkills.filter((group) => (
    !defaultSkillGroups.some((defaultGroup) => defaultGroup.title === group.title)
  ));

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const skillsData = await dataService.getSkills();
      setSkills(skillsData);
      
      // Subscribe to real-time updates
      const unsubscribe = dataService.subscribe('skills', (newSkills) => {
        setSkills(newSkills);
      });
      
      return unsubscribe;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch skills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    fetchSkills().then(unsub => { unsubscribe = unsub; });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchSkills]);

  if (loading) {
    return (
      <section id="skills" className="skills-section">
        <div className="skills-container">
          <div className="skills-header">
            <div className="skills-title-wrap">
              <span className="skills-title-line" aria-hidden="true" />
              <h2 className="skills-title">Skills & Technologies</h2>
              <span className="skills-title-line" aria-hidden="true" />
            </div>
            <p className="skills-subtitle">What I Work With</p>
          </div>
          <div className="skills-grid">
            {[1,2,3].map(i => (
              <div key={i} className="skill-group-card skeleton-card">
                <div className="skill-group-head">
                  <div className="skeleton skeleton-text" style={{ width: '80px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '30px' }} />
                </div>
                <div className="skill-group-list">
                  {[1,2,3,4,5].map(j => (
                    <div key={j} className="skeleton skeleton-skill-bar" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="skills" className="skills-section">
        <div className="skills-container">
          <div className="skills-header">
            <div className="skills-title-wrap">
              <span className="skills-title-line" aria-hidden="true" />
              <h2 className="skills-title">Skills & Technologies</h2>
              <span className="skills-title-line" aria-hidden="true" />
            </div>
            <p className="skills-subtitle">What I Work With</p>
          </div>
          <div className="error-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Failed to load skills: {error}</p>
            <button onClick={fetchSkills} className="btn-primary" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="skills" className="skills-section">
      <div className="skills-container">
        {/* ---------- Header ---------- */}
        <div className="skills-header">
          <div className="skills-title-wrap">
            <span className="skills-title-line" aria-hidden="true" />
            <h2 className="skills-title">Skills & Technologies</h2>
            <span className="skills-title-line" aria-hidden="true" />
          </div>
          <p className="skills-subtitle">What I Work With</p>
        </div>

        {/* ---------- Skill Groups ---------- */}
        <div className="skills-grid">
          {[...regularSkills, ...additionalSkills].map((group) => (
            <div key={group._id || group.title} className="skill-group-card">
              <div className="skill-group-head">
                <h4 className="skill-group-title">
                  {group.title}
                </h4>
              </div>

              <div className="skill-group-list">
                {group.skills.map((skill) => (
                  <SkillBar key={skill._id || skill.name} {...skill} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div id="tech-stack" className="tech-stack">
          <div className="tech-stack-header">
            <h3 className="font-extrabold text-lg mb-4">Technology Stack</h3>
          </div>

          <div className="tech-stack-grid">
            {techStacks.map((group, index) => (
              <div key={group._id || group.title} className="tech-stack-col">
                <p className="tech-stack-col-label">
                  {index === 0 ? "Primary Tech" : "Secondary Tech"}
                </p>
                <div className="tech-pills">
                  {group.skills.map((skill, techIndex) => (
                    <span
                      key={skill._id || skill.name || techIndex}
                      className={`tech-pill ${index === 0 ? "tech-pill-primary" : "tech-pill-secondary"}`}
                    >
                      {skill.name || skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}