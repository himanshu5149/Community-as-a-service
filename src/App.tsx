import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import PageLayout from './components/PageLayout';
import { ParticleBackground } from './components/ParticleBackground';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import Marketplace from './pages/Marketplace';
import Developer from './pages/Developer';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import GroupChat from './pages/GroupChat';
import DirectMessages from './pages/DirectMessages';
import Conversation from './pages/Conversation';
import Events from './pages/Events';
import Members from './pages/Members';
import Admin from './pages/Admin';
import Search from './pages/Search';
import Spaces from './pages/Spaces';
import SpaceRoom from './pages/SpaceRoom';
import Explore from './pages/Explore';
import Billing from './pages/Billing';
import NotFound from './pages/NotFound';

// New Pages
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AIGroup from './pages/AIGroup';
import AIAgent from './pages/AIAgent';
import AiManagement from './pages/AiManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';

function AnimatedRoutes() {
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to onboarding if authenticated but not finished
  const isOnboarding = location.pathname === '/onboarding';
  if (user && profile && !profile.onboardingCompleted && !isOnboarding) {
     return <Navigate to="/onboarding" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/" element={<PageLayout>{user ? <Dashboard /> : <Home />}</PageLayout>} />
        <Route path="/login" element={<PageLayout><Login /></PageLayout>} />
        <Route path="/signup" element={<PageLayout><Signup /></PageLayout>} />
        <Route path="/onboarding" element={<ProtectedRoute><PageLayout><Onboarding /></PageLayout></ProtectedRoute>} />
        <Route path="/how-it-works" element={<PageLayout><HowItWorks /></PageLayout>} />
        <Route path="/blog" element={<PageLayout><Blog /></PageLayout>} />
        <Route path="/pricing" element={<PageLayout><Pricing /></PageLayout>} />
        <Route path="/marketplace" element={<PageLayout><Marketplace /></PageLayout>} />
        <Route path="/developer" element={<PageLayout><Developer /></PageLayout>} />
        <Route path="/settings" element={<ProtectedRoute><PageLayout><Settings /></PageLayout></ProtectedRoute>} />
        <Route path="/about" element={<PageLayout><About /></PageLayout>} />
        <Route path="/contact" element={<PageLayout><Contact /></PageLayout>} />
        <Route path="/groups" element={<PageLayout><Groups /></PageLayout>} />
        <Route path="/members" element={<PageLayout><Members /></PageLayout>} />
        <Route path="/spaces" element={<PageLayout><Spaces /></PageLayout>} />
        <Route path="/explore" element={<PageLayout><Explore /></PageLayout>} />
        <Route path="/billing" element={<ProtectedRoute><PageLayout><Billing /></PageLayout></ProtectedRoute>} />
        <Route path="/ai" element={<PageLayout><AIGroup /></PageLayout>} />
        
        {/* Auth Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
        <Route path="/groups/:groupId" element={<ProtectedRoute><PageLayout><GroupChat /></PageLayout></ProtectedRoute>} />
        <Route path="/groups/:groupId/channels/:channelId" element={<ProtectedRoute><PageLayout><GroupChat /></PageLayout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><PageLayout><DirectMessages /></PageLayout></ProtectedRoute>} />
        <Route path="/messages/:convId" element={<ProtectedRoute><PageLayout><Conversation /></PageLayout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><PageLayout><Events /></PageLayout></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><PageLayout><Profile /></PageLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PageLayout><Notifications /></PageLayout></ProtectedRoute>} />
        <Route path="/spaces/:spaceId" element={<ProtectedRoute><PageLayout><SpaceRoom /></PageLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><PageLayout><Search /></PageLayout></ProtectedRoute>} />
        
        {/* AI Protected Routes */}
        <Route path="/ai/:agentId" element={<ProtectedRoute><PageLayout><AIAgent /></PageLayout></ProtectedRoute>} />
        <Route path="/ai-nexus" element={<ProtectedRoute><PageLayout><AiManagement /></PageLayout></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><PageLayout><Admin /></PageLayout></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<PageLayout><NotFound /></PageLayout>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <ParticleBackground />
            <div className="relative min-h-screen flex flex-col font-sans selection:bg-primary/30 selection:text-text-main">
              <Navbar />
              <main className="flex-grow">
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
