import { useAuth } from '../../hooks/useAuth.js';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';

const ProtectedRoute = ({ children, requiredRole = null, requireOnboarded = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      // Check role requirements
      if (requiredRole && user.role !== requiredRole) {
        setLocation('/unauthorized');
        return;
      }

      // Check onboarding requirements for students
      if (requireOnboarded && 
          user.role === 'student' && 
          (!user.studentProfile || !user.studentProfile.onboarded)) {
        setLocation('/onboarding');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requireOnboarded, setLocation]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  if (requireOnboarded && 
      user?.role === 'student' && 
      (!user.studentProfile || !user.studentProfile.onboarded)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
