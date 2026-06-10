import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/lib/ThemeContext"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Schedule from '@/pages/Schedule';
import MyBookings from '@/pages/MyBookings';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Feed from '@/pages/Feed';
import Notices from '@/pages/Notices';
import Profile from '@/pages/Profile';
import Plans from '@/pages/Plans';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import BottomTabs from '@/components/mobile/BottomTabs';

const AnimatedRoute = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
    // Para qualquer outro erro (user_not_registered, etc.), redireciona pro login
    navigateToLogin();
    return null;
  }

  // Render the main app
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<AnimatedRoute><Home /></AnimatedRoute>} />
              <Route path="/aulas" element={<AnimatedRoute><Schedule /></AnimatedRoute>} />
              <Route path="/minhas-reservas" element={<AnimatedRoute><MyBookings /></AnimatedRoute>} />
              <Route path="/feed" element={<AnimatedRoute><Feed /></AnimatedRoute>} />
              <Route path="/recados" element={<AnimatedRoute><Notices /></AnimatedRoute>} />
              <Route path="/admin" element={<AnimatedRoute><AdminDashboard /></AnimatedRoute>} />
              <Route path="/perfil" element={<AnimatedRoute><Profile /></AnimatedRoute>} />
              <Route path="/planos" element={<AnimatedRoute><Plans /></AnimatedRoute>} />
              <Route path="/notificacoes" element={<AnimatedRoute><Notifications /></AnimatedRoute>} />
              <Route path="/configuracoes" element={<AnimatedRoute><Settings /></AnimatedRoute>} />
              <Route path="/sobre" element={<AnimatedRoute><About /></AnimatedRoute>} />
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AnimatePresence>
      <BottomTabs />
    </>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App