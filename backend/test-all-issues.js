import prisma from './src/utils/prisma.js';

async function testAllIssues() {
    try {
        console.log('🔍 Comprehensive Issue Testing Script\n');
        
        // Test 1: Check exercise answer validation for numbers
        console.log('📝 Test 1: Exercise Answer Validation');
        console.log('=====================================');
        
        const exercisesWithNumbers = await prisma.exercise.findMany({
            where: {
                OR: [
                    { correctAnswer: { contains: 'numbers' } },
                    { correctAnswer: { contains: '0-20' } },
                    { correctAnswer: { contains: 'zero' } },
                    { correctAnswer: { contains: 'one' } },
                    { correctAnswer: { contains: 'two' } }
                ]
            },
            include: {
                lesson: {
                    select: { title: true, lessonNumber: true }
                }
            },
            take: 10
        });
        
        console.log(`Found ${exercisesWithNumbers.length} exercises with number-related answers:`);
        exercisesWithNumbers.forEach(ex => {
            console.log(`  - Lesson ${ex.lesson.lessonNumber}: ${ex.lesson.title} | Type: ${ex.type} | Answer: "${ex.correctAnswer}"`);
        });
        
        // Test 2: Check lesson completion logic
        console.log('\n📚 Test 2: Lesson Completion Logic');
        console.log('===================================');
        
        const lessonsWithFewExercises = await prisma.lesson.findMany({
            include: {
                exercises: true,
                _count: {
                    select: { exercises: true }
                }
            },
            where: {
                exercises: {
                    some: {}
                }
            },
            orderBy: { lessonNumber: 'asc' },
            take: 10
        });
        
        console.log('Lessons and their exercise counts:');
        lessonsWithFewExercises.forEach(lesson => {
            console.log(`  - Lesson ${lesson.lessonNumber}: "${lesson.title}" - ${lesson._count.exercises} exercises`);
            if (lesson._count.exercises === 1) {
                console.log(`    ⚠️  WARNING: Only 1 exercise - lesson completes too quickly!`);
            }
        });
        
        // Test 3: Check curriculum differences between levels
        console.log('\n🎯 Test 3: Curriculum Level Differences');
        console.log('=======================================');
        
        const beginnerChapters = await prisma.chapter.findMany({
            where: { level: 'BEGINNER' },
            select: { title: true, chapterNumber: true, level: true },
            orderBy: { chapterNumber: 'asc' },
            take: 10
        });
        
        const intermediateChapters = await prisma.chapter.findMany({
            where: { level: 'INTERMEDIATE' },
            select: { title: true, chapterNumber: true, level: true },
            orderBy: { chapterNumber: 'asc' },
            take: 10
        });
        
        console.log('BEGINNER Curriculum (first 10 chapters):');
        beginnerChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title}`);
        });
        
        console.log('\nINTERMEDIATE Curriculum (first 10 chapters):');
        intermediateChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title}`);
        });
        
        // Check for identical titles
        const beginnerTitles = beginnerChapters.map(ch => ch.title);
        const intermediateTitles = intermediateChapters.map(ch => ch.title);
        const identicalTitles = beginnerTitles.filter(title => intermediateTitles.includes(title));
        
        if (identicalTitles.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${identicalTitles.length} identical chapter titles between levels:`);
            identicalTitles.forEach(title => console.log(`    - "${title}"`));
        } else {
            console.log('\n✅ Curriculum levels have different content');
        }
        
        // Test 4: Check exercise types and validation
        console.log('\n🔧 Test 4: Exercise Types and Validation');
        console.log('========================================');
        
        const exerciseTypes = await prisma.exercise.groupBy({
            by: ['type'],
            _count: {
                type: true
            }
        });
        
        console.log('Exercise types distribution:');
        exerciseTypes.forEach(type => {
            console.log(`  - ${type.type}: ${type._count.type} exercises`);
        });
        
        // Test 5: Check for problematic exercise answers
        console.log('\n🚨 Test 5: Problematic Exercise Answers');
        console.log('=======================================');
        
        const problematicExercises = await prisma.exercise.findMany({
            where: {
                OR: [
                    { correctAnswer: { contains: 'numbers 0-20' } },
                    { correctAnswer: { contains: 'type numbers' } },
                    { correctAnswer: { startsWith: 'numbers' } },
                    { type: 'FILL_IN_BLANK', correctAnswer: { contains: ' ' } } // Multi-word answers for fill-in-blank
                ]
            },
            include: {
                lesson: {
                    select: { title: true, lessonNumber: true }
                }
            }
        });
        
        console.log(`Found ${problematicExercises.length} potentially problematic exercises:`);
        problematicExercises.forEach(ex => {
            console.log(`  - Lesson ${ex.lesson.lessonNumber}: ${ex.lesson.title}`);
            console.log(`    Type: ${ex.type} | Question: "${ex.question}"`);
            console.log(`    Answer: "${ex.correctAnswer}"`);
            console.log(`    Issue: ${ex.correctAnswer.includes('numbers') ? 'Instruction instead of answer' : 'Multi-word fill-in-blank'}`);
            console.log('');
        });
        
        // Test 6: Check lesson completion requirements
        console.log('\n📋 Test 6: Lesson Completion Requirements');
        console.log('=========================================');
        
        const userLessons = await prisma.lesson.findMany({
            where: {
                userId: { not: null }
            },
            include: {
                exercises: true,
                user: {
                    select: { email: true }
                }
            },
            take: 5
        });
        
        console.log('Sample user lessons and completion logic:');
        userLessons.forEach(lesson => {
            console.log(`  User: ${lesson.user.email}`);
            console.log(`  Lesson: "${lesson.title}" (${lesson.exercises.length} exercises)`);
            console.log(`  Completed: ${lesson.isCompleted}`);
            // Note: Lesson model doesn't have currentExercise field, checking completion logic differently
            const completedExercises = lesson.exercises.filter(ex => ex.isCorrect === true).length;
            console.log(`  Completed Exercises: ${completedExercises}/${lesson.exercises.length}`);
            
            if (lesson.isCompleted && completedExercises < lesson.exercises.length) {
                console.log(`    ⚠️  WARNING: Lesson marked complete but not all exercises done!`);
            }
            console.log('');
        });
        
        console.log('\n📊 Summary of Issues Found:');
        console.log('===========================');
        
        let issueCount = 0;
        
        if (exercisesWithNumbers.length > 0) {
            console.log(`❌ ${exercisesWithNumbers.length} exercises have instruction-like answers instead of actual answers`);
            issueCount++;
        }
        
        const singleExerciseLessons = lessonsWithFewExercises.filter(l => l._count.exercises === 1);
        if (singleExerciseLessons.length > 0) {
            console.log(`❌ ${singleExerciseLessons.length} lessons have only 1 exercise (complete too quickly)`);
            issueCount++;
        }
        
        if (identicalTitles.length > 0) {
            console.log(`❌ ${identicalTitles.length} identical chapter titles between BEGINNER and INTERMEDIATE levels`);
            issueCount++;
        }
        
        if (problematicExercises.length > 0) {
            console.log(`❌ ${problematicExercises.length} exercises have problematic answer formats`);
            issueCount++;
        }
        
        if (issueCount === 0) {
            console.log('✅ No major issues found!');
        } else {
            console.log(`\n🔧 Total issues to fix: ${issueCount}`);
        }
        
    } catch (error) {
        console.error('❌ Error running tests:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAllIssues();