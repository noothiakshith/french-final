import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRemedialChapter } from '../api/remedial';
import RemedialExercise from '../components/RemedialExercise';
import styles from './RemedialChapterPage.module.css';

const RemedialChapterPage = () => {
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
        const response = await getRemedialChapter(chapterId);
        setChapter(response.data);
        
        // Initialize correct answers from already completed exercises
        const completedExercises = response.data.exercises
          ?.filter(ex => ex.isCorrect)
          ?.map(ex => ex.id) || [];
        setCorrectAnswers(new Set(completedExercises));
      } catch (err) {
        setError('Failed to load this remedial chapter.');
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

  if (loading) return <p className={styles.loading}>Loading Remedial Chapter...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  const totalExercises = chapter?.exercises?.length || 0;
  const completedExercises = correctAnswers.size;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link to="/dashboard">Dashboard</Link> / Remedial Review
        </p>
        <h1 className={styles.title}>Remedial Chapter: {chapter.topic}</h1>
        <p className={styles.description}>
          Let's review and strengthen your understanding of this topic.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Review Material</h2>
        <div className={styles.content}>
          <p>{chapter.explanation || 'Review the exercises below to strengthen your understanding.'}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Practice Exercises ({completedExercises} / {totalExercises} complete)
        </h2>
        <div>
          {chapter.exercises?.map(exercise => (
            <RemedialExercise 
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
            <h2>Remedial Chapter Complete!</h2>
            <p>Excellent work! You've successfully reviewed this topic and strengthened your understanding.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className={styles.modalButton}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default RemedialChapterPage;