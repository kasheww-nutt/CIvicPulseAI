/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import { AppLayout } from './components/layout/AppLayout';
import { CitizenHome } from './pages/CitizenHome';
import { Missions } from './pages/Missions';
import { ReportIssue } from './pages/ReportIssue';
import { CaseDetail } from './pages/CaseDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { EscalationPacket } from './pages/EscalationPacket';

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<CitizenHome />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/escalation/:id" element={<EscalationPacket />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
}
