import prisma from '../utils/prisma.js';

/**
 * @desc    Get a single lesson by its ID, including its exercises and chapter info
 * @route   GET /api/lessons/:lessonId
 * @access  Private
 */
export const getLessonById = async (req, res) => {
    const userId = req.user.id;
    const { lessonId } = req.params;

    try {
        // 1. Find the lesson, ensuring it belongs to the logged-in user
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                chapter: {
                    userId: userId, // CRITICAL: Ensures user can only access their own lessons
                },
            },
            include: {
                // 2. Include the chapter info for breadcrumb navigation
                chapter: {
                    select: {
                        id: true,
                        chapterNumber: true,
                        title: true,
                    },
                },
                // 3. Include all exercises for this lesson
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

        // 4. Handle case where lesson doesn't exist or doesn't belong to user
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found or you do not have access.' });
        }

        // 5. Check if the chapter is unlocked
        const chapterData = await prisma.chapter.findUnique({
            where: { id: lesson.chapter.id },
            select: { isUnlocked: true }
        });

        if (!chapterData?.isUnlocked) {
            return res.status(403).json({ message: 'This lesson is in a locked chapter. Complete the required progress test to unlock it.' });
        }

        // 6. Send the full lesson data
        res.status(200).json(lesson);

    } catch (error) {
        console.error(`Error fetching lesson ${lessonId}:`, error);
        res.status(500).json({ message: 'Server error while fetching the lesson.' });
    }
};