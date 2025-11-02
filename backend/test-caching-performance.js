import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Test user credentials
const testUser = {
    email: 'priya@gmail.com',
    password: 'priyaranjini'
};

async function testCachingPerformance() {
    console.log('🚀 Testing API Caching Performance...\n');
    
    try {
        // 1. Login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
        const token = loginResponse.data.token;
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // 2. Test /auth/me endpoint (should be cached)
        console.log('\n2. Testing /auth/me endpoint:');
        
        const startTime1 = Date.now();
        await axios.get(`${BASE_URL}/auth/me`, { headers });
        const firstCall = Date.now() - startTime1;
        console.log(`   First call: ${firstCall}ms`);
        
        const startTime2 = Date.now();
        await axios.get(`${BASE_URL}/auth/me`, { headers });
        const secondCall = Date.now() - startTime2;
        console.log(`   Second call (cached): ${secondCall}ms`);
        console.log(`   Performance improvement: ${Math.round(((firstCall - secondCall) / firstCall) * 100)}%`);
        
        // 3. Test /course/chapters endpoint
        console.log('\n3. Testing /course/chapters endpoint:');
        
        const startTime3 = Date.now();
        await axios.get(`${BASE_URL}/course/chapters`, { headers });
        const firstChaptersCall = Date.now() - startTime3;
        console.log(`   First call: ${firstChaptersCall}ms`);
        
        const startTime4 = Date.now();
        await axios.get(`${BASE_URL}/course/chapters`, { headers });
        const secondChaptersCall = Date.now() - startTime4;
        console.log(`   Second call (cached): ${secondChaptersCall}ms`);
        console.log(`   Performance improvement: ${Math.round(((firstChaptersCall - secondChaptersCall) / firstChaptersCall) * 100)}%`);
        
        // 4. Test multiple rapid calls
        console.log('\n4. Testing 10 rapid calls to /auth/me:');
        const rapidCalls = [];
        
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            await axios.get(`${BASE_URL}/auth/me`, { headers });
            const duration = Date.now() - start;
            rapidCalls.push(duration);
        }
        
        const avgTime = rapidCalls.reduce((a, b) => a + b, 0) / rapidCalls.length;
        console.log(`   Average response time: ${Math.round(avgTime)}ms`);
        console.log(`   Fastest: ${Math.min(...rapidCalls)}ms`);
        console.log(`   Slowest: ${Math.max(...rapidCalls)}ms`);
        
        // 5. Test bridge course caching
        console.log('\n5. Testing bridge course caching:');
        try {
            const startTime5 = Date.now();
            await axios.get(`${BASE_URL}/bridge-course`, { headers });
            const firstBridgeCall = Date.now() - startTime5;
            console.log(`   First bridge course call: ${firstBridgeCall}ms`);
            
            const startTime6 = Date.now();
            await axios.get(`${BASE_URL}/bridge-course`, { headers });
            const secondBridgeCall = Date.now() - startTime6;
            console.log(`   Second bridge course call (cached): ${secondBridgeCall}ms`);
            console.log(`   Performance improvement: ${Math.round(((firstBridgeCall - secondBridgeCall) / firstBridgeCall) * 100)}%`);
        } catch (error) {
            console.log('   Bridge course not available for this user');
        }
        
        console.log('\n✅ Caching performance test completed!');
        console.log('\n📊 Summary:');
        console.log(`   - User profile caching: ~${Math.round(((firstCall - secondCall) / firstCall) * 100)}% faster`);
        console.log(`   - Chapters caching: ~${Math.round(((firstChaptersCall - secondChaptersCall) / firstChaptersCall) * 100)}% faster`);
        console.log(`   - Average rapid call time: ${Math.round(avgTime)}ms`);
        
    } catch (error) {
        console.error('❌ Error testing caching:', error.response?.data || error.message);
    }
}

testCachingPerformance();