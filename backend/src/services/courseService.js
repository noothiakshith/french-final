import prisma from '../utils/prisma.js';
// --- CORRECTED IMPORTS ---
// Now all these functions are correctly exported from aiService.js
import { generateCurriculum, generateBridgeCourse } from './aiService.js';

// Helper to map incoming exercise type strings to Prisma ExerciseType enum values
const mapExerciseType = (t) => {
    if (!t || typeof t !== 'string') return 'MULTIPLE_CHOICE';
    const lower = t.toLowerCase();
    if (lower.includes('fill') || lower.includes('blank')) return 'FILL_IN_BLANK';
    if (lower.includes('multiple') || lower.includes('choice')) return 'MULTIPLE_CHOICE';
    if (lower.includes('translation') && lower.includes('en_to_fr')) return 'TRANSLATION_EN_TO_FR';
    if (lower.includes('translation') && lower.includes('fr_to_en')) return 'TRANSLATION_FR_TO_EN';
    if (lower.includes('translation') && lower.includes('en')) return 'TRANSLATION_EN_TO_FR';
    if (lower.includes('translation') && lower.includes('fr')) return 'TRANSLATION_FR_TO_EN';
    if (lower.includes('rearrange')) return 'SENTENCE_REARRANGE';
    if (lower.includes('conjugation')) return 'CONJUGATION';
    if (lower.includes('article')) return 'ARTICLE_SELECTION';
    if (lower.includes('pronoun')) return 'PRONOUN_SELECTION';
    if (lower.includes('true') || lower.includes('false')) return 'TRUE_FALSE';
    // default
    return 'MULTIPLE_CHOICE';
};

// Generate a small set of default exercises for a lesson if the AI did not provide any
const generateDefaultExercises = (lesson) => {
    const topic = lesson.topic || lesson.title || 'General Topic';
    return [
        {
            type: 'MULTIPLE_CHOICE',
            question: `Which topic does this lesson focus on?`,
            options: [topic, 'Articles', 'Conjugation', 'Vocabulary'],
            correctAnswer: topic,
            explanation: `Topic identification for the lesson: ${topic}`,
            grammarPoint: lesson.grammarPoints ? (lesson.grammarPoints[0] || topic) : topic,
            difficulty: 'EASY',
            topic: topic,
        },
        {
            type: 'FILL_IN_BLANK',
            question: `Write a short sentence about ${topic} in French.`,
            options: [],
            correctAnswer: `Sample answer about ${topic}`,
            explanation: `Open-ended practice for topic ${topic}`,
            grammarPoint: lesson.grammarPoints ? (lesson.grammarPoints[0] || topic) : topic,
            difficulty: 'MEDIUM',
            topic: topic,
        }
    ];
};

/**
 * @desc    Generates and saves a full curriculum for a given user and level.
 */
export const generateAndSaveCurriculum = async (userId, level) => {
    console.log(`Course Service: Generating ${level} curriculum for user ${userId}`);
    try {
        // Check if curriculum already exists for this user and level
        const existingChapters = await prisma.chapter.findMany({
            where: {
                userId,
                level
            }
        });

        if (existingChapters.length > 0) {
            console.log(`Course Service: Curriculum already exists for user ${userId} at level ${level}. Skipping generation.`);
            return; // Exit early if curriculum already exists
        }

        const curriculumData = await generateCurriculum(level);
        if (!curriculumData || curriculumData.length === 0) {
            throw new Error("AI service returned no curriculum data.");
        }

        // Prepare all database operations
        const chapterCreationPromises = curriculumData.map((chapter, index) => {
            const { lessons, ...chapterData } = chapter;
            const section = Math.ceil((index + 1) / 5);
            const isUnlocked = (index + 1) <= 5;

            return prisma.chapter.create({
                data: {
                    ...chapterData,
                    userId,
                    level,
                    chapterNumber: index + 1,
                    sectionNumber: section,
                    isUnlocked,
                    unlockCondition: isUnlocked ? null : `Pass Progress Test for chapters ${section * 5 - 4}-${section * 5}.`,
                    lessons: {
                        create: (lessons || []).map((lesson, lessonIndex) => {
                            const lessonExercises = (lesson.exercises && lesson.exercises.length) ? lesson.exercises : generateDefaultExercises(lesson || {});
                            return {
                                ...lesson,
                                userId,
                                lessonNumber: lessonIndex + 1,
                                title: lesson.title || `Lesson ${lessonIndex + 1}`,
                                topic: lesson.topic || lesson.title || chapterData.topic || `Lesson ${lessonIndex + 1}`,
                                content: lesson.content || {},
                                grammarPoints: lesson.grammarPoints || [],
                                vocabulary: lesson.vocabulary || [],
                                examples: lesson.examples || [],
                                exercises: {
                                    create: lessonExercises.map((exercise, exIndex) => ({
                                        userId,
                                        exerciseNumber: exIndex + 1,
                                        type: mapExerciseType(exercise.type),
                                        question: exercise.question || `Practice: ${lesson.title || lesson.topic || 'Exercise'}`,
                                        correctAnswer: exercise.correctAnswer || (Array.isArray(exercise.options) ? exercise.options[0] : (exercise.correctAnswer || 'Sample answer')),
                                        options: exercise.options || [],
                                        explanation: exercise.explanation || null,
                                        grammarPoint: exercise.grammarPoint || (lesson.grammarPoints ? lesson.grammarPoints[0] : lesson.topic) || lesson.topic || 'General',
                                        difficulty: (exercise.difficulty || 'MEDIUM').toUpperCase(),
                                        topic: exercise.topic || lesson.topic || lesson.title || chapterData.topic || 'General',
                                    }))
                                }
                            };
                        }),
                    },
                },
            });
        });

        // Add UserProgress and Streak creation to the transaction
        const transactionOperations = [
            ...chapterCreationPromises,
            prisma.userProgress.upsert({
                where: { userId },
                create: {
                    userId,
                    currentLevel: level,
                    currentChapter: 1,
                    currentLesson: 1,
                    totalLessonsCompleted: 0,
                    totalExercisesCompleted: 0,
                    totalQuizzesTaken: 0,
                    totalTestsTaken: 0,
                    overallAccuracy: 0,
                    averageTestScore: 0,
                    averageQuizScore: 0,
                    topicMastery: {},
                    identifiedWeaknesses: {},
                    totalTimeSpent: 0,
                    averageSessionTime: 0,
                },
                update: {
                    currentLevel: level,
                    currentChapter: 1,
                    currentLesson: 1,
                }
            }),
            prisma.streak.upsert({
                where: { userId },
                create: {
                    userId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActivityDate: new Date(),
                },
                update: {
                    currentStreak: 1,
                    lastActivityDate: new Date(),
                }
            })
        ];

        // Execute all operations in a single transaction
        await prisma.$transaction(transactionOperations);
        console.log(`Course Service: Successfully saved ${curriculumData.length} chapters and initialized progress tracking.`);
    } catch (error) {
        console.error(`Error in generateAndSaveCurriculum for user ${userId}:`, error);
        throw error;
    }
};

/**
 * @desc    Generates and saves a Bridge Course for a user based on their weaknesses.
 */
export const generateAndSaveBridgeCourse = async (userId, targetLevel, weaknesses) => {
    console.log(`Course Service: Generating Bridge Course for user ${userId}`);
    try {
        const bridgeCourseData = await generateBridgeCourse(weaknesses);
        if (!bridgeCourseData || !bridgeCourseData.chapters) {
            throw new Error("AI service returned invalid bridge course data.");
        }

        const chapters = bridgeCourseData.chapters;

        // Compute estimated hours from chapter estimatedMinutes
        const totalEstimatedMinutes = chapters.reduce((sum, c) => sum + (c.estimatedMinutes || 0), 0);
        const estimatedHours = Number((totalEstimatedMinutes / 60).toFixed(2));

        // Helper to map incoming exercise type strings to Prisma ExerciseType enum values
        const mapExerciseType = (t) => {
            if (!t || typeof t !== 'string') return 'MULTIPLE_CHOICE';
            const lower = t.toLowerCase();
            if (lower.includes('fill') || lower.includes('blank')) return 'FILL_IN_BLANK';
            if (lower.includes('multiple') || lower.includes('choice')) return 'MULTIPLE_CHOICE';
            if (lower.includes('translation') && lower.includes('en_to_fr')) return 'TRANSLATION_EN_TO_FR';
            if (lower.includes('translation') && lower.includes('fr_to_en')) return 'TRANSLATION_FR_TO_EN';
            if (lower.includes('translation') && lower.includes('en')) return 'TRANSLATION_EN_TO_FR';
            if (lower.includes('translation') && lower.includes('fr')) return 'TRANSLATION_FR_TO_EN';
            if (lower.includes('rearrange')) return 'SENTENCE_REARRANGE';
            if (lower.includes('conjugation')) return 'CONJUGATION';
            if (lower.includes('article')) return 'ARTICLE_SELECTION';
            if (lower.includes('pronoun')) return 'PRONOUN_SELECTION';
            if (lower.includes('true') || lower.includes('false')) return 'TRUE_FALSE';
            // default
            return 'MULTIPLE_CHOICE';
        };

        await prisma.bridgeCourse.create({
            data: {
                userId,
                targetLevel,
                identifiedGaps: weaknesses,
                totalChapters: chapters.length,
                estimatedHours,
                // Save the full curriculum payload returned by the AI (if available)
                curriculum: bridgeCourseData.curriculum || { chapters },
                chapters: {
                    create: chapters.map((chapter, index) => ({
                        chapterNumber: index + 1,
                        title: chapter.title,
                        topic: chapter.topic,
                        description: chapter.description,
                        estimatedMinutes: chapter.estimatedMinutes,
                        content: chapter.content,
                        isUnlocked: index === 0, // Unlock the first chapter
                        unlockedAt: index === 0 ? new Date() : null,
                        exercises: {
                            create: (chapter.exercises || []).map((exercise, exIndex) => ({
                                exerciseNumber: exIndex + 1,
                                type: mapExerciseType(exercise.type),
                                question: exercise.question,
                                correctAnswer: exercise.correctAnswer,
                                options: exercise.options || [],
                                explanation: exercise.explanation,
                                grammarPoint: exercise.grammarPoint || chapter.topic,
                                difficulty: (exercise.difficulty || 'MEDIUM').toUpperCase(),
                            })),
                        },
                    })),
                },
            },
        });
        
        console.log(`Course Service: Successfully saved Bridge Course with ${chapters.length} chapters.`);
    } catch (error) {
        console.error(`Error in generateAndSaveBridgeCourse for user ${userId}:`, error);
        throw error;
    }
};

