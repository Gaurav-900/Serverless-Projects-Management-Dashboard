import React, { useState, useEffect } from "react";
import { auth, FUNCTIONS_URL } from "../firebase";

function SectionModal({ section, onClose, onSubmit, title: modalTitle }) {
  const [formData, setFormData] = useState(
    section ? { name: section.name, order: section.order } : { name: "", order: 0 }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 w-full max-w-md animate-slide-down"
        style={{ borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); onSubmit(formData, section); }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="modal-section-name" className="form-label">
              Section Name <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text" id="modal-section-name" required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="glass-input"
              placeholder="e.g., Featured Projects"
            />
          </div>
          <div>
            <label htmlFor="modal-section-order" className="form-label">Display Order</label>
            <input
              type="number" id="modal-section-order"
              value={formData.order}
              onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="glass-input"
              placeholder="0"
            />
            <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>
              Lower numbers appear first.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1 text-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gradient flex-1 text-sm">
              {section ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

export default function ManageSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [movingId, setMovingId] = useState(null);

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${FUNCTIONS_URL}/getSections`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch sections");
      const data = await res.json();
      setSections(data.sections || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load sections");
      setLoading(false);
    }
  };

  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleModalSubmit = async (formData, existing) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (existing) {
        const res = await fetch(`${FUNCTIONS_URL}/updateSection`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({ id: existing.id, name: formData.name.trim(), order: formData.order, isActive: existing.isActive })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to update"); }
        showMsg('success', 'Section updated!');
      } else {
        const res = await fetch(`${FUNCTIONS_URL}/createSection`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({ name: formData.name.trim(), order: formData.order || 0 })
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create"); }
        showMsg('success', 'Section created!');
      }
      setShowModal(false);
      setEditingSection(null);
      fetchSections();
    } catch (err) {
      showMsg('error', err.message || "An error occurred");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${FUNCTIONS_URL}/deleteSection`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ id: sectionId })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to delete"); }
      showMsg('success', 'Section deleted!');
      setConfirmDelete(null);
      fetchSections();
    } catch (err) {
      showMsg('error', err.message || "Failed to delete section");
      setConfirmDelete(null);
    }
  };

  const handleToggleActive = async (section) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${FUNCTIONS_URL}/updateSection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ id: section.id, name: section.name, order: section.order, isActive: !section.isActive })
      });
      fetchSections();
    } catch (err) {
      showMsg('error', err.message || "Failed to update section");
    }
  };

  const moveSection = async (sectionId, direction) => {
    setMovingId(sectionId);
    const updated = [...sections];
    const idx = updated.findIndex(s => s.id === sectionId);
    if (idx === -1) { setMovingId(null); return; }
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= updated.length) { setMovingId(null); return; }
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const tempOrder = updated[idx].order;
    updated[idx].order = updated[newIdx].order;
    updated[newIdx].order = tempOrder;
    setSections(updated);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');
      await Promise.all([
        fetch(`${FUNCTIONS_URL}/updateSection`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({ id: updated[idx].id, order: updated[idx].order, name: updated[idx].name, isActive: updated[idx].isActive })
        }),
        fetch(`${FUNCTIONS_URL}/updateSection`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
          body: JSON.stringify({ id: updated[newIdx].id, order: updated[newIdx].order, name: updated[newIdx].name, isActive: updated[newIdx].isActive })
        })
      ]);
      showMsg('success', 'Order updated!');
    } catch (err) {
      showMsg('error', "Failed to reorder. Please try again.");
      fetchSections();
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4" style={{ borderRadius: '14px' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
            <div className="flex-1 space-y-2">
              <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              <div className="skeleton" style={{ height: '12px', width: '20%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-label mb-1">Configuration</div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
            Manage Sections
          </h2>
          <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>
            Create, reorder, and toggle visibility of project display sections.
          </p>
        </div>
        <button
          id="add-section-btn"
          className="btn-gradient flex items-center gap-2 text-sm"
          onClick={() => { setEditingSection(null); setShowModal(true); }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="toast-error mb-5 animate-slide-down">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="toast-success mb-5 animate-slide-down">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Sections list */}
      {sections.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2" />
            </svg>
          </div>
          <p className="font-medium mb-1" style={{ color: '#f1f5f9' }}>No sections yet</p>
          <p style={{ color: '#334155', fontSize: '13px' }}>Create your first section to organize projects.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="glass-card flex items-center gap-4 p-5 transition-all"
              style={{
                borderRadius: '14px',
                opacity: movingId === section.id ? 0.7 : 1,
              }}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
                  onMouseEnter={e => { if (index !== 0) e.currentTarget.style.color = '#10b981'; }}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  title="Move up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
                  onMouseEnter={e => { if (index !== sections.length - 1) e.currentTarget.style.color = '#10b981'; }}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  title="Move down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Section icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: section.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                  border: section.isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: section.isActive ? '#10b981' : '#334155' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
                  {section.name}
                </p>
                <p style={{ color: '#334155', fontSize: '12px', marginTop: '2px' }}>
                  Order: {section.order} · ID: {section.id}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => handleToggleActive(section)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: section.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    color: section.isActive ? '#34d399' : '#475569',
                    border: section.isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {section.isActive ? '● Active' : '○ Inactive'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setEditingSection(section); setShowModal(true); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete({ id: section.id, name: section.name })}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <SectionModal
          section={editingSection}
          title={editingSection ? 'Edit Section' : 'Add New Section'}
          onClose={() => { setShowModal(false); setEditingSection(null); }}
          onSubmit={handleModalSubmit}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={() => handleDeleteSection(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
