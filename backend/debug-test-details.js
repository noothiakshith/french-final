import prisma from './src/utils/prisma.js';

async function debugTestDetails() {
    try {
        console.log('🔍 Debugging test details...\n');

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

        console.log(`📊 Test Attempt Details:`);
        console.log(`   ID: ${testAttempt.id}`);
        console.log(`   Title: ${testAttempt.title}`);
        console.log(`   Chapter Range: ${testAttempt.chapterRange}`);
        console.log(`   Total Questions: ${testAttempt.totalQuestions}`);
        console.log(`   Score: ${testAttempt.score}%`);
        console.log(`   Correct Answers: ${testAttempt.correctAnswers}`);
        console.log(`   Passed: ${testAttempt.passed}`);
        console.log(`   Completed At: ${testAttempt.completedAt}`);

        console.log(`\n📝 Questions (${testAttempt.questions.length}):`);
        testAttempt.questions.forEach((q, index) => {
            console.log(`   Q${index + 1} (ID: ${q.id}): ${q.question}`);
            console.log(`      Type: ${q.type}`);
            console.log(`      Correct Answer: "${q.correctAnswer}"`);
            if (q.options && q.options.length > 0) {
                console.log(`      Options: ${q.options.join(', ')}`);
            }
        });

        console.log(`\n👤 User Answers (${testAttempt.userAnswers.length}):`);
        testAttempt.userAnswers.forEach((answer, index) => {
            console.log(`   A${index + 1}: Q${answer.questionId} = "${answer.userAnswer}"`);
        });

        // Check for grading issues
        console.log(`\n🔍 Grading Analysis:`);
        let manualCorrectCount = 0;
        
        for (const answer of testAttempt.userAnswers) {
            const question = testAttempt.questions.find(q => q.id === answer.questionId);
            if (question) {
                const isCorrect = question.correctAnswer.toLowerCase() === answer.userAnswer.toLowerCase();
                console.log(`   Q${answer.questionId}: "${answer.userAnswer}" vs "${question.correctAnswer}" = ${isCorrect ? '✅' : '❌'}`);
                if (isCorrect) manualCorrectCount++;
            } else {
                console.log(`   Q${answer.questionId}: Question not found!`);
            }
        }

        console.log(`\n📊 Manual Grading Results:`);
        console.log(`   Correct: ${manualCorrectCount}/${testAttempt.questions.length}`);
        console.log(`   Score: ${Math.round((manualCorrectCount / testAttempt.questions.length) * 100)}%`);
        console.log(`   Database Score: ${testAttempt.score}%`);

        if (manualCorrectCount !== testAttempt.correctAnswers) {
            console.log(`⚠️  GRADING MISMATCH DETECTED!`);
            console.log(`   Manual: ${manualCorrectCount} correct`);
            console.log(`   Database: ${testAttempt.correctAnswers} correct`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugTestDetails();