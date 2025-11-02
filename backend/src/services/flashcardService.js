import prisma from '../utils/prisma.js';
import { generateFlashcardsForLesson } from './aiService.js';

/**
 * @desc    Generates and saves flashcards for a completed lesson
 * @param {string} lessonId - The ID of the lesson to generate flashcards for
 * @returns {Promise<Array>} Array of created flashcard objects
 */
export const generateAndSaveFlashcardsForLesson = async (lessonId) => {
    try {
        // 1. Get the lesson data
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                chapter: {
                    select: {
                        level: true,
                        chapterNumber: true,
                    }
                }
            }
        });

        if (!lesson) {
            throw new Error(`Lesson ${lessonId} not found`);
        }

        // 2. Check if flashcards already exist for this lesson
        const existingFlashcards = await prisma.flashcard.findMany({
            where: {
                level: lesson.chapter.level,
                chapterNumber: lesson.chapter.chapterNumber,
                topic: lesson.topic,
            }
        });

        if (existingFlashcards.length > 0) {
            console.log(`Flashcards already exist for lesson ${lessonId}`);
            return existingFlashcards;
        }

        // 3. Generate flashcards using AI
        const flashcardData = await generateFlashcardsForLesson(lesson);
        
        if (!flashcardData || flashcardData.length === 0) {
            console.log(`No flashcards generated for lesson ${lessonId}`);
            return [];
        }

        // 4. Save flashcards to database
        const createdFlashcards = await Promise.all(
            flashcardData.map(async (cardData) => {
                const flashcard = await prisma.flashcard.create({
                    data: {
                        level: lesson.chapter.level,
                        chapterNumber: lesson.chapter.chapterNumber,
                        topic: lesson.topic,
                        grammarPoint: lesson.grammarPoints?.[0] || lesson.topic,
                        frontText: cardData.frontText,
                        backText: cardData.backText,
                        exampleSentence: cardData.exampleSentence,
                        difficulty: 'MEDIUM', // Default difficulty
                    }
                });

                // 5. Create initial progress record for the user
                await prisma.flashcardProgress.create({
                    data: {
                        userId: lesson.userId,
                        flashcardId: flashcard.id,
                        nextReviewDate: new Date(), // Available immediately
                    }
                });

                return flashcard;
            })
        );

        console.log(`Generated ${createdFlashcards.length} flashcards for lesson ${lessonId}`);
        return createdFlashcards;

    } catch (error) {
        console.error(`Error generating flashcards for lesson ${lessonId}:`, error);
        throw error;
    }
};

/**
 * @desc    Initializes flashcard progress for a user when they complete a lesson
 * @param {string} userId - The user ID
 * @param {string} lessonId - The completed lesson ID
 */
export const initializeFlashcardsForCompletedLesson = async (userId, lessonId) => {
    try {
        await generateAndSaveFlashcardsForLesson(lessonId);
        console.log(`Flashcards initialized for user ${userId}, lesson ${lessonId}`);
    } catch (error) {
        console.error(`Failed to initialize flashcards for user ${userId}, lesson ${lessonId}:`, error);
        // Don't throw - flashcard generation failure shouldn't block lesson completion
    }
};