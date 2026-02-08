import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import DonorPage from './pages/DonorPage';
import ConsumerPage from './pages/ConsumerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrgPage from './pages/OrgPage';
import ActivityPage from './pages/ActivityPage'; // Import ActivityPage
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext'; // Import ChatContext
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { AnimatePresence } from 'framer-motion';
import ChatWindow from './components/ChatWindow';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

// Navbar Wrapper to handle conditional rendering
const NavbarWithConditionalRender = () => {
  const location = useLocation();
  // Hide Navbar on Login and Register pages
  const hideNavbarRoutes = ['/login', '/register'];
  if (hideNavbarRoutes.includes(location.pathname)) {
    return null;
  }
  return <Navbar />;
};

// Global Alerts Component
const GlobalAlerts = () => {
  const { user } = useAuth();

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('priceUpdate', (data) => {
      toast("Price Drop Alert! 📉", {
        icon: '⚡',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    socket.on('missionUpdate', (missions) => {
      if (user?.role === 'organization' && missions.length > 0) {
        toast("New Rescue Mission Detected! 🚚", {
          icon: '🚨',
          duration: 5000
        });
      }
    });

    return () => socket.disconnect();
  }, [user]); // Re-run if user logs in/out

  return <Toaster position="top-right" toastOptions={{ className: 'font-bold' }} />;
};

// Separate component for the Global Chat Overlay to use the hook
const GlobalChatOverlay = () => {
  const { activeChat, setActiveChat } = useChat();

  return (
    <AnimatePresence>
      {activeChat && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1500]" onClick={() => setActiveChat(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ChatWindow listingId={activeChat} onClose={() => setActiveChat(null)} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <GlobalAlerts />
          <div className="min-h-screen bg-white">
            <Navbar />
            <GlobalChatOverlay />
            <Routes>
              <Route path="/" element={<ConsumerPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/donor" element={
                <ProtectedRoute allowedRoles={['donor', 'organization']}>
                  <DonorPage />
                </ProtectedRoute>
              } />
              <Route path="/org" element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <OrgPage />
                </ProtectedRoute>
              } />
              <Route path="/consumer" element={<ConsumerPage />} />
              <Route path="/activity" element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
