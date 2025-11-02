import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRemedialChapters, triggerRemedialCheck } from '../api/remedial';
import styles from './RemedialListPage.module.css';

const RemedialListPage = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingForNew, setCheckingForNew] = useState(false);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const response = await getRemedialChapters();
      setChapters(response.data);
    } catch (err) {
      setError('Failed to load remedial chapters.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForNew = async () => {
    setCheckingForNew(true);
    try {
      const response = await triggerRemedialCheck();
      if (response.data.generatedChapters && response.data.generatedChapters.length > 0) {
        // Refresh the list to show new chapters
        await fetchChapters();
      }
    } catch (err) {
      console.error('Failed to check for new remedial chapters:', err);
    } finally {
      setCheckingForNew(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'MICRO': return 'Quick Review (15-30 min)';
      case 'STANDARD': return 'Standard Review (45-60 min)';
      case 'COMPREHENSIVE': return 'Comprehensive Review (90+ min)';
      default: return type;
    }
  };

  if (loading) return <p className={styles.loading}>Loading your remedial chapters...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const incompleteChapters = chapters.filter(ch => !ch.isCompleted);
  const completedChapters = chapters.filter(ch => ch.isCompleted);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/dashboard">Dashboard</Link> / Remedial Review
        </p>
        <h1 className={styles.title}>Remedial Chapters</h1>
        <p className={styles.description}>
          Strengthen your understanding with targeted review chapters based on your learning patterns.
        </p>
        
        <button 
          onClick={handleCheckForNew}
          disabled={checkingForNew}
          className={styles.checkButton}
        >
          {checkingForNew ? 'Checking...' : 'Check for New Reviews'}
        </button>
      </header>

      {incompleteChapters.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pending Reviews</h2>
          <div className={styles.chaptersGrid}>
            {incompleteChapters.map(chapter => (
              <div key={chapter.id} className={styles.chapterCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                  <div 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(chapter.priority) }}
                  >
                    {chapter.priority}
                  </div>
                </div>
                
                <p className={styles.chapterDescription}>{chapter.description}</p>
                
                <div className={styles.chapterMeta}>
                  <span className={styles.grammarPoint}>📚 {chapter.grammarPoint}</span>
                  <span className={styles.type}>{getTypeLabel(chapter.remedialType)}</span>
                </div>

                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${chapter.completionPercentage}%` }}
                  ></div>
                </div>
                <p className={styles.progressText}>
                  {chapter.completionPercentage}% complete
                </p>

                <div className={styles.cardActions}>
                  <Link 
                    to={`/remedial/${chapter.id}`}
                    className={`${styles.actionButton} ${styles.primary}`}
                  >
                    {chapter.completionPercentage > 0 ? 'Continue' : 'Start Review'}
                  </Link>
                  {chapter.isRequired && (
                    <span className={styles.requiredBadge}>Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedChapters.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Completed Reviews</h2>
          <div className={styles.chaptersGrid}>
            {completedChapters.map(chapter => (
              <div key={chapter.id} className={`${styles.chapterCard} ${styles.completed}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                  <div className={styles.completedBadge}>✓ Complete</div>
                </div>
                
                <p className={styles.chapterDescription}>{chapter.description}</p>
                
                <div className={styles.chapterMeta}>
                  <span className={styles.grammarPoint}>📚 {chapter.grammarPoint}</span>
                  <span className={styles.completedDate}>
                    Completed {new Date(chapter.completedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <Link 
                    to={`/remedial/${chapter.id}`}
                    className={`${styles.actionButton} ${styles.secondary}`}
                  >
                    Review Again
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {chapters.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No Remedial Chapters Yet</h2>
          <p>
            Remedial chapters are automatically generated based on your learning patterns and mistakes. 
            Keep practicing, and we'll create targeted reviews to help strengthen your weak areas!
          </p>
          <button 
            onClick={handleCheckForNew}
            disabled={checkingForNew}
            className={styles.checkButton}
          >
            {checkingForNew ? 'Checking...' : 'Check for Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RemedialListPage;