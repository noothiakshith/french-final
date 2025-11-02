import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBridgeChapter } from '../api/bridgeCourse';
import BridgeExercise from '../components/BridgeExercise';
import styles from './BridgeChapterDetailPage.module.css';

const BridgeChapterDetailPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const response = await getBridgeChapter(chapterId);
        setChapter(response.data);
        
        // Initialize correct answers from already completed exercises
        const completedExercises = response.data.exercises
          .filter(ex => ex.isCorrect)
          .map(ex => ex.id);
        setCorrectAnswers(new Set(completedExercises));
      } catch (err) {
        setError('Failed to load this chapter.');
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [chapterId]);

  const handleCorrectAnswer = (exerciseId, isChapterComplete) => {
    setCorrectAnswers(prev => new Set(prev).add(exerciseId));
    if (isChapterComplete) {
      setShowCompletionModal(true);
    }
  };

  if (loading) return <p className={styles.loading}>Loading Chapter...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const totalExercises = chapter?.exercises?.length || 0;
  const completedExercises = correctAnswers.size;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/bridge-course">Bridge Course</Link> / Chapter {chapter.chapterNumber}
        </p>
        <h1 className={styles.title}>{chapter.title}</h1>
        <p className={styles.description}>{chapter.description}</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Explanation</h2>
        <div className={styles.content}>
          <p>{chapter.explanation || 'No explanation available.'}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Exercises ({completedExercises} / {totalExercises} complete)
        </h2>
        <div>
          {chapter.exercises?.map(exercise => (
            <BridgeExercise 
              key={exercise.id} 
              exercise={exercise} 
              onCorrectAnswer={handleCorrectAnswer}
              isAlreadyCorrect={correctAnswers.has(exercise.id)}
            />
          ))}
        </div>
      </section>

      {showCompletionModal && (
        <div className={styles.completionModal}>
          <div className={styles.modalContent}>
            <h2>Chapter Complete!</h2>
            <p>Excellent work! You've mastered this chapter.</p>
            <button 
              onClick={() => navigate('/bridge-course')}
              className={styles.modalButton}
            >
              Back to Bridge Course
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default BridgeChapterDetailPage;