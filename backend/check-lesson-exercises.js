import prisma from './src/utils/prisma.js';

async function checkLessonExercises() {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        exercises: true,
        _count: { select: { exercises: true } }
      },
      orderBy: { lessonNumber: 'asc' }
    });
    
    console.log('📊 Lesson Exercise Count Analysis:');
    console.log('==================================');
    
    const exerciseCountDistribution = {};
    lessons.forEach(lesson => {
      const count = lesson._count.exercises;
      exerciseCountDistribution[count] = (exerciseCountDistribution[count] || 0) + 1;
    });
    
    console.log('Distribution of exercises per lesson:');
    Object.entries(exerciseCountDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, lessonCount]) => {
        console.log(`  ${count} exercises: ${lessonCount} lessons`);
      });
    
    const singleExerciseLessons = lessons.filter(l => l._count.exercises === 1);
    console.log(`\n❌ Lessons with only 1 exercise (${singleExerciseLessons.length} total):`);
    singleExerciseLessons.slice(0, 10).forEach(lesson => {
      console.log(`  - "${lesson.title}" (Topic: ${lesson.topic})`);
      console.log(`    Exercise: "${lesson.exercises[0]?.question}"`);
      console.log('');
    });
    
    if (singleExerciseLessons.length > 10) {
      console.log(`  ... and ${singleExerciseLessons.length - 10} more lessons`);
    }
    
    console.log('\n🔧 Solution: Add more exercises to single-exercise lessons');
    console.log('This will prevent lessons from completing after just 1 question.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLessonExercises();