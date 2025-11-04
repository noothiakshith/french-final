import prisma from '../utils/prisma.js';
import { generateBridgeCourseFinalTest } from '../services/aiService.js';
import { generateAndSaveCurriculum } from '../services/courseService.js';

/**
 * @desc    Get the user's active bridge course and its chapters.
 * @route   GET /api/bridge-course/
 * @access  Private
 */
export const getBridgeCourse = async (req, res) => {
    const userId = req.user.id;
    try {
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
            where: { userId },
            include: { chapters: { orderBy: { chapterNumber: 'asc' } } },
        });

        if (!bridgeCourse) {
            return res.status(404).json({ message: "No active Bridge Course found for this user." });
        }
        res.status(200).json(bridgeCourse);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching Bridge Course." });
    }
};


/**
 * @desc    Get a single bridge course chapter by its ID, including its exercises.
 * @route   GET /api/bridge-course/chapters/:chapterId
 * @access  Private
 */
export const getBridgeChapter = async (req, res) => {
    const userId = req.user.id;
    const { chapterId } = req.params;

    try {
        // 1. Find the bridge chapter, ensuring it belongs to the logged-in user
        const chapter = await prisma.bridgeChapter.findFirst({
            where: {
                id: chapterId,
                bridgeCourse: {
                    userId: userId, // CRITICAL: Ensures user can only access their own chapters
                },
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
                        // Note: We don't track isCorrect for bridge exercises in the current schema
                        // If you want to track completion, you'd need to add user exercise attempts
                    },
                },
            },
        });

        // 3. Handle case where chapter doesn't exist or doesn't belong to user
        if (!chapter) {
            return res.status(404).json({ message: 'Bridge chapter not found or you do not have access.' });
        }

        // 4. Send the full chapter data
        res.status(200).json(chapter);

    } catch (error) {
        console.error(`Error fetching bridge chapter ${chapterId}:`, error);
        res.status(500).json({ message: 'Server error while fetching the bridge chapter.' });
    }
};

/**
 * @desc    Generate and start the final test for the user's bridge course.
 * @route   POST /api/bridge-course/final-test/start
 * @access  Private
 */
export const startFinalTest = async (req, res) => {
    const userId = req.user.id;
    try {
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
            where: { userId },
            include: { chapters: true },
        });

        if (!bridgeCourse || bridgeCourse.isCompleted) {
            return res.status(400).json({ message: "No active Bridge Course to test." });
        }
        // TODO: Add logic to ensure all bridge chapters are completed before starting the final test.

        const testData = await generateBridgeCourseFinalTest(bridgeCourse.chapters);
        if (!testData || !testData.questionsData) {
            throw new Error("AI failed to generate test data.");
        }

        const newTest = await prisma.testAttempt.create({
            data: {
                userId,
                testType: 'BRIDGE_FINAL',
                level: bridgeCourse.targetLevel,
                title: `Final Test for Bridge Course`,
                questions: testData.questionsData,
                totalQuestions: testData.questionsData.length,
                passingScore: 80, // 8/10 questions correct to pass
                chapterRange: `Bridge-${bridgeCourse.id}`, // Custom identifier
                correctAnswers: 0, // Initialize with 0 since no questions answered yet
                score: 0, // Initialize with 0 since no questions answered yet
                    passed: false, // Initialize as false since test hasn't been taken yet
                timeSpent: 0, // Initialize with 0 seconds; updated on submit
                userAnswers: [], // Empty array for user's answers until submission
                topicBreakdown: {}, // Empty analysis object until test is graded
                weakAreas: [], // Will be populated after grading
                strongAreas: [], // Will be populated after grading
            }
        });

        const questionsForUser = testData.questionsData.map(({ correctAnswer, ...q }) => q);
        res.status(201).json({ testId: newTest.id, questions: questionsForUser });

    } catch (error) {
        console.error("Error starting Bridge Course final test:", error);
        res.status(500).json({ message: "Server error while starting final test." });
    }
};


/**
 * @desc    Submit the Bridge Course final test, grade it, and generate the target curriculum if passed.
 * @route   POST /api/bridge-course/final-test/:testId/submit
 * @access  Private
 */
export const submitFinalTest = async (req, res) => {
    const { testId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    try {
        const testAttempt = await prisma.testAttempt.findUnique({ where: { id: testId } });
        if (!testAttempt || testAttempt.userId !== userId || testAttempt.testType !== 'BRIDGE_FINAL') {
            return res.status(404).json({ message: "Test not found." });
        }
        if (testAttempt.completedAt) {
            return res.status(400).json({ message: "Test already completed." });
        }

        // Grade the test
        const correctAnswersMap = new Map(testAttempt.questions.map(q => [q.id, q.correctAnswer]));
        let correctCount = 0;
        for (const ans of answers) {
            if (correctAnswersMap.get(ans.questionId)?.toLowerCase() === ans.userAnswer.toLowerCase()) {
                correctCount++;
            }
        }
        const score = Math.round((correctCount / testAttempt.totalQuestions) * 100);
        const passed = score >= testAttempt.passingScore;
        let curriculumGenerated = false;

        // --- CORE LOGIC ---
        if (passed) {
            // 1. Mark the bridge course and test as complete
            const bridgeCourseId = testAttempt.chapterRange.replace('Bridge-', '');
            
            // First verify the bridge course exists and belongs to the user
            const bridgeCourse = await prisma.bridgeCourse.findFirst({
                where: { 
                    id: bridgeCourseId,
                    userId: userId 
                }
            });
            
            if (!bridgeCourse) {
                console.error(`Bridge course ${bridgeCourseId} not found for user ${userId}`);
                return res.status(400).json({ message: "Bridge course not found or access denied." });
            }
            
            await prisma.bridgeCourse.update({
                where: { id: bridgeCourseId },
                data: { 
                    isCompleted: true, 
                    finalTestScore: score, 
                    completedAt: new Date(),
                    completedChapters: bridgeCourse.totalChapters
                }
            });
            
            // 2. Generate the user's target level curriculum
            await generateAndSaveCurriculum(userId, testAttempt.level); // e.g., 'INTERMEDIATE'
            curriculumGenerated = true;
        }

        // 3. Update the test attempt record
        await prisma.testAttempt.update({
            where: { id: testId },
            data: { score, correctAnswers: correctCount, passed, completedAt: new Date(), userAnswers: answers }
        });

        res.status(200).json({
            message: passed ? "Congratulations! You passed and your new course is ready." : "You did not pass. Please review the Bridge Course material.",
            score,
            passed,
            curriculumGenerated,
        });

    } catch (error) {
        console.error("Error submitting Bridge Course final test:", error);
        console.error("Test ID:", testId);
        console.error("User ID:", userId);
        console.error("Test attempt chapterRange:", testAttempt?.chapterRange);
        res.status(500).json({ message: "Server error while submitting test." });
    }
};


/**
 * @desc    Submit an answer for a single Bridge Course exercise.
 * @route   POST /api/bridge-course/exercises/:exerciseId/submit
 * @access  Private
 */
export const submitBridgeExercise = async (req, res) => {
    const { exerciseId } = req.params;
    const userId = req.user.id;
    const { userAnswer } = req.body;

    if (typeof userAnswer !== 'string') {
        return res.status(400).json({ message: "A valid 'userAnswer' string is required." });
    }

    try {
        // 1. Find the BridgeExercise and its parent chapter. We don't need to verify userId
        // because the exerciseId is a unique UUID, which is unguessable. A check on the parent
        // course could be added for extra security if needed.
        const exercise = await prisma.bridgeExercise.findUnique({
            where: { id: exerciseId },
            include: { bridgeChapter: true },
        });

        if (!exercise) {
            return res.status(404).json({ message: "Exercise not found." });
        }
        
        // Security check: Ensure the course belongs to the user making the request
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
           where: { id: exercise.bridgeChapter.bridgeCourseId }
        });
        
        if (bridgeCourse.userId !== userId) {
            return res.status(403).json({ message: "You do not have access to this exercise." });
        }

        // 2. Enhanced answer validation that handles both French and English
        const normalizeAnswer = (text) => {
            return text
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
                .replace(/[^a-z\s\-']/g, '') // Keep only letters, spaces, hyphens, and apostrophes
                .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
        };

        const normalizedUserAnswer = normalizeAnswer(userAnswer);
        const normalizedCorrectAnswer = normalizeAnswer(exercise.correctAnswer);
        
        // Check for exact match first
        let isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        // For translation exercises, also check common alternative answers
        if (!isCorrect && (exercise.type === 'TRANSLATION_EN_TO_FR' || exercise.type === 'TRANSLATION_FR_TO_EN')) {
            // Define common alternative translations
            const alternativeAnswers = {
                'hello': ['bonjour', 'salut'],
                'bonjour': ['hello', 'good morning', 'good day'],
                'goodbye': ['au revoir', 'salut'],
                'au revoir': ['goodbye', 'bye'],
                'thank you': ['merci'],
                'merci': ['thank you', 'thanks'],
                'please': ['s\'il vous plait', 'sil vous plait'],
                'sil vous plait': ['please'],
                'yes': ['oui'],
                'oui': ['yes'],
                'no': ['non'],
                'non': ['no']
            };
            
            const correctAlternatives = alternativeAnswers[normalizedCorrectAnswer] || [];
            isCorrect = correctAlternatives.includes(normalizedUserAnswer);
        }
        let chapterCompleted = false;

        // 3. Update the exercise attempt (Note: BridgeExercise doesn't have attempt tracking in your schema, so we skip this)
        // If you wanted to add it, you would add `userAnswer`, `isCorrect` fields to the BridgeExercise model
        // and perform an update here. For now, we'll just grade and check for completion.

        // 4. Log mistakes
        if (!isCorrect) {
            await prisma.mistake.create({
                data: {
                    userId: userId,
                    sourceType: 'BRIDGE_EXERCISE',
                    sourceId: exerciseId,
                    level: bridgeCourse.targetLevel,
                    topic: exercise.bridgeChapter.topic,
                    grammarPoint: exercise.bridgeChapter.topic, // Add the missing grammarPoint field
                    question: exercise.question,
                    correctAnswer: exercise.correctAnswer,
                    userAnswer: userAnswer,
                    mistakeType: 'INCORRECT_ANSWER', // Add the missing mistakeType field
                    errorCategory: 'GRAMMAR', // Add the missing errorCategory field
                    severity: 'MODERATE', // Default severity for bridge exercises
                    isAddressed: false
                },
            });
        } else {
             // --- LOGIC TO CHECK FOR BRIDGE CHAPTER COMPLETION ---
             // This is a simplified version. A robust implementation would track completion of each exercise.
             // For now, we will mark the chapter complete on the first correct answer of its last exercise.
             
             const chapterId = exercise.bridgeChapterId;
             
             // Get the highest exercise number in this chapter
             const lastExercise = await prisma.bridgeExercise.findFirst({
                 where: { bridgeChapterId: chapterId },
                 orderBy: { exerciseNumber: 'desc' }
             });

             if (exercise.exerciseNumber === lastExercise.exerciseNumber) {
                 await prisma.bridgeChapter.update({
                     where: { id: chapterId },
                     data: { isCompleted: true, completedAt: new Date() }
                 });
                 chapterCompleted = true;
                 console.log(`Bridge Chapter ${chapterId} marked as complete.`);
             }
        }
        
        // 5. Respond with immediate feedback
        res.status(200).json({
            isCorrect: isCorrect,
            correctAnswer: exercise.correctAnswer,
            chapterCompleted: chapterCompleted
        });

    } catch (error) {
        console.error(`Error submitting bridge exercise ${exerciseId}:`, error);
        res.status(500).json({ message: "Server error while submitting exercise." });
    }
};