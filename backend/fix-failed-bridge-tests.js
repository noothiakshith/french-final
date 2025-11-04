import prisma from './src/utils/prisma.js';

async function fixFailedBridgeTests() {
    try {
        console.log('🔧 Fixing failed bridge course tests that should have passed...\n');
        
        // Find tests that scored 80% or higher but failed due to 85% requirement
        const testsToFix = await prisma.testAttempt.findMany({
            where: { 
                testType: 'BRIDGE_FINAL',
                passed: false,
                completedAt: { not: null },
                score: { gte: 80 }
            },
            include: {
                user: {
                    select: { email: true, currentLevel: true }
                }
            }
        });
        
        console.log(`Found ${testsToFix.length} tests to fix:`);
        
        for (const test of testsToFix) {
            console.log(`\n👤 User: ${test.user.email}`);
            console.log(`📊 Score: ${test.score}% (should pass with 80% threshold)`);
            
            // Update the test to mark as passed
            await prisma.testAttempt.update({
                where: { id: test.id },
                data: { passed: true }
            });
            console.log('✅ Test marked as passed');
            
            // Mark bridge course as completed
            const bridgeCourseId = test.chapterRange.replace('Bridge-', '');
            const bridgeCourse = await prisma.bridgeCourse.findUnique({
                where: { id: bridgeCourseId }
            });
            
            if (bridgeCourse && !bridgeCourse.isCompleted) {
                await prisma.bridgeCourse.update({
                    where: { id: bridgeCourseId },
                    data: { 
                        isCompleted: true, 
                        finalTestScore: test.score, 
                        completedAt: new Date(),
                        completedChapters: bridgeCourse.totalChapters
                    }
                });
                console.log('✅ Bridge course marked as completed');
            }
            
            // Check if curriculum already exists
            const existingChapters = await prisma.chapter.findMany({
                where: { 
                    userId: test.userId,
                    level: test.level 
                }
            });
            
            if (existingChapters.length === 0) {
                console.log('🚀 Generating curriculum...');
                try {
                    const { generateAndSaveCurriculum } = await import('./src/services/courseService.js');
                    await generateAndSaveCurriculum(test.userId, test.level);
                    
                    const newChapters = await prisma.chapter.findMany({
                        where: { 
                            userId: test.userId,
                            level: test.level 
                        }
                    });
                    console.log(`✅ Generated ${newChapters.length} curriculum chapters`);
                } catch (curriculumError) {
                    console.error('❌ Error generating curriculum:', curriculumError.message);
                }
            } else {
                console.log(`📚 Curriculum already exists (${existingChapters.length} chapters)`);
            }
        }
        
        console.log(`\n🎉 Fixed ${testsToFix.length} bridge course tests!`);
        console.log('Users can now access their main curriculum.');
        
    } catch (error) {
        console.error('❌ Error fixing tests:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixFailedBridgeTests();