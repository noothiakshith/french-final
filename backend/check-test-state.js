import prisma from './src/utils/prisma.js';

async function checkTestState() {
    try {
        console.log('🔍 Checking test state...\n');

        // Get the latest test attempt
        const testAttempt = await prisma.testAttempt.findFirst({
            where: { 
                userId: (await prisma.user.findUnique({ where: { email: 'akshith@gmail.com' } })).id,
                testType: 'PROGRESS_TEST'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!testAttempt) {
            console.log('❌ No test attempt found');
            return;
        }

        console.log(`📊 Latest Test Attempt:`);
        console.log(`   ID: ${testAttempt.id}`);
        console.log(`   Created At: ${testAttempt.createdAt}`);
        console.log(`   Completed At: ${testAttempt.completedAt}`);
        console.log(`   Score: ${testAttempt.score}%`);
        console.log(`   Passed: ${testAttempt.passed}`);
        console.log(`   User Answers: ${testAttempt.userAnswers.length}`);

        if (testAttempt.completedAt) {
            console.log('⚠️  Test is marked as completed!');
            console.log('   This explains why submission fails');
        } else {
            console.log('✅ Test is not completed - should be submittable');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTestState();