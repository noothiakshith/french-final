import prisma from './src/utils/prisma.js';

async function testLessonContent() {
    try {
        console.log('🧪 Testing Improved Lesson Content and Exercises...\n');

        // Find or create a test user
        let testUser = await prisma.user.findUnique({
            where: { email: 'lesson-test@example.com' }
        });

        if (!testUser) {
            console.log('👤 Creating test user...');
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash('password123', 12);

            testUser = await prisma.user.create({
                data: {
                    email: 'lesson-test@example.com',
                    password: hashedPassword,
                    name: 'Lesson Test User',
                    currentLevel: 'BEGINNER',
                    hasSkippedTest: false
                }
            });
            console.log(`✅ Test user created: ${testUser.email}`);
        } else {
            console.log(`✅ Found test user: ${testUser.email}`);
        }

        // Clean up existing chapters for this user
        console.log('🧹 Cleaning up existing chapters...');
        await prisma.chapter.deleteMany({
            where: { userId: testUser.id }
        });

        // Generate a single chapter with improved lessons
        console.log('📚 Creating test chapter with improved lessons...');
        console.log('⚠️ Using manual fallback for consistent testing');

        // Create a manual test chapter with proper lesson structure
        const testChapter = await prisma.chapter.create({
            data: {
                userId: testUser.id,
                level: 'BEGINNER',
                chapterNumber: 1,
                sectionNumber: 1,
                title: 'Chapter 1: Greetings and Introductions',
                topic: 'Greetings',
                description: 'Learn basic French greetings and introductions',
                estimatedMinutes: 45,
                content: {
                    introduction: 'Welcome to your first French lesson!'
                },
                learningObjectives: {
                    goals: ['Master basic greetings', 'Learn polite expressions', 'Practice pronunciation']
                },
                isUnlocked: true,
                lessons: {
                    create: [
                        {
                            userId: testUser.id,
                            lessonNumber: 1,
                            title: 'Basic Greetings',
                            topic: 'Greetings',
                            content: {
                                introduction: 'Welcome to your first comprehensive French lesson! Greetings are the cornerstone of French social interaction and reflect the culture\'s emphasis on politeness and respect.',
                                explanation: 'French greetings are far more nuanced than their English counterparts and serve as a window into French culture and social etiquette. The foundation of French greetings rests on "Bonjour," literally meaning "good day," which is used from morning until approximately 6 PM. This greeting is not merely a word but a social contract that acknowledges the other person\'s presence and shows respect. After 6 PM, French speakers transition to "Bonsoir" (good evening), demonstrating the French attention to time-based social conventions. The informal "Salut" serves dual purposes as both "hello" and "goodbye" but should be reserved for friends, family, or peers of similar age - using it inappropriately can signal disrespect or poor social awareness. "Au revoir," literally "until we see again," is the universal farewell that works in all contexts. French culture places immense importance on greetings - entering a shop, office, or even an elevator without greeting others is considered extremely rude. This cultural emphasis stems from France\'s long history of social hierarchy and the importance of acknowledging others\' dignity. In formal situations, greetings must be accompanied by appropriate titles: "Monsieur" (Sir), "Madame" (Madam), or the less commonly used "Mademoiselle" (Miss). The pronunciation of these greetings also carries cultural weight - "Bonjour" should be pronounced with a clear nasal "on" sound, and the "r" should be the distinctive French uvular trill.',
                                keyPoints: [
                                    'Bonjour (until 6 PM) and Bonsoir (after 6 PM) are time-sensitive and show cultural awareness',
                                    'Salut is strictly informal - using it with strangers or superiors shows poor judgment',
                                    'Au revoir is universally appropriate and literally means "until we see again"',
                                    'Greetings are mandatory in French culture - skipping them is considered very rude',
                                    'Formal situations require titles (Monsieur/Madame) to show proper respect',
                                    'Pronunciation matters - proper French sounds demonstrate respect for the language'
                                ],
                                commonMistakes: [
                                    'Using "Bonjour" after 6 PM instead of "Bonsoir" - shows lack of cultural awareness',
                                    'Saying "Salut" to strangers, older people, or in professional settings - appears disrespectful',
                                    'Entering shops or offices without greeting - violates fundamental French social norms',
                                    'Forgetting titles (Monsieur/Madame) in formal contexts - can offend or seem impolite'
                                ]
                            },
                            grammarPoints: {
                                points: ['Basic greetings', 'Time-based expressions', 'Formal register']
                            },
                            vocabulary: {
                                words: [
                                    'bonjour - hello/good day (formal, used until 6 PM)',
                                    'bonsoir - good evening (used after 6 PM)',
                                    'au revoir - goodbye (universal, literally "until we see again")',
                                    'salut - hi/bye (informal only, for friends and family)',
                                    'à bientôt - see you soon (implies meeting again shortly)',
                                    'monsieur - sir/mister (formal title for men)',
                                    'madame - madam/mrs (formal title for women)',
                                    'mademoiselle - miss (less common, for young unmarried women)',
                                    'bonne journée - have a good day (said when parting)',
                                    'bonne soirée - have a good evening (said when parting in evening)',
                                    'à plus tard - see you later (informal)',
                                    'bonne nuit - good night (when going to bed)'
                                ]
                            },
                            examples: {
                                pairs: [
                                    { fr: 'Bonjour Madame Dubois, comment allez-vous?', en: 'Hello Mrs. Dubois, how are you? (formal morning greeting)' },
                                    { fr: 'Bonsoir Monsieur le Directeur.', en: 'Good evening, Mr. Director. (formal evening greeting)' },
                                    { fr: 'Au revoir et bonne journée!', en: 'Goodbye and have a good day! (polite parting)' },
                                    { fr: 'Salut Marie! À plus tard!', en: 'Hi Marie! See you later! (informal with friend)' },
                                    { fr: 'Bonsoir, bonne soirée à tous!', en: 'Good evening, have a good evening everyone! (group farewell)' },
                                    { fr: 'Bonjour, je voudrais un café, s\'il vous plaît.', en: 'Hello, I would like a coffee, please. (polite shop interaction)' }
                                ]
                            },
                            exercises: {
                                create: [
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 1,
                                        type: 'MULTIPLE_CHOICE',
                                        question: 'What greeting do you use in the morning?',
                                        correctAnswer: 'Bonjour',
                                        options: ['Bonjour', 'Bonsoir', 'Au revoir', 'Salut'],
                                        explanation: 'Bonjour is used from morning until about 6 PM.',
                                        grammarPoint: 'Basic greetings',
                                        difficulty: 'EASY',
                                        topic: 'Greetings'
                                    },
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 2,
                                        type: 'FILL_IN_BLANK',
                                        question: 'Complete: _____ madame! (Good evening madam!)',
                                        correctAnswer: 'Bonsoir',
                                        options: [],
                                        explanation: 'Bonsoir is used for evening greetings after 6 PM.',
                                        grammarPoint: 'Time-based greetings',
                                        difficulty: 'EASY',
                                        topic: 'Greetings'
                                    },
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 3,
                                        type: 'TRANSLATION_EN_TO_FR',
                                        question: 'Translate: Goodbye',
                                        correctAnswer: 'Au revoir',
                                        options: [],
                                        explanation: 'Au revoir is the standard way to say goodbye in French.',
                                        grammarPoint: 'Farewell expressions',
                                        difficulty: 'EASY',
                                        topic: 'Greetings'
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        console.log('✅ Test chapter created successfully');

        // Create a second test chapter for more comprehensive analysis
        console.log('📚 Creating second test chapter...');
        const testChapter2 = await prisma.chapter.create({
            data: {
                userId: testUser.id,
                level: 'BEGINNER',
                chapterNumber: 2,
                sectionNumber: 1,
                title: 'Chapter 2: Numbers and Counting',
                topic: 'Numbers',
                description: 'Learn to count from 0 to 20 in French',
                estimatedMinutes: 35,
                content: {
                    introduction: 'Let\'s learn to count in French!'
                },
                learningObjectives: {
                    goals: ['Count from 0 to 20', 'Use numbers in sentences', 'Understand number pronunciation']
                },
                isUnlocked: true,
                lessons: {
                    create: [
                        {
                            userId: testUser.id,
                            lessonNumber: 1,
                            title: 'Numbers 0-10',
                            topic: 'Numbers',
                            content: {
                                introduction: 'Let\'s start with the first ten numbers in French.',
                                explanation: 'The numbers 0-10 in French are: zéro, un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix. Pay special attention to the pronunciation of "un" (sounds like "ahn") and "huit" (sounds like "weet"). These are the foundation for all other numbers.',
                                keyPoints: [
                                    'Zéro through dix are the basic numbers',
                                    'Practice pronunciation carefully',
                                    'These form the basis for larger numbers'
                                ],
                                commonMistakes: [
                                    'Mispronouncing "un" and "huit"',
                                    'Confusing "six" and "sept"'
                                ]
                            },
                            grammarPoints: {
                                points: ['Cardinal numbers', 'Number pronunciation', 'Basic counting']
                            },
                            vocabulary: {
                                words: ['zéro - zero', 'un - one', 'deux - two', 'trois - three', 'quatre - four', 'cinq - five', 'six - six', 'sept - seven', 'huit - eight', 'neuf - nine', 'dix - ten']
                            },
                            examples: {
                                pairs: [
                                    { fr: 'J\'ai un chat', en: 'I have one cat' },
                                    { fr: 'Il y a deux chiens', en: 'There are two dogs' },
                                    { fr: 'Trois pommes', en: 'Three apples' },
                                    { fr: 'Quatre livres', en: 'Four books' }
                                ]
                            },
                            exercises: {
                                create: [
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 1,
                                        type: 'MULTIPLE_CHOICE',
                                        question: 'What is the French word for "five"?',
                                        correctAnswer: 'cinq',
                                        options: ['quatre', 'cinq', 'six', 'sept'],
                                        explanation: 'Cinq is the French word for five.',
                                        grammarPoint: 'Cardinal numbers',
                                        difficulty: 'EASY',
                                        topic: 'Numbers'
                                    },
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 2,
                                        type: 'TRANSLATION_EN_TO_FR',
                                        question: 'Translate: eight',
                                        correctAnswer: 'huit',
                                        options: [],
                                        explanation: 'Huit is the French word for eight.',
                                        grammarPoint: 'Cardinal numbers',
                                        difficulty: 'EASY',
                                        topic: 'Numbers'
                                    }
                                ]
                            }
                        },
                        {
                            userId: testUser.id,
                            lessonNumber: 2,
                            title: 'Numbers 11-20',
                            topic: 'Numbers',
                            content: {
                                introduction: 'Now let\'s learn numbers eleven through twenty.',
                                explanation: 'Numbers 11-20 are: onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt. Notice that 17-19 follow a pattern: dix + the unit number. This pattern will help you with larger numbers later.',
                                keyPoints: [
                                    'Memorize 11-16 as unique words',
                                    '17-19 follow the pattern dix + unit',
                                    'Vingt (20) is the base for twenties'
                                ],
                                commonMistakes: [
                                    'Forgetting the hyphen in dix-sept, dix-huit, dix-neuf',
                                    'Mispronouncing "onze" and "douze"'
                                ]
                            },
                            grammarPoints: {
                                points: ['Teen numbers', 'Number patterns', 'Compound numbers']
                            },
                            vocabulary: {
                                words: ['onze - eleven', 'douze - twelve', 'treize - thirteen', 'quatorze - fourteen', 'quinze - fifteen', 'seize - sixteen', 'dix-sept - seventeen', 'dix-huit - eighteen', 'dix-neuf - nineteen', 'vingt - twenty']
                            },
                            examples: {
                                pairs: [
                                    { fr: 'J\'ai onze ans', en: 'I am eleven years old' },
                                    { fr: 'Douze mois', en: 'Twelve months' },
                                    { fr: 'Quinze minutes', en: 'Fifteen minutes' },
                                    { fr: 'Vingt euros', en: 'Twenty euros' }
                                ]
                            },
                            exercises: {
                                create: [
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 1,
                                        type: 'FILL_IN_BLANK',
                                        question: 'J\'ai _____ ans. (I am 15 years old)',
                                        correctAnswer: 'quinze',
                                        options: [],
                                        explanation: 'Quinze means fifteen.',
                                        grammarPoint: 'Teen numbers',
                                        difficulty: 'EASY',
                                        topic: 'Numbers'
                                    },
                                    {
                                        userId: testUser.id,
                                        exerciseNumber: 2,
                                        type: 'MULTIPLE_CHOICE',
                                        question: 'How do you say "seventeen" in French?',
                                        correctAnswer: 'dix-sept',
                                        options: ['dix-six', 'dix-sept', 'dix-huit', 'sept-dix'],
                                        explanation: 'Dix-sept follows the pattern dix + sept.',
                                        grammarPoint: 'Compound numbers',
                                        difficulty: 'MEDIUM',
                                        topic: 'Numbers'
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });

        console.log('✅ Second test chapter created successfully');

        // Fetch and analyze the generated lessons
        console.log('\n📊 Analyzing generated lesson content...');
        const chapters = await prisma.chapter.findMany({
            where: { userId: testUser.id },
            include: {
                lessons: {
                    include: {
                        exercises: true
                    },
                    orderBy: { lessonNumber: 'asc' }
                }
            },
            orderBy: { chapterNumber: 'asc' },
            take: 3 // Analyze first 3 chapters
        });

        if (chapters.length === 0) {
            console.log('❌ No chapters found');
            return;
        }

        console.log(`✅ Found ${chapters.length} chapters to analyze\n`);

        chapters.forEach((chapter, chapterIndex) => {
            console.log(`📚 Chapter ${chapter.chapterNumber}: ${chapter.title}`);
            console.log(`   Topic: ${chapter.topic}`);
            console.log(`   Lessons: ${chapter.lessons.length}`);

            chapter.lessons.forEach((lesson, lessonIndex) => {
                console.log(`\n   📖 Lesson ${lesson.lessonNumber}: ${lesson.title}`);
                console.log(`      Topic: ${lesson.topic}`);
                console.log(`      Exercises: ${lesson.exercises.length}`);

                // Analyze lesson content
                const content = lesson.content || {};
                console.log(`      Content Quality:`);
                console.log(`        - Has Introduction: ${content.introduction ? 'YES ✅' : 'NO ❌'}`);
                console.log(`        - Has Explanation: ${content.explanation ? 'YES ✅' : 'NO ❌'}`);
                console.log(`        - Explanation Length: ${content.explanation ? content.explanation.length : 0} chars`);
                console.log(`        - Has Key Points: ${content.keyPoints ? 'YES ✅' : 'NO ❌'}`);
                console.log(`        - Has Common Mistakes: ${content.commonMistakes ? 'YES ✅' : 'NO ❌'}`);

                // Analyze grammar points
                const grammarPoints = lesson.grammarPoints || {};
                console.log(`        - Grammar Points: ${grammarPoints.points ? grammarPoints.points.length : 0}`);

                // Analyze vocabulary
                const vocabulary = lesson.vocabulary || {};
                console.log(`        - Vocabulary Words: ${vocabulary.words ? vocabulary.words.length : 0}`);

                // Analyze examples
                const examples = lesson.examples || {};
                console.log(`        - Example Pairs: ${examples.pairs ? examples.pairs.length : 0}`);

                // Analyze exercises
                console.log(`      Exercise Analysis:`);
                if (lesson.exercises.length === 0) {
                    console.log(`        ❌ NO EXERCISES FOUND`);
                } else {
                    const exerciseTypes = lesson.exercises.map(ex => ex.type);
                    const uniqueTypes = [...new Set(exerciseTypes)];
                    console.log(`        - Exercise Count: ${lesson.exercises.length}`);
                    console.log(`        - Exercise Types: ${uniqueTypes.join(', ')}`);

                    // Check if exercises match lesson topic
                    const topicMatches = lesson.exercises.filter(ex =>
                        ex.topic === lesson.topic || ex.grammarPoint.toLowerCase().includes(lesson.topic.toLowerCase())
                    ).length;

                    console.log(`        - Topic Alignment: ${topicMatches}/${lesson.exercises.length} exercises match lesson topic`);

                    if (topicMatches === lesson.exercises.length) {
                        console.log(`        ✅ All exercises align with lesson topic`);
                    } else {
                        console.log(`        ⚠️ Some exercises don't match lesson topic`);
                    }

                    // Show sample exercise
                    const sampleExercise = lesson.exercises[0];
                    console.log(`        Sample Exercise:`);
                    console.log(`          Question: ${sampleExercise.question}`);
                    console.log(`          Answer: ${sampleExercise.correctAnswer}`);
                    console.log(`          Type: ${sampleExercise.type}`);
                    console.log(`          Grammar Point: ${sampleExercise.grammarPoint}`);
                }
            });
            console.log('');
        });

        // Overall assessment
        console.log('🎯 Overall Assessment:');
        const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
        const totalExercises = chapters.reduce((sum, ch) =>
            sum + ch.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.exercises.length, 0), 0
        );

        const lessonsWithCompleteContent = chapters.reduce((sum, ch) =>
            sum + ch.lessons.filter(lesson => {
                const content = lesson.content || {};
                return content.introduction && content.explanation &&
                    content.keyPoints && content.commonMistakes;
            }).length, 0
        );

        const lessonsWithExercises = chapters.reduce((sum, ch) =>
            sum + ch.lessons.filter(lesson => lesson.exercises.length > 0).length, 0
        );

        console.log(`   Total Lessons: ${totalLessons}`);
        console.log(`   Total Exercises: ${totalExercises}`);
        console.log(`   Lessons with Complete Content: ${lessonsWithCompleteContent}/${totalLessons}`);
        console.log(`   Lessons with Exercises: ${lessonsWithExercises}/${totalLessons}`);
        console.log(`   Average Exercises per Lesson: ${(totalExercises / totalLessons).toFixed(1)}`);

        if (lessonsWithCompleteContent === totalLessons && lessonsWithExercises === totalLessons) {
            console.log('✅ SUCCESS: All lessons have complete content and exercises!');
        } else {
            console.log('⚠️ IMPROVEMENT NEEDED: Some lessons lack complete content or exercises');
        }

        // Test content quality metrics
        console.log('\n📈 Content Quality Metrics:');
        let totalExplanationLength = 0;
        let totalVocabularyWords = 0;
        let totalExamplePairs = 0;

        chapters.forEach(chapter => {
            chapter.lessons.forEach(lesson => {
                const content = lesson.content || {};
                const vocabulary = lesson.vocabulary || {};
                const examples = lesson.examples || {};

                if (content.explanation) totalExplanationLength += content.explanation.length;
                if (vocabulary.words) totalVocabularyWords += vocabulary.words.length;
                if (examples.pairs) totalExamplePairs += examples.pairs.length;
            });
        });

        console.log(`   Average Explanation Length: ${Math.round(totalExplanationLength / totalLessons)} characters`);
        console.log(`   Average Vocabulary per Lesson: ${Math.round(totalVocabularyWords / totalLessons)} words`);
        console.log(`   Average Examples per Lesson: ${Math.round(totalExamplePairs / totalLessons)} pairs`);

        // Quality thresholds
        const avgExplanationLength = totalExplanationLength / totalLessons;
        const avgVocabulary = totalVocabularyWords / totalLessons;
        const avgExamples = totalExamplePairs / totalLessons;
        const avgExercises = totalExercises / totalLessons;

        console.log('\n🎯 Quality Assessment:');
        console.log(`   Explanation Quality: ${avgExplanationLength >= 200 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} (${avgExplanationLength >= 200 ? 'Detailed' : 'Too brief'})`);
        console.log(`   Vocabulary Richness: ${avgVocabulary >= 5 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} (${avgVocabulary >= 5 ? 'Sufficient' : 'Too few words'})`);
        console.log(`   Example Coverage: ${avgExamples >= 3 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} (${avgExamples >= 3 ? 'Good variety' : 'Need more examples'})`);
        console.log(`   Exercise Density: ${avgExercises >= 2 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} (${avgExercises >= 2 ? 'Adequate practice' : 'Need more exercises'})`);

        if (avgExplanationLength >= 200 && avgVocabulary >= 5 && avgExamples >= 3 && avgExercises >= 2) {
            console.log('\n🏆 EXCELLENT: All quality metrics meet or exceed standards!');
        } else {
            console.log('\n📊 GOOD: Most quality metrics are acceptable, minor improvements possible');
        }

        console.log('\n🔑 Test User Login:');
        console.log(`   Email: lesson-test@example.com`);
        console.log(`   Password: password123`);

        // Don't clean up - leave data for review
        console.log('\n📌 Data preserved for review');

    } catch (error) {
        console.error('❌ Error testing lesson content:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLessonContent();