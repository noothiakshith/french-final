import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBridgeCourse, startBridgeFinalTest } from '../api/bridgeCourse';
import styles from './BridgeCoursePage.module.css';

const BridgeCoursePage = () => {
  const [bridgeCourse, setBridgeCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingFinalTest, setStartingFinalTest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBridgeCourse = async () => {
      try {
        const response = await getBridgeCourse();
        setBridgeCourse(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('no-bridge-course');
        } else {
          setError('Failed to load bridge course data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBridgeCourse();
  }, []);

  const handleStartFinalTest = async () => {
    setStartingFinalTest(true);
    try {
      const response = await startBridgeFinalTest();
      navigate('/bridge-final-test', { state: { testData: response.data } });
    } catch (err) {
      console.error('Failed to start final test:', err);
      setError('Failed to start the final test. Please try again.');
    } finally {
      setStartingFinalTest(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading Bridge Course...</p>;
  
  if (error === 'no-bridge-course') {
    return (
      <main className={styles.container}>
        <div className={styles.noBridgeCourse}>
          <h1 className={styles.title}>No Bridge Course Available</h1>
          <div className={styles.explanation}>
            <p>You don't have a bridge course assigned. This typically means:</p>
            <ul>
              <li>You chose the <strong>Beginner</strong> level and are following the regular curriculum</li>
              <li>You scored below 50% on the placement test and were assigned to the Beginner path</li>
              <li>You haven't taken a placement test yet</li>
            </ul>
            <p>
              Bridge courses are only created for users who score 50% or higher on the placement test 
              and need targeted lessons to fill knowledge gaps before advancing to intermediate content.
            </p>
          </div>
          <div className={styles.actions}>
            <Link to="/dashboard" className={styles.dashboardButton}>
              Go to Dashboard
            </Link>
            <Link to="/curriculum" className={styles.curriculumButton}>
              View Your Curriculum
            </Link>
          </div>
        </div>
      </main>
    );
  }
  
  if (error) return <p className={styles.error}>{error}</p>;

  const allChaptersComplete = bridgeCourse?.chapters?.every(chapter => chapter.isCompleted) || false;
  const completedChapters = bridgeCourse?.chapters?.filter(chapter => chapter.isCompleted).length || 0;
  const totalChapters = bridgeCourse?.chapters?.length || 0;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bridge Course</h1>
        <p className={styles.subtitle}>
          Complete these focused lessons to bridge any knowledge gaps before starting your main curriculum.
        </p>
        <div className={styles.progress}>
          <span className={styles.progressText}>
            Progress: {completedChapters} / {totalChapters} chapters completed
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      <section className={styles.chaptersSection}>
        <h2 className={styles.sectionTitle}>Chapters</h2>
        <div className={styles.chaptersGrid}>
          {bridgeCourse?.chapters?.map((chapter) => (
            <div key={chapter.id} className={`${styles.chapterCard} ${chapter.isCompleted ? styles.completed : ''}`}>
              <div className={styles.chapterHeader}>
                <h3 className={styles.chapterTitle}>
                  Chapter {chapter.chapterNumber}: {chapter.title}
                </h3>
                {chapter.isCompleted && (
                  <span className={styles.completedBadge}>✓ Complete</span>
                )}
              </div>
              <p className={styles.chapterDescription}>{chapter.description}</p>
              <div className={styles.chapterFooter}>
                <Link 
                  to={`/bridge-course/chapters/${chapter.id}`}
                  className={styles.chapterButton}
                >
                  {chapter.isCompleted ? 'Review' : 'Start Chapter'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {allChaptersComplete && (
        <section className={styles.finalTestSection}>
          <div className={styles.finalTestCard}>
            <h2 className={styles.finalTestTitle}>🎉 Bridge Course Complete!</h2>
            <p className={styles.finalTestDescription}>
              Excellent work! You've completed all bridge course chapters. 
              Take the final test to demonstrate your mastery and unlock your main curriculum.
            </p>
            <button 
              onClick={handleStartFinalTest}
              disabled={startingFinalTest}
              className={styles.finalTestButton}
            >
              {startingFinalTest ? 'Starting Test...' : 'Start Final Test'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
};

export default BridgeCoursePage;