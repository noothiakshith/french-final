import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyChapters } from '../api/course';
import { getDashboard, getProgressTestRecommendation } from '../api/user';
import ChapterCard from '../components/ChapterCard';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [chapters, setChapters] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [progressTestRec, setProgressTestRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Check for test results from navigation state
    if (location.state?.testResult) {
      setTestResult(location.state.testResult);
    }

    const fetchData = async () => {
      try {
        const [chaptersResponse, dashboardResponse, progressTestResponse] = await Promise.all([
          getMyChapters().catch(() => ({ data: [] })),
          getDashboard().catch(() => ({ data: null })),
          getProgressTestRecommendation().catch(() => ({ data: null }))
        ]);

        setChapters(chaptersResponse.data);
        setDashboard(dashboardResponse.data);
        setProgressTestRec(progressTestResponse.data);
      } catch (err) {
        setError('Failed to load your dashboard. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.state]);



  const handleNextAction = () => {
    if (!dashboard?.nextAction) return;

    const { type, details } = dashboard.nextAction;
    
    switch (type) {
      case 'BRIDGE_CHAPTER':
        navigate(`/bridge-course/chapters/${details.chapterId}`);
        break;
      case 'BRIDGE_FINAL_TEST':
        navigate('/bridge-course');
        break;
      case 'REMEDIAL_CHAPTER':
        navigate(`/remedial/${details.remedialChapterId}`);
        break;
      case 'FLASHCARD_REVIEW':
        navigate('/flashcards/review');
        break;
      case 'LESSON':
        navigate(`/lessons/${details.lessonId}`);
        break;
      case 'PROGRESS_TEST':
        navigate(`/progress-test/${details.chapterRange}`);
        break;
      default:
        console.log('Unknown next action type:', type);
    }
  };

  const handleProgressTest = () => {
    if (progressTestRec?.recommended) {
      navigate(`/progress-test/${progressTestRec.chapterRange}`);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading your course...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.name}!</h1>
      </header>

      {/* Test Result Notification */}
      {testResult && (
        <div className={`${styles.notification} ${testResult.passed ? styles.success : styles.warning}`}>
          <h3>{testResult.type === 'bridge-final' ? 'Bridge Course Final Test' : 'Progress Test'} Result</h3>
          <p>{testResult.message}</p>
          <p>Score: {testResult.score}%</p>
          <button onClick={() => setTestResult(null)} className={styles.closeButton}>×</button>
        </div>
      )}

      {/* Progress Overview */}
      {dashboard && (
        <section className={styles.progressSection}>
          <h2>Your Progress</h2>
          <div className={styles.progressCards}>
            <div className={styles.progressCard}>
              <h3>Current Level</h3>
              <p className={styles.level}>{dashboard.progress.level}</p>
            </div>
            <div className={styles.progressCard}>
              <h3>Lessons Completed</h3>
              <p className={styles.stat}>{dashboard.progress.totalLessonsCompleted}</p>
            </div>
            <div className={styles.progressCard}>
              <h3>Accuracy</h3>
              <p className={styles.stat}>{dashboard.progress.overallAccuracy}%</p>
            </div>
            <div className={styles.progressCard}>
              <h3>Current Streak</h3>
              <p className={styles.stat}>{dashboard.streak.current} days</p>
            </div>
          </div>
        </section>
      )}

      {/* Next Action */}
      {dashboard?.nextAction && (
        <section className={styles.nextActionSection}>
          <h2>What's Next?</h2>
          <div className={styles.nextActionCard}>
            <p className={styles.nextActionMessage}>{dashboard.nextAction.message}</p>
            <button onClick={handleNextAction} className={styles.nextActionButton}>
              Continue Learning
            </button>
          </div>
        </section>
      )}

      {/* Progress Test Recommendation */}
      {progressTestRec?.recommended && (
        <section className={styles.testRecommendation}>
          <h2>🎯 Progress Test Available!</h2>
          <div className={styles.testCard}>
            <p>{progressTestRec.message}</p>
            <button onClick={handleProgressTest} className={styles.testButton}>
              Take Progress Test
            </button>
          </div>
        </section>
      )}

      {/* Chapters Grid */}
      <section className={styles.chaptersSection}>
        <h2>Your Curriculum</h2>
        {chapters.length > 0 ? (
          <div className={styles.chaptersGrid}>
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No chapters found. You might need to complete your placement test or bridge course first.</p>
            <button onClick={() => navigate('/level-select')} className={styles.setupButton}>
              Set Up Your Course
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;