import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdminUser } from '@/lib/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const location = useLocation();
  const authed = isAuthenticated();

  if (!authed) {
    // Redirect unauthenticated visitors to login, preserving intended path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdminUser()) {
    // Non-admin trying to access admin restricted route
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : null;
}
