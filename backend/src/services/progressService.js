import prisma from '../utils/prisma.js';

/**
 * Update user streak when they log in or perform activity.
 */
export const updateUserStreak = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) return; // Happens only for users without streak initialized

  const lastActivity = new Date(streak.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = (today - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysDiff === 1) {
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: { increment: 1 },
        lastActivityDate: new Date(),
      },
    });

    if (updated.currentStreak > updated.longestStreak) {
      await prisma.streak.update({
        where: { userId },
        data: { longestStreak: updated.currentStreak },
      });
    }
  } else if (daysDiff > 1) {
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: new Date(),
      },
    });
  }
};

/**
 * Update UserProgress when a lesson is completed.
 */
export const updateProgressOnLessonComplete = async (userId) => {
  try {
    const completedLessons = await prisma.lesson.count({
      where: { userId, isCompleted: true },
    });

    const nextLesson = await prisma.lesson.findFirst({
      where: { userId, isCompleted: false, chapter: { isUnlocked: true } },
      orderBy: [
        { chapter: { chapterNumber: 'asc' } },
        { lessonNumber: 'asc' },
      ],
      select: { lessonNumber: true, chapter: { select: { chapterNumber: true } } },
    });

    await prisma.userProgress.update({
      where: { userId },
      data: {
        totalLessonsCompleted: completedLessons,
        currentChapter: nextLesson ? nextLesson.chapter.chapterNumber : undefined,
        currentLesson: nextLesson ? nextLesson.lessonNumber : undefined,
      },
    });

    // Check if we need to unlock the next section of chapters
    await checkAndUnlockNextSection(userId);
    
    console.log(`✅ Progress updated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to update progress for user ${userId}:`, error);
  }
};

/**
 * Check if a section is completed and unlock the next section automatically
 */
export const checkAndUnlockNextSection = async (userId) => {
  try {
    // Find completed chapters grouped by section
    const completedChapters = await prisma.chapter.findMany({
      where: { userId, isCompleted: true },
      select: { chapterNumber: true, sectionNumber: true, level: true },
      orderBy: { chapterNumber: 'asc' }
    });

    if (completedChapters.length === 0) return;

    // Group by section and level
    const sectionCounts = completedChapters.reduce((acc, chapter) => {
      const key = `${chapter.level}-${chapter.sectionNumber}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Check each section to see if it has 5 completed chapters
    for (const [sectionKey, count] of Object.entries(sectionCounts)) {
      if (count >= 5) {
        const [level, sectionNum] = sectionKey.split('-');
        const sectionNumber = parseInt(sectionNum);
        
        // Calculate the next section's chapter range
        const nextSectionStart = sectionNumber * 5 + 1;
        const nextSectionEnd = (sectionNumber + 1) * 5;
        
        // Check if the next section exists and is locked
        const nextSectionChapters = await prisma.chapter.findMany({
          where: {
            userId,
            level,
            chapterNumber: {
              gte: nextSectionStart,
              lte: nextSectionEnd
            }
          }
        });

        // If next section chapters exist and are locked, unlock them
        if (nextSectionChapters.length > 0) {
          const lockedChapters = nextSectionChapters.filter(ch => !ch.isUnlocked);
          
          if (lockedChapters.length > 0) {
            await prisma.chapter.updateMany({
              where: {
                userId,
                level,
                chapterNumber: {
                  gte: nextSectionStart,
                  lte: nextSectionEnd
                }
              },
              data: {
                isUnlocked: true,
                unlockedAt: new Date()
              }
            });
            
            console.log(`🔓 Auto-unlocked chapters ${nextSectionStart}-${nextSectionEnd} for user ${userId} after completing section ${sectionNumber}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error checking/unlocking next section for user ${userId}:`, error);
  }
};

/**
 * Update UserProgress when a test is completed.
 */
export const updateProgressOnTestComplete = async (userId) => {
  try {
    const testAttempts = await prisma.testAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      select: { score: true },
    });

    const total = testAttempts.length;
    const avgScore =
      total > 0 ? testAttempts.reduce((sum, t) => sum + t.score, 0) / total : 0;

    await prisma.userProgress.update({
      where: { userId },
      data: {
        totalTestsTaken: total,
        averageTestScore: Math.round(avgScore),
      },
    });
    console.log(`✅ Test progress updated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error updating test progress for user ${userId}:`, error);
  }
};

/**
 * Check and handle level progression after bridge course completion
 */
export const checkForLevelProgression = async (userId, testScore, testType) => {
  try {
    if (testScore < 80) {
      console.log(`❌ Score ${testScore}% is below 80% threshold for level progression`);
      return false;
    }

    if (testType !== 'BRIDGE_FINAL' && testType !== 'FINAL_TEST') {
      return false; // Only advance on bridge course or final test completion
    }

    // Get current user level
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true, email: true }
    });

    if (!user) {
      console.error(`❌ User ${userId} not found`);
      return false;
    }

    // Determine target level based on current level
    let targetLevel = null;
    if (user.currentLevel === 'BEGINNER') {
      targetLevel = 'INTERMEDIATE';
    } else if (user.currentLevel === 'INTERMEDIATE') {
      targetLevel = 'ADVANCED';
    }

    if (!targetLevel) {
      console.log(`ℹ️ User ${user.email} is already at maximum level (${user.currentLevel})`);
      return false;
    }

    console.log(`🚀 Advancing user ${user.email} from ${user.currentLevel} to ${targetLevel} (Score: ${testScore}%)`);

    // Update user level
    await prisma.user.update({
      where: { id: userId },
      data: { currentLevel: targetLevel }
    });

    // Update user progress
    await prisma.userProgress.upsert({
      where: { userId },
      update: {
        currentLevel: targetLevel,
        currentChapter: 1,
        currentLesson: 1
      },
      create: {
        userId,
        currentLevel: targetLevel,
        currentChapter: 1,
        currentLesson: 1,
        topicMastery: {},
        identifiedWeaknesses: { weaknesses: [] }
      }
    });

    // Initialize curriculum for new level
    await initializeCurriculumForLevel(userId, targetLevel);

    console.log(`✅ Successfully advanced user ${user.email} to ${targetLevel} level`);
    return true;

  } catch (error) {
    console.error(`❌ Error in level progression for user ${userId}:`, error);
    return false;
  }
};

/**
 * Initialize curriculum for a specific level
 */
export const initializeCurriculumForLevel = async (userId, level) => {
  try {
    console.log(`📚 Initializing ${level} curriculum for user ${userId}...`);

    // Check if curriculum already exists for this level
    const existingChapters = await prisma.chapter.count({
      where: { userId, level }
    });

    if (existingChapters > 0) {
      console.log(`ℹ️ Curriculum for ${level} already exists (${existingChapters} chapters)`);
      return;
    }

    const chapterTitles = {
      'INTERMEDIATE': [
        'Past Experiences', 'Future Plans', 'Describing People and Places', 
        'Weather and Seasons', 'Hobbies and Interests', 'At the Restaurant',
        'Travel and Vacation', 'Health and Body', 'Work and Professions', 'Expressing Opinions'
      ],
      'ADVANCED': [
        'The Subjunctive Mood', 'Complex Past Tenses', 'Conditional Mood',
        'Relative Pronouns', 'French Literature and Culture', 'Business French',
        'Advanced Conversation', 'French Media and News', 'Regional Variations', 'Mastery Integration'
      ]
    };

    const titles = chapterTitles[level] || [];
    
    for (let i = 0; i < titles.length; i++) {
      const chapterNumber = i + 1;
      const sectionNumber = Math.ceil(chapterNumber / 5);
      const isUnlocked = chapterNumber <= 5; // Only first 5 chapters unlocked initially

      const chapter = await prisma.chapter.create({
        data: {
          userId,
          level,
          chapterNumber,
          sectionNumber,
          title: titles[i],
          topic: titles[i],
          description: `Learn about ${titles[i].toLowerCase()} in ${level.toLowerCase()} French.`,
          estimatedMinutes: 60,
          content: {
            introduction: `Welcome to ${titles[i]}`,
            objectives: [`Master ${titles[i].toLowerCase()} concepts`]
          },
          learningObjectives: { 
            goals: [`Master ${titles[i].toLowerCase()} concepts`] 
          },
          isUnlocked,
          unlockedAt: isUnlocked ? new Date() : null
        }
      });

      // Create basic lessons for each chapter
      for (let lessonNum = 1; lessonNum <= 2; lessonNum++) {
        const lesson = await prisma.lesson.create({
          data: {
            chapterId: chapter.id,
            userId,
            lessonNumber: lessonNum,
            title: `${titles[i]} - Lesson ${lessonNum}`,
            topic: titles[i],
            content: {
              text: `This is lesson ${lessonNum} about ${titles[i].toLowerCase()}.`,
              examples: []
            },
            grammarPoints: { points: [] },
            vocabulary: { words: [] },
            examples: { pairs: [] }
          }
        });

        // Create basic exercises for each lesson
        for (let exerciseNum = 1; exerciseNum <= 3; exerciseNum++) {
          await prisma.exercise.create({
            data: {
              lessonId: lesson.id,
              userId,
              exerciseNumber: exerciseNum,
              type: 'FILL_IN_BLANK',
              question: `Complete this ${titles[i].toLowerCase()} exercise ${exerciseNum}`,
              correctAnswer: 'answer',
              grammarPoint: titles[i].toLowerCase().replace(/\s+/g, '_'),
              difficulty: 'MEDIUM',
              topic: titles[i]
            }
          });
        }
      }
    }

    console.log(`✅ Successfully created ${titles.length} chapters for ${level} level`);

  } catch (error) {
    console.error(`❌ Error initializing curriculum for ${level}:`, error);
  }
};
