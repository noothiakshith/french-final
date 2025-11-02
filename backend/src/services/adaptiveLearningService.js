import prisma from '../utils/prisma.js';
import { checkForAndGenerateRemedials } from './remedialService.js';
import { updateUserStreak } from './progressService.js';

/**
 * @desc    Performs adaptive learning checks after user activities
 * @param {string} userId - The user ID
 * @param {string} activityType - Type of activity completed
 */
export const performAdaptiveLearningChecks = async (userId, activityType = 'EXERCISE') => {
    try {
        // 1. Update user streak
        await updateUserStreak(userId);

        // 2. Check for remedial generation (only after exercises/tests)
        if (['EXERCISE', 'TEST', 'QUIZ'].includes(activityType)) {
            const generatedRemedials = await checkForAndGenerateRemedials(userId);
            if (generatedRemedials.length > 0) {
                console.log(`Generated ${generatedRemedials.length} remedial chapters for user ${userId}`);
            }
        }

        // 3. Update overall progress metrics
        await updateOverallProgress(userId);

    } catch (error) {
        console.error(`Error in adaptive learning checks for user ${userId}:`, error);
        // Don't throw - adaptive learning failures shouldn't block user progress
    }
};

/**
 * @desc    Updates overall progress metrics for a user
 * @param {string} userId - The user ID
 */
const updateOverallProgress = async (userId) => {
    try {
        // Calculate overall accuracy from exercises
        const exercises = await prisma.exercise.findMany({
            where: { userId, attempts: { gt: 0 } },
            select: { isCorrect: true }
        });

        const totalAttempts = exercises.length;
        const correctAttempts = exercises.filter(ex => ex.isCorrect).length;
        const overallAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        // Get test scores
        const testAttempts = await prisma.testAttempt.findMany({
            where: { userId, completedAt: { not: null } },
            select: { score: true }
        });

        const averageTestScore = testAttempts.length > 0 
            ? testAttempts.reduce((sum, test) => sum + test.score, 0) / testAttempts.length 
            : 0;

        // Update user progress
        await prisma.userProgress.upsert({
            where: { userId },
            create: {
                userId,
                currentLevel: 'BEGINNER',
                currentChapter: 1,
                totalExercisesCompleted: totalAttempts,
                overallAccuracy: Math.round(overallAccuracy),
                averageTestScore: Math.round(averageTestScore),
                totalTestsTaken: testAttempts.length,
            },
            update: {
                totalExercisesCompleted: totalAttempts,
                overallAccuracy: Math.round(overallAccuracy),
                averageTestScore: Math.round(averageTestScore),
                totalTestsTaken: testAttempts.length,
            }
        });

    } catch (error) {
        console.error(`Error updating overall progress for user ${userId}:`, error);
    }
};

/**
 * @desc    Checks if user should be recommended to take a progress test
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>} Test recommendation or null
 */
export const checkForProgressTestRecommendation = async (userId) => {
    try {
        // Find completed chapters grouped by section
        const completedChapters = await prisma.chapter.findMany({
            where: { userId, isCompleted: true },
            select: { chapterNumber: true, sectionNumber: true },
            orderBy: { chapterNumber: 'asc' }
        });

        // Group by section and check if any section has 5 completed chapters
        const sectionCounts = completedChapters.reduce((acc, chapter) => {
            acc[chapter.sectionNumber] = (acc[chapter.sectionNumber] || 0) + 1;
            return acc;
        }, {});

        for (const [section, count] of Object.entries(sectionCounts)) {
            if (count >= 5) {
                const sectionNum = parseInt(section);
                const chapterRange = `${sectionNum * 5 - 4}-${sectionNum * 5}`;
                
                // Check if test already taken
                const existingTest = await prisma.testAttempt.findFirst({
                    where: { userId, chapterRange }
                });

                if (!existingTest) {
                    return {
                        recommended: true,
                        chapterRange,
                        message: `You've completed chapters ${chapterRange}. Take the progress test to unlock the next section!`
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error(`Error checking progress test recommendation for user ${userId}:`, error);
        return null;
    }
};