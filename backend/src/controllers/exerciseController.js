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

    // Enhanced answer validation that handles both French and English
    const normalizeAnswer = (text) => {
      return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/[^a-z\s\-']/g, '') // Keep only letters, spaces, hyphens, and apostrophes
        .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    };

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(exercise.correctAnswer);
    
    // Check for exact match first
    let isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // For translation exercises, also check common alternative answers
    if (!isCorrect && (exercise.type === 'TRANSLATION_EN_TO_FR' || exercise.type === 'TRANSLATION_FR_TO_EN')) {
      // Define common alternative translations
      const alternativeAnswers = {
        'hello': ['bonjour', 'salut'],
        'bonjour': ['hello', 'good morning', 'good day'],
        'goodbye': ['au revoir', 'salut'],
        'au revoir': ['goodbye', 'bye'],
        'thank you': ['merci'],
        'merci': ['thank you', 'thanks'],
        'please': ['s\'il vous plait', 'sil vous plait'],
        'sil vous plait': ['please'],
        'yes': ['oui'],
        'oui': ['yes'],
        'no': ['non'],
        'non': ['no']
      };
      
      const correctAlternatives = alternativeAnswers[normalizedCorrectAnswer] || [];
      isCorrect = correctAlternatives.includes(normalizedUserAnswer);
    }

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
