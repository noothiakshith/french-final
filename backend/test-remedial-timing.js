import { generateRemedialChapter } from './src/services/aiService.js';

async function testRemedialTiming() {
    console.log('🕐 Starting remedial chapter generation timing test...\n');
    
    // Sample mistake examples for testing
    const sampleMistakes = [
        {
            question: "Choose the correct article: ___ chat est noir.",
            userAnswer: "La",
            correctAnswer: "Le"
        },
        {
            question: "Complete: ___ maison est grande.",
            userAnswer: "Le",
            correctAnswer: "La"
        },
        {
            question: "Fill in: ___ livre est intéressant.",
            userAnswer: "La",
            correctAnswer: "Le"
        }
    ];

    const topics = [
        "Definite Articles",
        "Past Tense Conjugation", 
        "Gender Agreement",
        "Pronoun Usage",
        "Verb Conjugation"
    ];

    const results = [];

    for (const topic of topics) {
        console.log(`📚 Testing topic: "${topic}"`);
        const startTime = Date.now();
        
        try {
            const remedialData = await generateRemedialChapter(topic, sampleMistakes);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`✅ Generated successfully in ${duration}ms (${(duration/1000).toFixed(2)}s)`);
            console.log(`   Title: ${remedialData?.title || 'N/A'}`);
            console.log(`   Exercises: ${remedialData?.exercises?.length || 0}`);
            
            results.push({
                topic,
                duration,
                success: true,
                title: remedialData?.title,
                exerciseCount: remedialData?.exercises?.length || 0
            });
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`❌ Failed after ${duration}ms: ${error.message}`);
            
            results.push({
                topic,
                duration,
                success: false,
                error: error.message
            });
        }
        
        console.log(''); // Empty line for readability
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('📊 TIMING SUMMARY:');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
        const totalTime = successful.reduce((sum, r) => sum + r.duration, 0);
        const avgTime = totalTime / successful.length;
        const minTime = Math.min(...successful.map(r => r.duration));
        const maxTime = Math.max(...successful.map(r => r.duration));
        
        console.log(`✅ Successful generations: ${successful.length}/${results.length}`);
        console.log(`⏱️  Average time: ${(avgTime/1000).toFixed(2)}s (${avgTime.toFixed(0)}ms)`);
        console.log(`🚀 Fastest: ${(minTime/1000).toFixed(2)}s (${minTime}ms)`);
        console.log(`🐌 Slowest: ${(maxTime/1000).toFixed(2)}s (${maxTime}ms)`);
        console.log(`📈 Total time: ${(totalTime/1000).toFixed(2)}s`);
    }
    
    if (failed.length > 0) {
        console.log(`❌ Failed generations: ${failed.length}`);
        failed.forEach(f => {
            console.log(`   - ${f.topic}: ${f.error}`);
        });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (successful.length > 0) {
        const avgSeconds = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length / 1000;
        
        if (avgSeconds < 5) {
            console.log('✨ Excellent performance! Remedial chapters generate quickly.');
        } else if (avgSeconds < 10) {
            console.log('👍 Good performance. Consider caching for frequently requested topics.');
        } else if (avgSeconds < 20) {
            console.log('⚠️  Moderate performance. Consider implementing background generation.');
        } else {
            console.log('🚨 Slow performance. Strongly recommend background processing and caching.');
        }
        
        console.log(`💡 For production: Consider pre-generating common remedial topics.`);
        console.log(`🔄 Estimated time for ${MISTAKE_THRESHOLD} mistakes: ${(avgSeconds * 3).toFixed(1)}s (assuming 3 topics)`);
    }
}

// Configuration
const MISTAKE_THRESHOLD = 5;

// Run the test
testRemedialTiming()
    .then(() => {
        console.log('\n✅ Timing test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });