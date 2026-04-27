import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-bg-dark">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupChat />} />
            <Route path="/messages" element={<DirectMessages />} />
            <Route path="/messages/:convId" element={<Conversation />} />
            <Route path="/events" element={<Events />} />
            <Route path="/members" element={<Members />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/search" element={<Search />} />
            <Route path="/spaces" element={<Spaces />} />
             <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function Footer() {
  return (
    <footer className="bg-bg-dark text-gray-400 py-16 px-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center text-[10px] font-bold text-primary">C</div>
          <span className="text-xl font-bold text-white tracking-tighter">CaaS</span>
        </div>
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
          © 2026 Community as a Service. Protocol v1.0
        </div>
        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors text-gray-400">Privacy</a>
          <a href="#" className="hover:text-white transition-colors text-gray-400">Terms</a>
          <a href="#" className="hover:text-white transition-colors text-gray-400">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
