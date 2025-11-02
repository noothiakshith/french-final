// Using built-in fetch (Node.js 18+)

async function testChapterGeneration() {
    try {
        console.log('🧪 Testing chapter generation after progress test...\n');

        // First, login to get a token
        const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'akshith@gmail.com',
                password: 'akshith'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // Check current chapters
        const userResponse = await fetch('http://localhost:8000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userResponse.json();
        console.log(`📚 Current chapters: ${userData.totalChapters || 'unknown'}`);

        // Start a progress test
        const startResponse = await fetch('http://localhost:8000/api/tests/progress/start', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                level: 'BEGINNER',
                chapterRange: '1-5'
            })
        });

        const testData = await startResponse.json();
        console.log('✅ Progress test started');
        console.log(`   Test ID: ${testData.testId}`);

        // Create correct answers to pass the test (80%+ needed)
        const correctAnswers = testData.questions.map(q => {
            let correctAnswer;
            
            if (q.type === 'MULTIPLE_CHOICE') {
                // For multiple choice, we need to find the correct answer
                // Let's use some common French knowledge
                if (q.question.toLowerCase().includes('hello') || q.question.toLowerCase().includes('bonjour')) {
                    correctAnswer = q.options.find(opt => opt.toLowerCase().includes('bonjour')) || q.options[0];
                } else if (q.question.toLowerCase().includes('goodbye') || q.question.toLowerCase().includes('au revoir')) {
                    correctAnswer = q.options.find(opt => opt.toLowerCase().includes('au revoir')) || q.options[0];
                } else if (q.question.toLowerCase().includes('mother') || q.question.toLowerCase().includes('mère')) {
                    correctAnswer = q.options.find(opt => opt.toLowerCase().includes('mère')) || q.options[0];
                } else if (q.question.toLowerCase().includes('cat') || q.question.toLowerCase().includes('chat')) {
                    correctAnswer = q.options.find(opt => opt.toLowerCase().includes('chat')) || q.options[0];
                } else {
                    // Default to first option
                    correctAnswer = q.options[0];
                }
            } else {
                // For fill-in-blank, provide reasonable answers
                if (q.question.toLowerCase().includes('goodbye')) {
                    correctAnswer = 'Au revoir';
                } else if (q.question.toLowerCase().includes('brother')) {
                    correctAnswer = 'frère';
                } else if (q.question.toLowerCase().includes('table')) {
                    correctAnswer = 'table';
                } else if (q.question.toLowerCase().includes('bird')) {
                    correctAnswer = 'oiseau';
                } else {
                    correctAnswer = 'bonjour'; // Default answer
                }
            }
            
            return {
                questionId: q.id,
                userAnswer: correctAnswer
            };
        });

        console.log('\n🚀 Submitting test with strategic answers to pass...');
        console.log(`   Answers count: ${correctAnswers.length}`);

        // Submit the test
        const submitResponse = await fetch(`http://localhost:8000/api/tests/progress/${testData.testId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: correctAnswers
            })
        });

        const result = await submitResponse.json();
        console.log('\n📊 Test Results:');
        console.log(`   Score: ${result.score}%`);
        console.log(`   Passed: ${result.passed}`);
        console.log(`   Correct: ${result.correctAnswers}/${result.totalQuestions}`);

        if (result.passed) {
            console.log('\n🎉 Test PASSED! Checking if new chapters were generated...');
            
            // Wait a moment for chapter generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check chapters again
            const updatedUserResponse = await fetch('http://localhost:8000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedUserData = await updatedUserResponse.json();
            console.log(`📚 Updated chapters: ${updatedUserData.totalChapters || 'unknown'}`);
            
            if (updatedUserData.totalChapters > 5) {
                console.log('✅ SUCCESS: New chapters were generated!');
            } else {
                console.log('❌ No new chapters generated');
            }
        } else {
            console.log('\n❌ Test FAILED - no chapters should be generated');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testChapterGeneration();