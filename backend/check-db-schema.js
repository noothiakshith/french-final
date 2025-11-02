import prisma from './src/utils/prisma.js';

async function checkDbSchema() {
    try {
        console.log('🔍 Checking database schema...\n');

        // Check the raw SQL to see the actual table structure
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'test_attempts' 
            AND column_name IN ('created_at', 'completed_at')
            ORDER BY column_name;
        `;

        console.log('📊 Database Schema for test_attempts:');
        result.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });

        // Also check if there are any existing records
        const count = await prisma.testAttempt.count();
        console.log(`\n📈 Total test attempts in database: ${count}`);

        if (count > 0) {
            const sample = await prisma.testAttempt.findFirst({
                select: {
                    id: true,
                    createdAt: true,
                    completedAt: true
                }
            });
            console.log('\n📝 Sample record:');
            console.log(`   ID: ${sample.id}`);
            console.log(`   Created At: ${sample.createdAt}`);
            console.log(`   Completed At: ${sample.completedAt}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDbSchema();