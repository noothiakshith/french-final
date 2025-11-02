import prisma from './src/utils/prisma.js';

async function testBridgeCourseContent() {
    try {
        console.log('🧪 Testing Enhanced Bridge Course Content...\n');

        // Find or create a test user
        let testUser = await prisma.user.findUnique({
            where: { email: 'bridge-test@example.com' }
        });

        if (!testUser) {
            console.log('👤 Creating test user...');
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash('password123', 12);
            
            testUser = await prisma.user.create({
                data: {
                    email: 'bridge-test@example.com',
                    password: hashedPassword,
                    name: 'Bridge Test User',
                    currentLevel: 'BEGINNER',
                    hasSkippedTest: false
                }
            });
            console.log(`✅ Test user created: ${testUser.email}`);
        } else {
            console.log(`✅ Found test user: ${testUser.email}`);
        }

        // Clean up existing bridge course
        console.log('🧹 Cleaning up existing bridge course...');
        await prisma.bridgeCourse.deleteMany({
            where: { userId: testUser.id }
        });

        // Create enhanced bridge course with comprehensive content
        console.log('📚 Creating enhanced bridge course...');
        
        // First create the bridge course
        const bridgeCourse = await prisma.bridgeCourse.create({
            data: {
                userId: testUser.id,
                targetLevel: 'BEGINNER',
                totalChapters: 1,
                identifiedGaps: {
                    "Gender and Articles": 3,
                    "Basic Greetings": 2
                },
                estimatedHours: 1.5,
                curriculum: {
                    "title": "Enhanced French Fundamentals Bridge Course",
                    "description": "Comprehensive remedial course with detailed explanations",
                    "overview": "Enhanced bridge course with comprehensive explanations",
                    "focus_areas": ["Gender and Articles", "Basic Greetings"]
                }
            }
        });
        
        const bridgeChapter = await prisma.bridgeChapter.create({
            data: {
                bridgeCourseId: bridgeCourse.id,
                chapterNumber: 1,
                title: 'Mastering French Gender and Articles',
                topic: 'Gender and Articles',
                description: 'Comprehensive guide to French noun gender and article usage',
                estimatedMinutes: 45,
                content: {
                    introduction: 'Understanding French gender and articles is crucial for speaking correctly. This chapter provides comprehensive explanations, practical tips, and cultural insights to help you master this fundamental concept.',
                    explanation: 'French nouns have gender (masculine or feminine), which affects articles, adjectives, and sometimes pronunciation. Unlike English, every French noun has a gender that must be memorized. The definite articles are "le" (masculine), "la" (feminine), and "les" (plural). Indefinite articles are "un" (masculine), "une" (feminine), and "des" (plural). Gender patterns exist but have exceptions: most nouns ending in -e are feminine (la table, la voiture), but important exceptions include le problème, le musée, le lycée. Masculine nouns often end in consonants (le chat, le livre, le travail), but exceptions exist like la main, la forêt. Some endings are reliable indicators: -tion, -sion, -té are usually feminine (la nation, la passion, la liberté), while -age, -isme, -ment are usually masculine (le voyage, le tourisme, le moment). Learning gender is essential because it affects agreement throughout the sentence. Adjectives must agree: un chat noir (masculine) vs une voiture noire (feminine). Past participles with être also agree: il est parti vs elle est partie. The key to mastering gender is learning nouns with their articles from the beginning, using memory techniques like visualization or association, and practicing regularly through reading and conversation.',
                    keyPoints: [
                        'Every French noun has a gender (masculine or feminine) that affects articles and adjectives',
                        'Definite articles: le (masc.), la (fem.), les (plural) - Indefinite: un (masc.), une (fem.), des (plural)',
                        'Common patterns: -e endings often feminine, consonant endings often masculine, but many exceptions exist',
                        'Reliable endings: -tion/-sion/-té (feminine), -age/-isme/-ment (masculine)',
                        'Gender affects adjective agreement and past participle agreement with être'
                    ],
                    commonMistakes: [
                        'Assuming all -e endings are feminine (le problème, le musée are masculine exceptions)',
                        'Forgetting to make adjectives agree with noun gender (saying "une voiture noir" instead of "noire")',
                        'Using wrong articles due to English interference (saying "la problème" instead of "le problème")',
                        'Not learning nouns with their articles from the start, making gender harder to remember'
                    ],
                    studyTips: [
                        'Always learn nouns with their articles: memorize "le chat" not just "chat"',
                        'Use color coding: blue for masculine, pink for feminine when making flashcards',
                        'Create mental associations: "le soleil" (sun) is masculine like strength, "la lune" (moon) is feminine like beauty',
                        'Practice with adjectives to reinforce gender: "un grand homme" vs "une grande femme"'
                    ],
                    culturalNotes: [
                        'French speakers are generally understanding of gender mistakes from learners',
                        'Gender mistakes rarely prevent communication, but correct usage shows advanced proficiency',
                        'Some professions have both masculine and feminine forms: un acteur/une actrice',
                        'Modern French is evolving with inclusive writing, but traditional gender rules remain standard'
                    ]
                },
                exercises: {
                    create: [
                        {
                            bridgeChapterId: bridgeChapter.id,
                            exerciseNumber: 1,
                            type: 'MULTIPLE_CHOICE',
                            question: 'Which article goes with "problème"?',
                            correctAnswer: 'le',
                            options: ['le', 'la', 'les', 'des'],
                            explanation: '"Le problème" is masculine despite ending in -e. This is a common exception that must be memorized. Remember: not all -e endings are feminine!'
                        },
                        {
                            bridgeChapterId: bridgeChapter.id,
                            exerciseNumber: 2,
                            type: 'FILL_IN_BLANK',
                            question: 'Complete with the correct article: _____ voiture rouge (the red car)',
                            correctAnswer: 'la',
                            options: [],
                            explanation: '"Voiture" is feminine, so we use "la". The adjective "rouge" doesn\'t change because it ends in -e and works for both genders.'
                        },
                        {
                            bridgeChapterId: bridgeChapter.id,
                            exerciseNumber: 3,
                            type: 'MULTIPLE_CHOICE',
                            question: 'Which noun is masculine?',
                            correctAnswer: 'le musée',
                            options: ['le musée', 'la table', 'la nation', 'la liberté'],
                            explanation: '"Le musée" is masculine despite ending in -e. This is another important exception to learn. The others are feminine following typical patterns.'
                        },
                        {
                            bridgeChapterId: bridgeChapter.id,
                            exerciseNumber: 4,
                            type: 'FILL_IN_BLANK',
                            question: 'Make this adjective agree: un chat noir → une voiture _____',
                            correctAnswer: 'noire',
                            options: [],
                            explanation: 'Adjectives must agree with noun gender. "Noir" becomes "noire" for feminine nouns. The -e ending marks feminine agreement.'
                        },
                        {
                            bridgeChapterId: bridgeChapter.id,
                            exerciseNumber: 5,
                            type: 'MULTIPLE_CHOICE',
                            question: 'Which ending usually indicates a feminine noun?',
                            correctAnswer: '-tion',
                            options: ['-tion', '-age', '-isme', '-ment'],
                            explanation: 'Words ending in -tion are almost always feminine (la nation, la création). The others (-age, -isme, -ment) are typically masculine.'
                        }
                    ]
                }
            }
        });

        console.log('✅ Enhanced bridge course chapter created successfully');

        // Analyze the content
        console.log('\n📊 Analyzing Bridge Course Content Quality...');
        
        const chapter = await prisma.bridgeChapter.findUnique({
            where: { id: bridgeChapter.id },
            include: {
                exercises: true
            }
        });

        console.log(`📚 Chapter: ${chapter.title}`);
        console.log(`   Topic: ${chapter.topic}`);
        console.log(`   Description: ${chapter.description}`);
        console.log(`   Estimated Time: ${chapter.estimatedMinutes} minutes`);
        
        const content = chapter.content || {};
        console.log(`\n📖 Content Analysis:`);
        console.log(`   - Has Introduction: ${content.introduction ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Has Detailed Explanation: ${content.explanation ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Explanation Length: ${content.explanation ? content.explanation.length : 0} characters`);
        console.log(`   - Has Key Points: ${content.keyPoints ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Key Points Count: ${content.keyPoints ? content.keyPoints.length : 0}`);
        console.log(`   - Has Common Mistakes: ${content.commonMistakes ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Common Mistakes Count: ${content.commonMistakes ? content.commonMistakes.length : 0}`);
        console.log(`   - Has Study Tips: ${content.studyTips ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Study Tips Count: ${content.studyTips ? content.studyTips.length : 0}`);
        console.log(`   - Has Cultural Notes: ${content.culturalNotes ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   - Cultural Notes Count: ${content.culturalNotes ? content.culturalNotes.length : 0}`);

        console.log(`\n🎯 Exercise Analysis:`);
        console.log(`   - Total Exercises: ${chapter.exercises.length}`);
        
        if (chapter.exercises.length > 0) {
            const exerciseTypes = chapter.exercises.map(ex => ex.type);
            const uniqueTypes = [...new Set(exerciseTypes)];
            console.log(`   - Exercise Types: ${uniqueTypes.join(', ')}`);
            
            // Show sample exercise
            const sampleExercise = chapter.exercises[0];
            console.log(`   Sample Exercise:`);
            console.log(`     Question: ${sampleExercise.question}`);
            console.log(`     Answer: ${sampleExercise.correctAnswer}`);
            console.log(`     Type: ${sampleExercise.type}`);
            console.log(`     Explanation: ${sampleExercise.explanation}`);
        }

        // Quality assessment
        console.log('\n🎯 Quality Assessment:');
        const hasAllSections = content.introduction && content.explanation && 
                              content.keyPoints && content.commonMistakes && 
                              content.studyTips && content.culturalNotes;
        
        const explanationLength = content.explanation ? content.explanation.length : 0;
        const hasEnoughExercises = chapter.exercises.length >= 5;
        
        console.log(`   Content Completeness: ${hasAllSections ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
        console.log(`   Explanation Quality: ${explanationLength >= 500 ? '✅ COMPREHENSIVE' : '⚠️ TOO BRIEF'} (${explanationLength} chars)`);
        console.log(`   Exercise Coverage: ${hasEnoughExercises ? '✅ SUFFICIENT' : '⚠️ NEEDS MORE'} (${chapter.exercises.length} exercises)`);
        
        if (hasAllSections && explanationLength >= 500 && hasEnoughExercises) {
            console.log('\n🏆 EXCELLENT: Bridge course content meets all quality standards!');
        } else {
            console.log('\n📊 GOOD: Bridge course content is functional but could be enhanced');
        }

        console.log('\n🔑 Test User Login:');
        console.log(`   Email: bridge-test@example.com`);
        console.log(`   Password: password123`);

        console.log('\n📌 Enhanced bridge course data preserved for review');

    } catch (error) {
        console.error('❌ Error testing bridge course content:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBridgeCourseContent();