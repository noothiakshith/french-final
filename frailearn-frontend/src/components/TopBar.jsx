import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getProgressTestRecommendation } from '../api/user';
import styles from './TopBar.module.css';

const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [progressTestRec, setProgressTestRec] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchProgressTest = async () => {
      try {
        const response = await getProgressTestRecommendation();
        setProgressTestRec(response.data);
      } catch (error) {
        console.error('Error fetching progress test recommendation:', error);
      }
    };

    fetchProgressTest();
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/bridge-course') return 'Bridge Course';
    if (path.startsWith('/bridge-course/chapters/')) return 'Bridge Chapter';
    if (path.startsWith('/chapters/')) return 'Chapter';
    if (path.startsWith('/lessons/')) return 'Lesson';
    if (path.startsWith('/remedial/')) return 'Remedial Chapter';
    if (path === '/flashcards/review') return 'Flashcard Review';
    if (path.startsWith('/progress-test/')) return 'Progress Test';
    if (path === '/bridge-final-test') return 'Bridge Final Test';
    if (path === '/stats') return 'Statistics';
    return 'FrAIlearn';
  };

  const notifications = [];
  if (progressTestRec?.recommended) {
    notifications.push({
      id: 'progress-test',
      type: 'info',
      title: 'Progress Test Available',
      message: progressTestRec.message,
      action: () => navigate(`/progress-test/${progressTestRec.chapterRange}`)
    });
  }

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <button onClick={onMenuClick} className={styles.menuButton}>
          ☰
        </button>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>

      <div className={styles.right}>
        {/* Notifications */}
        <div className={styles.notificationContainer}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`${styles.notificationButton} ${notifications.length > 0 ? styles.hasNotifications : ''}`}
          >
            🔔
            {notifications.length > 0 && (
              <span className={styles.notificationBadge}>{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h3>Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
              </div>
              <div className={styles.notificationList}>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={styles.notificationItem}>
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      {notification.action && (
                        <button 
                          onClick={() => {
                            notification.action();
                            setShowNotifications(false);
                          }}
                          className={styles.notificationAction}
                        >
                          Take Action
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.noNotifications}>No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className={styles.userName}>{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;