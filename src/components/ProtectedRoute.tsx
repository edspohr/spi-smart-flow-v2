import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore, { UserRole } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Guest users are always redirected to the pending activation screen,
  // regardless of which protected route they try to access.
  if (user.role === 'guest') {
    return <Navigate to="/pendiente" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
