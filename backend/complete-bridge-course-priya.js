import prisma from './src/utils/prisma.js';

async function completeBridgeCourseForPriya() {
    try {
        console.log('🔍 Finding user priya@gmail.com...\n');

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'teacher@gmail.com' }
        });

        if (!user) {
            console.log('❌ User priya@gmail.com not found');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
        console.log(`   Current Level: ${user.currentLevel}\n`);

        // Check if user has a bridge course
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
            where: { userId: user.id },
            include: {
                chapters: {
                    include: {
                        exercises: true
                    },
                    orderBy: { chapterNumber: 'asc' }
                }
            }
        });

        if (!bridgeCourse) {
            console.log('❌ No bridge course found for this user');
            return;
        }

        console.log(`📚 Bridge Course Found:`);
        console.log(`   Target Level: ${bridgeCourse.targetLevel}`);
        console.log(`   Is Completed: ${bridgeCourse.isCompleted}`);
        console.log(`   Chapters: ${bridgeCourse.chapters.length}\n`);

        if (bridgeCourse.isCompleted) {
            console.log('✅ Bridge course is already completed!');
        } else {
            // Complete all bridge chapters
            for (const chapter of bridgeCourse.chapters) {
                console.log(`📖 Processing Chapter: ${chapter.title}`);
                console.log(`   Exercises: ${chapter.exercises.length}`);
                
                // Create a few mistakes for testing the remedial system
                if (chapter.chapterNumber === 1 && chapter.exercises.length > 0) {
                    const firstExercise = chapter.exercises[0];
                    try {
                        await prisma.mistake.create({
                            data: {
                                userId: user.id,
                                sourceType: 'BRIDGE_EXERCISE',
                                sourceId: firstExercise.id,
                                level: bridgeCourse.targetLevel,
                                topic: chapter.topic,
                                grammarPoint: firstExercise.grammarPoint,
                                question: firstExercise.question,
                                correctAnswer: firstExercise.correctAnswer,
                                userAnswer: 'wrong answer',
                                mistakeType: 'INCORRECT_ANSWER',
                                errorCategory: 'GRAMMAR',
                                severity: 'MODERATE',
                                isAddressed: false
                            }
                        });
                        console.log(`   📝 Added mistake for remedial system testing`);
                    } catch (mistakeError) {
                        console.log(`   ⚠️ Could not create mistake (may already exist)`);
                    }
                }

                // Mark chapter as completed
                await prisma.bridgeChapter.update({
                    where: { id: chapter.id },
                    data: {
                        isCompleted: true,
                        completedAt: new Date(),
                        masteryScore: 95.0
                    }
                });
                console.log(`   ✅ Chapter completed: ${chapter.title}\n`);
            }

            // Mark the entire bridge course as completed
            await prisma.bridgeCourse.update({
                where: { id: bridgeCourse.id },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    completedChapters: bridgeCourse.chapters.length
                }
            });

            console.log('🎉 Bridge Course Completed!\n');
        }

        // Check if main curriculum chapters exist
        const existingChapters = await prisma.chapter.findMany({
            where: {
                userId: user.id,
                level: bridgeCourse.targetLevel
            },
            orderBy: { chapterNumber: 'asc' }
        });

        console.log(`📊 Existing main curriculum chapters: ${existingChapters.length}`);

        if (existingChapters.length === 0) {
            console.log('🚀 Generating main curriculum...');
            
            // Import and use the course service
            try {
                const { generateAndSaveCurriculum } = await import('./src/services/courseService.js');
                await generateAndSaveCurriculum(user.id, bridgeCourse.targetLevel);
                console.log('✅ Main curriculum generated successfully!');
                
                // Check what was generated
                const newChapters = await prisma.chapter.findMany({
                    where: { userId: user.id },
                    orderBy: { chapterNumber: 'asc' }
                });
                
                console.log(`📚 Generated ${newChapters.length} chapters:`);
                newChapters.forEach(chapter => {
                    console.log(`   - Chapter ${chapter.chapterNumber}: ${chapter.title} (${chapter.isUnlocked ? 'Unlocked' : 'Locked'})`);
                });
                
            } catch (curriculumError) {
                console.error('❌ Error generating curriculum:', curriculumError.message);
                console.log('💡 The system will generate chapters when user accesses dashboard.');
            }
        } else {
            console.log('📚 Main curriculum chapters already exist:');
            existingChapters.slice(0, 5).forEach(chapter => {
                console.log(`   - Chapter ${chapter.chapterNumber}: ${chapter.title} (${chapter.isUnlocked ? 'Unlocked' : 'Locked'})`);
            });
        }

        console.log('\n🎯 Summary:');
        console.log('✅ Bridge course completed');
        console.log('✅ User ready for main curriculum');
        console.log('✅ Mistakes added for remedial system testing');
        console.log('\n🚀 User can now log in and start learning!');

    } catch (error) {
        console.error('❌ Error completing bridge course:', error);
    } finally {
        await prisma.$disconnect();
    }
}

completeBridgeCourseForPriya();