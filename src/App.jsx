import React from 'react';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import './App.css';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { TabsProvider } from './context/TabsContext';

import Navigation from './components/Navigation';
import ProjectTabs from './components/ProjectTabs';
import Footer from './components/Footer';
import Home from './pages/Home';
import Developers from './pages/Developers';
import Designers from './pages/Designers';
import DesignTeams from './pages/DesignTeams';
import Explore from './pages/Explore';
import Docs from './pages/Docs';
import Learn from './pages/Learn';
import Pricing from './pages/Pricing';
import VibeCoders from './pages/VibeCoders';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProjectPage from './pages/NewProjectPage';
import Generator from './pages/Generator';
import SharedProject from './pages/SharedProject';
import TemplatePage from './pages/TemplatePage';
import ForgotPassword from './pages/ForgotPassword';

/**
 * One ProjectDetail per project, rather than one shared between them.
 *
 * Router keeps the same element mounted when only `:id` changes, so switching projects from
 * the tab strip left every piece of that page's state behind: the previous project's tokens
 * and components, and in Forge its conversation and the page it had generated. The Tokens
 * tab would report the project you came from until you reloaded.
 *
 * Keying on the id makes the switch a remount, which is what a different project is. It
 * costs the in-flight state of the project you are leaving — a Forge transcript does not
 * survive going away and coming back — but that state was being shown against the wrong
 * project before, which is worse than losing it.
 */
const KeyedProjectDetail = () => {
  const { id } = useParams();
  return <ProjectDetail key={id} />;
};

// Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function AppInner() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';
  const isAppPage = location.pathname.startsWith('/projects/');
  // The workspace is the list plus everything under it, so the strip stays put while moving
  // between projects and the list — note '/projects' alone does not match isAppPage.
  const isWorkspace = location.pathname === '/projects' || isAppPage;

  return (
    <div className="app">
      {!isAuthPage && !isAppPage && <Navigation />}
      {isWorkspace && <ProjectTabs />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/designers" element={<Designers />} />
        <Route path="/design-teams" element={<DesignTeams />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/:id" element={<SharedProject />} />
        {/* Templates have an address so the gallery can link to them, and so a card
            can open one in a new tab without costing you the screen you were on. */}
        <Route path="/templates/:id" element={<TemplatePage />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/vibe-coders" element={<VibeCoders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected App Routes */}
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/new" element={
          <ProtectedRoute>
            <NewProjectPage />
          </ProtectedRoute>
        } />
        <Route path="/projects/generate" element={
          <ProtectedRoute>
            <Generator />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <KeyedProjectDetail />
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
        <TabsProvider>
          <AppInner />
        </TabsProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
