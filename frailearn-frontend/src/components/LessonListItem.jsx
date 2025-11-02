import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LessonListItem.module.css';

// A simple checkmark SVG to use as a component
const CheckmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const LessonListItem = ({ lesson }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to the specific lesson page (we will build this next)
    navigate(`/lessons/${lesson.id}`);
  };

  return (
    <div className={styles.item} onClick={handleClick}>
      <div className={styles.info}>
        <h4>Lesson {lesson.lessonNumber}: {lesson.title}</h4>
        <p>{lesson.topic}</p>
      </div>
      <div className={`${styles.status} ${lesson.isCompleted ? styles.completed : styles.notCompleted}`}>
        {lesson.isCompleted && <CheckmarkIcon />}
      </div>
    </div>
  );
};

export default LessonListItem;