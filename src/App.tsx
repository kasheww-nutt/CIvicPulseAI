/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CitizenHome } from './pages/CitizenHome';
import { Missions } from './pages/Missions';
import { ReportIssue } from './pages/ReportIssue';
import { CaseDetail } from './pages/CaseDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { EscalationPacket } from './pages/EscalationPacket';
import { MyCases } from './pages/MyCases';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import React from 'react';

// A helper to redirect logged-in users away from auth pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, dbRole } = useAuth();
  
  // Wait until we know for sure what their role is before deciding where to route them.
  // if loading is true, we haven't even fetched the user yet.
  if (loading) return null;
  
  // If we have a user but no dbRole yet, wait. (AuthContext fetches dbRole asynchronously after setting user).
  if (user && !dbRole) return null;
  
  if (user && dbRole) {
    return <Navigate to={dbRole === 'citizen' ? '/' : '/dashboard'} replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={
              <PublicRoute><Signup /></PublicRoute>
            } />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<CitizenHome />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/cases" element={<MyCases />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/report" element={<ReportIssue />} />
                <Route path="/case/:id" element={<CaseDetail />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/escalation/:id" element={<EscalationPacket />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DemoProvider>
    </AuthProvider>
  );
}
