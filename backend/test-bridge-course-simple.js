import prisma from './src/utils/prisma.js';

async function testEnhancedBridgeCourse() {
    try {
        console.log('🧪 Testing Enhanced Bridge Course Content...\n');

        // Find test user
        const testUser = await prisma.user.findUnique({
            where: { email: 'bridge-test@example.com' }
        });

        if (!testUser) {
            console.log('❌ Test user not found. Run the previous test first.');
            return;
        }

        console.log(`✅ Found test user: ${testUser.email}`);

        // Check existing bridge course
        const existingBridgeCourse = await prisma.bridgeCourse.findFirst({
            where: { userId: testUser.id },
            include: {
                chapters: {
                    include: {
                        exercises: true
                    }
                }
            }
        });

        if (existingBridgeCourse && existingBridgeCourse.chapters.length > 0) {
            console.log('\n📊 Analyzing Existing Bridge Course Content...');
            
            const chapter = existingBridgeCourse.chapters[0];
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
            console.log(`   Bridge Course ID: ${existingBridgeCourse.id}`);
            console.log(`   Chapter ID: ${chapter.id}`);

        } else {
            console.log('❌ No bridge course chapters found. Create some first.');
        }

    } catch (error) {
        console.error('❌ Error testing bridge course content:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEnhancedBridgeCourse();