import { checkForAndGenerateRemedials } from '../services/remedialService.js';
import prisma from '../utils/prisma.js';

/**
 * @desc    Get all remedial chapters for the logged-in user
 * @route   GET /api/remedial/chapters
 * @access  Private
 */
export const getRemedialChapters = async (req, res) => {
    const userId = req.user.id;

    try {
        const chapters = await prisma.remedialChapter.findMany({
            where: { userId },
            orderBy: [
                { isCompleted: 'asc' }, // Incomplete first
                { priority: 'desc' }, // High priority first
                { createdAt: 'desc' } // Newest first
            ],
            select: {
                id: true,
                title: true,
                description: true,
                remedialType: true,
                priority: true,
                grammarPoint: true,
                isCompleted: true,
                isRequired: true,
                blocksProgress: true,
                completedAt: true,
                createdAt: true,
                totalExercises: true,
                estimatedMinutes: true, // Added for 2-minute requirement tracking
                _count: {
                    select: {
                        exercises: {
                            where: { isCorrect: true }
                        }
                    }
                }
            }
        });

        // Add completion percentage to each chapter
        const chaptersWithProgress = chapters.map(chapter => ({
            ...chapter,
            completionPercentage: chapter.totalExercises > 0 
                ? Math.round((chapter._count.exercises / chapter.totalExercises) * 100)
                : 0
        }));

        res.status(200).json(chaptersWithProgress);

    } catch (error) {
        console.error(`Error fetching remedial chapters for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error while fetching remedial chapters.' });
    }
};

/**
 * @desc    Get a single remedial chapter by its ID, including its exercises.
 * @route   GET /api/remedial/chapters/:chapterId
 * @access  Private
 */
export const getRemedialChapter = async (req, res) => {
    const userId = req.user.id;
    const { chapterId } = req.params;

    try {
        // 1. Find the remedial chapter, ensuring it belongs to the logged-in user
        const chapter = await prisma.remedialChapter.findFirst({
            where: {
                id: chapterId,
                userId: userId, // CRITICAL: Ensures user can only access their own chapters
            },
            include: {
                // 2. Include all exercises for this chapter
                exercises: {
                    orderBy: {
                        exerciseNumber: 'asc',
                    },
                    select: {
                        id: true,
                        exerciseNumber: true,
                        question: true,
                        correctAnswer: true,
                        isCorrect: true,
                    },
                },
            },
        });

        // 3. Handle case where chapter doesn't exist or doesn't belong to user
        if (!chapter) {
            return res.status(404).json({ message: 'Remedial chapter not found or you do not have access.' });
        }

        // 4. Send the full chapter data
        res.status(200).json(chapter);

    } catch (error) {
        console.error(`Error fetching remedial chapter ${chapterId}:`, error);
        res.status(500).json({ message: 'Server error while fetching the remedial chapter.' });
    }
};

/**
 * @desc    Submit an answer for a single remedial exercise.
 * @route   POST /api/remedial/exercises/:exerciseId/submit
 * @access  Private
 */
export const submitRemedialExercise = async (req, res) => {
    const { exerciseId } = req.params;
    const userId = req.user.id;
    const { userAnswer } = req.body;

    if (typeof userAnswer !== 'string') {
        return res.status(400).json({ message: "A valid 'userAnswer' string is required." });
    }

    try {
        // 1. Find the remedial exercise and verify ownership
        const exercise = await prisma.remedialExercise.findFirst({
            where: {
                id: exerciseId,
                remedialChapter: {
                    userId: userId, // Ensure the exercise belongs to the user
                },
            },
            include: {
                remedialChapter: true,
            },
        });

        if (!exercise) {
            return res.status(404).json({ message: "Exercise not found or you do not have access." });
        }

        // 2. Grade the answer
        const isCorrect = userAnswer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();
        let chapterCompleted = false;

        // 3. Update the exercise with the result
        await prisma.remedialExercise.update({
            where: { id: exerciseId },
            data: { 
                isCorrect: isCorrect,
                userAnswer: userAnswer,
            },
        });

        // 4. Check if this completes the chapter
        if (isCorrect) {
            // Check if all exercises in this chapter are now correct
            const allExercises = await prisma.remedialExercise.findMany({
                where: { remedialChapterId: exercise.remedialChapterId },
            });

            const allCorrect = allExercises.every(ex => 
                ex.id === exerciseId ? true : ex.isCorrect
            );

            if (allCorrect) {
                await prisma.remedialChapter.update({
                    where: { id: exercise.remedialChapterId },
                    data: { 
                        isCompleted: true, 
                        completedAt: new Date() 
                    }
                });
                chapterCompleted = true;
            }
        }

        // 5. Respond with immediate feedback
        res.status(200).json({
            isCorrect: isCorrect,
            correctAnswer: exercise.correctAnswer,
            chapterCompleted: chapterCompleted
        });

    } catch (error) {
        console.error(`Error submitting remedial exercise ${exerciseId}:`, error);
        res.status(500).json({ message: "Server error while submitting exercise." });
    }
};

/**
 * @desc    Manually triggers a check for remedial content for the logged-in user.
 * @route   POST /api/remedial/check
 * @access  Private
 */
export const triggerRemedialCheck = async (req, res) => {
    const userId = req.user.id;

    try {
        const generatedChapters = await checkForAndGenerateRemedials(userId);

        if (generatedChapters.length > 0) {
            res.status(201).json({
                message: "Remedial check complete. New chapters were generated.",
                generatedChapters: generatedChapters,
            });
        } else {
            res.status(200).json({
                message: "Remedial check complete. No new chapters were needed.",
            });
        }
    } catch (error) {
        console.error(`Error triggering remedial check for user ${userId}:`, error);
        res.status(500).json({ message: "Server error during remedial check." });
    }
};

/**
 * @desc    Force generate a remedial chapter for testing (creates fake mistakes if needed)
 * @route   POST /api/remedial/force-generate
 * @access  Private
 */
export const forceGenerateRemedial = async (req, res) => {
    const userId = req.user.id;
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ message: "Topic is required for force generation." });
    }

    try {
        // Create some fake mistakes for the topic to trigger generation
        const fakeMistakes = [];
        for (let i = 0; i < 3; i++) {
            const mistake = await prisma.mistake.create({
                data: {
                    userId,
                    sourceType: 'EXERCISE',
                    sourceId: `force-generate-${i + 1}`,
                    level: 'BEGINNER', // Default level for force generation
                    grammarPoint: topic,
                    topic: topic,
                    userAnswer: `incorrect answer ${i + 1}`,
                    correctAnswer: `correct answer ${i + 1}`,
                    question: `Test question ${i + 1} for ${topic}`,
                    mistakeType: 'INCORRECT_ANSWER',
                    errorCategory: 'GRAMMAR',
                    severity: 'MODERATE',
                    isAddressed: false
                }
            });
            fakeMistakes.push(mistake);
        }

        // Now trigger remedial generation
        const generatedChapters = await checkForAndGenerateRemedials(userId);

        res.status(201).json({
            message: `Force generated remedial chapter for topic: ${topic}`,
            generatedChapters: generatedChapters,
            createdMistakes: fakeMistakes.length
        });

    } catch (error) {
        console.error(`Error force generating remedial for user ${userId}:`, error);
        res.status(500).json({ message: "Server error during force generation." });
    }
};