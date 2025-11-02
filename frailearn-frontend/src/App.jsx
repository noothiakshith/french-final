import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import api from './api';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (location.pathname === '/' && isAuthenticated) {
        setIsCheckingOnboarding(true);
        try {
          // Check if user has completed onboarding
          const response = await api.get('/auth/me');
          const user = response.data;
          
          // If user has chapters in their database, they've completed onboarding
          // Also check if they've skipped test or taken placement test as fallback
          const hasCompletedOnboarding = user.hasChapters || user.hasSkippedTest || user.placementTestScore !== null;
          
          if (hasCompletedOnboarding) {
            navigate('/dashboard');
          } else {
            navigate('/level-select');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          navigate('/level-select'); // Fallback to level select
        } finally {
          setIsCheckingOnboarding(false);
        }
      } else if (location.pathname === '/' && !isAuthenticated) {
        navigate('/login');
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, navigate, location.pathname]);

  if (isCheckingOnboarding) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>;
  }

  return null; // This component is for logic only, it doesn't render UI
}

export default App;