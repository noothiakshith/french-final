import prisma from '../utils/prisma.js';
// Import the AI functions for starting and GRADING the test
import { generatePlacementTest, gradeTestWithAI, generateProgressTest } from '../services/aiService.js';
// Import the services for creating courses
import { generateAndSaveCurriculum, generateAndSaveBridgeCourse } from '../services/courseService.js';

/**
 * @desc    Generate and save a new placement test for the logged-in user.
 * @route   POST /api/tests/placement/start
 * @access  Private
 */

export const startPlacementTest = async (req, res) => {
    const userId = req.user.id;

    try {
        // Check if user already has a placement test
        const existingTest = await prisma.placementTest.findUnique({
            where: { userId },
        });

        if (existingTest) {
            // If test is completed, return the existing test
            if (existingTest.completedAt) {
                return res.status(400).json({ 
                    message: "Placement test has already been completed.",
                    testId: existingTest.id,
                    completed: true
                });
            }
            // If test is in progress, return the existing test
            return res.status(200).json({
                testId: existingTest.id,
                questions: existingTest.questionsData.map(({ correctAnswer, ...question }) => question),
                message: "Resuming existing placement test."
            });
        }

        const testData = await generatePlacementTest();
        if (!testData || !testData.questionsData) {
            throw new Error("AI service failed to return valid test data.");
        }

        const newTest = await prisma.placementTest.create({
            data: {
                userId: userId,
                totalQuestions: testData.questionsData.length,
                questionsData: testData.questionsData,
                correctAnswers: 0,
                score: 0,
                timeSpent: 0,
                strengths: {},
                weaknesses: {},
                recommendedLevel: 'BEGINNER',
            },
        });

        const questionsForUser = testData.questionsData.map(({ correctAnswer, ...question }) => question);

        res.status(201).json({
            testId: newTest.id,
            questions: questionsForUser,
        });

    } catch (error) {
        console.error("Error starting placement test:", error);
        
        // Handle unique constraint violation specifically
        if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
            return res.status(400).json({ 
                message: "Placement test already exists for this user." 
            });
        }
        
        res.status(500).json({ message: "Server error while starting the placement test." });
    }
};

/**
 * @desc    Check if user has a placement test and its status
 * @route   GET /api/tests/placement/status
 * @access  Private
 */
export const checkPlacementTestStatus = async (req, res) => {
    const userId = req.user.id;

    try {
        const existingTest = await prisma.placementTest.findUnique({
            where: { userId },
            select: {
                id: true,
                completedAt: true,
                score: true,
                recommendedLevel: true
            }
        });

        if (!existingTest) {
            return res.status(200).json({ 
                hasTest: false,
                message: "No placement test found for this user."
            });
        }

        if (existingTest.completedAt) {
            return res.status(200).json({
                hasTest: true,
                completed: true,
                testId: existingTest.id,
                score: existingTest.score,
                recommendedLevel: existingTest.recommendedLevel,
                message: "Placement test completed."
            });
        }

        return res.status(200).json({
            hasTest: true,
            completed: false,
            testId: existingTest.id,
            message: "Placement test in progress."
        });

    } catch (error) {
        console.error("Error checking placement test status:", error);
        res.status(500).json({ message: "Server error while checking placement test status." });
    }
};


/**
 * @desc    Submit answers, have AI grade them, and assign a learning path.
 * @route   POST /api/tests/placement/:testId/submit
 * @access  Private
 */
export const submitPlacementTest = async (req, res) => {
    const { testId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    try {
        // 1. Validate input and find the original test data
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: "A valid 'answers' array is required." });
        }
        
        const test = await prisma.placementTest.findUnique({ where: { id: testId } });

        if (!test || test.userId !== userId) {
            return res.status(404).json({ message: "Test not found or you do not have access." });
        }

        if (test.completedAt) {
            return res.status(400).json({ message: "This test has already been completed." });
        }

        // --- NEW AI GRADING LOGIC ---
        // 2. Call the AI service to grade the test
        const evaluation = await gradeTestWithAI(test.questionsData, answers);
        
        const { score, correctCount, weaknesses } = evaluation;

        if (typeof score !== 'number') {
            throw new Error("AI evaluation did not return a valid score.");
        }
        // --- END OF NEW LOGIC ---

        // 3. Decide the user's path based on the AI's score
        let pathAssigned;
        let curriculumError = null;

        try {
            if (score < 50) {
                pathAssigned = 'BEGINNER';
                await prisma.user.update({ where: { id: userId }, data: { currentLevel: 'BEGINNER' } });
                await generateAndSaveCurriculum(userId, 'BEGINNER');
            } else {
                pathAssigned = 'BRIDGE_COURSE';
                const recommendedLevel = 'INTERMEDIATE';
                await prisma.user.update({ where: { id: userId }, data: { currentLevel: recommendedLevel } });
                await generateAndSaveBridgeCourse(userId, recommendedLevel, weaknesses);
            }
        } catch (error) {
            console.error('Curriculum generation error:', error);
            curriculumError = error.message;
            // Continue execution - we'll return the error to the client but still save the test results
        }

        // 4. Update the test record in the DB with the AI's results
        await prisma.placementTest.update({
            where: { id: testId },
            data: {
                score,
                correctAnswers: correctCount,
                completedAt: new Date(),
                weaknesses: weaknesses || {}, // Use the AI's weakness analysis
                requiresBridge: score >= 50,
                recommendedLevel: score < 50 ? 'BEGINNER' : 'INTERMEDIATE',
            },
        });

        // 5. Respond to the user with the results
        const response = {
            message: curriculumError 
                ? "Test graded successfully, but there was an error generating your curriculum. Our team will fix this shortly." 
                : "Test submitted and graded by AI successfully.",
            score: score,
            correctAnswers: correctCount,
            totalQuestions: test.totalQuestions,
            pathAssigned: pathAssigned,
            weaknesses: weaknesses,
        };

        if (curriculumError) {
            response.curriculumError = curriculumError;
        }

        res.status(200).json(response);

    } catch (error) {
        console.error(`Error submitting placement test ${testId}:`, error);
        res.status(500).json({ message: "Server error while submitting the test." });
    }
};



// startPlacementTest and submitPlacementTest functions remain unchanged.

/**
 * @desc    Generate and start a new Progress Test for a specific chapter range.
 * @route   POST /api/tests/progress/start
 * @access  Private
 */
export const startProgressTest = async (req, res) => {
    const userId = req.user.id;
    const { level, chapterRange } = req.body; // e.g., level: "BEGINNER", chapterRange: "1-5"

    if (!level || !chapterRange) {
        return res.status(400).json({ message: "Level and chapterRange are required." });
    }

    try {
        // 1. Parse the chapter range "1-5" -> [1, 2, 3, 4, 5]
        const [start, end] = chapterRange.split('-').map(Number);
        const chapterNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        // 2. Find the chapters the user has completed in this range.
        const completedChapters = await prisma.chapter.findMany({
            where: {
                userId,
                level,
                chapterNumber: { in: chapterNumbers },
                isCompleted: true, // Ensure the user has actually completed them
            },
        });

        // 3. Check if the user is ready to take the test
        if (completedChapters.length !== chapterNumbers.length) {
            return res.status(400).json({ 
                message: "You must complete all chapters in this section before taking the progress test.",
                completedCount: completedChapters.length,
                requiredCount: chapterNumbers.length,
            });
        }

        // 4. Call the AI service to generate a test based on this content
        const testData = await generateProgressTest(completedChapters);
        if (!testData || !testData.questionsData) {
            throw new Error("AI service returned invalid test data.");
        }

        // 5. Save the new test attempt to the database
        console.log('🔍 Creating test attempt with data:', {
            userId,
            testType: 'PROGRESS_TEST',
            level,
            chapterRange,
            questionsCount: testData.questionsData.length
        });

        const newTestAttempt = await prisma.testAttempt.create({
            data: {
                userId,
                testType: 'PROGRESS_TEST',
                level,
                chapterRange,
                title: `Progress Test: Chapters ${chapterRange}`,
                questions: testData.questionsData,
                totalQuestions: testData.questionsData.length,
                passingScore: 80, // As per your project plan
                correctAnswers: 0,
                score: 0,
                passed: false,
                timeSpent: 0, // Initialize with 0, will be updated when test is submitted
                userAnswers: [], // Initialize with empty array, will be populated when test is submitted
                topicBreakdown: {}, // Initialize with empty object, will be populated after grading
                weakAreas: [], // Initialize with empty array, will be populated after grading
                strongAreas: [], // Initialize with empty array, will be populated after grading
            }
        });

        console.log('✅ Test attempt created:', {
            id: newTestAttempt.id,
            createdAt: newTestAttempt.createdAt,
            completedAt: newTestAttempt.completedAt
        });

        // 6. Send only the questions to the user
        const questionsForUser = testData.questionsData.map(({ correctAnswer, ...q }) => q);

        res.status(201).json({
            testId: newTestAttempt.id,
            title: newTestAttempt.title,
            questions: questionsForUser,
        });

    } catch (error) {
        console.error("Error starting progress test:", error);
        res.status(500).json({ message: "Server error while starting progress test." });
    }
};

/**
 * @desc Submit answers for a Progress Test, grade it, and unlock chapters if passed.
 * @route POST /api/tests/progress/:testId/submit
 * @access Private
 */
export const submitProgressTest = async (req, res) => {
    const { testId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    console.log('🚀 Backend - Progress test submission:', {
        testId,
        userId,
        answersReceived: answers ? answers.length : 0,
        answersType: typeof answers,
        isArray: Array.isArray(answers),
        answers: answers
    });

    // --- Validate request body ---
    if (!answers || !Array.isArray(answers)) {
        console.log('❌ Backend - Validation failed: answers is not a valid array');
        return res.status(400).json({ message: "A valid 'answers' array is required." });
    }

    try {
        // 1. Find the test attempt
        const testAttempt = await prisma.testAttempt.findUnique({
            where: { id: testId },
        });

        if (!testAttempt || testAttempt.userId !== userId) {
            return res.status(404).json({ message: "Test attempt not found or you do not have access." });
        }

        if (testAttempt.completedAt) {
            return res.status(400).json({ message: "This test has already been submitted." });
        }

        // 2. Grade the test and track mistakes
        const questions = testAttempt.questions;
        let correctCount = 0;
        const mistakes = [];
        const topicScores = {};
        const weakAreas = [];
        const strongAreas = [];

        console.log('🔍 Grading test and tracking mistakes...');

        for (const answer of answers) {
            const question = questions.find(q => q.id === answer.questionId);
            if (question) {
                const isCorrect = question.correctAnswer.toLowerCase() === answer.userAnswer.toLowerCase();
                const topic = question.topic || 'General';
                
                // Initialize topic score tracking
                if (!topicScores[topic]) {
                    topicScores[topic] = { correct: 0, total: 0 };
                }
                topicScores[topic].total++;
                
                if (isCorrect) {
                    correctCount++;
                    topicScores[topic].correct++;
                } else {
                    // Track mistake
                    const mistake = {
                        questionId: question.id,
                        question: question.question,
                        userAnswer: answer.userAnswer,
                        correctAnswer: question.correctAnswer,
                        topic: topic,
                        questionType: question.type,
                        difficulty: question.difficulty || 'MEDIUM'
                    };
                    mistakes.push(mistake);
                    
                    // Store mistake in database
                    await prisma.mistake.create({
                        data: {
                            userId: userId,
                            sourceType: 'PROGRESS_TEST',
                            sourceId: testId,
                            level: testAttempt.level,
                            grammarPoint: topic,
                            topic: topic,
                            question: question.question,
                            userAnswer: answer.userAnswer,
                            correctAnswer: question.correctAnswer,
                            mistakeType: 'INCORRECT_ANSWER',
                            errorCategory: 'GRAMMAR',
                            severity: question.difficulty === 'HARD' ? 'CRITICAL' : question.difficulty === 'EASY' ? 'MINOR' : 'MODERATE',
                            isAddressed: false
                        }
                    });
                }
            }
        }

        // Analyze topic performance
        for (const [topic, scores] of Object.entries(topicScores)) {
            const percentage = Math.round((scores.correct / scores.total) * 100);
            if (percentage < 70) {
                weakAreas.push(topic);
            } else if (percentage >= 85) {
                strongAreas.push(topic);
            }
        }

        const score = Math.round((correctCount / questions.length) * 100);
        const passed = score >= testAttempt.passingScore;

        console.log(`📊 Test Results: ${score}% (${correctCount}/${questions.length})`);
        console.log(`❌ Mistakes: ${mistakes.length}`);
        console.log(`⚠️  Weak Areas: ${weakAreas.join(', ') || 'None'}`);
        console.log(`✅ Strong Areas: ${strongAreas.join(', ') || 'None'}`);

        // 3. Update the test attempt record with detailed analysis
        await prisma.testAttempt.update({
            where: { id: testId },
            data: {
                correctAnswers: correctCount,
                score,
                passed,
                userAnswers: answers,
                completedAt: new Date(),
                timeSpent: 0, // TODO: Calculate actual time spent
                topicBreakdown: topicScores,
                weakAreas: weakAreas,
                strongAreas: strongAreas,
            },
        });

        // 4. If the test is passed and it's a progress test, unlock the next chapters
        if (passed && testAttempt.testType === 'PROGRESS_TEST') {
            console.log('🔓 Progress test passed - generating next chapters...');
            
            try {
                // Parse the completed chapter range (e.g., "1-5")
                const [startRange, endRange] = testAttempt.chapterRange.split('-').map(Number);
                const nextStart = endRange + 1;
                const nextEnd = endRange + 5; // Generate next 5 chapters
                
                console.log(`📚 Generating chapters ${nextStart}-${nextEnd}...`);
                
                // Check if chapters already exist
                const existingChapters = await prisma.chapter.findMany({
                    where: {
                        userId: userId,
                        level: testAttempt.level,
                        chapterNumber: {
                            gte: nextStart,
                            lte: nextEnd
                        }
                    }
                });
                
                if (existingChapters.length === 0) {
                    // Generate new chapters using AI - generate only the specific range needed
                    const { generateChapterRange } = await import('../services/aiService.js');
                    const chaptersToCreate = await generateChapterRange(testAttempt.level, nextStart, nextEnd);
                    
                    // Create the new chapters in the database
                    for (let i = 0; i < chaptersToCreate.length; i++) {
                        const chapterData = chaptersToCreate[i];
                        const chapterNumber = nextStart + i;
                        
                        const newChapter = await prisma.chapter.create({
                            data: {
                                userId: userId,
                                level: testAttempt.level,
                                chapterNumber: chapterNumber,
                                title: chapterData.title,
                                topic: chapterData.topic,
                                description: chapterData.description,
                                estimatedMinutes: chapterData.estimatedMinutes,
                                learningObjectives: chapterData.learningObjectives,
                                content: chapterData.content,
                                isUnlocked: true, // Unlock immediately since test was passed
                                unlockedAt: new Date(),
                                isCompleted: false,
                                masteryScore: 0
                            }
                        });
                        
                        // Create lessons for this chapter
                        for (let j = 0; j < chapterData.lessons.length; j++) {
                            const lessonData = chapterData.lessons[j];
                            
                            await prisma.lesson.create({
                                data: {
                                    chapterId: newChapter.id,
                                    lessonNumber: lessonData.lessonNumber,
                                    title: lessonData.title,
                                    topic: lessonData.topic,
                                    content: lessonData.content,
                                    grammarPoints: lessonData.grammarPoints,
                                    vocabulary: lessonData.vocabulary,
                                    examples: lessonData.examples,
                                    isCompleted: false
                                }
                            });
                        }
                    }
                    
                    console.log(`✅ Generated and unlocked ${chaptersToCreate.length} new chapters (${nextStart}-${nextEnd})`);
                } else {
                    // Chapters already exist, just unlock them
                    await prisma.chapter.updateMany({
                        where: {
                            userId: userId,
                            level: testAttempt.level,
                            chapterNumber: {
                                gte: nextStart,
                                lte: nextEnd
                            }
                        },
                        data: {
                            isUnlocked: true,
                            unlockedAt: new Date()
                        }
                    });
                    
                    console.log(`✅ Unlocked ${existingChapters.length} existing chapters (${nextStart}-${nextEnd})`);
                }
                
            } catch (error) {
                console.error('❌ Error generating/unlocking chapters:', error);
                // Don't fail the test submission if chapter generation fails
            }
        }

        // 5. Generate remedial chapters for weak areas (regardless of pass/fail)
        if (weakAreas.length > 0 && mistakes.length > 0) {
            console.log('🔧 Generating remedial chapters for weak areas...');
            
            try {
                const { generateRemedialChapter } = await import('../services/aiService.js');
                
                for (const weakTopic of weakAreas) {
                    // Get mistakes for this specific topic
                    const topicMistakes = mistakes.filter(m => m.topic === weakTopic);
                    
                    if (topicMistakes.length > 0) {
                        console.log(`📚 Generating remedial chapter for: ${weakTopic}`);
                        
                        // Check if remedial chapter already exists for this topic
                        const existingRemedial = await prisma.remedialChapter.findFirst({
                            where: {
                                userId: userId,
                                grammarPoint: weakTopic,
                                isCompleted: false
                            }
                        });
                        
                        if (!existingRemedial) {
                            // Generate new remedial chapter
                            const remedialData = await generateRemedialChapter(weakTopic, topicMistakes);
                            
                            const newRemedialChapter = await prisma.remedialChapter.create({
                                data: {
                                    userId: userId,
                                    remedialType: 'MICRO', // Quick micro-lesson for teacher review
                                    priority: 'HIGH',
                                    title: remedialData.title,
                                    description: remedialData.description,
                                    triggeredBy: `Progress Test: ${testAttempt.title}`,
                                    grammarPoint: weakTopic,
                                    relatedTopics: [weakTopic],
                                    mistakeCount: topicMistakes.length,
                                    mistakeIds: topicMistakes.map(m => m.questionId),
                                    content: remedialData.content,
                                    totalLessons: remedialData.exercises?.length || 5,
                                    totalExercises: remedialData.exercises?.length || 10,
                                    estimatedMinutes: 2, // Ultra-quick remedial for teacher review - 2 minutes max
                                    isCompleted: false
                                }
                            });
                            
                            console.log(`✅ Created remedial chapter: ${remedialData.title}`);
                        } else {
                            console.log(`ℹ️  Remedial chapter for ${weakTopic} already exists`);
                        }
                    }
                }
            } catch (remedialError) {
                console.error('❌ Error generating remedial chapters:', remedialError);
                // Don't fail the test submission if remedial generation fails
            }
        }

        res.status(200).json({
            message: "Test submitted successfully!",
            score,
            passed,
            correctAnswers: correctCount,
            totalQuestions: questions.length,
        });

    } catch (error) {
        console.error("Error submitting progress test:", error);
        res.status(500).json({ message: "Server error while submitting the test." });
    }
};


