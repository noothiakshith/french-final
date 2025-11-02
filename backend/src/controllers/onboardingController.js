import prisma from '../utils/prisma.js';
// Import the new course service instead of the AI service directly
import { generateAndSaveCurriculum } from '../services/courseService.js';

export const skipTestAndStart = async (req, res) => {
    const { level } = req.body;
    const userId = req.user.id;

    if (!level || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
        return res.status(400).json({ message: 'A valid level is required.' });
    }

    try {
        const existingChapters = await prisma.chapter.findFirst({ where: { userId } });
        if (existingChapters) {
            return res.status(400).json({ message: 'Course has already been generated.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { currentLevel: level, hasSkippedTest: true },
        });

        // --- SIMPLIFIED LOGIC ---
        // Call the reusable service to do the heavy lifting
        await generateAndSaveCurriculum(userId, level);

        res.status(201).json({
            message: `Successfully generated AI-powered ${level} course.`,
        });

    } catch (error) {
        console.error("Error during 'skipTestAndStart':", error);
        res.status(500).json({ message: 'Server error while setting up the course.' });
    }
};