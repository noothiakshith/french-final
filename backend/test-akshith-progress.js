import prisma from './src/utils/prisma.js';

async function testAkshithProgress() {
    try {
        console.log('🔍 Testing akshith@gmail.com progress...\n');

        // Get user with all related data
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' },
            include: {
                chapters: {
                    orderBy: { chapterNumber: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { lessonNumber: 'asc' },
                            include: {
                                exercises: true
                            }
                        }
                    }
                },
                userProgress: true,
                streaks: true
            }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ User: ${user.email}`);
        console.log(`📊 Current Level: ${user.currentLevel}`);
        console.log(`🎯 Has Skipped Test: ${user.hasSkippedTest}`);
        console.log(`📝 Placement Test Score: ${user.placementTestScore || 'Not taken'}`);
        console.log(`📚 Total Chapters: ${user.chapters.length}`);

        // Check completed chapters
        const completedChapters = user.chapters.filter(ch => ch.isCompleted);
        console.log(`✅ Completed Chapters: ${completedChapters.length}`);

        if (completedChapters.length > 0) {
            console.log('\n📖 Completed Chapters:');
            completedChapters.forEach(ch => {
                console.log(`   Chapter ${ch.chapterNumber}: ${ch.title} (${ch.masteryScore}% mastery)`);
            });
        }

        // Check if progress test should be available
        const firstSectionComplete = completedChapters.length >= 5;
        console.log(`\n🎯 First Section (Chapters 1-5) Complete: ${firstSectionComplete}`);

        if (firstSectionComplete) {
            console.log('✅ Progress test should be available!');
            console.log('🔒 Chapters 6+ should be locked until progress test is passed');
        }

        // Show user progress
        if (user.userProgress) {
            console.log('\n📊 User Progress:');
            console.log(`   Current Chapter: ${user.userProgress.currentChapter}`);
            console.log(`   Lessons Completed: ${user.userProgress.totalLessonsCompleted}`);
            console.log(`   Exercises Completed: ${user.userProgress.totalExercisesCompleted}`);
            console.log(`   Overall Accuracy: ${user.userProgress.overallAccuracy}%`);
        }

        // Show streak
        if (user.streaks && user.streaks.length > 0) {
            const streak = user.streaks[0];
            console.log('\n🔥 Streak:');
            console.log(`   Current Streak: ${streak.currentStreak} days`);
            console.log(`   Longest Streak: ${streak.longestStreak} days`);
        }

        console.log('\n🚀 Ready for testing!');
        console.log('   1. Login with akshith@gmail.com / akshith');
        console.log('   2. Should go directly to dashboard (no level-select)');
        console.log('   3. Dashboard should show progress test available');
        console.log('   4. Curriculum should show completed chapters 1-5');
        console.log('   5. Chapters 6+ should be locked');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAkshithProgress();