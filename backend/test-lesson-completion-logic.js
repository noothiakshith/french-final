import prisma from './src/utils/prisma.js';

async function testLessonCompletionLogic() {
  try {
    console.log('🧪 Testing Lesson Completion Logic');
    console.log('==================================\n');
    
    // Find a lesson with multiple exercises
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
    
    if (!testLesson) {
      console.log('❌ No lessons found with exercises');
      return;
    }
    
    console.log(`📚 Test Lesson: "${testLesson.title}"`);
    console.log(`   Topic: ${testLesson.topic}`);
    console.log(`   Total Exercises: ${testLesson._count.exercises}`);
    console.log(`   Is Completed: ${testLesson.isCompleted}`);
    console.log('');
    
    console.log('📝 Exercises in this lesson:');
    testLesson.exercises.forEach((exercise, index) => {
      console.log(`   ${index + 1}. Question: "${exercise.question}"`);
      console.log(`      Answer: "${exercise.correctAnswer}"`);
      console.log(`      Type: ${exercise.type}`);
      console.log(`      Is Correct: ${exercise.isCorrect}`);
      console.log(`      Attempts: ${exercise.attempts}`);
      console.log('');
    });
    
    // Check completion logic
    const totalExercises = testLesson.exercises.length;
    const correctExercises = testLesson.exercises.filter(ex => ex.isCorrect === true).length;
    
    console.log('🔍 Completion Analysis:');
    console.log(`   Total exercises: ${totalExercises}`);
    console.log(`   Correct exercises: ${correctExercises}`);
    console.log(`   Should be complete: ${totalExercises > 0 && correctExercises === totalExercises}`);
    console.log(`   Actually complete: ${testLesson.isCompleted}`);
    
    if (testLesson.isCompleted && correctExercises < totalExercises) {
      console.log('   ❌ ISSUE: Lesson marked complete but not all exercises answered correctly!');
    } else if (!testLesson.isCompleted && correctExercises === totalExercises) {
      console.log('   ❌ ISSUE: All exercises correct but lesson not marked complete!');
    } else {
      console.log('   ✅ Completion status is correct');
    }
    
    // Test the exact logic from exerciseController.js
    console.log('\n🧮 Testing Backend Logic:');
    const total = await prisma.exercise.count({ where: { lessonId: testLesson.id } });
    const correct = await prisma.exercise.count({ where: { lessonId: testLesson.id, isCorrect: true } });
    
    console.log(`   Backend count - Total: ${total}, Correct: ${correct}`);
    console.log(`   Backend logic would complete lesson: ${total > 0 && correct === total}`);
    
    // Find lessons that might have completion issues
    console.log('\n🔍 Checking for Problematic Lessons:');
    const problematicLessons = await prisma.lesson.findMany({
      include: {
        exercises: true,
        _count: { select: { exercises: true } }
      },
      where: {
        isCompleted: true,
        exercises: {
          some: {
            isCorrect: { not: true }
          }
        }
      },
      take: 5
    });
    
    if (problematicLessons.length > 0) {
      console.log(`   ❌ Found ${problematicLessons.length} lessons marked complete with incorrect exercises:`);
      problematicLessons.forEach(lesson => {
        const correctCount = lesson.exercises.filter(ex => ex.isCorrect === true).length;
        console.log(`      - "${lesson.title}": ${correctCount}/${lesson._count.exercises} correct`);
      });
    } else {
      console.log('   ✅ No problematic lessons found - all completed lessons have all exercises correct');
    }
    
    // Check for lessons with 0 exercises
    const emptyLessons = await prisma.lesson.count({
      where: {
        exercises: { none: {} }
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Empty lessons (0 exercises): ${emptyLessons}`);
    console.log(`   Problematic completed lessons: ${problematicLessons.length}`);
    
    if (emptyLessons === 0 && problematicLessons.length === 0) {
      console.log('   ✅ Lesson completion logic appears to be working correctly!');
      console.log('   \n💡 If users report lessons completing after 1 question, the issue might be:');
      console.log('      1. Frontend caching/state management');
      console.log('      2. Multiple rapid submissions');
      console.log('      3. Browser/network issues');
      console.log('      4. User confusion about lesson vs exercise completion');
    }
    
  } catch (error) {
    console.error('❌ Error testing lesson completion logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLessonCompletionLogic();