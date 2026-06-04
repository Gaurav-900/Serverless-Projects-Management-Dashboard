import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Projects from './pages/Projects';
import Admin from './pages/Admin';
import Login from './pages/Login';
import EditProject from './pages/EditProject';
import ProjectDetail from './pages/ProjectDetail';
import { auth } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav
      className="glass-nav sticky top-0 z-50 transition-all duration-300"
      style={{ boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" id="nav-logo">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}
            >
              P
            </div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="gradient-text">Project management Admin dashboard</span>
              <span style={{ color: '#94a3b8' }}> CMS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/') && location.pathname === '/'} label="Projects" id="nav-projects" />
            <NavLink to="/admin" active={isActive('/admin')} label="Admin" id="nav-admin" />
          </div>

          {/* Sign Out */}
          <div className="hidden md:flex items-center gap-3">
            <button
              id="nav-signout"
              onClick={handleSignOut}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-slide-down">
            <MobileNavLink to="/" label="Projects" onClick={() => setMobileOpen(false)} />
            <MobileNavLink to="/admin" label="Admin" onClick={() => setMobileOpen(false)} />
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium mt-2"
              style={{ background: 'rgba(244,63,94,0.1)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, label, id }) {
  return (
    <Link
      id={id}
      to={to}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
      style={{
        color: active ? '#10b981' : '#94a3b8',
        background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
        border: active ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = '#f1f5f9';
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 rounded-lg text-sm font-medium"
      style={{ color: '#94a3b8' }}
    >
      {label}
    </Link>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-6"
          style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', boxShadow: '0 0 40px rgba(16,185,129,0.4)', animation: 'pulse-glow 2s ease-in-out infinite' }}
        >
          P
        </div>
        <div className="glow-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {user && <NavBar />}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={user ? <Projects /> : <Navigate to="/login" />} />
              <Route path="/projects/:projectId" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
              <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />}>
                <Route path="manage" element={<Admin activeTab="manage-projects" />} />
                <Route path="sections" element={<Admin activeTab="sections" />} />
              </Route>
              <Route path="/project/edit/:projectId" element={user ? <EditProject /> : <Navigate to="/login" />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;