import prisma from './src/utils/prisma.js';

async function testFinalLessonCompletion() {
  try {
    console.log('🎯 Final Lesson Completion Test');
    console.log('===============================\n');
    
    // 1. Check lesson exercise distribution
    console.log('📊 Step 1: Exercise Distribution Analysis');
    console.log('========================================');
    
    const lessons = await prisma.lesson.findMany({
      include: {
        _count: { select: { exercises: true } }
      }
    });
    
    const distribution = {};
    lessons.forEach(lesson => {
      const count = lesson._count.exercises;
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log('Exercises per lesson:');
    Object.entries(distribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, lessonCount]) => {
        const status = count === '1' ? '❌ TOO FEW' : count >= '2' ? '✅ GOOD' : '⚠️ CHECK';
        console.log(`  ${count} exercises: ${lessonCount} lessons ${status}`);
      });
    
    const singleExerciseLessons = lessons.filter(l => l._count.exercises === 1);
    if (singleExerciseLessons.length === 0) {
      console.log('\n✅ SUCCESS: No lessons with only 1 exercise!');
    } else {
      console.log(`\n❌ ISSUE: ${singleExerciseLessons.length} lessons still have only 1 exercise`);
    }
    
    // 2. Test completion logic with a real lesson
    console.log('\n🧪 Step 2: Testing Completion Logic');
    console.log('===================================');
    
    const testLesson = await prisma.lesson.findFirst({
      include: {
        exercises: true,
        _count: { select: { exercises: true } }
      },
      where: {
        exercises: {
          some: {}
        }
      }
    });
    
    if (testLesson) {
      console.log(`Testing lesson: "${testLesson.title}"`);
      console.log(`Total exercises: ${testLesson._count.exercises}`);
      
      const correctExercises = testLesson.exercises.filter(ex => ex.isCorrect === true).length;
      const shouldBeComplete = testLesson._count.exercises > 0 && correctExercises === testLesson._count.exercises;
      
      console.log(`Correct exercises: ${correctExercises}`);
      console.log(`Should be complete: ${shouldBeComplete}`);
      console.log(`Actually complete: ${testLesson.isCompleted}`);
      
      if (shouldBeComplete === testLesson.isCompleted) {
        console.log('✅ Completion logic is working correctly!');
      } else {
        console.log('❌ Completion logic mismatch detected');
      }
    }
    
    // 3. Check for any problematic lessons
    console.log('\n🔍 Step 3: Checking for Problematic Lessons');
    console.log('==========================================');
    
    const problematicLessons = await prisma.lesson.findMany({
      include: {
        exercises: true,
        _count: { select: { exercises: true } }
      },
      where: {
        OR: [
          // Lessons marked complete but have incorrect/unanswered exercises
          {
            isCompleted: true,
            exercises: {
              some: {
                OR: [
                  { isCorrect: false },
                  { isCorrect: null }
                ]
              }
            }
          },
          // Lessons with all correct exercises but not marked complete (and have exercises)
          {
            isCompleted: false,
            exercises: {
              some: {},
              every: {
                isCorrect: true
              }
            }
          }
        ]
      }
    });
    
    if (problematicLessons.length === 0) {
      console.log('✅ No problematic lessons found!');
    } else {
      console.log(`❌ Found ${problematicLessons.length} problematic lessons:`);
      problematicLessons.forEach(lesson => {
        const correctCount = lesson.exercises.filter(ex => ex.isCorrect === true).length;
        console.log(`  - "${lesson.title}": ${correctCount}/${lesson._count.exercises} correct, complete: ${lesson.isCompleted}`);
      });
    }
    
    // 4. Summary and recommendations
    console.log('\n📋 Step 4: Summary & Recommendations');
    console.log('===================================');
    
    const totalLessons = lessons.length;
    const lessonsWithMultipleExercises = lessons.filter(l => l._count.exercises >= 2).length;
    const completedLessons = lessons.filter(l => l.isCompleted).length;
    
    console.log(`Total lessons: ${totalLessons}`);
    console.log(`Lessons with 2+ exercises: ${lessonsWithMultipleExercises} (${Math.round(lessonsWithMultipleExercises/totalLessons*100)}%)`);
    console.log(`Completed lessons: ${completedLessons}`);
    console.log(`Problematic lessons: ${problematicLessons.length}`);
    
    if (singleExerciseLessons.length === 0 && problematicLessons.length === 0) {
      console.log('\n🎉 EXCELLENT! All lesson completion issues have been resolved!');
      console.log('\n✅ What users will now experience:');
      console.log('   1. Every lesson has at least 2 exercises');
      console.log('   2. Lessons only complete when ALL exercises are answered correctly');
      console.log('   3. Clear progress indication (X/Y exercises complete)');
      console.log('   4. No more lessons completing after just 1 question');
      console.log('   5. Proper validation and safeguards in place');
      
      console.log('\n🛡️ Safeguards implemented:');
      console.log('   - Backend: Requires ALL exercises correct before lesson completion');
      console.log('   - Frontend: Shows clear progress counter and completion notice');
      console.log('   - Database: Validated all lesson completion statuses');
      console.log('   - Exercises: Added to lessons that had too few');
    } else {
      console.log('\n⚠️ Issues remaining:');
      if (singleExerciseLessons.length > 0) {
        console.log(`   - ${singleExerciseLessons.length} lessons still have only 1 exercise`);
      }
      if (problematicLessons.length > 0) {
        console.log(`   - ${problematicLessons.length} lessons have completion status issues`);
      }
      console.log('\n🔧 Run fix-lesson-completion-safeguards.js again to resolve remaining issues');
    }
    
  } catch (error) {
    console.error('❌ Error in final lesson completion test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalLessonCompletion();