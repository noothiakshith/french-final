import prisma from './src/utils/prisma.js';
import { checkForAndGenerateRemedials } from './src/services/remedialService.js';

async function testRemedialSystem() {
    try {
        console.log('🔍 Testing Remedial System...\n');

        // Find the test user
        const user = await prisma.user.findUnique({
            where: { email: 'niakak@test.com' }
        });

        if (!user) {
            console.log('❌ Test user not found');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

        // Check current mistakes
        const mistakes = await prisma.mistake.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Current mistakes: ${mistakes.length}`);

        if (mistakes.length > 0) {
            const topicCounts = {};
            mistakes.forEach(mistake => {
                topicCounts[mistake.grammarPoint] = (topicCounts[mistake.grammarPoint] || 0) + 1;
            });

            console.log('📈 Mistakes by topic:');
            Object.entries(topicCounts).forEach(([topic, count]) => {
                console.log(`   ${topic}: ${count} mistakes`);
            });
        }

        // Check existing remedial chapters
        const existingRemedials = await prisma.remedialChapter.findMany({
            where: { userId: user.id },
            include: { exercises: true }
        });

        console.log(`\n🔄 Existing remedial chapters: ${existingRemedials.length}`);
        existingRemedials.forEach(chapter => {
            console.log(`   - ${chapter.title} (${chapter.isCompleted ? 'Complete' : 'Incomplete'})`);
            console.log(`     Priority: ${chapter.priority}, Type: ${chapter.remedialType}`);
            console.log(`     Exercises: ${chapter.exercises.length}, Grammar: ${chapter.grammarPoint}`);
        });

        // Try to generate new remedials
        console.log('\n🚀 Checking for new remedial generation...');
        const generatedChapters = await checkForAndGenerateRemedials(user.id);

        if (generatedChapters.length > 0) {
            console.log(`✅ Generated ${generatedChapters.length} new remedial chapters:`);
            generatedChapters.forEach(title => {
                console.log(`   - ${title}`);
            });
        } else {
            console.log('ℹ️  No new remedial chapters generated (threshold not met or already addressed)');
        }

        // Final count
        const finalRemedials = await prisma.remedialChapter.findMany({
            where: { userId: user.id }
        });

        console.log(`\n📋 Total remedial chapters: ${finalRemedials.length}`);
        console.log('✅ Remedial system test complete!');

    } catch (error) {
        console.error('❌ Error testing remedial system:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRemedialSystem();