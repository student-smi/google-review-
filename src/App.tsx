import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { QrStudioPage } from './pages/dashboard/QrStudioPage';
import { ReviewsRepliesPage } from './pages/dashboard/ReviewsRepliesPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { LocalSeoPage } from './pages/dashboard/LocalSeoPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { CustomerFlowPage } from './pages/customer/CustomerFlowPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Living Style Guide */}
        <Route path="/design" element={<DesignSystemPage />} />

        {/* Guided Owner Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage onComplete={() => {}} />} />

        {/* Owner Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="qr" element={<QrStudioPage />} />
          <Route path="replies" element={<ReviewsRepliesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="local-seo" element={<LocalSeoPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Customer Mobile Flow */}
        <Route path="/r/:code" element={<CustomerFlowPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
