import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore, { UserRole } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuthStore();

  if (loading) {
     return null; // or a spinner, but AppLayout usually handles the main loading state
  }

  if (!user) {
    // In a real app, redirect to /login
    // For this prototype, we might want to redirect to a dev login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
