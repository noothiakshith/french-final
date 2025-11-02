import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { checkForAndGenerateRemedials } from './remedialService.js';

/**
 * Starts all scheduled tasks
 */
export function startScheduledTasks() {
    console.log('🕒 Starting scheduled tasks...');
    
    // Run remedial check every 3 hours
    cron.schedule('0 */3 * * *', async () => {
        console.log('🔄 Running scheduled remedial check...');
        await runRemedialCheckForAllUsers();
    });

    // Also run a daily cleanup at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('🧹 Running daily cleanup tasks...');
        await cleanupOldData();
    });

    console.log('✅ Scheduled tasks started successfully');
}

/**
 * Runs remedial check for all active users
 */
async function runRemedialCheckForAllUsers() {
    try {
        // Get all users who have been active in the last 7 days
        const activeUsers = await prisma.user.findMany({
            where: {
                lastLoginAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            select: { id: true, email: true }
        });

        console.log(`🔍 Checking remedials for ${activeUsers.length} active users...`);

        let totalGenerated = 0;
        for (const user of activeUsers) {
            try {
                const generatedChapters = await checkForAndGenerateRemedials(user.id);
                if (generatedChapters.length > 0) {
                    console.log(`✅ Generated ${generatedChapters.length} remedial chapters for ${user.email}`);
                    totalGenerated += generatedChapters.length;
                }
            } catch (error) {
                console.error(`❌ Error generating remedials for user ${user.email}:`, error);
            }
        }

        console.log(`🎯 Scheduled remedial check complete. Generated ${totalGenerated} total chapters.`);
    } catch (error) {
        console.error('❌ Error in scheduled remedial check:', error);
    }
}

/**
 * Cleans up old data to keep the database optimized
 */
async function cleanupOldData() {
    try {
        // Clean up old mistake records that are older than 6 months and already addressed
        const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        
        const deletedMistakes = await prisma.mistake.deleteMany({
            where: {
                createdAt: { lt: sixMonthsAgo },
                isAddressed: true
            }
        });

        console.log(`🗑️ Cleaned up ${deletedMistakes.count} old addressed mistakes`);

        // Clean up old test attempts (keep only the latest 10 per user)
        const users = await prisma.user.findMany({ select: { id: true } });
        
        for (const user of users) {
            const oldAttempts = await prisma.testAttempt.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                skip: 10 // Keep the latest 10
            });

            if (oldAttempts.length > 0) {
                await prisma.testAttempt.deleteMany({
                    where: {
                        id: { in: oldAttempts.map(a => a.id) }
                    }
                });
            }
        }

        console.log('🧹 Daily cleanup completed');
    } catch (error) {
        console.error('❌ Error in daily cleanup:', error);
    }
}

/**
 * Manually trigger remedial check for all users (for testing)
 */
export async function manualRemedialCheckAll() {
    console.log('🚀 Manual remedial check triggered for all users...');
    await runRemedialCheckForAllUsers();
}