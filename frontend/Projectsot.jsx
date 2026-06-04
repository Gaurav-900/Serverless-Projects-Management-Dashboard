import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../src/firebase/firebase';
import Footer from '../src/components/ui/Footer.jsx';
import Navbar from '../src/components/ui/Navbar.jsx';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [projectsBySection, setProjectsBySection] = useState({});
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  // Fetch and listen for projects
  useEffect(() => {
    console.log('Setting up projects listener...');
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          console.log('Projects snapshot received');
          const allProjects = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data({ serverTimestamps: 'estimate' })
          }));
          
          console.log('All projects:', allProjects);
          setProjects(allProjects);

          // Group projects by sections with backward compatibility
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
              
              // Apply the filter to all projects
              grouped[section.id] = allProjects.filter(projectFilter);
              
              // Sort projects within each section by creation date (newest first)
              if (grouped[section.id]) {
                grouped[section.id].sort((a, b) => {
                  const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                  const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                  return bDate - aDate;
                });
              }
            }
          });

          console.log('Final grouped projects:', grouped);
          setProjectsBySection(grouped);
        } catch (error) {
          console.error('Error processing projects:', error);
        } finally {
          setLoading(false);
        }
      }, 
      (error) => {
        console.error('Error in projects listener:', error);
        setLoading(false);
      }
    );
    
    return () => {
      console.log('Cleaning up projects listener');
      unsubscribe();
    };
  }, [sections]);

  // Fetch sections configuration
  useEffect(() => {
    let isMounted = true;
    
    const fetchSections = async () => {
      console.log('Starting to fetch sections...');
      try {
        console.log('Fetching sections...');
        const idToken = await auth.currentUser?.getIdToken();
        console.log('Auth state:', auth.currentUser ? 'User authenticated' : 'No user');
        
        const response = await fetch(
          'https://us-central1-admin-project-page.cloudfunctions.net/getSections', 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Sections API response status:', response.status);
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          console.log('Sections data received:', data);
          const sections = Array.isArray(data.sections) ? data.sections : [];
          
          if (sections.length > 0) {
            const validSections = sections.map(section => ({
              id: section.id || '',
              name: section.name || `Section ${section.id}`,
              order: typeof section.order === 'number' ? section.order : 999,
              isActive: section.isActive !== false
            }));
            console.log('Validated sections:', validSections);
            setSections(validSections);
          } else {
            const defaultSections = [
              { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
              { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
            ];
            console.log('No sections found, using defaults:', defaultSections);
            setSections(defaultSections);
          }
        } else {
          console.error('Failed to fetch sections:', await response.text());
          const defaultSections = [
            { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
            { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
          ];
          console.log('Using fallback sections:', defaultSections);
          setSections(defaultSections);
        }
      } catch (error) {
        console.error('Error in fetchSections:', error);
        if (!isMounted) return;
        
        setSections([
          { id: 'featured', name: 'Featured Projects', order: 0, isActive: true },
          { id: 'recent', name: 'Recent Projects', order: 1, isActive: true }
        ]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchSections();
    
    return () => {
      isMounted = false;
      console.log('Cleaning up sections fetch');
    };
  }, []);

  const heroBg = {
    backgroundImage:
      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD4ZKUDVOi5HKJxiYEsA90buwD-eKvlOja4d_Ct02TbaGdJCXgiioc1Ju5ZidwOBXtm18Jph9lLrNZQ-CiSWWPY_o4v1pPcT_AhsXjoGlyNi55BKkp_OjevupLi2ez_iB_CKEdC0drZny0n5fOaCjWDm46j9aF3kXTa0-rcPS_IMLVkGrMcBKEmwTePh5mXO-7tWoeG1V2c0Wvi")'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderProjectCard = (project) => {
    const projectImage = project.imageUrls?.[0] || project.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';
    const projectDate = project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'N/A';
    
    return (
      <div key={project.id} className="bg-white dark:bg-background-dark rounded-xl shadow-lg overflow-hidden group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={projectImage} 
            alt={project.title || 'Project Image'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button 
              className="bg-primary text-white text-sm font-bold py-2 px-4 rounded-lg"
              onClick={() => window.location.href = `/projects/${project.id}`}
            >
              View Details
            </button>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {project.title || 'Untitled Project'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description || 'No description available.'}
          </p>
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            {project.capacity && <span>{project.capacity}</span>}
            {project.location && <span>{project.location}</span>}
            <span>{projectDate}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      <div className="relative flex min-h-screen w-full flex-col">
        <Navbar />

        <main className="flex-grow">
          <div className="relative h-[50vh] min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
            <div className="absolute inset-0 bg-cover bg-center" style={heroBg}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-primary/30"></div>
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-center text-center text-white">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter">Our Projects</h1>
              <p className="mt-4 max-w-2xl text-lg sm:text-xl opacity-90">
                {sections.length > 0 
                  ? sections[0].description || 'Explore our Project management Admin dashboard of successful projects.'
                  : 'Explore our Project management Admin dashboard of successful projects.'
                }
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {sections
              .filter(section => section.isActive)
              .sort((a, b) => (a.order || 999) - (b.order || 999))
              .map(section => {
                const sectionProjects = projectsBySection[section.id] || [];
                
                if (sectionProjects.length === 0) return null;
                
                return (
                  <section key={section.id} className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                      {section.name}
                    </h2>
                    
                    {section.id === 'featured' && sectionProjects.length > 0 ? (
                      <div className="relative overflow-hidden mb-8">
                        <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
                          {sectionProjects.slice(0, 3).map(project => (
                            <div key={project.id} className="snap-start shrink-0 w-full sm:w-1/2 lg:w-1/3">
                              <div className="flex flex-col h-full bg-white dark:bg-background-dark rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl">
                                <img 
                                  src={project.imageUrls?.[0] || project.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image'} 
                                  alt={project.title || 'Project Image'} 
                                  className="w-full h-48 object-cover"
                                />
                                <div className="p-6 flex flex-col flex-grow">
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                    {project.title || 'Untitled Project'}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow line-clamp-2">
                                    {project.description || 'No description available.'}
                                  </p>
                                  <button 
                                    className="mt-4 text-sm font-bold text-primary hover:underline text-left"
                                    onClick={() => window.location.href = `/projects/${project.id}`}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sectionProjects.map(project => renderProjectCard(project))}
                      </div>
                    )}
                  </section>
                );
              })}

            {projects.length === 0 && !loading && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6M12 16v4M12 16l-4 4m4-4l4 4"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
                <p className="mt-1 text-gray-500">Check back later for new projects.</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Projects;