import prisma from '../utils/prisma.js';
import { generateRemedialChapter } from './aiService.js';

// Define the threshold for when to trigger a remedial lesson.
const MISTAKE_THRESHOLD = 2; // Lowered for better user experience

/**
 * @desc    Analyzes a user's unaddressed mistakes and generates remedial chapters if thresholds are met.
 * @param {string} userId - The ID of the user to analyze.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of titles of the generated chapters.
 */
export const checkForAndGenerateRemedials = async (userId) => {
    // 1. Find all mistakes for this user that haven't been addressed yet.
    const unaddressedMistakes = await prisma.mistake.findMany({
        where: {
            userId,
            isAddressed: false,
        },
    });

    if (unaddressedMistakes.length < MISTAKE_THRESHOLD) {
        console.log(`Remedial Service: User ${userId} has only ${unaddressedMistakes.length} unaddressed mistakes. No action needed.`);
        return []; // Not enough mistakes to warrant a check.
    }

    // 2. Group mistakes by topic and count them.
    const mistakeCountsByTopic = unaddressedMistakes.reduce((acc, mistake) => {
        const topic = mistake.topic;
        if (!acc[topic]) {
            acc[topic] = [];
        }
        acc[topic].push(mistake);
        return acc;
    }, {});

    const generatedChapters = [];

    // 3. Loop through the topics and check if any have reached the threshold.
    for (const topic in mistakeCountsByTopic) {
        const mistakes = mistakeCountsByTopic[topic];
        if (mistakes.length >= MISTAKE_THRESHOLD) {
            console.log(`Remedial Service: User ${userId} has ${mistakes.length} mistakes in "${topic}". Threshold met. Generating chapter...`);

            // 4. Call the AI to generate a remedial chapter for this topic.
            // We'll provide up to 3 examples of their mistakes for better context.
            const mistakeExamples = mistakes.slice(0, 3);
            const remedialData = await generateRemedialChapter(topic, mistakeExamples);

            if (!remedialData) {
                console.error(`AI failed to generate remedial chapter for topic: ${topic}`);
                continue; // Skip to the next topic
            }

            // 5. Save the new remedial chapter and its exercises to the database.
            const newChapter = await prisma.remedialChapter.create({
                data: {
                    userId,
                    title: remedialData.title,
                    description: remedialData.description,
                    remedialType: 'MICRO', // Quick micro-lesson for teacher review
                    priority: 'HIGH', // Or determine based on severity
                    triggeredBy: `Reached ${MISTAKE_THRESHOLD} mistakes in topic: ${topic}`,
                    grammarPoint: topic,
                    content: remedialData.content,
                    mistakeIds: mistakes.map(m => m.id),
                    mistakeCount: mistakes.length,
                    relatedTopics: [topic], // Add the related topics field
                    totalLessons: 1,
                    totalExercises: remedialData.exercises.length,
                    estimatedMinutes: 2, // Ultra-quick remedial for teacher review - 2 minutes max
                    // For simplicity, we'll say it's required and blocks progress
                    isRequired: true,
                    blocksProgress: true, 
                    exercises: {
                        create: remedialData.exercises.map((ex, index) => ({
                            exerciseNumber: index + 1,
                            lessonNumber: 1, // All in one "lesson"
                            type: ex.type,
                            question: ex.question,
                            correctAnswer: ex.correctAnswer,
                            options: ex.options || [],
                            explanation: ex.explanation,
                        })),
                    },
                },
            });

            // 6. Mark the original mistakes as "addressed".
            await prisma.mistake.updateMany({
                where: {
                    id: { in: mistakes.map(m => m.id) },
                },
                data: {
                    isAddressed: true,
                    remedialId: newChapter.id,
                },
            });
            
            generatedChapters.push(newChapter.title);
        }
    }

    return generatedChapters;
};