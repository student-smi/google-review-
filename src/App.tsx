import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerFlowPage } from './pages/customer/CustomerFlowPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy-load non-customer routes for sub-300ms mobile instant render
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage').then(m => ({ default: m.OverviewPage })));
const BusinessesPage = lazy(() => import('./pages/dashboard/BusinessesPage').then(m => ({ default: m.BusinessesPage })));
const QrStudioPage = lazy(() => import('./pages/dashboard/QrStudioPage').then(m => ({ default: m.QrStudioPage })));
const ReviewsRepliesPage = lazy(() => import('./pages/dashboard/ReviewsRepliesPage').then(m => ({ default: m.ReviewsRepliesPage })));
const TeamPermissionsPage = lazy(() => import('./pages/dashboard/TeamPermissionsPage').then(m => ({ default: m.TeamPermissionsPage })));
const PackageBillingPage = lazy(() => import('./pages/dashboard/PackageBillingPage').then(m => ({ default: m.PackageBillingPage })));
const KeywordManagementPage = lazy(() => import('./pages/dashboard/KeywordManagementPage').then(m => ({ default: m.KeywordManagementPage })));
const GooglePostsPage = lazy(() => import('./pages/dashboard/GooglePostsPage').then(m => ({ default: m.GooglePostsPage })));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const LocalSeoPage = lazy(() => import('./pages/dashboard/LocalSeoPage').then(m => ({ default: m.LocalSeoPage })));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
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
            <Route path="branches" element={<BusinessesPage />} />
            <Route path="qr" element={<QrStudioPage />} />
            <Route path="media" element={<Navigate to="/dashboard" replace />} />
            <Route path="replies" element={<ReviewsRepliesPage />} />
            <Route path="ai-replies" element={<ReviewsRepliesPage />} />
            <Route path="customer-requests" element={<ReviewsRepliesPage />} />
            <Route path="team" element={<TeamPermissionsPage />} />
            <Route path="billing" element={<PackageBillingPage />} />
            <Route path="keywords" element={<KeywordManagementPage />} />
            <Route path="posts" element={<GooglePostsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="local-seo" element={<LocalSeoPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Super Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* Customer Mobile Flow (Directly loaded, no lazy delay) */}
          <Route path="/r/:code" element={<CustomerFlowPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
