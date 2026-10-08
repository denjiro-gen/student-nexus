import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './config/supabase';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKanban from './pages/admin/AdminKanban';
import InstitutionalRegister from './pages/admin/InstitutionalRegister';
import AdminSearch from './pages/admin/AdminSearch';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPortfolios from './pages/admin/AdminPortfolios';
import AdminCompliance from './pages/admin/AdminCompliance';
import AdminReports from './pages/admin/AdminReports';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminCommunications from './pages/admin/AdminCommunications';
import AdminMessages from './pages/admin/AdminMessages';
import AdminRepository from './pages/admin/AdminRepository';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminContactMessages from './pages/admin/AdminContactMessages';
import AdminLogin from './pages/AdminLogin';
import OfficeDashboard from './pages/admin/OfficeDashboard';
import GSODashboard from './pages/office/GSODashboard';
import VenueDashboard from './pages/office/VenueDashboard';
import SupplyDashboard from './pages/office/SupplyDashboard';
import PSODashboard from './pages/office/PSODashboard';

const ADMIN_ROLES  = ['admin', 'superadmin', 'osas_admin', 'gso', 'pso', 'supply', 'venue', 'admin_assistant', 'osas_staff'];
const OFFICE_ROLES = ['gso', 'pso', 'supply', 'venue', 'admin_assistant'];

// ─── Auth Gate ────────────────────────────────────────────────────────────────
// Handles session checking at the App level — single source of truth.
// Shows nothing while loading so there is zero flicker.
function AuthGate({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'unauthed'

  useEffect(() => {
    let mounted = true;

    const check = async (session) => {
      if (!session) {
        if (mounted) setStatus('unauthed');
        return;
      }
      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;
        if (data && ADMIN_ROLES.includes(data.role)) {
          setStatus('authed');
        } else {
          await supabase.auth.signOut();
          setStatus('unauthed');
        }
      } catch {
        if (mounted) setStatus('unauthed');
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => check(session));

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') return null;
  return children(status === 'authed', status === 'office');
}

function RoleDashboard() {
  const [role, setRole] = React.useState(null);
  React.useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('./config/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        setRole(data?.role || 'admin');
      } catch { setRole('admin'); }
    })();
  }, []);
  if (role === null) return null;
  if (role === 'gso') return <GSODashboard />;
  if (role === 'venue') return <VenueDashboard />;
  if (role === 'supply') return <SupplyDashboard />;
  if (role === 'pso') return <PSODashboard />;
  if (OFFICE_ROLES.includes(role)) return <OfficeDashboard />; // admin_assistant fallback
  return <AdminDashboard />;
}

function App() {
  return (
    <Router>
      <AuthGate>
        {(isAuthed) => (
          <Routes>
            {/* Login — redirect to dashboard if already authenticated */}
            <Route
              path="/"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <AdminLogin />}
            />
            <Route
              path="/login"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <AdminLogin />}
            />

            {/* Protected admin routes */}
            {isAuthed ? (
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<RoleDashboard />} />
                <Route path="/kanban" element={<AdminKanban />} />
                <Route path="/register" element={<InstitutionalRegister />} />
                <Route path="/calendar" element={<AdminCalendar />} />
                <Route path="/announcements" element={<AdminAnnouncements />} />
                <Route path="/communications" element={<AdminCommunications />} />
                <Route path="/messages" element={<AdminMessages />} />
                <Route path="/search" element={<AdminSearch />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/portfolios" element={<AdminPortfolios />} />
                <Route path="/compliance" element={<AdminCompliance />} />
                <Route path="/repository" element={<AdminRepository />} />
                <Route path="/reports" element={<AdminReports />} />
                <Route path="/contact-messages" element={<AdminContactMessages />} />
              </Route>
            ) : (
              // Not authenticated — redirect any protected route back to login
              <Route path="*" element={<Navigate to="/" replace />} />
            )}

            <Route path="*" element={<Navigate to={isAuthed ? '/dashboard' : '/'} replace />} />
          </Routes>
        )}
      </AuthGate>
    </Router>
  );
}

export default App;
