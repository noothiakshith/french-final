import prisma from './src/utils/prisma.js';

async function comprehensiveBridgeFix() {
    try {
        console.log('🔧 Comprehensive Bridge Course Fix Script\n');
        console.log('This script will:');
        console.log('1. Update failed tests that scored 80%+ to passed');
        console.log('2. Complete bridge courses for those users');
        console.log('3. Generate main curriculum for eligible users');
        console.log('4. Update future test passing scores to 80%\n');
        
        // Step 1: Find and fix tests that should have passed
        console.log('📊 Step 1: Finding tests that scored 80%+ but failed...');
        
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
        
        console.log(`Found ${testsToFix.length} tests to fix\n`);
        
        for (const test of testsToFix) {
            console.log(`👤 Fixing test for: ${test.user.email}`);
            console.log(`   Score: ${test.score}% → Marking as PASSED`);
            
            // Update test to passed
            await prisma.testAttempt.update({
                where: { id: test.id },
                data: { 
                    passed: true,
                    passingScore: 80 // Update the passing score for this test too
                }
            });
            
            // Get bridge course info
            const bridgeCourseId = test.chapterRange.replace('Bridge-', '');
            const bridgeCourse = await prisma.bridgeCourse.findUnique({
                where: { id: bridgeCourseId }
            });
            
            if (bridgeCourse) {
                // Mark bridge course as completed if not already
                if (!bridgeCourse.isCompleted) {
                    await prisma.bridgeCourse.update({
                        where: { id: bridgeCourseId },
                        data: { 
                            isCompleted: true, 
                            finalTestScore: test.score, 
                            completedAt: new Date(),
                            completedChapters: bridgeCourse.totalChapters
                        }
                    });
                    console.log('   ✅ Bridge course marked as completed');
                }
                
                // Check for existing curriculum
                const existingChapters = await prisma.chapter.findMany({
                    where: { 
                        userId: test.userId,
                        level: test.level 
                    }
                });
                
                if (existingChapters.length === 0) {
                    console.log('   🚀 Generating main curriculum...');
                    try {
                        const { generateAndSaveCurriculum } = await import('./src/services/courseService.js');
                        await generateAndSaveCurriculum(test.userId, test.level);
                        
                        const newChapters = await prisma.chapter.findMany({
                            where: { 
                                userId: test.userId,
                                level: test.level 
                            }
                        });
                        console.log(`   ✅ Generated ${newChapters.length} curriculum chapters`);
                    } catch (curriculumError) {
                        console.error('   ❌ Curriculum generation failed:', curriculumError.message);
                    }
                } else {
                    console.log(`   📚 Curriculum already exists (${existingChapters.length} chapters)`);
                }
            }
            console.log('');
        }
        
        // Step 2: Update all existing bridge final tests to use 80% passing score
        console.log('📊 Step 2: Updating passing scores for all bridge final tests...');
        
        const updatedTests = await prisma.testAttempt.updateMany({
            where: { 
                testType: 'BRIDGE_FINAL',
                passingScore: 85
            },
            data: { 
                passingScore: 80
            }
        });
        
        console.log(`Updated ${updatedTests.count} test records to use 80% passing score\n`);
        
        // Step 3: Summary report
        console.log('📈 Final Summary Report:');
        
        const allBridgeTests = await prisma.testAttempt.findMany({
            where: { 
                testType: 'BRIDGE_FINAL',
                completedAt: { not: null }
            }
        });
        
        const passedCount = allBridgeTests.filter(t => t.passed).length;
        const totalCount = allBridgeTests.length;
        const averageScore = allBridgeTests.reduce((sum, t) => sum + t.score, 0) / totalCount;
        
        console.log(`Total completed bridge tests: ${totalCount}`);
        console.log(`Passed: ${passedCount} (${Math.round(passedCount/totalCount*100)}%)`);
        console.log(`Failed: ${totalCount - passedCount} (${Math.round((totalCount-passedCount)/totalCount*100)}%)`);
        console.log(`Average score: ${Math.round(averageScore)}%`);
        console.log(`New passing score: 80%`);
        
        // Check users with curriculum
        const usersWithCurriculum = await prisma.user.findMany({
            where: {
                chapters: {
                    some: {}
                }
            },
            include: {
                _count: {
                    select: { chapters: true }
                }
            }
        });
        
        console.log(`\nUsers with main curriculum: ${usersWithCurriculum.length}`);
        
        console.log('\n🎉 Bridge course fix completed successfully!');
        console.log('All eligible users should now have access to their main curriculum.');
        
    } catch (error) {
        console.error('❌ Error in comprehensive fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveBridgeFix();