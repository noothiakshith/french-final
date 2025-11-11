import prisma from '../utils/prisma.js';

/**
 * @desc    Get all chapters for the logged-in user
 * @route   GET /api/course/chapters
 * @access  Private
 */
export const getMyChapters = async (req, res) => {
    // ... (existing code from previous step, no changes here)
    const userId = req.user.id;

    try {
        const chapters = await prisma.chapter.findMany({
            where: { userId: userId },
            orderBy: { chapterNumber: 'asc' },
            select: {
                id: true,
                chapterNumber: true,
                sectionNumber: true,
                title: true,
                description: true,
                isUnlocked: true,
                isCompleted: true,
                masteryScore: true,
            },
        });

        if (!chapters || chapters.length === 0) {
            return res.status(404).json({ message: 'No chapters found for this user.' });
        }

        res.status(200).json(chapters);

    } catch (error) {
        console.error("Error fetching user chapters:", error);
        res.status(500).json({ message: 'Server error while fetching chapters.' });
    }
};

/**
 * @desc    Get a single chapter by its ID, including its lessons
 * @route   GET /api/course/chapters/:chapterId
 * @access  Private
 */
export const getChapterById = async (req, res) => {
    const userId = req.user.id;
    const { chapterId } = req.params;

    try {
        // 1. Find the chapter, ensuring it belongs to the logged-in user
        const chapter = await prisma.chapter.findFirst({
            where: {
                id: chapterId,
                userId: userId, // CRITICAL: Ensures user can only access their own chapters
            },
            include: {
                // 2. Also fetch all lessons related to this chapter
                lessons: {
                    orderBy: {
                        lessonNumber: 'asc', // Order lessons correctly
                    },
                },
            },
        });

        // 3. Handle case where chapter doesn't exist or doesn't belong to user
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found or you do not have access.' });
        }

        // 4. Handle case where chapter is not yet unlocked
        if (!chapter.isUnlocked) {
            return res.status(403).json({ message: 'This chapter is currently locked.' });
        }

        // 5. Send the full chapter data
        res.status(200).json(chapter);

    } catch (error) {
        console.error(`Error fetching chapter ${chapterId}:`, error);
        res.status(500).json({ message: 'Server error while fetching the chapter.' });
    }
};


/**
 * @desc    Get the progress details for a single chapter.
 * @route   GET /api/course/chapters/:chapterId/progress
 * @access  Private
 */
export const getChapterProgress = async (req, res) => {
    const { chapterId } = req.params;
    const userId = req.user.id;

    try {
        // 1. First, check if the chapter exists and belongs to the user
        const chapter = await prisma.chapter.findFirst({
            where: { id: chapterId, userId: userId },
        });

        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found or you do not have access." });
        }

        // 2. Count total lessons and completed lessons in this chapter
        const totalLessons = await prisma.lesson.count({ where: { chapterId } });
        const completedLessons = await prisma.lesson.count({
            where: { chapterId, isCompleted: true },
        });

        // 3. Count total exercises and completed exercises in this chapter
        const totalExercises = await prisma.exercise.count({
            where: { lesson: { chapterId: chapterId } },
        });
        const completedExercises = await prisma.exercise.count({
            where: { lesson: { chapterId: chapterId }, isCorrect: true },
        });

        // 4. Check if the chapter itself is complete
        // Our business logic: a chapter is complete if all its lessons are complete.
        let isChapterCompleted = false;
        if (totalLessons > 0 && totalLessons === completedLessons) {
            // Update the chapter in the DB if it's not already marked
            if (!chapter.isCompleted) {
                await prisma.chapter.update({
                    where: { id: chapterId },
                    data: { isCompleted: true, completedAt: new Date() }
                });
                
                // Check if we need to unlock the next section after completing this chapter
                const { checkAndUnlockNextSection } = await import('../services/progressService.js');
                await checkAndUnlockNextSection(userId);
            }
            isChapterCompleted = true;
        }

        res.status(200).json({
            chapterId,
            totalLessons,
            completedLessons,
            totalExercises,
            completedExercises,
            isChapterCompleted,
        });

    } catch (error) {
        console.error(`Error fetching progress for chapter ${chapterId}:`, error);
        res.status(500).json({ message: "Server error while fetching chapter progress." });
    }
};