import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navigation from './Navigation';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  // If the user is not authenticated, redirect them to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated, render the navigation and child route
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;