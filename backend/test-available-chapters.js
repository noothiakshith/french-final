import prisma from './src/utils/prisma.js';

async function checkAvailableChapters() {
    try {
        console.log('🔍 Checking available chapters for priya@gmail.com...\n');

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
        console.log(`   Current Level: ${user.currentLevel}\n`);

        // Get all chapters for this user
        const chapters = await prisma.chapter.findMany({
            where: { userId: user.id },
            orderBy: { chapterNumber: 'asc' },
            select: {
                id: true,
                chapterNumber: true,
                title: true,
                level: true,
                isUnlocked: true,
                isCompleted: true,
                isStarted: true
            }
        });

        console.log(`📚 Found ${chapters.length} chapters:`);
        chapters.forEach(chapter => {
            const status = chapter.isCompleted ? '✅ Completed' : 
                          chapter.isStarted ? '🔄 In Progress' : 
                          chapter.isUnlocked ? '🔓 Unlocked' : '🔒 Locked';
            
            console.log(`   Chapter ${chapter.chapterNumber}: ${chapter.title}`);
            console.log(`      ID: ${chapter.id}`);
            console.log(`      Level: ${chapter.level}`);
            console.log(`      Status: ${status}\n`);
        });

        // Also check bridge course chapters
        const bridgeCourse = await prisma.bridgeCourse.findUnique({
            where: { userId: user.id },
            include: {
                chapters: {
                    orderBy: { chapterNumber: 'asc' },
                    select: {
                        id: true,
                        chapterNumber: true,
                        title: true,
                        isCompleted: true
                    }
                }
            }
        });

        if (bridgeCourse) {
            console.log(`🌉 Bridge Course (${bridgeCourse.isCompleted ? 'Completed' : 'In Progress'}):`);
            bridgeCourse.chapters.forEach(chapter => {
                console.log(`   Bridge Chapter ${chapter.chapterNumber}: ${chapter.title}`);
                console.log(`      ID: ${chapter.id}`);
                console.log(`      Status: ${chapter.isCompleted ? '✅ Completed' : '🔄 In Progress'}\n`);
            });
        }

        console.log('🎯 Summary:');
        console.log(`   - Main chapters: ${chapters.length}`);
        console.log(`   - Unlocked chapters: ${chapters.filter(ch => ch.isUnlocked).length}`);
        console.log(`   - Completed chapters: ${chapters.filter(ch => ch.isCompleted).length}`);
        console.log(`   - Bridge course: ${bridgeCourse ? (bridgeCourse.isCompleted ? 'Completed' : 'Available') : 'Not available'}`);

    } catch (error) {
        console.error('❌ Error checking chapters:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAvailableChapters();