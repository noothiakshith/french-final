import prisma from './src/utils/prisma.js';

async function debugProgressTest() {
    try {
        console.log('🔍 Debugging progress test creation...\n');

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' },
            include: {
                chapters: {
                    where: { isCompleted: true },
                    orderBy: { chapterNumber: 'asc' }
                }
            }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ User: ${user.email}`);
        console.log(`📚 Completed Chapters: ${user.chapters.length}`);

        // Show completed chapters
        user.chapters.forEach(ch => {
            console.log(`   Chapter ${ch.chapterNumber}: ${ch.title} (${ch.topic})`);
        });

        // Check if we can create a progress test for chapters 1-5
        const chapterRange = "1-5";
        const [start, end] = chapterRange.split('-').map(Number);
        const chapterNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        console.log(`\n🎯 Testing range: ${chapterRange}`);
        console.log(`   Expected chapters: ${chapterNumbers.join(', ')}`);

        const completedChapters = user.chapters.filter(ch => 
            chapterNumbers.includes(ch.chapterNumber)
        );

        console.log(`   Completed in range: ${completedChapters.length}/${chapterNumbers.length}`);

        if (completedChapters.length === chapterNumbers.length) {
            console.log('✅ User is ready for progress test!');
            
            // Show what data would be sent to AI
            console.log('\n📝 Data for AI test generation:');
            completedChapters.forEach(ch => {
                console.log(`   - Chapter ${ch.chapterNumber}: ${ch.title}`);
                console.log(`     Topic: ${ch.topic}`);
                console.log(`     Description: ${ch.description}`);
            });
        } else {
            console.log('❌ User not ready for progress test');
        }

        // Check existing test attempts
        const existingTests = await prisma.testAttempt.findMany({
            where: { 
                userId: user.id,
                testType: 'PROGRESS_TEST'
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`\n📊 Existing Progress Tests: ${existingTests.length}`);
        existingTests.forEach((test, index) => {
            console.log(`   Test ${index + 1}: ${test.title} (${test.chapterRange})`);
            console.log(`     Status: ${test.completedAt ? 'Completed' : 'In Progress'}`);
            console.log(`     Score: ${test.score}% (${test.passed ? 'PASSED' : 'FAILED'})`);
            console.log(`     Questions: ${test.questions.length}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugProgressTest();