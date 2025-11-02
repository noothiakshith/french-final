import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapterDetails } from '../api/course';
import LessonListItem from '../components/LessonListItem';
import styles from './ChapterDetailPage.module.css';

const ChapterDetailPage = () => {
  const { chapterId } = useParams(); // Gets the ':chapterId' from the URL
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        const response = await getChapterDetails(chapterId);
        setChapter(response.data);
      } catch (err) {
        setError('Failed to load this chapter. It might be locked or does not exist.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId]); // Re-run this effect if the chapterId in the URL changes

  if (loading) {
    return <p className={styles.loading}>Loading Chapter...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!chapter) {
    return <p className={styles.error}>Chapter not found.</p>;
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <p className={styles.breadcrumb}><Link to="/dashboard">My Curriculum</Link> / Chapter {chapter.chapterNumber}</p>
        <h1 className={styles.title}>{chapter.title}</h1>
        <p className={styles.description}>{chapter.description}</p>
      </header>

      <h2 className={styles.lessonsHeader}>Lessons</h2>
      <div>
        {chapter.lessons && chapter.lessons.length > 0 ? (
          chapter.lessons.map(lesson => (
            <LessonListItem key={lesson.id} lesson={lesson} />
          ))
        ) : (
          <p>No lessons found in this chapter.</p>
        )}
      </div>
    </main>
  );
};

export default ChapterDetailPage;