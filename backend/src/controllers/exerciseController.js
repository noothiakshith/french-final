import prisma from '../utils/prisma.js';
import { updateProgressOnLessonComplete, checkForLevelProgression } from '../services/progressService.js';
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
        .replace(/[^a-z0-9\s\-']/g, '') // Keep only letters, numbers, spaces, hyphens, and apostrophes
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

        // Check if this lesson completion makes the chapter complete
        const chapterData = await prisma.lesson.findUnique({
          where: { id: lessonId },
          select: { 
            chapterId: true,
            chapter: {
              select: { id: true, isCompleted: true }
            }
          }
        });

        if (chapterData && !chapterData.chapter.isCompleted) {
          const chapterLessonsTotal = await prisma.lesson.count({ 
            where: { chapterId: chapterData.chapterId } 
          });
          const chapterLessonsCompleted = await prisma.lesson.count({ 
            where: { chapterId: chapterData.chapterId, isCompleted: true } 
          });

          if (chapterLessonsTotal > 0 && chapterLessonsCompleted === chapterLessonsTotal) {
            await prisma.chapter.update({
              where: { id: chapterData.chapterId },
              data: { isCompleted: true, completedAt: new Date() }
            });
            console.log(`✅ Chapter ${chapterData.chapterId} completed for user ${userId}.`);
          }
        }

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

/**
 * Submit a test attempt and handle level progression
 */
export const submitTest = async (req, res) => {
  const userId = req.user.id;
  const { testType, level, chapterRange, answers, timeSpent } = req.body;

  try {
    // Validate required fields
    if (!testType || !level || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        message: 'testType, level, and answers array are required.' 
      });
    }

    // For this fix, we'll focus on bridge course final tests
    if (testType !== 'BRIDGE_FINAL' && testType !== 'FINAL_TEST') {
      return res.status(400).json({ 
        message: 'Only BRIDGE_FINAL and FINAL_TEST are supported for level progression.' 
      });
    }

    // Calculate score (simplified - in real app you'd have actual questions)
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= 80;

    // Create test attempt record
    const testAttempt = await prisma.testAttempt.create({
      data: {
        userId,
        testType,
        level,
        chapterRange: chapterRange || 'FINAL',
        title: `${level} ${testType === 'BRIDGE_FINAL' ? 'Bridge Course Final' : 'Final'} Test`,
        questions: { questions: answers.map(a => ({ question: a.question, correctAnswer: a.correctAnswer })) },
        totalQuestions,
        passingScore: 80,
        correctAnswers,
        score,
        passed,
        timeSpent: timeSpent || 0,
        userAnswers: { answers },
        topicBreakdown: {},
        weakAreas: { areas: [] },
        strongAreas: { areas: [] },
        completedAt: new Date()
      }
    });

    // Update bridge course if this is a bridge final test
    if (testType === 'BRIDGE_FINAL') {
      const bridgeCourse = await prisma.bridgeCourse.findUnique({
        where: { userId }
      });

      if (bridgeCourse) {
        await prisma.bridgeCourse.update({
          where: { userId },
          data: {
            finalTestScore: score,
            isCompleted: passed,
            completedAt: passed ? new Date() : null
          }
        });
      }
    }

    // Check for level progression if test passed
    let levelAdvanced = false;
    if (passed) {
      levelAdvanced = await checkForLevelProgression(userId, score, testType);
    }

    // Update user progress
    await prisma.userProgress.upsert({
      where: { userId },
      update: {
        totalTestsTaken: { increment: 1 },
        averageTestScore: score
      },
      create: {
        userId,
        currentLevel: level,
        currentChapter: 1,
        currentLesson: 1,
        totalTestsTaken: 1,
        averageTestScore: score
      }
    });

    console.log(`✅ Test completed for user ${userId}: ${score}% (${passed ? 'PASSED' : 'FAILED'})`);
    if (levelAdvanced) {
      console.log(`🚀 User ${userId} advanced to next level!`);
    }

    res.status(200).json({
      success: true,
      testAttemptId: testAttempt.id,
      score,
      passed,
      correctAnswers,
      totalQuestions,
      levelAdvanced,
      message: levelAdvanced 
        ? `Congratulations! You scored ${score}% and advanced to the next level!`
        : passed 
          ? `Great job! You scored ${score}% and passed the test.`
          : `You scored ${score}%. You need 80% or higher to advance to the next level.`
    });

  } catch (error) {
    console.error(`❌ Error submitting test for user ${userId}:`, error);
    res.status(500).json({ message: 'Server error while submitting test.' });
  }
};
