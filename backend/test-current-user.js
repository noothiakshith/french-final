import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

async function testCurrentUser() {
    try {
        console.log('🔍 Testing current user authentication...\n');

        // Test with different users
        const users = [
            { email: 'akshith@gmail.com', password: 'akshith1234' },
            { email: 'priya@gmail.com', password: 'priyaranjini' }
        ];

        for (const user of users) {
            try {
                console.log(`\n👤 Testing user: ${user.email}`);
                
                // Login
                const loginResponse = await axios.post(`${BASE_URL}/auth/login`, user);
                const token = loginResponse.data.token;
                console.log(`   ✅ Login successful`);
                
                const headers = { Authorization: `Bearer ${token}` };
                
                // Get user profile
                const profileResponse = await axios.get(`${BASE_URL}/auth/me`, { headers });
                console.log(`   📋 Profile: ${profileResponse.data.name || profileResponse.data.email}`);
                console.log(`   📊 Level: ${profileResponse.data.currentLevel}`);
                console.log(`   📚 Has Chapters: ${profileResponse.data.hasChapters}`);
                
                // Get chapters
                const chaptersResponse = await axios.get(`${BASE_URL}/course/chapters`, { headers });
                const chapters = chaptersResponse.data;
                console.log(`   📖 Chapters: ${chapters.length}`);
                
                if (chapters.length > 0) {
                    console.log(`   🔓 First unlocked chapter: ${chapters[0].title} (ID: ${chapters[0].id})`);
                    
                    // Test accessing the first chapter
                    try {
                        const chapterResponse = await axios.get(`${BASE_URL}/course/chapters/${chapters[0].id}`, { headers });
                        console.log(`   ✅ Chapter access successful: ${chapterResponse.data.title}`);
                    } catch (chapterError) {
                        console.log(`   ❌ Chapter access failed: ${chapterError.response?.status} ${chapterError.response?.statusText}`);
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
            }
        }

        // Test the problematic chapter ID
        console.log(`\n🔍 Testing problematic chapter ID: f0fe8364-8c21-4ab9-bc4d-c4d5519a5b14`);
        
        // Try with akshith's token
        const akshithLogin = await axios.post(`${BASE_URL}/auth/login`, users[0]);
        const akshithToken = akshithLogin.data.token;
        const akshithHeaders = { Authorization: `Bearer ${akshithToken}` };
        
        try {
            await axios.get(`${BASE_URL}/course/chapters/f0fe8364-8c21-4ab9-bc4d-c4d5519a5b14`, { headers: akshithHeaders });
            console.log(`   ✅ Chapter found for akshith`);
        } catch (error) {
            console.log(`   ❌ Chapter not found for akshith: ${error.response?.status} ${error.response?.data?.message}`);
        }

    } catch (error) {
        console.error('❌ Error testing users:', error.message);
    }
}

testCurrentUser();