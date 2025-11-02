import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserStats } from '../api/user';
import styles from './StatsPage.module.css';

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getUserStats();
        setStats(response.data);
      } catch (err) {
        setError('Failed to load your statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p className={styles.loading}>Loading your statistics...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
        <h1 className={styles.title}>Your Learning Statistics</h1>
      </header>

      {stats && (
        <>
          {/* Progress Overview */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Progress Overview</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Current Level</h3>
                <p className={styles.level}>{stats.progress.level}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Current Chapter</h3>
                <p className={styles.stat}>{stats.progress.currentChapter}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Current Lesson</h3>
                <p className={styles.stat}>{stats.progress.currentLesson}</p>
              </div>
              <div className={styles.statCard}>
                <h3>Overall Accuracy</h3>
                <p className={styles.stat}>{stats.progress.overallAccuracy}%</p>
              </div>
            </div>
          </section>

          {/* Completion Stats */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Completion Statistics</h2>
            <div className={styles.completionGrid}>
              <div className={styles.completionCard}>
                <h3>Chapters</h3>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${stats.completion.chapters.percentage}%` }}
                  />
                </div>
                <p>{stats.completion.chapters.completed} / {stats.completion.chapters.total} completed</p>
                <span className={styles.percentage}>{stats.completion.chapters.percentage}%</span>
              </div>
              
              <div className={styles.completionCard}>
                <h3>Lessons</h3>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${stats.completion.lessons.percentage}%` }}
                  />
                </div>
                <p>{stats.completion.lessons.completed} / {stats.completion.lessons.total} completed</p>
                <span className={styles.percentage}>{stats.completion.lessons.percentage}%</span>
              </div>
              
              <div className={styles.completionCard}>
                <h3>Exercises</h3>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${stats.completion.exercises.accuracy}%` }}
                  />
                </div>
                <p>{stats.completion.exercises.correct} / {stats.completion.exercises.attempted} correct</p>
                <span className={styles.percentage}>{stats.completion.exercises.accuracy}%</span>
              </div>
            </div>
          </section>

          {/* Streak Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Learning Streak</h2>
            <div className={styles.streakGrid}>
              <div className={styles.streakCard}>
                <h3>Current Streak</h3>
                <p className={styles.streakNumber}>{stats.streak.current}</p>
                <span>days</span>
              </div>
              <div className={styles.streakCard}>
                <h3>Longest Streak</h3>
                <p className={styles.streakNumber}>{stats.streak.longest}</p>
                <span>days</span>
              </div>
              <div className={styles.streakCard}>
                <h3>Last Activity</h3>
                <p className={styles.lastActivity}>
                  {stats.streak.lastActivity 
                    ? new Date(stats.streak.lastActivity).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </section>

          {/* Test Performance */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Test Performance</h2>
            <div className={styles.testGrid}>
              <div className={styles.testCard}>
                <h3>Tests Taken</h3>
                <p className={styles.testStat}>{stats.tests.taken}</p>
              </div>
              <div className={styles.testCard}>
                <h3>Average Score</h3>
                <p className={styles.testStat}>{stats.tests.averageScore}%</p>
              </div>
              <div className={styles.testCard}>
                <h3>Test Types</h3>
                <div className={styles.testTypes}>
                  {Object.entries(stats.tests.byType).map(([type, count]) => (
                    <div key={type} className={styles.testType}>
                      <span>{type.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Flashcard Stats */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Flashcard Review</h2>
            <div className={styles.flashcardGrid}>
              <div className={styles.flashcardCard}>
                <h3>Total Flashcards</h3>
                <p className={styles.flashcardStat}>{stats.flashcards.total}</p>
              </div>
              <div className={styles.flashcardCard}>
                <h3>Average Reviews</h3>
                <p className={styles.flashcardStat}>{stats.flashcards.averageReviews}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default StatsPage;