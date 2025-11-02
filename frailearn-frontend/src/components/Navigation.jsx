import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import styles from './Navigation.module.css';

const Navigation = () => {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/curriculum', label: 'Curriculum', icon: '📚' },
    { path: '/bridge-course', label: 'Bridge Course', icon: '🌉' },
    { path: '/flashcards/review', label: 'Flashcards', icon: '🃏' },
    { path: '/stats', label: 'Statistics', icon: '📊' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link to="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🇫🇷</span>
          <span className={styles.logoText}>FrAIlearn</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <div className={styles.navItems}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.userSection}>
            <span className={styles.userName}>Hi, {user?.name}!</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileNavItems}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.mobileNavItem} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            ))}
            <div className={styles.mobileUserSection}>
              <span className={styles.userName}>Hi, {user?.name}!</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;