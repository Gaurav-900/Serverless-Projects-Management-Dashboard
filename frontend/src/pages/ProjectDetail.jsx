import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="glow-spinner" />
        <p style={{ color: '#475569', fontSize: '14px' }}>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-up">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#f43f5e' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>{error}</h2>
        <button className="btn-ghost text-sm" onClick={() => navigate(-1)}>← Go back</button>
      </div>
    );
  }

  const images = project.imageUrls?.length > 0 ? project.imageUrls : project.imageUrl ? [project.imageUrl] : [];
  const statusColor = {
    active: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    inactive: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    completed: { bg: 'rgba(20,184,166,0.15)', text: '#5eead4', border: 'rgba(20,184,166,0.3)' },
  };
  const sc = statusColor[project.status] || statusColor.active;

  return (
    <div className="animate-fade-up">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium mb-8 group"
        style={{ color: '#475569', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {/* Hero section with large image */}
      {images.length > 0 && (
        <div
          className="relative w-full overflow-hidden rounded-2xl mb-10"
          style={{ height: '420px', cursor: 'zoom-in' }}
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[activeImg]}
            alt={project.title}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 0.6s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(6,13,26,0.85) 0%, rgba(6,13,26,0.2) 50%, transparent 100%)',
            }}
          />
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="section-label mb-2">Project</div>
            <h1
              className="text-4xl md:text-5xl font-bold text-white mb-2"
              style={{ fontFamily: 'Outfit, sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
            >
              {project.title}
            </h1>
            {project.brief && (
              <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '600px' }}>{project.brief}</p>
            )}
          </div>
          {/* Zoom icon */}
          <div
            className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Image thumbnails */}
          {images.length > 1 && (
            <div className="mb-8">
              <div className="section-label mb-4">Gallery</div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl cursor-pointer"
                    style={{
                      height: '90px',
                      border: activeImg === idx ? '2px solid #10b981' : '2px solid transparent',
                      boxShadow: activeImg === idx ? '0 0 16px rgba(16,185,129,0.35)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: activeImg === idx ? 'rgba(16,185,129,0.1)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Details */}
          <div className="glass-card p-7 mb-6" style={{ borderRadius: '16px' }}>
            <div className="section-label mb-4">Details</div>
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
              Project Details
            </h2>
            <div
              className="prose max-w-none"
              style={{
                color: '#94a3b8',
                lineHeight: '1.8',
                fontSize: '15px',
              }}
            >
              {project.details ? (
                <div
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{
                    __html: project.details
                      .replace(/\n/g, '<br>')
                      .replace(/  /g, '&nbsp;&nbsp;')
                  }}
                />
              ) : (
                <p style={{ color: '#334155', fontStyle: 'italic' }}>
                  No additional details available for this project.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Metadata */}
        <div className="space-y-4">
          {/* Status */}
          <div className="glass-card p-6" style={{ borderRadius: '16px' }}>
            <div className="section-label mb-4">Overview</div>
            <div className="space-y-4">
              {project.status && (
                <div>
                  <p style={{ color: '#475569', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Status</p>
                  <span
                    className="text-sm font-semibold px-3 py-1.5 rounded-full capitalize inline-block"
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                  >
                    {project.status}
                  </span>
                </div>
              )}
              {project.location && (
                <div>
                  <p style={{ color: '#475569', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Location</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{project.location}</span>
                  </div>
                </div>
              )}
              {project.createdAt && (
                <div>
                  <p style={{ color: '#475569', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Created</p>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {project.createdAt?.toDate
                      ? project.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sections/Categories */}
          {project.sections?.length > 0 && (
            <div className="glass-card p-6" style={{ borderRadius: '16px' }}>
              <div className="section-label mb-4">Categories</div>
              <div className="flex flex-wrap gap-2">
                {project.sections.map((section, idx) => (
                  <span key={idx} className="badge-emerald capitalize">{section}</span>
                ))}
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
            onClick={() => navigate(-1)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={images[activeImg]}
              alt="Lightbox"
              className="w-full rounded-2xl"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
            <button
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(8px)' }}
              onClick={() => setLightbox(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images.length > 1 && (
              <div className="flex justify-center gap-3 mt-4">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className="rounded-full transition-all"
                    style={{
                      width: activeImg === idx ? '24px' : '8px',
                      height: '8px',
                      background: activeImg === idx ? '#10b981' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
