import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getDashboard, getUserStats } from '../api/user';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, statsRes] = await Promise.all([
          getDashboard().catch(() => ({ data: null })),
          getUserStats().catch(() => ({ data: null }))
        ]);
        setDashboard(dashboardRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const navigationItems = [
    {
      icon: '🏠',
      label: 'Dashboard',
      path: '/dashboard',
      active: isActive('/dashboard')
    },
    {
      icon: '📚',
      label: 'Curriculum',
      path: '/curriculum',
      active: isActive('/curriculum')
    },
    {
      icon: '🎯',
      label: 'Bridge Course',
      path: '/bridge-course',
      active: isActive('/bridge-course'),
      show: dashboard?.nextAction?.type?.includes('BRIDGE') || stats?.progress?.level === 'BRIDGE'
    },
    {
      icon: '🔄',
      label: 'Remedial',
      path: '/remedial',
      active: isActive('/remedial'),
      show: true // Always show remedial link
    },
    {
      icon: '🃏',
      label: 'Flashcards',
      path: '/flashcards/review',
      active: isActive('/flashcards'),
      badge: dashboard?.nextAction?.type === 'FLASHCARD_REVIEW' ? dashboard.nextAction.details?.dueCount : null
    },
    {
      icon: '📊',
      label: 'Progress Tests',
      path: '/progress-test',
      active: isActive('/progress-test')
    },
    {
      icon: '📈',
      label: 'Statistics',
      path: '/stats',
      active: isActive('/stats')
    }
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          {!isCollapsed && <span className={styles.logoText}>FrAIlearn</span>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={styles.collapseButton}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        {!isCollapsed && (
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name || 'User'}</p>
            <p className={styles.userLevel}>{stats?.progress?.level || 'Beginner'}</p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {!isCollapsed && stats && (
        <div className={styles.progressOverview}>
          <h3 className={styles.sectionTitle}>Quick Stats</h3>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🔥</span>
            <span className={styles.statText}>{stats.streak?.current || 0} day streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>✅</span>
            <span className={styles.statText}>{stats.completion?.lessons?.completed || 0} lessons</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🎯</span>
            <span className={styles.statText}>{stats.completion?.exercises?.accuracy || 0}% accuracy</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.navigation}>
        {!isCollapsed && <h3 className={styles.sectionTitle}>Navigation</h3>}
        <ul className={styles.navList}>
          {navigationItems.map((item) => {
            if (item.show === false) return null;
            
            return (
              <li key={item.path} className={styles.navItem}>
                <Link 
                  to={item.path}
                  className={`${styles.navLink} ${item.active ? styles.active : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge && (
                        <span className={styles.badge}>{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Next Action */}
      {!isCollapsed && dashboard?.nextAction && (
        <div className={styles.nextAction}>
          <h3 className={styles.sectionTitle}>Up Next</h3>
          <div className={styles.nextActionCard}>
            <p className={styles.nextActionText}>
              {dashboard.nextAction.message}
            </p>
            <Link 
              to={getNextActionPath(dashboard.nextAction)}
              className={styles.nextActionButton}
            >
              Continue
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <span className={styles.navIcon}>🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

// Helper function to get the correct path for next actions
const getNextActionPath = (nextAction) => {
  const { type, details } = nextAction;
  
  switch (type) {
    case 'BRIDGE_CHAPTER':
      return `/bridge-course/chapters/${details.chapterId}`;
    case 'BRIDGE_FINAL_TEST':
      return '/bridge-course';
    case 'REMEDIAL_CHAPTER':
      return `/remedial/${details.remedialChapterId}`;
    case 'FLASHCARD_REVIEW':
      return '/flashcards/review';
    case 'LESSON':
      return `/lessons/${details.lessonId}`;
    case 'PROGRESS_TEST':
      return `/progress-test/${details.chapterRange}`;
    default:
      return '/dashboard';
  }
};

export default Sidebar;