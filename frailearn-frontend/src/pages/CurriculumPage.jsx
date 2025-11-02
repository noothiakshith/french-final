import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChapters } from '../api/course';
import styles from './CurriculumPage.module.css';

const CurriculumPage = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await getChapters();
        setChapters(response.data);
      } catch (err) {
        setError('Failed to load curriculum.');
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, []);

  if (loading) return <p className={styles.loading}>Loading Curriculum...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  // Group chapters by sections (every 5 chapters)
  const sections = [];
  for (let i = 0; i < chapters.length; i += 5) {
    sections.push(chapters.slice(i, i + 5));
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My French Curriculum</h1>
        <p className={styles.subtitle}>
          Progress through structured chapters. Complete progress tests to unlock new sections.
        </p>
      </header>

      {sections.map((section, sectionIndex) => {
        const sectionNumber = sectionIndex + 1;
        const startChapter = sectionIndex * 5 + 1;
        const endChapter = Math.min(startChapter + 4, chapters.length);
        const completedInSection = section.filter(ch => ch.isCompleted).length;
        const unlockedInSection = section.filter(ch => ch.isUnlocked).length;
        const allSectionCompleted = completedInSection === section.length;
        
        return (
          <section key={sectionIndex} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Section {sectionNumber}: Chapters {startChapter}-{endChapter}
              </h2>
              <div className={styles.sectionProgress}>
                <span className={styles.progressText}>
                  {completedInSection}/{section.length} completed
                </span>
                {allSectionCompleted && (
                  <span className={styles.completedBadge}>✓ Section Complete</span>
                )}
              </div>
            </div>

            <div className={styles.chaptersGrid}>
              {section.map((chapter) => (
                <div 
                  key={chapter.id} 
                  className={`${styles.chapterCard} ${
                    chapter.isCompleted ? styles.completed : 
                    chapter.isUnlocked ? styles.unlocked : styles.locked
                  }`}
                >
                  <div className={styles.chapterHeader}>
                    <h3 className={styles.chapterTitle}>
                      Chapter {chapter.chapterNumber}
                    </h3>
                    <div className={styles.chapterStatus}>
                      {chapter.isCompleted && <span className={styles.statusBadge}>✓</span>}
                      {!chapter.isUnlocked && <span className={styles.lockBadge}>🔒</span>}
                    </div>
                  </div>
                  
                  <h4 className={styles.chapterName}>{chapter.title}</h4>
                  <p className={styles.chapterDescription}>{chapter.description}</p>
                  
                  {chapter.unlockCondition && !chapter.isUnlocked && (
                    <p className={styles.unlockCondition}>
                      🔒 {chapter.unlockCondition}
                    </p>
                  )}
                  
                  <div className={styles.chapterFooter}>
                    {chapter.isUnlocked ? (
                      <Link 
                        to={`/chapters/${chapter.id}`}
                        className={styles.chapterButton}
                      >
                        {chapter.isCompleted ? 'Review' : 'Start Chapter'}
                      </Link>
                    ) : (
                      <button className={styles.lockedButton} disabled>
                        Locked
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {allSectionCompleted && sectionIndex < sections.length - 1 && (
              <div className={styles.progressTestPrompt}>
                <div className={styles.testCard}>
                  <h3>🎯 Progress Test Available</h3>
                  <p>
                    You've completed all chapters in this section! 
                    Take the progress test to unlock the next 5 chapters.
                  </p>
                  <Link 
                    to={`/progress-test/${startChapter}-${endChapter}`}
                    className={styles.testButton}
                  >
                    Take Progress Test
                  </Link>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
};

export default CurriculumPage;