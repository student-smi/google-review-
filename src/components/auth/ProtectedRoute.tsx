import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const authed = isAuthenticated();

  if (!authed) {
    // Redirect unauthenticated visitors to login, preserving intended path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
}
