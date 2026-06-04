import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div className="glass-card p-7 max-w-sm w-full animate-slide-down" style={{ borderRadius: '20px' }}>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#f43f5e' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
          Confirm Delete
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: '#64748b' }}>{message}</p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 text-sm" onClick={onCancel}>Cancel</button>
          <button className="btn-danger flex-1 text-sm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const imageUrl = project.imageUrls?.[0] || project.imageUrl;
  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const statusColor = {
    active: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    inactive: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    completed: { bg: 'rgba(20,184,166,0.15)', text: '#5eead4', border: 'rgba(20,184,166,0.3)' },
  };
  const sc = statusColor[project.status] || statusColor.active;

  const currentUserEmail = auth.currentUser?.email;
  const isProtected = project.createdBy === 'mainuser900@gmail.com';
  const canDelete = !isProtected || currentUserEmail === 'mainuser900@gmail.com';

  return (
    <div
      className="glass-card overflow-hidden"
      style={{
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '140px' }}>
        {imageUrl ? (
          <img
            src={imageUrl} alt={project.title}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#1e293b' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
            style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, backdropFilter: 'blur(8px)' }}
          >
            {project.status || 'active'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-sm mb-1 line-clamp-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
          {project.title}
        </h3>
        <p className="text-xs line-clamp-2 mb-4" style={{ color: '#475569', lineHeight: '1.6' }}>
          {project.brief || project.description || 'No description.'}
        </p>
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span style={{ color: '#334155', fontSize: '11px' }}>{formatDate(project.createdAt)}</span>
          <div className="flex items-center gap-2">
            <button
              id={`edit-${project.id}`}
              onClick={() => onEdit(project)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(16,185,129,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              title="Edit project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            {canDelete && (
              <button
                id={`delete-${project.id}`}
                onClick={() => onDelete(project.id, project.imageUrls)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(244,63,94,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                title="Delete project"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(collection(db, "projects"));
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    } catch (err) {
      setError("Failed to load projects");
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setSuccess("Project deleted successfully");
      setError("");
      setConfirmDelete(null);
      fetchProjects();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete project");
      setConfirmDelete(null);
    }
  };

  const handleEditProject = (project) => navigate(`/project/edit/${project.id}`);

  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden" style={{ borderRadius: '16px' }}>
              <div className="skeleton" style={{ height: '140px', borderRadius: '0' }} />
              <div className="p-5 space-y-3">
                <div className="skeleton" style={{ height: '16px', width: '70%' }} />
                <div className="skeleton" style={{ height: '12px', width: '90%' }} />
                <div className="skeleton" style={{ height: '12px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-label mb-1">Library</div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
            All Projects
            {projects.length > 0 && (
              <span
                className="ml-3 text-base font-semibold px-3 py-1 rounded-full align-middle"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                {projects.length}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="toast-error mb-6 animate-slide-down">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="toast-success mb-6 animate-slide-down">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#f1f5f9' }}>No projects yet</h3>
          <p style={{ color: '#334155', fontSize: '13px' }}>Add your first project from the "Add Project" tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={(id, urls) => setConfirmDelete({ id, urls })}
            />
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message="This will permanently delete the project and all its data. This action cannot be undone."
          onConfirm={() => handleDeleteProject(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
