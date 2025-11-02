import prisma from './src/utils/prisma.js';

async function checkSpecificChapter() {
    const chapterId = 'f0fe8364-8c21-4ab9-bc4d-c4d5519a5b14';
    
    try {
        console.log(`🔍 Checking chapter ID: ${chapterId}\n`);

        // Check if this chapter exists
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                user: {
                    select: { email: true, currentLevel: true }
                },
                lessons: {
                    select: { id: true, title: true, isCompleted: true }
                }
            }
        });

        if (!chapter) {
            console.log('❌ Chapter not found in database');
            
            // Let's find all chapters to see what's available
            console.log('\n🔍 Looking for all chapters...');
            const allChapters = await prisma.chapter.findMany({
                select: {
                    id: true,
                    chapterNumber: true,
                    title: true,
                    level: true,
                    user: {
                        select: { email: true }
                    }
                },
                orderBy: { chapterNumber: 'asc' }
            });

            console.log(`\n📚 Found ${allChapters.length} total chapters:`);
            allChapters.forEach(ch => {
                console.log(`   ${ch.user.email} - Chapter ${ch.chapterNumber}: ${ch.title}`);
                console.log(`      ID: ${ch.id}`);
                console.log(`      Level: ${ch.level}\n`);
            });
            
        } else {
            console.log('✅ Chapter found!');
            console.log(`   Title: ${chapter.title}`);
            console.log(`   Chapter Number: ${chapter.chapterNumber}`);
            console.log(`   Level: ${chapter.level}`);
            console.log(`   User: ${chapter.user.email}`);
            console.log(`   Unlocked: ${chapter.isUnlocked}`);
            console.log(`   Completed: ${chapter.isCompleted}`);
            console.log(`   Lessons: ${chapter.lessons.length}`);
        }

    } catch (error) {
        console.error('❌ Error checking chapter:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificChapter();