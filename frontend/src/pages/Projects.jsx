import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth, FUNCTIONS_URL } from "../firebase";
import { useNavigate } from "react-router-dom";

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden" style={{ borderRadius: '16px' }}>
      <div className="skeleton" style={{ height: '200px', borderRadius: '0' }} />
      <div className="p-5 space-y-3">
        <div className="skeleton" style={{ height: '20px', width: '70%' }} />
        <div className="skeleton" style={{ height: '14px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '60%' }} />
        <div className="flex justify-between mt-4">
          <div className="skeleton" style={{ height: '22px', width: '64px', borderRadius: '999px' }} />
          <div className="skeleton" style={{ height: '14px', width: '80px' }} />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const statusColor = {
    active: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    inactive: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    completed: { bg: 'rgba(20,184,166,0.15)', text: '#5eead4', border: 'rgba(20,184,166,0.3)' },
  };

  const sc = statusColor[project.status] || statusColor.active;
  const imageUrl = project.imageUrls?.[0] || project.imageUrl;
  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="card-stagger glass-card overflow-hidden cursor-pointer"
      style={{
        borderRadius: '16px',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.15)'
          : '0 4px 24px rgba(0,0,0,0.4)',
        borderColor: hovered ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
              style={{
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
            {/* Overlay on hover */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(to top, rgba(6,13,26,0.9) 0%, rgba(6,13,26,0.3) 60%, transparent 100%)',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                  transform: hovered ? 'scale(1)' : 'scale(0.8)',
                  transition: 'transform 0.3s ease',
                }}
              >
                View Details
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
            {/* Gradient bottom overlay */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: '60px',
                background: 'linear-gradient(to top, rgba(6,13,26,0.8), transparent)',
              }}
            />
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#334155' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style={{ color: '#334155', fontSize: '12px' }}>No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3
          className="font-bold text-base mb-2 line-clamp-1"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}
        >
          {project.title}
        </h3>
        <p className="text-sm line-clamp-2 mb-4" style={{ color: '#64748b', lineHeight: '1.6' }}>
          {project.brief || project.description || 'No description provided.'}
        </p>

        {project.location && (
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ color: '#475569', fontSize: '12px' }}>{project.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
            style={{
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}`,
              letterSpacing: '0.05em',
            }}
          >
            {project.status || 'active'}
          </span>
          <span style={{ color: '#334155', fontSize: '11px' }}>
            {formatDate(project.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ name }) {
  return (
    <div className="mb-8">
      <div className="section-label">{name}</div>
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}
      >
        {name}
      </h2>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [projectsBySection, setProjectsBySection] = useState({});

  // Fetch projects
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        try {
          const allProjects = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data({ serverTimestamps: 'estimate' })
          }));
          setProjects(allProjects);

          const grouped = {};
          sections.forEach(section => {
            if (section.isActive) {
              const projectFilter = (project) => {
                const projectSections = Array.isArray(project?.sections) ? project.sections : [];
                if (section.id === 'recent') {
                  return projectSections.length === 0 || projectSections.includes('recent');
                } else {
                  return projectSections.includes(section.id);
                }
              };
              grouped[section.id] = allProjects.filter(projectFilter);
              if (grouped[section.id]) {
                grouped[section.id].sort((a, b) => {
                  const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                  const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                  return bDate - aDate;
                });
              }
            }
          });
          setProjectsBySection(grouped);
        } catch (error) {
          console.error('Error processing projects:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error in projects listener:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [sections]);

  // Fetch sections
  useEffect(() => {
    let isMounted = true;
    const fetchSections = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch(
          `${FUNCTIONS_URL}/getSections`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${idToken}`,
              "Content-Type": "application/json"
            }
          }
        );
        if (!isMounted) return;
        if (response.ok) {
          const data = await response.json();
          const sects = Array.isArray(data.sections) ? data.sections : [];
          if (sects.length > 0) {
            setSections(sects.map(s => ({
              id: s.id || '',
              name: s.name || `Section ${s.id}`,
              order: typeof s.order === 'number' ? s.order : 999,
              isActive: s.isActive !== false
            })));
          } else {
            setSections([
              { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
              { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
            ]);
          }
        } else {
          setSections([
            { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
            { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
          ]);
        }
      } catch (error) {
        if (!isMounted) return;
        setSections([
          { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
          { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
        ]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSections();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="py-10">
        {/* Hero skeleton */}
        <div className="mb-12">
          <div className="skeleton mb-3" style={{ height: '14px', width: '120px', borderRadius: '999px' }} />
          <div className="skeleton mb-2" style={{ height: '40px', width: '300px' }} />
          <div className="skeleton" style={{ height: '16px', width: '240px' }} />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 animate-fade-up">
      {/* Hero Header */}
      <div className="mb-12">
        <div className="section-label mb-3">Portfolio</div>
        <div className="flex flex-wrap items-end gap-4 mb-3">
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            My <span className="gradient-text">Projects</span>
          </h1>
          {projects.length > 0 && (
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.25)',
                marginBottom: '4px',
              }}
            >
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          )}
        </div>
        <p style={{ color: '#475569', fontSize: '15px', maxWidth: '480px' }}>
          A curated collection of projects organized by sections. Click any card to explore.
        </p>
      </div>

      {/* Empty state */}
      {!loading && projects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{
            border: '2px dashed rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#f1f5f9' }}>No projects yet</h3>
          <p style={{ color: '#475569', fontSize: '14px' }}>Head to the Admin panel to add your first project.</p>
        </div>
      ) : (
        <div>
          {sections
            .filter(s => s.isActive)
            .sort((a, b) => {
              const orderA = typeof a.order === 'number' ? a.order : 999;
              const orderB = typeof b.order === 'number' ? b.order : 999;
              return orderA - orderB;
            })
            .map(section => {
              const sectionProjects = projectsBySection[section.id] || [];
              return (
                <div key={section.id} className="mb-14">
                  <SectionHeading name={section.name} />
                  {sectionProjects.length === 0 ? (
                    <div
                      className="flex items-center justify-center py-10 rounded-2xl"
                      style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <p style={{ color: '#334155', fontSize: '14px' }}>No projects in this section yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {sectionProjects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
