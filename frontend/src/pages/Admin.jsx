import React, { useState, useRef, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth, db, FUNCTIONS_URL } from "../firebase";
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import ManageSections from "./ManageSections";
import ManageProjects from "./ManageProjects";
import { v4 as uuidv4 } from 'uuid';

export default function Admin() {
  const [activeTab, setActiveTab] = useState("projects");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState("");
  const [sections, setSections] = useState(["recent"]);
  const [availableSections, setAvailableSections] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("active");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleSectionChange = (sectionId, isChecked) => {
    if (isChecked) {
      setSections([...sections, sectionId]);
    } else {
      setSections(sections.filter(s => s !== sectionId));
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileChange = (e) => processFiles(Array.from(e.target.files));

  const processFiles = (fileList) => {
    const valid = [];
    fileList.forEach(file => {
      if (!file.type.startsWith('image/')) { setError('Please select only image files'); return; }
      if (file.size > 5 * 1024 * 1024) { setError('File size should be less than 5MB'); return; }
      valid.push(file);
    });
    if (valid.length > 0) { setFiles(prev => [...prev, ...valid]); setError(''); }
  };

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, "projects"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      setError("Failed to load projects");
      return [];
    }
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${FUNCTIONS_URL}/getSections`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${idToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableSections(data.sections || []);
        } else {
          setAvailableSections([
            { id: 'featured', name: 'Featured Projects' },
            { id: 'recent', name: 'Recent Projects' }
          ]);
        }
      } catch {
        setAvailableSections([
          { id: 'featured', name: 'Featured Projects' },
          { id: 'recent', name: 'Recent Projects' }
        ]);
      }
    };
    fetchSections();
  }, []);

  const resetForm = () => {
    setTitle(""); setBrief(""); setDetails(""); setLocation("");
    setFiles([]); setSections(["recent"]); setStatus("active");
    setEditingProject(null); setIsEditing(false); setError(""); setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!title.trim()) { setError("Title is required"); return; }
    if (!brief.trim()) { setError("Brief description is required"); return; }
    if (files.length === 0 && (!editingProject || !editingProject.imageUrls?.length)) {
      setError("Please select at least one image"); return;
    }
    setIsUploading(true);
    setProgress(0);
    try {
      let imageUrls = [];
      if (files.length > 0) {
        const totalSize = files.reduce((t, f) => t + f.size, 0);
        let uploadedSize = 0;
        const uploadPromises = files.map(file => {
          const fileExt = file.name.split('.').pop();
          const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const storageRef = ref(storage, `projects/${filename}`);
          return new Promise((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, file);
            task.on('state_changed',
              (snapshot) => {
                const p = Math.min(100, Math.round(((uploadedSize + snapshot.bytesTransferred) / totalSize) * 100));
                setProgress(p);
              },
              reject,
              async () => {
                try {
                  const url = await getDownloadURL(task.snapshot.ref);
                  uploadedSize += file.size;
                  resolve(url);
                } catch (e) { reject(e); }
              }
            );
          });
        });
        imageUrls = await Promise.all(uploadPromises);
      }
      if (isEditing && editingProject?.imageUrls?.length) {
        imageUrls = [...editingProject.imageUrls, ...imageUrls];
      }
      const projectData = {
        title: title.trim(), brief: brief.trim(),
        details: details.trim(), location: location.trim(),
        imageUrls, sections: sections.length > 0 ? sections : ['recent'],
        status, updatedAt: serverTimestamp()
      };
      if (isEditing && editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), projectData);
        setSuccess("Project updated successfully!");
      } else {
        projectData.createdAt = serverTimestamp();
        await addDoc(collection(db, "projects"), projectData);
        setSuccess("Project created successfully!");
      }
      setProgress(100);
      resetForm();
      setTimeout(() => setProgress(0), 1000);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (!isEditing) setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred. Please try again.");
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'projects', label: 'Add Project', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )},
    { id: 'manage-projects', label: 'Manage Projects', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    )},
    { id: 'sections', label: 'Manage Sections', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
  ];

  return (
    <div className="animate-fade-up">
      {/* Page header */}
      <div className="mb-8">
        <div className="section-label mb-2">Dashboard</div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Admin <span className="gradient-text">Panel</span>
        </h1>
        <p style={{ color: '#475569', fontSize: '14px', marginTop: '6px' }}>
          Manage your portfolio projects and display sections.
        </p>
      </div>

      {/* Pill Tab Navigation */}
      <div className="pill-tab mb-8 flex-wrap gap-1" style={{ display: 'inline-flex' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`pill-tab-item flex items-center gap-2${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Add Project Tab */}
      {activeTab === "projects" && (
        <div className="max-w-2xl">
          <div className="glass-card p-8" style={{ borderRadius: '20px' }}>
            {/* Form header */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9' }}>
                {isEditing ? 'Edit Project' : 'Add New Project'}
              </h2>
              <p style={{ color: '#475569', fontSize: '13px' }}>
                {isEditing ? 'Update the project details below.' : 'Fill in the details to add a new project to the portfolio.'}
              </p>
            </div>

            {/* Toast messages */}
            {error && (
              <div className="toast-error mb-6 animate-slide-down">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="toast-success mb-6 animate-slide-down">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="proj-title" className="form-label">
                  Project Title <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="text" id="proj-title"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="glass-input" placeholder="My Awesome Project" required
                />
              </div>

              {/* Brief */}
              <div>
                <label htmlFor="proj-brief" className="form-label">Brief Description</label>
                <input
                  type="text" id="proj-brief"
                  value={brief} onChange={e => setBrief(e.target.value)}
                  className="glass-input" placeholder="A short one-line summary..."
                />
                <p style={{ color: '#334155', fontSize: '12px', marginTop: '5px' }}>
                  Shown on the project card preview.
                </p>
              </div>

              {/* Details */}
              <div>
                <label htmlFor="proj-details" className="form-label">Project Details</label>
                <textarea
                  id="proj-details" rows={6}
                  value={details} onChange={e => setDetails(e.target.value)}
                  className="glass-input" style={{ resize: 'vertical' }}
                  placeholder="Full project description, technical details, outcomes..."
                />
                <p style={{ color: '#334155', fontSize: '12px', marginTop: '5px' }}>
                  Shown on the project detail page. HTML tags supported.
                </p>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="proj-location" className="form-label">Location</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <input
                    type="text" id="proj-location"
                    value={location} onChange={e => setLocation(e.target.value)}
                    className="glass-input" style={{ paddingLeft: '36px' }}
                    placeholder="e.g., New York, NY"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <div className="flex gap-3 flex-wrap">
                  {['active', 'inactive', 'completed'].map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setStatus(s)}
                      className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                      style={{
                        background: status === s
                          ? s === 'active' ? 'rgba(16,185,129,0.2)' : s === 'inactive' ? 'rgba(148,163,184,0.15)' : 'rgba(20,184,166,0.2)'
                          : 'rgba(255,255,255,0.04)',
                        color: status === s
                          ? s === 'active' ? '#34d399' : s === 'inactive' ? '#94a3b8' : '#5eead4'
                          : '#475569',
                        border: status === s
                          ? s === 'active' ? '1px solid rgba(16,185,129,0.4)' : s === 'inactive' ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(20,184,166,0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              {availableSections.filter(s => s.isActive !== false).length > 0 && (
                <div>
                  <label className="form-label">Project Sections</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSections.filter(s => s.isActive !== false).map(section => {
                      const isChecked = sections.includes(section.id);
                      return (
                        <button
                          key={section.id} type="button"
                          onClick={() => handleSectionChange(section.id, !isChecked)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                          style={{
                            background: isChecked ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                            color: isChecked ? '#34d399' : '#475569',
                            border: isChecked ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {isChecked && '✓ '}{section.name || section.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="form-label">
                  Project Images <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div
                  className={`drag-zone p-6 text-center transition-all${isDragging ? ' active' : ''}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  {files.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3" onClick={e => e.stopPropagation()}>
                      {files.map((file, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden" style={{ height: '90px' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: '#f43f5e', color: '#fff' }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {/* Add more */}
                      <div
                        className="rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                        style={{ height: '90px', border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#475569' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span style={{ color: '#334155', fontSize: '11px' }}>Add more</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{
                          background: isDragging ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                          border: isDragging ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: isDragging ? '#10b981' : '#334155' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p style={{ color: isDragging ? '#10b981' : '#64748b', fontWeight: 500, fontSize: '14px' }}>
                        {isDragging ? 'Drop files here!' : 'Drag & drop images, or click to select'}
                      </p>
                      <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>PNG, JPG, GIF — up to 5MB each</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="file-upload" name="file-upload" type="file"
                    className="sr-only" onChange={handleFileChange} accept="image/*" multiple
                  />
                </div>

                {/* Show existing images when editing */}
                {isEditing && editingProject?.imageUrls?.length > 0 && (
                  <div className="mt-3">
                    <p style={{ color: '#475569', fontSize: '12px', marginBottom: '6px' }}>Current images:</p>
                    <div className="flex gap-2 flex-wrap">
                      {editingProject.imageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt="" className="w-14 h-14 object-cover rounded-lg"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress */}
              {isUploading && (
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { isEditing ? resetForm() : navigate('/'); }}
                  disabled={isUploading}
                  className="btn-ghost flex-1 text-sm"
                >
                  {isEditing ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn-gradient flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : isEditing ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "manage-projects" && <ManageProjects />}
      {activeTab === "sections" && <ManageSections />}
    </div>
  );
}
