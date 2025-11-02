import prisma from '../utils/prisma.js';
import { updateProgressOnLessonComplete } from '../services/progressService.js';
import { initializeFlashcardsForCompletedLesson } from '../services/flashcardService.js';
import { performAdaptiveLearningChecks } from '../services/adaptiveLearningService.js';

export const submitExercise = async (req, res) => {
  const { exerciseId } = req.params;
  const userId = req.user.id;
  const { userAnswer } = req.body;

  if (typeof userAnswer !== 'string') {
    return res.status(400).json({ message: "A valid 'userAnswer' string is required." });
  }

  try {
    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
      include: { lesson: { include: { chapter: true } } },
    });

    if (!exercise)
      return res.status(404).json({ message: 'Exercise not found or unauthorized.' });

    const isCorrect =
      userAnswer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();

    await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        userAnswer,
        isCorrect,
        attempts: { increment: 1 },
        attemptedAt: new Date(),
      },
    });

    if (!isCorrect) {
      await prisma.mistake.create({
        data: {
          userId,
          sourceType: 'EXERCISE',
          sourceId: exerciseId,
          chapterNumber: exercise.lesson.chapter.chapterNumber,
          lessonNumber: exercise.lesson.lessonNumber,
          level: exercise.lesson.chapter.level,
          grammarPoint: exercise.grammarPoint,
          topic: exercise.topic,
          mistakeType: 'INCORRECT_ANSWER',
          question: exercise.question,
          correctAnswer: exercise.correctAnswer,
          userAnswer,
          errorCategory: 'GRAMMAR',
          severity: 'MINOR',
        },
      });
    } else {
      // Check for lesson completion
      const { lessonId } = exercise;
      const total = await prisma.exercise.count({ where: { lessonId } });
      const correct = await prisma.exercise.count({ where: { lessonId, isCorrect: true } });

      if (total > 0 && correct === total) {
        await prisma.lesson.update({
          where: { id: lessonId },
          data: { isCompleted: true, completedAt: new Date() },
        });

        await updateProgressOnLessonComplete(userId);
        
        // Generate flashcards for the completed lesson
        await initializeFlashcardsForCompletedLesson(userId, lessonId);
        
        // Perform adaptive learning checks
        await performAdaptiveLearningChecks(userId, 'EXERCISE');
        
        console.log(`✅ Lesson ${lessonId} completed for user ${userId}.`);

        return res.status(200).json({
          isCorrect,
          correctAnswer: exercise.correctAnswer,
          lessonCompleted: true,
        });
      }
    }

    res.status(200).json({
      isCorrect,
      correctAnswer: exercise.correctAnswer,
      lessonCompleted: false,
    });
  } catch (error) {
    console.error(`❌ Error submitting exercise ${exerciseId}:`, error);
    res.status(500).json({ message: 'Server error while submitting exercise.' });
  }
};
