import { generateChapterRange } from './src/services/aiService.js';

async function testChapterGeneration() {
    try {
        console.log('🧪 Testing chapter generation...\n');
        
        // Test generating chapters 6-10
        console.log('📚 Generating chapters 6-10...');
        const chapters = await generateChapterRange('BEGINNER', 6, 10);
        
        console.log(`✅ Generated ${chapters.length} chapters:`);
        chapters.forEach((chapter, index) => {
            console.log(`   Chapter ${6 + index}: ${chapter.title}`);
            console.log(`     Topic: ${chapter.topic}`);
            console.log(`     Description: ${chapter.description}`);
            console.log(`     Lessons: ${chapter.lessons.length}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testChapterGeneration();