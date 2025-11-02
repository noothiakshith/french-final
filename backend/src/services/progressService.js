import prisma from '../utils/prisma.js';

/**
 * Update user streak when they log in or perform activity.
 */
export const updateUserStreak = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) return; // Happens only for users without streak initialized

  const lastActivity = new Date(streak.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = (today - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysDiff === 1) {
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: { increment: 1 },
        lastActivityDate: new Date(),
      },
    });

    if (updated.currentStreak > updated.longestStreak) {
      await prisma.streak.update({
        where: { userId },
        data: { longestStreak: updated.currentStreak },
      });
    }
  } else if (daysDiff > 1) {
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: new Date(),
      },
    });
  }
};

/**
 * Update UserProgress when a lesson is completed.
 */
export const updateProgressOnLessonComplete = async (userId) => {
  try {
    const completedLessons = await prisma.lesson.count({
      where: { userId, isCompleted: true },
    });

    const nextLesson = await prisma.lesson.findFirst({
      where: { userId, isCompleted: false, chapter: { isUnlocked: true } },
      orderBy: [
        { chapter: { chapterNumber: 'asc' } },
        { lessonNumber: 'asc' },
      ],
      select: { lessonNumber: true, chapter: { select: { chapterNumber: true } } },
    });

    await prisma.userProgress.update({
      where: { userId },
      data: {
        totalLessonsCompleted: completedLessons,
        currentChapter: nextLesson ? nextLesson.chapter.chapterNumber : undefined,
        currentLesson: nextLesson ? nextLesson.lessonNumber : undefined,
      },
    });
    console.log(`✅ Progress updated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to update progress for user ${userId}:`, error);
  }
};

/**
 * Update UserProgress when a test is completed.
 */
export const updateProgressOnTestComplete = async (userId) => {
  try {
    const testAttempts = await prisma.testAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      select: { score: true },
    });

    const total = testAttempts.length;
    const avgScore =
      total > 0 ? testAttempts.reduce((sum, t) => sum + t.score, 0) / total : 0;

    await prisma.userProgress.update({
      where: { userId },
      data: {
        totalTestsTaken: total,
        averageTestScore: Math.round(avgScore),
      },
    });
    console.log(`✅ Test progress updated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error updating test progress for user ${userId}:`, error);
  }
};
