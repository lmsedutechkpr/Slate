import { useAuth } from '../../hooks/useAuth.js';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';

const ProtectedRoute = ({ children, requiredRole = null, requireOnboarded = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (!user) return;

    if (requiredRole && user.role !== requiredRole) {
      setLocation('/unauthorized');
      return;
    }

    // Check onboarding requirement for students
    if (requireOnboarded && user.role === 'student') {
      if (!user.completedOnboarding) {
        setLocation('/onboarding');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requireOnboarded, setLocation]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) return null;
  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;
  
  // Final onboarding check before rendering
  if (requireOnboarded && user.role === 'student' && !user.completedOnboarding) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
