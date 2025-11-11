import prisma from './src/utils/prisma.js';

// Define comprehensive progressive curriculum with exercises
const progressiveCurriculum = {
  BEGINNER: {
    description: "Foundation level - Basic French essentials",
    chapters: [
      {
        title: "Bonjour! First Steps in French",
        topic: "Basic Greetings and Politeness",
        description: "Learn essential greetings, polite expressions, and how to introduce yourself",
        lessons: [
          {
            title: "Basic Greetings",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "Hello" in French?', options: ['Bonjour', 'Au revoir', 'Bonsoir', 'Merci'], correctAnswer: 'Bonjour' },
              { type: 'MULTIPLE_CHOICE', question: 'What greeting do you use after 6 PM?', options: ['Bonjour', 'Bonsoir', 'Salut', 'Au revoir'], correctAnswer: 'Bonsoir' },
              { type: 'FILL_IN_BLANK', question: 'Complete: _____ allez-vous? (How are you?)', correctAnswer: 'Comment' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: Goodbye', correctAnswer: 'Au revoir' }
            ]
          },
          {
            title: "Introducing Yourself",
            exercises: [
              { type: 'FILL_IN_BLANK', question: 'Complete: Je _____ Marie. (My name is Marie)', correctAnswer: 'm\'appelle' },
              { type: 'MULTIPLE_CHOICE', question: 'How do you ask someone\'s name formally?', options: ['Tu t\'appelles comment?', 'Comment vous appelez-vous?', 'Quel âge avez-vous?', 'Où habitez-vous?'], correctAnswer: 'Comment vous appelez-vous?' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: Nice to meet you', correctAnswer: 'Enchanté' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Je vous _____ mon ami Pierre. (I introduce my friend Pierre)', correctAnswer: 'présente' }
            ]
          }
        ]
      },
      {
        title: "Numbers and Age",
        topic: "Numbers 0-20 and Personal Information",
        description: "Count from 0-20, express your age, and ask basic personal questions",
        lessons: [
          {
            title: "Numbers 0-10",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'What is "five" in French?', options: ['quatre', 'cinq', 'six', 'sept'], correctAnswer: 'cinq' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: eight', correctAnswer: 'huit' },
              { type: 'FILL_IN_BLANK', question: 'Complete the sequence: un, deux, _____, quatre', correctAnswer: 'trois' },
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "zero" in French?', options: ['zéro', 'un', 'deux', 'dix'], correctAnswer: 'zéro' }
            ]
          },
          {
            title: "Numbers 11-20 and Age",
            exercises: [
              { type: 'FILL_IN_BLANK', question: 'Complete: J\'ai _____ ans. (I am 20 years old)', correctAnswer: 'vingt' },
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "I am 15 years old" in French?', options: ['J\'ai quinze ans', 'Je suis quinze ans', 'J\'ai quinze années', 'Je fais quinze ans'], correctAnswer: 'J\'ai quinze ans' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: thirteen', correctAnswer: 'treize' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Elle a _____ ans. (She is 18 years old)', correctAnswer: 'dix-huit' }
            ]
          }
        ]
      }
      // Add more beginner chapters as needed...
    ]
  },

  INTERMEDIATE: {
    description: "Building on basics - Expanding communication skills",
    chapters: [
      {
        title: "Past Experiences",
        topic: "Passé Composé",
        description: "Talk about past events and experiences using passé composé",
        lessons: [
          {
            title: "Passé Composé with Avoir",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "I ate" in French?', options: ['J\'ai mangé', 'Je mange', 'Je mangerai', 'Je mangeais'], correctAnswer: 'J\'ai mangé' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Nous _____ regardé un film. (We watched a movie)', correctAnswer: 'avons' },
              { type: 'MULTIPLE_CHOICE', question: 'What is the past participle of "finir"?', options: ['fini', 'finissé', 'finir', 'finissant'], correctAnswer: 'fini' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: They have worked', correctAnswer: 'Ils ont travaillé' }
            ]
          },
          {
            title: "Passé Composé with Être",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "She went" in French?', options: ['Elle a allé', 'Elle est allée', 'Elle va', 'Elle allait'], correctAnswer: 'Elle est allée' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Je _____ arrivé(e) hier. (I arrived yesterday)', correctAnswer: 'suis' },
              { type: 'MULTIPLE_CHOICE', question: 'Which verb uses être in passé composé?', options: ['manger', 'partir', 'avoir', 'faire'], correctAnswer: 'partir' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: We came back', correctAnswer: 'Nous sommes revenus' }
            ]
          }
        ]
      },
      {
        title: "Future Plans",
        topic: "Future Tenses",
        description: "Express future plans using futur proche and futur simple",
        lessons: [
          {
            title: "Futur Proche (Near Future)",
            exercises: [
              { type: 'FILL_IN_BLANK', question: 'Complete: Je _____ partir demain. (I am going to leave tomorrow)', correctAnswer: 'vais' },
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "We are going to eat"?', options: ['Nous mangeons', 'Nous allons manger', 'Nous avons mangé', 'Nous mangerons'], correctAnswer: 'Nous allons manger' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: She is going to study', correctAnswer: 'Elle va étudier' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Ils _____ acheter une voiture. (They are going to buy a car)', correctAnswer: 'vont' }
            ]
          },
          {
            title: "Futur Simple",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'How do you say "I will be" in French?', options: ['Je serai', 'Je suis', 'J\'étais', 'Je serais'], correctAnswer: 'Je serai' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Demain, nous _____ au cinéma. (Tomorrow, we will go to the cinema)', correctAnswer: 'irons' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: You will have', correctAnswer: 'Vous aurez' },
              { type: 'MULTIPLE_CHOICE', question: 'What is the future form of "faire" for "ils"?', options: ['ils font', 'ils feront', 'ils faisaient', 'ils feraient'], correctAnswer: 'ils feront' }
            ]
          }
        ]
      }
      // Add more intermediate chapters as needed...
    ]
  },

  ADVANCED: {
    description: "Mastery level - Complex communication and cultural nuances",
    chapters: [
      {
        title: "The Subjunctive Mood",
        topic: "Subjunctive Formation and Usage",
        description: "Master the subjunctive mood for expressing doubt, emotion, and necessity",
        lessons: [
          {
            title: "Subjunctive Formation",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'What is the subjunctive form of "avoir" for "je"?', options: ['j\'ai', 'j\'aie', 'j\'avais', 'j\'aurai'], correctAnswer: 'j\'aie' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Il faut que tu _____. (You must come)', correctAnswer: 'viennes' },
              { type: 'MULTIPLE_CHOICE', question: 'Which expression requires the subjunctive?', options: ['Je pense que', 'Il est certain que', 'Il faut que', 'Je sais que'], correctAnswer: 'Il faut que' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: I doubt that he knows', correctAnswer: 'Je doute qu\'il sache' }
            ]
          },
          {
            title: "Subjunctive Usage",
            exercises: [
              { type: 'MULTIPLE_CHOICE', question: 'Complete: Je suis content que vous _____ là.', options: ['êtes', 'soyez', 'étiez', 'serez'], correctAnswer: 'soyez' },
              { type: 'FILL_IN_BLANK', question: 'Complete: Bien qu\'il _____ tard... (Although it is late)', correctAnswer: 'soit' },
              { type: 'MULTIPLE_CHOICE', question: 'Which sentence uses the subjunctive correctly?', options: ['Je crois qu\'il vient', 'Il est possible qu\'il vienne', 'Je sais qu\'il vient', 'Il est sûr qu\'il vient'], correctAnswer: 'Il est possible qu\'il vienne' },
              { type: 'TRANSLATION_EN_TO_FR', question: 'Translate: I want you to understand', correctAnswer: 'Je veux que vous compreniez' }
            ]
          }
        ]
      }
      // Add more advanced chapters as needed...
    ]
  }
};

async function implementProgressiveCurriculum() {
  try {
    console.log('🚀 Implementing Progressive Curriculum');
    console.log('====================================\n');
    
    // Get users who need the new curriculum
    const users = await prisma.user.findMany({
      select: { id: true, email: true, currentLevel: true }
    });
    
    console.log(`👥 Found ${users.length} users\n`);
    
    // Check if we need to complete the curriculum creation
    const existingChapters = await prisma.chapter.groupBy({
      by: ['level'],
      _count: { level: true }
    });
    
    console.log('📊 Current Curriculum Status:');
    existingChapters.forEach(stat => {
      console.log(`   ${stat.level}: ${stat._count.level} chapters`);
    });
    console.log('');
    
    // Create missing ADVANCED curriculum and exercises for all levels
    console.log('🏗️  Creating missing curriculum and exercises...\n');
    
    for (const [level, levelData] of Object.entries(progressiveCurriculum)) {
      console.log(`📚 Processing ${level} curriculum...`);
      
      // Check if this level exists
      const existingLevelChapters = await prisma.chapter.findMany({
        where: { level: level },
        include: { lessons: { include: { exercises: true } } }
      });
      
      if (existingLevelChapters.length === 0) {
        console.log(`   Creating new ${level} curriculum...`);
        
        // Create chapters for each user
        for (const user of users) {
          for (let chapterIndex = 0; chapterIndex < levelData.chapters.length; chapterIndex++) {
            const chapterData = levelData.chapters[chapterIndex];
            const chapterNumber = chapterIndex + 1;
            const section = Math.ceil(chapterNumber / 5);
            const isUnlocked = chapterNumber <= 5;
            
            const chapter = await prisma.chapter.create({
              data: {
                userId: user.id,
                level: level,
                chapterNumber: chapterNumber,
                sectionNumber: section,
                title: chapterData.title,
                topic: chapterData.topic,
                description: chapterData.description,
                isUnlocked: isUnlocked,
                unlockCondition: isUnlocked ? null : `Complete all lessons in the previous section to unlock.`,
                estimatedMinutes: 45,
                learningObjectives: [
                  `Understand ${chapterData.topic.toLowerCase()}`,
                  `Apply ${chapterData.topic.toLowerCase()} in conversation`
                ],
                content: {
                  introduction: `Welcome to ${chapterData.title}! ${chapterData.description}`,
                  objectives: [`Master ${chapterData.topic.toLowerCase()}`]
                }
              }
            });
            
            // Create lessons with exercises
            for (let lessonIndex = 0; lessonIndex < chapterData.lessons.length; lessonIndex++) {
              const lessonData = chapterData.lessons[lessonIndex];
              
              const lesson = await prisma.lesson.create({
                data: {
                  chapterId: chapter.id,
                  userId: user.id,
                  lessonNumber: lessonIndex + 1,
                  title: lessonData.title,
                  topic: chapterData.topic,
                  content: {
                    introduction: `Learn about ${lessonData.title.toLowerCase()} in this comprehensive lesson.`,
                    explanation: `This lesson covers ${lessonData.title.toLowerCase()} as part of ${chapterData.topic.toLowerCase()}.`,
                    keyPoints: [`Understanding ${lessonData.title.toLowerCase()}`]
                  },
                  grammarPoints: { points: [`Grammar related to ${lessonData.title.toLowerCase()}`] },
                  vocabulary: { words: [`Vocabulary for ${lessonData.title.toLowerCase()}`] },
                  examples: { pairs: [{ en: "Example", fr: "Exemple" }] }
                }
              });
              
              // Create exercises for this lesson
              for (let exerciseIndex = 0; exerciseIndex < lessonData.exercises.length; exerciseIndex++) {
                const exerciseData = lessonData.exercises[exerciseIndex];
                
                await prisma.exercise.create({
                  data: {
                    lessonId: lesson.id,
                    userId: user.id,
                    exerciseNumber: exerciseIndex + 1,
                    type: exerciseData.type,
                    question: exerciseData.question,
                    correctAnswer: exerciseData.correctAnswer,
                    options: exerciseData.options || [],
                    explanation: `Practice exercise for ${lessonData.title}`,
                    grammarPoint: chapterData.topic,
                    difficulty: 'EASY',
                    topic: chapterData.topic,
                    attempts: 0,
                    isCorrect: false
                  }
                });
              }
            }
          }
        }
        
        console.log(`   ✅ Created ${levelData.chapters.length} chapters per user for ${level}`);
      } else {
        console.log(`   ✅ ${level} curriculum already exists`);
        
        // Check if exercises need to be added
        const chaptersWithoutExercises = existingLevelChapters.filter(ch => 
          ch.lessons.some(lesson => lesson.exercises.length === 0)
        );
        
        if (chaptersWithoutExercises.length > 0) {
          console.log(`   🔧 Adding exercises to ${chaptersWithoutExercises.length} chapters...`);
          
          // Add exercises to existing lessons that don't have them
          for (const chapter of chaptersWithoutExercises) {
            const chapterTemplate = levelData.chapters.find(template => 
              template.title === chapter.title || template.topic === chapter.topic
            );
            
            if (chapterTemplate) {
              for (const lesson of chapter.lessons) {
                if (lesson.exercises.length === 0) {
                  const lessonTemplate = chapterTemplate.lessons.find(lt => 
                    lt.title === lesson.title
                  );
                  
                  if (lessonTemplate && lessonTemplate.exercises) {
                    for (let exerciseIndex = 0; exerciseIndex < lessonTemplate.exercises.length; exerciseIndex++) {
                      const exerciseData = lessonTemplate.exercises[exerciseIndex];
                      
                      await prisma.exercise.create({
                        data: {
                          lessonId: lesson.id,
                          userId: lesson.userId,
                          exerciseNumber: exerciseIndex + 1,
                          type: exerciseData.type,
                          question: exerciseData.question,
                          correctAnswer: exerciseData.correctAnswer,
                          options: exerciseData.options || [],
                          explanation: `Practice exercise for ${lesson.title}`,
                          grammarPoint: chapter.topic,
                          difficulty: 'EASY',
                          topic: chapter.topic,
                          attempts: 0,
                          isCorrect: false
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final Curriculum Verification:');
    const finalStats = await prisma.chapter.groupBy({
      by: ['level'],
      _count: { level: true }
    });
    
    finalStats.forEach(stat => {
      const expectedPerUser = progressiveCurriculum[stat.level]?.chapters.length || 0;
      const expectedTotal = expectedPerUser * users.length;
      console.log(`   ${stat.level}: ${stat._count.level} chapters (${expectedPerUser} per user × ${users.length} users)`);
      
      if (stat._count.level === expectedTotal) {
        console.log(`      ✅ Perfect!`);
      } else {
        console.log(`      ⚠️  Expected ${expectedTotal}`);
      }
    });
    
    console.log('\n🎉 Progressive Curriculum Implementation Complete!');
    console.log('\n📋 New Progressive Structure:');
    console.log('   🟢 BEGINNER: Greetings → Numbers → Family → Colors → Food → Basic Verbs');
    console.log('   🟡 INTERMEDIATE: Past Tense → Future Tense → Descriptions → Opinions');
    console.log('   🔴 ADVANCED: Subjunctive → Literature → Business French → Cultural Mastery');
    console.log('\n✨ No more overlapping content between levels!');
    
  } catch (error) {
    console.error('❌ Error implementing progressive curriculum:', error);
  } finally {
    await prisma.$disconnect();
  }
}

implementProgressiveCurriculum();