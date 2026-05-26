import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Developers from './pages/Developers';
import Designers from './pages/Designers';
import DesignTeams from './pages/DesignTeams';
import Explore from './pages/Explore';
import Docs from './pages/Docs';
import Pricing from './pages/Pricing';
import VibeCoders from './pages/VibeCoders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function AppInner() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAppPage = location.pathname.startsWith('/projects/');

  return (
    <div className="app">
      {!isAuthPage && !isAppPage && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/designers" element={<Designers />} />
        <Route path="/design-teams" element={<DesignTeams />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/vibe-coders" element={<VibeCoders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected App Routes */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        } />
      </Routes>
      {!isAuthPage && !isAppPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppInner />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
