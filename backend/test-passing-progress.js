// Using built-in fetch (Node.js 18+)

async function testPassingProgress() {
    try {
        console.log('🧪 Testing chapter generation with passing score...\n');

        // Login
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

        // Start progress test
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

        // Create answers that will get 80%+ (need 12+ correct out of 15)
        const passingAnswers = [
            { questionId: "1", userAnswer: "Bonjour" },
            { questionId: "2", userAnswer: "Au revoir" },
            { questionId: "3", userAnswer: "Sept" },
            { questionId: "4", userAnswer: "vingt" },
            { questionId: "5", userAnswer: "Red" },
            { questionId: "6", userAnswer: "table" },
            { questionId: "7", userAnswer: "Mère" },
            { questionId: "8", userAnswer: "frère" },
            { questionId: "9", userAnswer: "Chien" },
            { questionId: "10", userAnswer: "chat" },
            { questionId: "11", userAnswer: "Comment vous appelez-vous?" },
            { questionId: "12", userAnswer: "quinze" },
            { questionId: "13", userAnswer: "Livre" },
            { questionId: "14", userAnswer: "père" },
            { questionId: "15", userAnswer: "Bird" }
        ];

        console.log('🚀 Submitting test with correct answers to pass...');

        // Submit the test
        const submitResponse = await fetch(`http://localhost:8000/api/tests/progress/${testData.testId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: passingAnswers
            })
        });

        const result = await submitResponse.json();
        console.log('\n📊 Test Results:');
        console.log(`   Score: ${result.score}%`);
        console.log(`   Passed: ${result.passed}`);
        console.log(`   Correct: ${result.correctAnswers}/${result.totalQuestions}`);

        if (result.passed) {
            console.log('\n🎉 Test PASSED! New chapters should be generated...');
            
            // Wait for chapter generation to complete
            console.log('⏳ Waiting for chapter generation...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if new chapters were created
            console.log('🔍 Checking for new chapters...');
            
        } else {
            console.log('\n❌ Test FAILED - no chapters should be generated');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testPassingProgress();