import prisma from './src/utils/prisma.js';

async function completeChaptersForAkshith1234() {
    try {
        console.log('🚀 Completing 5 chapters for akshith1234@gmail.com...\n');

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' },
            include: {
                chapters: {
                    orderBy: { chapterNumber: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { lessonNumber: 'asc' }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('❌ User akshith1234@gmail.com not found');
            return;
        }

        console.log(`✅ Found user: ${user.email}`);
        console.log(`📚 Current chapters: ${user.chapters.length}`);

        if (user.chapters.length < 5) {
            console.log('❌ User needs at least 5 chapters to complete. Please generate curriculum first.');
            return;
        }

        // Complete the first 5 chapters
        for (let chapterNum = 1; chapterNum <= 5; chapterNum++) {
            const chapter = user.chapters.find(ch => ch.chapterNumber === chapterNum);

            if (!chapter) {
                console.log(`❌ Chapter ${chapterNum} not found`);
                continue;
            }

            console.log(`\n📖 Completing Chapter ${chapterNum}: ${chapter.title}`);

            // Complete all lessons in this chapter
            for (const lesson of chapter.lessons) {
                if (!lesson.isCompleted) {
                    await prisma.lesson.update({
                        where: { id: lesson.id },
                        data: {
                            isCompleted: true,
                            completedAt: new Date()
                        }
                    });
                    console.log(`   ✅ Completed Lesson ${lesson.lessonNumber}: ${lesson.title}`);
                } else {
                    console.log(`   ✓ Lesson ${lesson.lessonNumber} already completed`);
                }
            }

            // Mark the chapter as completed with high mastery score
            await prisma.chapter.update({
                where: { id: chapter.id },
                data: {
                    isCompleted: true,
                    completedAt: new Date(),
                    masteryScore: 95 // High mastery score
                }
            });

            console.log(`   🎯 Chapter ${chapterNum} completed with 95% mastery`);
        }

        // Update user progress
        const totalLessonsCompleted = await prisma.lesson.count({
            where: {
                chapter: {
                    userId: user.id
                },
                isCompleted: true
            }
        });

        const totalExercisesCompleted = totalLessonsCompleted * 2; // Assume 2 exercises per lesson

        // Update or create user progress
        await prisma.userProgress.upsert({
            where: { userId: user.id },
            update: {
                currentChapter: 6, // Next chapter to work on
                totalLessonsCompleted,
                totalExercisesCompleted,
                overallAccuracy: 95
            },
            create: {
                userId: user.id,
                currentLevel: user.currentLevel || 'BEGINNER',
                currentChapter: 6,
                currentLesson: 1,
                totalLessonsCompleted,
                totalExercisesCompleted,
                totalQuizzesTaken: 0,
                totalTestsTaken: 0,
                overallAccuracy: 95,
                averageTestScore: 0,
                averageQuizScore: 0,
                topicMastery: {
                    "greetings": 95,
                    "numbers": 95,
                    "verbs": 95,
                    "family": 95,
                    "colors": 95
                },
                identifiedWeaknesses: [],
                totalTimeSpent: 18000, // 5 hours in seconds
                averageSessionTime: 1800, // 30 minutes per session
                longestStreak: 5,
                currentStreak: 5
            }
        });

        console.log('\n🎉 SUCCESS! User akshith1234@gmail.com is now ready for progress test!');
        console.log('📊 Summary:');
        console.log(`   ✅ Completed Chapters: 1-5`);
        console.log(`   📚 Total Lessons Completed: ${totalLessonsCompleted}`);
        console.log(`   🎯 Overall Accuracy: 95%`);
        console.log(`   🚀 Next Chapter: 6`);
        console.log('\n🧪 Test Instructions:');
        console.log('   1. Login with akshith1234@gmail.com / akshith');
        console.log('   2. Should go directly to dashboard (no level-select)');
        console.log('   3. Progress test for chapters 1-5 should be available');
        console.log('   4. Passing the test should generate chapters 6-10');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

completeChaptersForAkshith1234();