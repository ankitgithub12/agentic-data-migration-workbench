import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetail } from './pages/ProjectDetail';
import { PlanReview } from './pages/PlanReview';
import { RunDetail } from './pages/RunDetail';
import { QuarantineView } from './pages/QuarantineView';
import { HistoryView } from './pages/HistoryView';
import { RunsList } from './pages/RunsList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Dashboard />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/projects/:id/plans/:planId" element={<PlanReview />} />
                <Route path="/runs" element={<RunsList />} />
                <Route path="/runs/:id" element={<RunDetail />} />
                <Route path="/runs/:id/quarantine" element={<QuarantineView />} />
                <Route path="/history" element={<HistoryView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
