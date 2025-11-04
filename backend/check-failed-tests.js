import prisma from './src/utils/prisma.js';

async function checkFailedTests() {
    try {
        console.log('🔍 Checking failed bridge course final tests...\n');
        
        const failedTests = await prisma.testAttempt.findMany({
            where: { 
                testType: 'BRIDGE_FINAL',
                passed: false,
                completedAt: { not: null }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: {
                    select: { email: true, currentLevel: true }
                }
            }
        });
        
        console.log(`Found ${failedTests.length} failed bridge final tests:`);
        
        for (const test of failedTests) {
            console.log(`\nUser: ${test.user.email}`);
            console.log(`Score: ${test.score}% (needed ${test.passingScore}%)`);
            console.log(`Questions: ${test.correctAnswers}/${test.totalQuestions} correct`);
            console.log(`Failed by: ${test.passingScore - test.score} points`);
            
            // Check if user has any curriculum
            const chapters = await prisma.chapter.findMany({
                where: { 
                    userId: test.userId,
                    level: test.level 
                }
            });
            console.log(`Has curriculum: ${chapters.length > 0 ? 'Yes (' + chapters.length + ' chapters)' : 'No'}`);
        }
        
        // Check overall statistics
        const allBridgeTests = await prisma.testAttempt.findMany({
            where: { 
                testType: 'BRIDGE_FINAL',
                completedAt: { not: null }
            }
        });
        
        const passedCount = allBridgeTests.filter(t => t.passed).length;
        const totalCount = allBridgeTests.length;
        const averageScore = allBridgeTests.reduce((sum, t) => sum + t.score, 0) / totalCount;
        
        console.log(`\n📊 Overall Statistics:`);
        console.log(`Total completed tests: ${totalCount}`);
        console.log(`Passed: ${passedCount} (${Math.round(passedCount/totalCount*100)}%)`);
        console.log(`Failed: ${totalCount - passedCount} (${Math.round((totalCount-passedCount)/totalCount*100)}%)`);
        console.log(`Average score: ${Math.round(averageScore)}%`);
        console.log(`Current passing score: 85%`);
        
        if (averageScore < 85) {
            console.log(`\n💡 Recommendation: Consider lowering passing score to ${Math.round(averageScore - 5)}% or improving test quality`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFailedTests();