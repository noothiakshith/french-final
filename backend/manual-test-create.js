import prisma from './src/utils/prisma.js';

async function manualTestCreate() {
    try {
        console.log('🧪 Manually creating test attempt...\n');

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        // Create a test attempt manually
        const testAttempt = await prisma.testAttempt.create({
            data: {
                userId: user.id,
                testType: 'PROGRESS_TEST',
                level: 'BEGINNER',
                chapterRange: '1-5',
                title: 'Manual Test',
                questions: [
                    {
                        id: 1,
                        type: 'MULTIPLE_CHOICE',
                        question: 'Test question?',
                        options: ['A', 'B', 'C', 'D'],
                        correctAnswer: 'A'
                    }
                ],
                totalQuestions: 1,
                passingScore: 80,
                correctAnswers: 0,
                score: 0,
                passed: false,
                timeSpent: 0,
                userAnswers: [],
                topicBreakdown: {},
                weakAreas: [],
                strongAreas: []
                // Note: NOT setting completedAt
            }
        });

        console.log('✅ Test attempt created:');
        console.log(`   ID: ${testAttempt.id}`);
        console.log(`   Created At: ${testAttempt.createdAt}`);
        console.log(`   Completed At: ${testAttempt.completedAt}`);

        if (testAttempt.completedAt) {
            console.log('❌ completedAt was set automatically!');
        } else {
            console.log('✅ completedAt is null as expected');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

manualTestCreate();