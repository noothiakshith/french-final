import prisma from '../utils/prisma.js';
import { checkForProgressTestRecommendation } from '../services/adaptiveLearningService.js';

/**
 * @desc    Get a consolidated dashboard for the logged-in user.
 * @route   GET /api/users/dashboard
 * @access  Private
 */
export const getDashboard = async (req, res) => {
    const userId = req.user.id;

    try {
        // We'll use Prisma's transaction feature to run all these queries concurrently for performance.
        const [
            userProgress,
            streak,
            activeRemedial,
            nextLesson,
            upcomingTestInfo
        ] = await prisma.$transaction([
            // 1. Get Overall Progress
            prisma.userProgress.findUnique({ where: { userId } }),

            // 2. Get Current Streak
            prisma.streak.findUnique({ where: { userId } }),

            // 3. Find any active, required remedial chapters
            prisma.remedialChapter.findFirst({
                where: {
                    userId,
                    isCompleted: false,
                    isRequired: true,
                },
                orderBy: { createdAt: 'asc' },
            }),

            // 4. Find the next lesson or chapter the user should work on
            prisma.lesson.findFirst({
                where: {
                    userId,
                    isCompleted: false,
                    chapter: { isUnlocked: true }, // Ensure it's in an unlocked chapter
                },
                orderBy: [{ chapter: { chapterNumber: 'asc' } }, { lessonNumber: 'asc' }],
                select: {
                    id: true,
                    title: true,
                    lessonNumber: true,
                    chapter: {
                        select: { id: true, title: true, chapterNumber: true },
                    },
                },
            }),
            
            // 5. Check for upcoming progress tests
            prisma.chapter.groupBy({
                by: ['sectionNumber'],
                where: { userId, isCompleted: true },
                _count: { chapterNumber: true },
                orderBy: { sectionNumber: 'asc' },
            })
        ]);

        // --- Assemble the Dashboard Object ---

        // Check for bridge course
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
            where: { userId },
            include: { chapters: true }
        });

        // Check for flashcards due for review
        const dueFlashcards = await prisma.flashcardProgress.count({
            where: {
                userId,
                nextReviewDate: { lte: new Date() }
            }
        });

        // Determine the next action for the user
        let nextAction = null;
        if (bridgeCourse && !bridgeCourse.isCompleted) {
            const allChaptersComplete = bridgeCourse.chapters.every(ch => ch.isCompleted);
            if (allChaptersComplete) {
                nextAction = {
                    type: 'BRIDGE_FINAL_TEST',
                    message: "You've completed all bridge course chapters! Take the final test to unlock your main curriculum.",
                    details: {
                        bridgeCourseId: bridgeCourse.id,
                    },
                };
            } else {
                const nextChapter = bridgeCourse.chapters.find(ch => !ch.isCompleted);
                nextAction = {
                    type: 'BRIDGE_CHAPTER',
                    message: `Continue your bridge course with: ${nextChapter.title}`,
                    details: {
                        chapterId: nextChapter.id,
                        title: nextChapter.title,
                    },
                };
            }
        } else if (activeRemedial) {
            nextAction = {
                type: 'REMEDIAL_CHAPTER',
                message: "You have a required remedial chapter to complete.",
                details: {
                    remedialChapterId: activeRemedial.id,
                    title: activeRemedial.title,
                },
            };
        } else if (dueFlashcards > 0) {
            nextAction = {
                type: 'FLASHCARD_REVIEW',
                message: `You have ${dueFlashcards} flashcards ready for review!`,
                details: {
                    dueCount: dueFlashcards,
                },
            };
        } else if (nextLesson) {
            nextAction = {
                type: 'LESSON',
                message: `Continue with Chapter ${nextLesson.chapter.chapterNumber}, Lesson ${nextLesson.lessonNumber}.`,
                details: {
                    chapterId: nextLesson.chapter.id,
                    lessonId: nextLesson.id,
                    title: nextLesson.title,
                },
            };
        }

        // Process upcoming test information and prioritize it as next action
        let upcomingTest = null;
        for (const section of upcomingTestInfo) {
            if (section._count.chapterNumber === 5) { // A full section of 5 is complete
                const isTestTaken = await prisma.testAttempt.findFirst({
                    where: { userId, chapterRange: `${section.sectionNumber * 5 - 4}-${section.sectionNumber * 5}` }
                });
                if (!isTestTaken) {
                    upcomingTest = {
                        message: `You have completed all chapters in this section. Time for the Progress Test!`,
                        chapterRange: `${section.sectionNumber * 5 - 4}-${section.sectionNumber * 5}`,
                    };
                    
                    // Override next action to prioritize progress test
                    nextAction = {
                        type: 'PROGRESS_TEST',
                        message: `🎯 Progress Test Available! Complete chapters ${section.sectionNumber * 5 - 4}-${section.sectionNumber * 5} test to unlock the next section.`,
                        details: {
                            chapterRange: `${section.sectionNumber * 5 - 4}-${section.sectionNumber * 5}`,
                            sectionNumber: section.sectionNumber,
                        },
                    };
                    break; // Found the next test, no need to look further
                }
            }
        }
        
        // Final response object
        const dashboard = {
            progress: {
                level: userProgress?.currentLevel || req.user.currentLevel,
                totalLessonsCompleted: userProgress?.totalLessonsCompleted || 0,
                overallAccuracy: userProgress?.overallAccuracy || 0,
            },
            streak: {
                current: streak?.currentStreak || 0,
                longest: streak?.longestStreak || 0,
            },
            nextAction,
            upcomingTest,
        };

        res.status(200).json(dashboard);

    } catch (error) {
        console.error(`Error fetching dashboard for user ${userId}:`, error);
        res.status(500).json({ message: "Server error while fetching dashboard." });
    }
};
/**
 
* @desc    Get detailed user statistics
 * @route   GET /api/users/stats
 * @access  Private
 */
export const getUserStats = async (req, res) => {
    const userId = req.user.id;

    try {
        const [
            userProgress,
            streak,
            totalExercises,
            correctExercises,
            totalLessons,
            completedLessons,
            totalChapters,
            completedChapters,
            testAttempts,
            flashcardStats
        ] = await prisma.$transaction([
            prisma.userProgress.findUnique({ where: { userId } }),
            prisma.streak.findUnique({ where: { userId } }),
            prisma.exercise.count({ where: { userId, attempts: { gt: 0 } } }),
            prisma.exercise.count({ where: { userId, isCorrect: true } }),
            prisma.lesson.count({ where: { userId } }),
            prisma.lesson.count({ where: { userId, isCompleted: true } }),
            prisma.chapter.count({ where: { userId } }),
            prisma.chapter.count({ where: { userId, isCompleted: true } }),
            prisma.testAttempt.findMany({
                where: { userId },
                select: { score: true, testType: true }
            }),
            prisma.flashcardProgress.aggregate({
                where: { userId },
                _count: { id: true },
                _avg: { totalReviews: true }
            })
        ]);

        const stats = {
            progress: {
                level: userProgress?.currentLevel || req.user.currentLevel,
                currentChapter: userProgress?.currentChapter || 1,
                currentLesson: userProgress?.currentLesson || 1,
                totalLessonsCompleted: completedLessons,
                totalExercisesCompleted: correctExercises,
                overallAccuracy: totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0,
            },
            streak: {
                current: streak?.currentStreak || 0,
                longest: streak?.longestStreak || 0,
                lastActivity: streak?.lastActivityDate || null,
            },
            completion: {
                chapters: {
                    completed: completedChapters,
                    total: totalChapters,
                    percentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
                },
                lessons: {
                    completed: completedLessons,
                    total: totalLessons,
                    percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
                },
                exercises: {
                    attempted: totalExercises,
                    correct: correctExercises,
                    accuracy: totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0,
                }
            },
            tests: {
                taken: testAttempts.length,
                averageScore: testAttempts.length > 0 
                    ? Math.round(testAttempts.reduce((sum, test) => sum + test.score, 0) / testAttempts.length)
                    : 0,
                byType: testAttempts.reduce((acc, test) => {
                    acc[test.testType] = (acc[test.testType] || 0) + 1;
                    return acc;
                }, {})
            },
            flashcards: {
                total: flashcardStats._count.id || 0,
                averageReviews: Math.round(flashcardStats._avg.totalReviews || 0),
            }
        };

        res.status(200).json(stats);

    } catch (error) {
        console.error(`Error fetching stats for user ${userId}:`, error);
        res.status(500).json({ message: "Server error while fetching user statistics." });
    }
};

/**
 * @desc    Get progress test recommendation for user
 * @route   GET /api/users/progress-test-recommendation
 * @access  Private
 */
export const getProgressTestRecommendation = async (req, res) => {
    const userId = req.user.id;

    try {
        const recommendation = await checkForProgressTestRecommendation(userId);
        
        if (recommendation) {
            res.status(200).json(recommendation);
        } else {
            res.status(200).json({
                recommended: false,
                message: "No progress test available at this time."
            });
        }

    } catch (error) {
        console.error(`Error getting progress test recommendation for user ${userId}:`, error);
        res.status(500).json({ message: "Server error while checking progress test recommendation." });
    }
};