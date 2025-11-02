import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRemedialChapters, triggerRemedialCheck } from '../api/remedial';
import api from '../api/index';
import styles from './RemedialManagementPage.module.css';

const RemedialManagementPage = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingForNew, setCheckingForNew] = useState(false);
  const [forceGenerating, setForceGenerating] = useState(false);
  const [forceTopic, setForceTopic] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [chaptersResponse, statsResponse] = await Promise.all([
        getRemedialChapters(),
        fetchRemedialStats()
      ]);
      
      setChapters(chaptersResponse.data);
      setStats(statsResponse);
    } catch (err) {
      setError('Failed to load remedial data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRemedialStats = async () => {
    try {
      // Get user mistakes for stats
      const response = await api.get('/users/stats');
      return response.data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      return null;
    }
  };

  const handleCheckForNew = async () => {
    setCheckingForNew(true);
    try {
      const response = await triggerRemedialCheck();
      if (response.data.generatedChapters && response.data.generatedChapters.length > 0) {
        await fetchData(); // Refresh data
        alert(`Generated ${response.data.generatedChapters.length} new remedial chapters!`);
      } else {
        alert('No new remedial chapters needed at this time.');
      }
    } catch (err) {
      console.error('Failed to check for new remedial chapters:', err);
      alert('Failed to check for new chapters. Please try again.');
    } finally {
      setCheckingForNew(false);
    }
  };

  const handleForceGenerate = async () => {
    if (!forceTopic.trim()) {
      alert('Please enter a topic name.');
      return;
    }

    setForceGenerating(true);
    try {
      const response = await api.post('/remedial/force-generate', { topic: forceTopic });
      await fetchData(); // Refresh data
      alert(`Force generated remedial chapter for: ${forceTopic}`);
      setForceTopic('');
    } catch (err) {
      console.error('Failed to force generate:', err);
      alert('Failed to generate remedial chapter. Please try again.');
    } finally {
      setForceGenerating(false);
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

  if (loading) return <p className={styles.loading}>Loading remedial management...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const incompleteChapters = chapters.filter(ch => !ch.isCompleted);
  const completedChapters = chapters.filter(ch => ch.isCompleted);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/dashboard">Dashboard</Link> / Remedial Management
        </p>
        <h1 className={styles.title}>Remedial Learning Management</h1>
        <p className={styles.description}>
          Manage your personalized review chapters and track your learning progress.
        </p>
      </header>

      {/* Stats Overview */}
      <section className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Chapters</h3>
            <p className={styles.statNumber}>{chapters.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Pending Reviews</h3>
            <p className={styles.statNumber}>{incompleteChapters.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Completed</h3>
            <p className={styles.statNumber}>{completedChapters.length}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Success Rate</h3>
            <p className={styles.statNumber}>
              {chapters.length > 0 ? Math.round((completedChapters.length / chapters.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </section>

      {/* Management Actions */}
      <section className={styles.actionsSection}>
        <h2 className={styles.sectionTitle}>Actions</h2>
        <div className={styles.actionsGrid}>
          <div className={styles.actionCard}>
            <h3>Check for New Reviews</h3>
            <p>Analyze your recent mistakes and generate new remedial chapters if needed.</p>
            <button 
              onClick={handleCheckForNew}
              disabled={checkingForNew}
              className={styles.actionButton}
            >
              {checkingForNew ? 'Checking...' : 'Check Now'}
            </button>
          </div>
          
          <div className={styles.actionCard}>
            <h3>Force Generate (Testing)</h3>
            <p>Create a remedial chapter for a specific topic for testing purposes.</p>
            <div className={styles.forceGenerateForm}>
              <input
                type="text"
                value={forceTopic}
                onChange={(e) => setForceTopic(e.target.value)}
                placeholder="Enter topic (e.g., 'French Articles')"
                className={styles.topicInput}
              />
              <button 
                onClick={handleForceGenerate}
                disabled={forceGenerating || !forceTopic.trim()}
                className={styles.actionButton}
              >
                {forceGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Chapters */}
      {incompleteChapters.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pending Reviews ({incompleteChapters.length})</h2>
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
                  <span className={styles.exercises}>🎯 {chapter.totalExercises} exercises</span>
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
                  {chapter.blocksProgress && (
                    <span className={styles.blocksBadge}>Blocks Progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Chapters */}
      {completedChapters.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Completed Reviews ({completedChapters.length})</h2>
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

      {/* Empty State */}
      {chapters.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No Remedial Chapters Yet</h2>
          <p>
            Remedial chapters are automatically generated every 3 hours based on your learning patterns. 
            Keep practicing, and we'll create targeted reviews to help strengthen your weak areas!
          </p>
          <div className={styles.emptyActions}>
            <button 
              onClick={handleCheckForNew}
              disabled={checkingForNew}
              className={styles.actionButton}
            >
              {checkingForNew ? 'Checking...' : 'Check for Reviews Now'}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <h3>🤖 Automatic Generation</h3>
        <p>
          The system automatically checks for new remedial chapters every 3 hours. 
          Chapters are generated when you have 2 or more mistakes in the same topic area.
        </p>
      </div>
    </div>
  );
};

export default RemedialManagementPage;