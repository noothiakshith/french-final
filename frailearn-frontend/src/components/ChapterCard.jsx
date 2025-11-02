import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChapterCard.module.css';

const ChapterCard = ({ chapter }) => {
  const navigate = useNavigate();

  const getStatus = () => {
    if (!chapter.isUnlocked) {
      return <span className={`${styles.status} ${styles.statusLocked}`}>Locked</span>;
    }
    if (chapter.isCompleted) {
      return <span className={`${styles.status} ${styles.statusCompleted}`}>Completed</span>;
    }
    return <span className={`${styles.status} ${styles.statusInProgress}`}>In Progress</span>;
  };

  const handleClick = () => {
    if (chapter.isUnlocked) {
      // Navigate to the chapter details page (we will create this later)
      navigate(`/chapters/${chapter.id}`);
    }
  };
  
  const cardClasses = `${styles.card} ${chapter.isUnlocked ? styles.unlocked : styles.locked}`;

  return (
    <div className={cardClasses} onClick={handleClick}>
      <h3>Chapter {chapter.chapterNumber}: {chapter.title}</h3>
      <p className={styles.description}>{chapter.description}</p>
      <div>{getStatus()}</div>
    </div>
  );
};

export default ChapterCard;