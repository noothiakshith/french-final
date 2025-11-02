// Using built-in fetch (Node.js 18+)

async function testSubmit() {
    try {
        console.log('🧪 Testing progress test submission...\n');

        // First, login to get a token
        const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'akshith@gmail.com',
                password: 'akshith'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Login failed');
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');

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

        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            throw new Error(`Start test failed: ${startResponse.status} - ${errorText}`);
        }

        const testData = await startResponse.json();
        console.log('✅ Progress test started');
        console.log(`   Test ID: ${testData.testId}`);
        console.log(`   Questions: ${testData.questions.length}`);

        // Show first few questions
        console.log('\n📝 Sample Questions:');
        testData.questions.slice(0, 3).forEach((q, i) => {
            console.log(`   Q${i+1} (ID: ${q.id}): ${q.question}`);
            console.log(`      Type: ${q.type}`);
            if (q.options) {
                console.log(`      Options: ${q.options.join(', ')}`);
            }
        });

        // Create sample answers
        const sampleAnswers = testData.questions.map(q => ({
            questionId: q.id,
            userAnswer: q.type === 'MULTIPLE_CHOICE' ? q.options[0] : 'test answer'
        }));

        console.log('\n🚀 Submitting test with sample answers...');
        console.log(`   Answers count: ${sampleAnswers.length}`);
        console.log(`   Sample answers:`, sampleAnswers.slice(0, 3));

        // Submit the test
        const submitResponse = await fetch(`http://localhost:8000/api/tests/progress/${testData.testId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                answers: sampleAnswers
            })
        });

        console.log(`\n📊 Submit Response Status: ${submitResponse.status}`);
        
        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            console.log('❌ Submit failed:', errorText);
        } else {
            const result = await submitResponse.json();
            console.log('✅ Submit successful:', result);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSubmit();