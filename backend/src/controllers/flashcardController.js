import prisma from '../utils/prisma.js';

/**
 * @desc    Get all flashcards due for review for the logged-in user.
 * @route   GET /api/flashcards/review
 * @access  Private
 */
export const getReviewDeck = async (req, res) => {
    const userId = req.user.id;
    try {
        const now = new Date();
        
        const dueCards = await prisma.flashcardProgress.findMany({
            where: {
                userId,
                nextReviewDate: {
                    lte: now, // Find all cards where the review date is in the past or now
                },
            },
            include: {
                flashcard: true, // Include the actual flashcard content
            },
            take: 20, // Limit to 20 cards per session to not overwhelm the user
        });

        res.status(200).json(dueCards);
    } catch (error) {
        console.error(`Error fetching review deck for user ${userId}:`, error);
        res.status(500).json({ message: "Server error while fetching review deck." });
    }
};

/**
 * @desc    Submit the result of a single flashcard review and update its next review date.
 * @route   POST /api/flashcards/review/:flashcardProgressId
 * @access  Private
 */
export const submitReview = async (req, res) => {
    const { flashcardProgressId } = req.params;
    const userId = req.user.id;
    const { wasCorrect } = req.body; // Expecting a boolean: true or false

    if (typeof wasCorrect !== 'boolean') {
        return res.status(400).json({ message: "A boolean 'wasCorrect' field is required." });
    }

    try {
        const progress = await prisma.flashcardProgress.findUnique({
            where: { id: flashcardProgressId },
        });

        if (!progress || progress.userId !== userId) {
            return res.status(404).json({ message: "Flashcard not found or you do not have access." });
        }
        
        // --- Simplified Spaced Repetition Algorithm (SuperMemo 2 inspired) ---
        let newInterval;
        let newEaseFactor = progress.easeFactor;

        if (wasCorrect) {
            if (progress.repetitions === 0) {
                newInterval = 1;
            } else if (progress.repetitions === 1) {
                newInterval = 6;
            } else {
                newInterval = Math.round(progress.interval * newEaseFactor);
            }
            newEaseFactor += 0.1; // Increase ease if correct
        } else {
            newInterval = 1; // Reset interval if incorrect
            newEaseFactor = Math.max(1.3, progress.easeFactor - 0.2); // Decrease ease, but not below 1.3
        }

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
        
        // --- End of Algorithm ---

        await prisma.flashcardProgress.update({
            where: { id: flashcardProgressId },
            data: {
                easeFactor: newEaseFactor,
                interval: newInterval,
                repetitions: { increment: wasCorrect ? 1 : 0 }, // Only increment repetitions if correct
                nextReviewDate: nextReviewDate,
                totalReviews: { increment: 1 },
                correctReviews: { increment: wasCorrect ? 1 : 0 },
                lastReviewedAt: new Date(),
            },
        });

        res.status(200).json({ message: "Review submitted successfully." });
    } catch (error) {
        console.error(`Error submitting review for flashcard ${flashcardProgressId}:`, error);
        res.status(500).json({ message: "Server error while submitting review." });
    }
};