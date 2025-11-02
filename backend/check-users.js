import prisma from './src/utils/prisma.js';

async function checkUsers() {
    try {
        console.log('🔍 Checking all users in database...\n');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                currentLevel: true,
                createdAt: true,
                _count: {
                    chapters: true
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`👥 Found ${users.length} users:\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.name || 'Not set'}`);
            console.log(`   Level: ${user.currentLevel}`);
            console.log(`   Chapters: ${user._count.chapters}`);
            console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
            console.log(`   ID: ${user.id}\n`);
        });

        // Check if there are any chapters with the problematic ID
        const problematicChapter = await prisma.chapter.findUnique({
            where: { id: 'f0fe8364-8c21-4ab9-bc4d-c4d5519a5b14' },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        if (problematicChapter) {
            console.log(`🔍 Found problematic chapter:`);
            console.log(`   Title: ${problematicChapter.title}`);
            console.log(`   User: ${problematicChapter.user.email}`);
            console.log(`   Level: ${problematicChapter.level}`);
        } else {
            console.log(`❌ Chapter f0fe8364-8c21-4ab9-bc4d-c4d5519a5b14 does not exist in database`);
        }

    } catch (error) {
        console.error('❌ Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();