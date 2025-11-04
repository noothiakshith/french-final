import prisma from './src/utils/prisma.js';

async function checkRecentTests() {
    try {
        console.log('🔍 Checking recent bridge course final tests...\n');
        
        const recentTests = await prisma.testAttempt.findMany({
            where: { testType: 'BRIDGE_FINAL' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: {
                    select: { email: true, currentLevel: true }
                }
            }
        });
        
        console.log(`Found ${recentTests.length} recent bridge final tests:`);
        
        for (const test of recentTests) {
            console.log(`\nTest ID: ${test.id}`);
            console.log(`User: ${test.user.email}`);
            console.log(`Level: ${test.level}`);
            console.log(`Score: ${test.score}%`);
            console.log(`Passed: ${test.passed}`);
            console.log(`Completed: ${test.completedAt ? 'Yes' : 'No'}`);
            console.log(`Created: ${test.createdAt}`);
            
            if (test.passed && test.completedAt) {
                // Check if curriculum was generated
                const chapters = await prisma.chapter.findMany({
                    where: { 
                        userId: test.userId,
                        level: test.level 
                    }
                });
                console.log(`Curriculum chapters generated: ${chapters.length}`);
                
                // Check bridge course status
                const bridgeCourse = await prisma.bridgeCourse.findUnique({
                    where: { userId: test.userId }
                });
                if (bridgeCourse) {
                    console.log(`Bridge course completed: ${bridgeCourse.isCompleted}`);
                    console.log(`Bridge course target level: ${bridgeCourse.targetLevel}`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentTests();