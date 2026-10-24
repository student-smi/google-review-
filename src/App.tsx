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
import { MediaLibraryPage } from './pages/dashboard/MediaLibraryPage';
import { BusinessesPage } from './pages/dashboard/BusinessesPage';
import { CustomerFlowPage } from './pages/customer/CustomerFlowPage';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Pages */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* Redirect old design route */}
        <Route path="/design" element={<Navigate to="/dashboard" replace />} />

        {/* Guided Owner Onboarding (Protected) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage onComplete={() => {}} />
            </ProtectedRoute>
          }
        />

        {/* Owner Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="qr" element={<QrStudioPage />} />
          <Route path="media" element={<MediaLibraryPage />} />
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
