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

      {/* Introduction Section */}
      {lesson.content?.introduction && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Introduction</h2>
          <div className={styles.content}>
            <p>{lesson.content.introduction}</p>
          </div>
        </section>
      )}

      {/* Explanation Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Explanation</h2>
        <div className={styles.content}>
          <p>{lesson.content?.explanation || 'No explanation available.'}</p>
        </div>
      </section>

      {/* Key Points Section */}
      {lesson.content?.keyPoints && lesson.content.keyPoints.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Key Points</h2>
          <div className={styles.content}>
            <ul className={styles.keyPointsList}>
              {lesson.content.keyPoints.map((point, index) => (
                <li key={index} className={styles.keyPoint}>{point}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Grammar Points Section */}
      {lesson.grammarPoints?.points && lesson.grammarPoints.points.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Grammar Points</h2>
          <div className={styles.content}>
            <ul className={styles.grammarList}>
              {lesson.grammarPoints.points.map((point, index) => (
                <li key={index} className={styles.grammarPoint}>{point}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Vocabulary Section */}
      {lesson.vocabulary?.words && lesson.vocabulary.words.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Vocabulary</h2>
          <div className={styles.content}>
            <div className={styles.vocabularyGrid}>
              {lesson.vocabulary.words.map((word, index) => {
                // Handle both string format "word - translation" and object format {fr: "", en: ""}
                let french, english;
                if (typeof word === 'string') {
                  const parts = word.split(' - ');
                  french = parts[0];
                  english = parts[1] || '';
                } else if (word.fr && word.en) {
                  french = word.fr;
                  english = word.en;
                } else {
                  return null;
                }
                
                return (
                  <div key={index} className={styles.vocabularyItem}>
                    <span className={styles.french}>{french}</span>
                    <span className={styles.english}>{english}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Examples Section */}
      {lesson.examples?.pairs && lesson.examples.pairs.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Examples</h2>
          <div className={styles.content}>
            <div className={styles.examplesList}>
              {lesson.examples.pairs.map((example, index) => (
                <div key={index} className={styles.exampleItem}>
                  <div className={styles.frenchExample}>{example.fr}</div>
                  <div className={styles.englishExample}>{example.en}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common Mistakes Section */}
      {lesson.content?.commonMistakes && lesson.content.commonMistakes.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Common Mistakes to Avoid</h2>
          <div className={styles.content}>
            <ul className={styles.mistakesList}>
              {lesson.content.commonMistakes.map((mistake, index) => (
                <li key={index} className={styles.mistake}>⚠️ {mistake}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Exercises Section */}
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