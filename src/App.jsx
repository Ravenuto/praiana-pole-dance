import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/lib/ThemeContext"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import StudioInfo from '@/pages/StudioInfo';

const AuthenticatedApp = () => {
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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/aulas" element={<Schedule />} />
          <Route path="/minhas-reservas" element={<MyBookings />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/recados" element={<Notices />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/notificacoes" element={<Notifications />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/studio" element={<StudioInfo />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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