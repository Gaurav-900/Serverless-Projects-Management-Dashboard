import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, auth, FUNCTIONS_URL } from "../firebase";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function EditProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [project, setProject] = useState(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [sections, setSections] = useState(["recent"]);
  const [status, setStatus] = useState("active");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableSections, setAvailableSections] = useState([{id: 'recent', name: 'Recent Projects'}]);
  const [tags, setTags] = useState([]);
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");

  // Fetch project data and sections
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (!projectDoc.exists()) {
          setError("Project not found");
          return;
        }
        
        const data = projectDoc.data();
        setProject({ id: projectDoc.id, ...data });
        setTitle(data.title || "");
        setBrief(data.brief || "");
        setDetails(data.details || "");
        setLocation(data.location || "");
        setExistingImages(data.imageUrls || []);
        setSections(data.sections || ["recent"]);
        setStatus(data.status || "active");
        setTags(data.tags || []);
        setGithubLink(data.githubLink || "");
        setLiveLink(data.liveLink || "");
        
        // Fetch available sections
        const idToken = await auth.currentUser?.getIdToken();
        const sectionsRes = await fetch(`${FUNCTIONS_URL}/getSections`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${idToken}` }
        });
        
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setAvailableSections(sectionsData.sections || [{id: 'recent', name: 'Recent Projects'}]);
        } else {
          console.error("Failed to fetch sections");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load project data");
      }
    };

    fetchData();
  }, [projectId]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    
    selectedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl, index) => {
    try {
      // Delete from storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      // Update state
      const updatedImages = [...existingImages];
      updatedImages.splice(index, 1);
      setExistingImages(updatedImages);
      
      // Update in Firestore
      await updateDoc(doc(db, "projects", projectId), {
        imageUrls: updatedImages
      });
      
      setSuccess("Image removed successfully");
    } catch (error) {
      console.error("Error removing image:", error);
      setError("Failed to remove image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!title.trim() || !brief.trim()) {
      setError("Title and brief description are required");
      return;
    }
    
    if (existingImages.length === 0 && files.length === 0) {
      setError("Please add at least one image");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload new files
      const newImageUrls = [];
      
      for (const file of files) {
        const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progress);
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              newImageUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }
      
      // Combine existing and new image URLs
      const allImageUrls = [...existingImages, ...newImageUrls];
      
      // Update project in Firestore
      await updateDoc(doc(db, "projects", projectId), {
        title: title.trim(),
        brief: brief.trim(),
        details: details.trim(),
        location: location.trim(),
        imageUrls: allImageUrls,
        sections: sections.length > 0 ? sections : ['recent'],
        status,
        updatedAt: new Date()
      });
      
      setSuccess("Project updated successfully!");
      setFiles([]);
      setProgress(0);
      
      // Redirect back to manage projects after a short delay
      setTimeout(() => {
        navigate('/admin/manage-projects');
      }, 1500);
      
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="brief" className="block text-sm font-medium text-gray-700">
              Brief Description (Shown on project cards) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="A short, one-line description of the project..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">This will be shown under the project title on the main projects page.</p>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700">
              Project Details (Shown on project detail page)
            </label>
            <textarea
              id="details"
              rows={8}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Detailed information about the project that will be shown on the project detail page..."
            />
            <p className="mt-1 text-xs text-gray-500">You can use HTML tags for formatting.</p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., New York, NY"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                />
                <span className="ml-2 text-gray-700">Active</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                />
                <span className="ml-2 text-gray-700">Inactive</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sections
            </label>
            <div className="space-y-2">
              {availableSections
                .filter(section => section.isActive !== false)
                .map((section) => (
                  <div key={section.id} className="flex items-center">
                    <input
                      id={`section-${section.id}`}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={sections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSections([...sections, section.id]);
                        } else {
                          setSections(sections.filter(s => s !== section.id));
                        }
                      }}
                    />
                    <label htmlFor={`section-${section.id}`} className="ml-2 block text-sm text-gray-700">
                      {section.name || section.id}
                    </label>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Images
            </label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Project ${index + 1}`}
                        className="h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(imageUrl, index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Images */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {existingImages.length > 0 ? 'Add More Images' : 'Upload Images'}
              </h4>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Uploading...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Preview of new files to be uploaded */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Images to Upload</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="h-32 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isUploading}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
