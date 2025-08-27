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

    if (requireOnboarded && user.role === 'student') {
      const onboardedProfile = Boolean(user.studentProfile && user.studentProfile.onboarded);
      const onboardedFlag = localStorage.getItem('onboarded') === 'true';
      const onboarded = onboardedProfile || onboardedFlag;
      if (!onboarded) {
        setLocation('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requireOnboarded, setLocation]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) return null;
  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;
  if (requireOnboarded && user.role === 'student' && !(user.studentProfile && user.studentProfile.onboarded)) return null;

  return children;
};

export default ProtectedRoute;
