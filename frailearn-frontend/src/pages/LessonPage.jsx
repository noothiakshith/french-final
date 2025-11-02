import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLessonDetails } from '../api/lessons';
import Exercise from '../components/Exercise';
import styles from './LessonPage.module.css';

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await getLessonDetails(lessonId);
        setLesson(response.data);
      } catch (err) {
        setError('Failed to load this lesson.');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  const handleCorrectAnswer = (exerciseId, isLessonComplete) => {
    setCorrectAnswers(prev => new Set(prev).add(exerciseId));
    if (isLessonComplete) {
      setShowCompletionModal(true);
    }
  };

  if (loading) return <p className={styles.loading}>Loading Lesson...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/dashboard">Curriculum</Link> / 
          <Link to={`/chapters/${lesson.chapter.id}`}> Chapter {lesson.chapter.chapterNumber}</Link>
        </p>
        <h1 className={styles.title}>{lesson.title}</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Explanation</h2>
        <div className={styles.content}>
          <p>{lesson.content?.explanation || 'No explanation available.'}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Exercises ({correctAnswers.size} / {lesson.exercises.length} complete)
        </h2>
        <div>
          {lesson.exercises.map(ex => (
            <Exercise key={ex.id} exercise={ex} onCorrectAnswer={handleCorrectAnswer} />
          ))}
        </div>
      </section>

      {showCompletionModal && (
        <div className={styles.completionModal}>
          <div className={styles.modalContent}>
            <h2>Lesson Complete!</h2>
            <p>Great work! You've mastered this topic.</p>
            <button 
              onClick={() => navigate(`/chapters/${lesson.chapter.id}`)}
              className={styles.modalButton}
            >
              Back to Chapter
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default LessonPage;