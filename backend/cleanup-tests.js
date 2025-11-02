import prisma from './src/utils/prisma.js';

async function cleanupTests() {
    try {
        console.log('🧹 Cleaning up old test attempts...\n');

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: 'akshith@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        // Delete all progress test attempts
        const result = await prisma.testAttempt.deleteMany({
            where: { 
                userId: user.id,
                testType: 'PROGRESS_TEST'
            }
        });

        console.log(`✅ Deleted ${result.count} progress test attempts`);
        console.log('🚀 Ready for fresh testing!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupTests();