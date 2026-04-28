import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';

// Pages
import Home from './pages/Home';
import Groups from './pages/Groups';
import HowItWorks from './pages/HowItWorks';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
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
import NotFound from './pages/NotFound';

// New Pages
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AIGroup from './pages/AIGroup';
import AIAgent from './pages/AIAgent';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-bg-dark font-sans selection:bg-primary/30 selection:text-white">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Auth Protected Routes */}
                <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                <Route path="/groups/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
                <Route path="/messages/:convId" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
                <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/spaces" element={<ProtectedRoute><Spaces /></ProtectedRoute>} />
                <Route path="/spaces/:spaceId" element={<ProtectedRoute><SpaceRoom /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                
                {/* AI Protected Routes */}
                <Route path="/ai" element={<ProtectedRoute><AIGroup /></ProtectedRoute>} />
                <Route path="/ai/:agentId" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
