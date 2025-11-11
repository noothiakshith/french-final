// --- CONFIGURATION ---
const AI_MODEL_NAME = "frailearn-ai-v2.0"; // Custom FrAILearn AI Model (Display name)
const ACTUAL_MODEL_NAME = "gemini-2.0-flash"; // Actual API model name

/**
 * A utility to parse a JSON response from our custom AI model.
 */
function parseAIResponse(rawText, maxLength = 50000) {
    const sanitizedText = rawText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    try {
        // Check for obvious truncation indicators
        const openBraces = (sanitizedText.match(/\{/g) || []).length;
        const closeBraces = (sanitizedText.match(/\}/g) || []).length;
        const openBrackets = (sanitizedText.match(/\[/g) || []).length;
        const closeBrackets = (sanitizedText.match(/\]/g) || []).length;
        
        // More comprehensive truncation detection
        if (sanitizedText.length > maxLength ||
            openBraces !== closeBraces ||
            openBrackets !== closeBrackets ||
            sanitizedText.includes('...') ||
            sanitizedText.includes('[truncated') ||
            sanitizedText.includes('Error generating')) {
            
            // Try to fix minor truncation issues
            let fixedText = sanitizedText;
            
            // If it's just missing closing braces/brackets, try to add them
            if (openBraces > closeBraces || openBrackets > closeBrackets) {
                console.log('🔧 Attempting to fix truncated JSON...');
                
                // Remove any incomplete trailing content that might be causing issues
                const lastCompleteIndex = Math.max(
                    fixedText.lastIndexOf('}'),
                    fixedText.lastIndexOf(']'),
                    fixedText.lastIndexOf('"')
                );
                
                if (lastCompleteIndex > 0) {
                    // Try to find a good truncation point
                    let truncateAt = fixedText.length;
                    
                    // Look for incomplete strings or objects
                    const incompleteString = fixedText.lastIndexOf('"') > fixedText.lastIndexOf('",');
                    const incompleteObject = fixedText.lastIndexOf('{') > fixedText.lastIndexOf('}');
                    
                    if (incompleteString || incompleteObject) {
                        // Find the last complete field
                        const lastComma = fixedText.lastIndexOf(',');
                        const lastCloseBrace = fixedText.lastIndexOf('}');
                        const lastCloseBracket = fixedText.lastIndexOf(']');
                        
                        truncateAt = Math.max(lastComma, lastCloseBrace, lastCloseBracket);
                        if (truncateAt > 0) {
                            fixedText = fixedText.substring(0, truncateAt);
                        }
                    }
                }
                
                // Add missing closing brackets
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    fixedText += ']';
                }
                // Add missing closing braces
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    fixedText += '}';
                }
                
                try {
                    const parsed = JSON.parse(fixedText);
                    console.log('✅ Successfully repaired truncated JSON');
                    return parsed;
                } catch (fixError) {
                    console.log('❌ Failed to fix truncated JSON:', fixError.message);
                }
            }
            
            throw new Error('AI response was truncated or incomplete. Please try again.');
        }
        
        return JSON.parse(sanitizedText);
    } catch (error) {
        console.error("--- JSON PARSE FAILED ---");
        console.error("Original raw text was:", rawText.substring(0, 1000) + (rawText.length > 1000 ? '...[truncated for log]' : ''));
        
        // If it's a truncation or malformed JSON, throw a clearer error
        if (error.message.includes('Unterminated string') ||
            error.message.includes('truncated') ||
            error.message.includes('Unexpected end of JSON') ||
            error.name === 'SyntaxError') {
            throw new Error('AI response was truncated or incomplete. Please try again.');
        }
        throw error;
    }
}

async function callAIModelAPI(prompt) {
    const API_KEY = process.env.AI_MODEL_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${ACTUAL_MODEL_NAME}:generateContent`;
    
    const requestBody = { 
        contents: [{ parts: [{ text: prompt }] }], 
        generationConfig: { 
            responseMimeType: "application/json",
            maxOutputTokens: 16384,  // Increased limit to prevent truncation
            temperature: 0.7,        // Slightly more focused responses
            topP: 0.8,              // More focused token selection
            topK: 40                // Limit vocabulary diversity
        } 
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Body:", errorBody);
        
        // Handle specific error types
        if (response.status === 429) {
            throw new Error(`Rate limit exceeded (429). Please try again later.`);
        } else if (response.status === 503) {
            throw new Error(`Service unavailable (503). Please try again later.`);
        } else {
            throw new Error(`API request failed with status ${response.status}`);
        }
    }

    const responseData = await response.json();
    
    // Check if response was truncated by the API
    if (responseData.candidates && responseData.candidates[0] && 
        responseData.candidates[0].finishReason === 'MAX_TOKENS') {
        throw new Error('AI response was truncated due to length limits. Please try again.');
    }
    
    return parseAIResponse(responseData.candidates[0].content.parts[0].text);
}


export async function generatePlacementTest() {
    try {
        console.log(`AI Service: Generating placement test...`);
        const prompt = `You are a French language assessment expert. Generate a comprehensive placement test for A1-B1 levels. 

The output MUST be a single, valid JSON object with this EXACT structure:
{
  "placementTest": {
    "questionsData": [
      {
        "id": "1",
        "type": "MULTIPLE_CHOICE",
        "topic": "Greetings",
        "difficulty": "EASY",
        "question": "How do you say 'Hello' in French?",
        "options": ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
        "correctAnswer": "Bonjour"
      },
      {
        "id": "2", 
        "type": "FILL_IN_BLANK",
        "topic": "Verbs",
        "difficulty": "MEDIUM",
        "question": "Complete: Je _____ français. (I speak French)",
        "options": [],
        "correctAnswer": "parle"
      }
    ]
  }
}

Generate exactly 10 questions. Mix MULTIPLE_CHOICE (with exactly 4 options each) and FILL_IN_BLANK types. Cover topics like greetings, numbers, verbs, family, food, time, etc. Distribute difficulty: 8 EASY, 8 MEDIUM, 4 HARD.`;
        const result = await callAIModelAPI(prompt);
        return result.placementTest;
    } catch (error) {
        console.error("Error in generatePlacementTest:", error);
        throw new Error("Failed to generate placement test from AI.");
    }
}

export async function gradeTestWithAI(originalQuestions, userAnswers) {
    try {
        console.log(`AI Service: Sending test to our custom AI model for grading...`);
        const prompt = `You are an expert French teacher. Grade the following test and provide an analysis. The output MUST be a single, valid JSON object with keys "score" (0-100 number), "correctCount" (number), and "weaknesses" (an object mapping topics to mistake counts). Be slightly lenient with grading.
**Original Test Questions:**
${JSON.stringify(originalQuestions, null, 2)}
**Student's Submitted Answers:**
${JSON.stringify(userAnswers, null, 2)}`;
        return await callAIModelAPI(prompt);
    } catch (error) {
        console.error("Error in gradeTestWithAI:", error);
        throw new Error("Failed to get evaluation from AI.");
    }
}

export async function generateCurriculum(level, retryCount = 0) {
    const maxRetries = 2;
    
    try {
        console.log(`AI Service: Generating ${level} curriculum in smaller batches (attempt ${retryCount + 1})...`);

        // Generate curriculum in very small batches of 1 chapter each to avoid truncation
        const allChapters = [];
        const batches = [
            { start: 1, end: 1, topics: "greetings and introductions" },
            { start: 2, end: 2, topics: "basic verbs and numbers" },
            { start: 3, end: 3, topics: "family vocabulary" },
            { start: 4, end: 4, topics: "colors and adjectives" },
            { start: 5, end: 5, topics: "food and meals" },
            { start: 6, end: 6, topics: "shopping and money" },
            { start: 7, end: 7, topics: "directions and places" },
            { start: 8, end: 8, topics: "time and dates" },
            { start: 9, end: 9, topics: "weather and seasons" },
            { start: 10, end: 10, topics: "hobbies and activities" },
            { start: 11, end: 11, topics: "past tense" },
            { start: 12, end: 12, topics: "future tense" },
            { start: 13, end: 13, topics: "subjunctive mood" },
            { start: 14, end: 14, topics: "complex sentences" },
            { start: 15, end: 15, topics: "culture and conversation" }
        ];

        for (const batch of batches) {
            try {
                const chapterCount = batch.end - batch.start + 1;
                const prompt = `You are an expert French language educator creating comprehensive curriculum content. Generate exactly ${chapterCount} chapter(s) (${batch.start}${chapterCount > 1 ? `-${batch.end}` : ''}) for a ${level} French course with RICH THEORETICAL CONTENT.

IMPORTANT: Create detailed, educational content with extensive explanations, cultural context, and practical applications.

The output MUST be a single, valid JSON object with this EXACT structure:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "topic": "Main Topic",
      "description": "Brief description (max 80 chars)",
      "estimatedMinutes": 60,
      "learningObjectives": {
        "goals": ["Specific learning goal 1", "Specific learning goal 2", "Specific learning goal 3"]
      },
      "content": {
        "introduction": "Comprehensive chapter introduction (2-3 sentences)"
      },
      "lessons": [
        {
          "lessonNumber": 1,
          "title": "Detailed Lesson Title",
          "topic": "Specific lesson topic",
          "content": {
            "introduction": "Detailed lesson introduction explaining importance and context (2-3 sentences)",
            "explanation": "COMPREHENSIVE explanation covering theory, rules, patterns, cultural context, and practical usage (minimum 300 words). Include etymology, pronunciation guides, cultural notes, and real-world applications.",
            "keyPoints": ["Detailed key point 1 with explanation", "Detailed key point 2 with context", "Detailed key point 3 with examples", "Detailed key point 4 with cultural notes"],
            "commonMistakes": ["Specific mistake 1 with explanation why it happens", "Specific mistake 2 with correction method", "Specific mistake 3 with cultural context"]
          },
          "grammarPoints": {
            "points": ["Detailed grammar concept 1", "Detailed grammar concept 2", "Detailed grammar concept 3"]
          },
          "vocabulary": {
            "words": ["word1 - translation", "word2 - translation", "word3 - translation", "word4 - translation", "word5 - translation"]
          },
          "examples": {
            "pairs": [
              {"fr": "French example", "en": "English translation"},
              {"fr": "French example", "en": "English translation"},
              {"fr": "French example", "en": "English translation"}
            ]
          },
          "exercises": [
            {
              "type": "MULTIPLE_CHOICE",
              "question": "Detailed question testing understanding of theory and application",
              "correctAnswer": "Correct answer",
              "options": ["Correct option", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
              "explanation": "Brief explanation of the correct answer",
              "grammarPoint": "Specific grammar point being tested"
            },
            {
              "type": "FILL_IN_BLANK",
              "question": "Contextual fill-in-the-blank testing practical application: _____ example with real context",
              "correctAnswer": "answer",
              "options": [],
              "explanation": "Brief explanation of the answer",
              "grammarPoint": "Specific grammar point being tested"
            }
          ]
        }
      ]
    }
  ]
}

Focus on: ${batch.topics}
REQUIREMENTS:
- Explanations must be 150-200 words (concise but informative)
- Include key cultural context and pronunciation notes
- Focus on practical applications
- Each lesson should have exactly 2 exercises
- Keep content focused and avoid excessive detail to prevent truncation`;

                const result = await callAIModelAPI(prompt);
                if (result && result.chapters && Array.isArray(result.chapters)) {
                    allChapters.push(...result.chapters);
                    console.log(`✅ Generated ${result.chapters.length} chapter(s) for batch ${batch.start}-${batch.end}`);
                } else {
                    throw new Error(`Invalid format for chapters ${batch.start}-${batch.end}`);
                }
            } catch (sectionError) {
                console.error(`Error generating chapters ${batch.start}-${batch.end}:`, sectionError);
                // Generate fallback chapters for this batch
                for (let i = batch.start; i <= batch.end; i++) {
                    allChapters.push(createFallbackChapter(i, level, batch.topics));
                }
            }
        }

        console.log(`✅ Total chapters generated: ${allChapters.length}`);
        return allChapters;
    } catch (error) {
        console.error(`Error in generateCurriculum for ${level} (attempt ${retryCount + 1}):`, error);
        
        // Retry with even simpler prompt if truncation error and retries available
        if (retryCount < maxRetries && (error.message.includes('truncated') || error.message.includes('429'))) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`🔄 Retrying curriculum generation in ${delay}ms (attempt ${retryCount + 2})...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateCurriculum(level, retryCount + 1);
        }
        
        // Return complete fallback curriculum
        console.log('⚠️ Using complete fallback curriculum');
        return Array(15).fill(null).map((_, chapterIndex) =>
            createFallbackChapter(chapterIndex + 1, level, "French fundamentals")
        );
    }
}

function createFallbackChapter(chapterNumber, level, topics) {
    const detailedChapters = {
        1: {
            title: "Chapter 1: Greetings and Introductions",
            topic: "Greetings and Introductions",
            description: "Master French greetings, introductions, and polite expressions",
            lessons: [
                {
                    lessonNumber: 1,
                    title: "Basic Greetings and Farewells",
                    topic: "Greetings",
                    content: {
                        introduction: "Welcome to your first French lesson! Greetings are the foundation of all social interactions in French culture. Understanding when and how to use different greetings is crucial for making a good impression.",
                        explanation: "French greetings are more nuanced than English ones and depend heavily on context, time of day, and social relationships. The most common greeting is 'Bonjour' (literally 'good day'), used from morning until about 6 PM. After 6 PM, French speakers switch to 'Bonsoir' (good evening). The informal 'Salut' can mean both 'hi' and 'bye' but should only be used with friends, family, or people your age. When leaving, 'Au revoir' (literally 'until we see again') is the standard goodbye, while 'À bientôt' (see you soon) implies you'll meet again shortly. In formal situations, always add 'Monsieur' (Sir), 'Madame' (Madam), or 'Mademoiselle' (Miss) after your greeting. French culture values politeness highly, so never skip greetings when entering shops, offices, or meeting people.",
                        keyPoints: [
                            "Bonjour is used until 6 PM, then switch to Bonsoir",
                            "Salut is informal - use only with friends and family",
                            "Always add Monsieur/Madame in formal situations",
                            "Au revoir is the standard goodbye for all situations",
                            "French greetings show respect and are never optional"
                        ],
                        commonMistakes: [
                            "Using 'Bonjour' in the evening (use 'Bonsoir' instead)",
                            "Saying 'Salut' to strangers or in professional settings",
                            "Forgetting to greet people when entering a shop or office",
                            "Not using titles (Monsieur/Madame) with older people or in formal contexts"
                        ]
                    },
                    grammarPoints: { 
                        points: [
                            "Time-based greetings (morning vs evening)",
                            "Formal vs informal register (vous vs tu)",
                            "Use of titles and honorifics"
                        ] 
                    },
                    vocabulary: { 
                        words: [
                            "bonjour - hello/good day (formal, until 6 PM)",
                            "bonsoir - good evening (after 6 PM)",
                            "salut - hi/bye (informal only)",
                            "au revoir - goodbye (universal)",
                            "à bientôt - see you soon",
                            "monsieur - sir/mister",
                            "madame - madam/mrs",
                            "mademoiselle - miss (less common now)",
                            "bonne nuit - good night (when going to bed)",
                            "à plus tard - see you later (informal)"
                        ] 
                    },
                    examples: {
                        pairs: [
                            { fr: "Bonjour Madame Dupont, comment allez-vous?", en: "Hello Mrs. Dupont, how are you?" },
                            { fr: "Bonsoir Monsieur, bonne soirée!", en: "Good evening Sir, have a good evening!" },
                            { fr: "Salut Marie! Ça va?", en: "Hi Marie! How's it going?" },
                            { fr: "Au revoir et à bientôt!", en: "Goodbye and see you soon!" },
                            { fr: "Bonne nuit, dormez bien!", en: "Good night, sleep well!" },
                            { fr: "À plus tard, les amis!", en: "See you later, friends!" }
                        ]
                    }
                },
                {
                    lessonNumber: 2,
                    title: "Introductions and Personal Information",
                    topic: "Introductions",
                    content: {
                        introduction: "Now that you can greet people, let's learn how to introduce yourself and others. This is essential for building relationships and making connections in French-speaking environments.",
                        explanation: "French introductions follow specific patterns and etiquette rules. To introduce yourself, use 'Je m'appelle...' (My name is...) or 'Je suis...' (I am...). The reflexive verb 's'appeler' literally means 'to call oneself' and is the most common way to give your name. When asking someone's name, use 'Comment vous appelez-vous?' (formal) or 'Comment tu t'appelles?' (informal). The choice between 'vous' and 'tu' is crucial - 'vous' shows respect and is used with strangers, older people, or in professional settings, while 'tu' is for friends, family, and peers. When introducing others, use 'Je vous présente...' (formal) or 'Je te présente...' (informal). After introductions, respond with 'Enchanté' (masculine) or 'Enchantée' (feminine) meaning 'pleased to meet you'. French culture values proper introductions, so take time to do them correctly.",
                        keyPoints: [
                            "Je m'appelle is the standard way to give your name",
                            "Vous vs tu distinction is crucial for politeness",
                            "Enchanté/Enchantée shows good manners after introductions",
                            "Always introduce the younger person to the older person",
                            "Use full names in formal situations, first names with friends"
                        ],
                        commonMistakes: [
                            "Using 'tu' with strangers or in professional settings",
                            "Forgetting to say 'Enchanté(e)' after being introduced",
                            "Not adjusting the ending of 'Enchanté(e)' to your gender",
                            "Introducing people in the wrong order (always younger to older)"
                        ]
                    },
                    grammarPoints: { 
                        points: [
                            "Reflexive verbs (s'appeler - to be called)",
                            "Formal vs informal pronouns (vous/tu)",
                            "Gender agreement in adjectives (enchanté/enchantée)"
                        ] 
                    },
                    vocabulary: { 
                        words: [
                            "je m'appelle - my name is (literally: I call myself)",
                            "comment vous appelez-vous? - what's your name? (formal)",
                            "comment tu t'appelles? - what's your name? (informal)",
                            "je vous présente - I introduce you to (formal)",
                            "je te présente - I introduce you to (informal)",
                            "enchanté(e) - pleased to meet you",
                            "ravi(e) de vous rencontrer - delighted to meet you",
                            "c'est un plaisir - it's a pleasure",
                            "permettez-moi de me présenter - allow me to introduce myself",
                            "voici - here is/this is"
                        ] 
                    },
                    examples: {
                        pairs: [
                            { fr: "Je m'appelle Pierre Dubois, et vous?", en: "My name is Pierre Dubois, and you?" },
                            { fr: "Comment vous appelez-vous, Monsieur?", en: "What is your name, Sir?" },
                            { fr: "Je vous présente ma collègue, Marie.", en: "I'd like you to meet my colleague, Marie." },
                            { fr: "Enchantée de faire votre connaissance!", en: "Pleased to make your acquaintance!" },
                            { fr: "Permettez-moi de me présenter: je suis le directeur.", en: "Allow me to introduce myself: I am the director." },
                            { fr: "Voici mon ami Paul, il est médecin.", en: "This is my friend Paul, he's a doctor." }
                        ]
                    }
                }
            ]
        },
        2: {
            title: "Chapter 2: Numbers and Counting",
            topic: "Numbers",
            description: "Learn French numbers 0-100 and their practical applications",
            lessons: [
                {
                    lessonNumber: 1,
                    title: "Numbers 0-20: Foundation of French Counting",
                    topic: "Numbers 0-20",
                    content: {
                        introduction: "Numbers are fundamental to daily communication in French. Whether you're shopping, telling time, or giving your age, you'll use numbers constantly. French numbers have unique pronunciation rules and patterns that differ significantly from English.",
                        explanation: "French numbers 0-10 are completely unique words that must be memorized: zéro, un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix. Pay special attention to pronunciation: 'un' has a nasal sound (like 'ahn'), 'huit' is pronounced 'weet' (the 'h' is silent), and 'six' can be pronounced 'sees' or 'see' depending on context. Numbers 11-16 are also unique: onze, douze, treize, quatorze, quinze, seize. From 17-19, French uses a logical pattern: dix-sept (ten-seven), dix-huit (ten-eight), dix-neuf (ten-nine). This pattern will help you understand larger numbers later. The number 20 is 'vingt', which becomes the base for numbers in the twenties. French numbers also have liaison rules - when a number ending in a consonant is followed by a word starting with a vowel, the consonant is pronounced and linked to the next word.",
                        keyPoints: [
                            "Numbers 0-16 are unique words that must be memorized",
                            "Numbers 17-19 follow the pattern 'dix + unit number'",
                            "Pronunciation of 'un' (nasal) and 'huit' (silent h) is crucial",
                            "Liaison occurs between numbers and following vowel sounds",
                            "These numbers form the foundation for all larger numbers"
                        ],
                        commonMistakes: [
                            "Mispronouncing 'un' as 'oon' instead of the nasal 'ahn'",
                            "Pronouncing the 'h' in 'huit' (it's silent)",
                            "Forgetting liaison between numbers and vowel-starting words",
                            "Confusing 'six' and 'sept' in rapid speech"
                        ]
                    },
                    grammarPoints: { 
                        points: [
                            "Cardinal numbers (counting numbers)",
                            "Liaison rules with numbers",
                            "Silent letters in number pronunciation"
                        ] 
                    },
                    vocabulary: { 
                        words: [
                            "zéro - zero",
                            "un - one (nasal pronunciation: 'ahn')",
                            "deux - two",
                            "trois - three", 
                            "quatre - four",
                            "cinq - five",
                            "six - six (pronunciation varies)",
                            "sept - seven",
                            "huit - eight (silent 'h')",
                            "neuf - nine",
                            "dix - ten",
                            "onze - eleven",
                            "douze - twelve",
                            "treize - thirteen",
                            "quatorze - fourteen",
                            "quinze - fifteen",
                            "seize - sixteen",
                            "dix-sept - seventeen",
                            "dix-huit - eighteen",
                            "dix-neuf - nineteen",
                            "vingt - twenty"
                        ] 
                    },
                    examples: {
                        pairs: [
                            { fr: "J'ai dix-huit ans.", en: "I am eighteen years old." },
                            { fr: "Il y a quinze étudiants dans la classe.", en: "There are fifteen students in the class." },
                            { fr: "Nous habitons au numéro douze.", en: "We live at number twelve." },
                            { fr: "Le magasin ferme à vingt heures.", en: "The store closes at twenty hours (8 PM)." },
                            { fr: "J'ai acheté six pommes et quatre oranges.", en: "I bought six apples and four oranges." },
                            { fr: "Mon frère a treize ans, ma sœur en a seize.", en: "My brother is thirteen, my sister is sixteen." }
                        ]
                    }
                }
            ]
        }
    };

    // Get detailed chapter or create basic fallback
    const detailedChapter = detailedChapters[chapterNumber];
    if (detailedChapter) {
        return {
            ...detailedChapter,
            estimatedMinutes: 60,
            learningObjectives: {
                goals: [
                    `Master ${detailedChapter.topic.toLowerCase()} vocabulary and usage`,
                    "Understand cultural context and proper etiquette",
                    "Apply knowledge in real-world conversations"
                ]
            },
            content: {
                introduction: `Welcome to ${detailedChapter.title}! This comprehensive chapter will give you deep understanding of ${detailedChapter.topic.toLowerCase()} in French.`
            },
            lessons: detailedChapter.lessons.map(lesson => ({
                ...lesson,
                exercises: [
                    {
                        type: "MULTIPLE_CHOICE",
                        question: `What is the main topic of this lesson about ${lesson.topic.toLowerCase()}?`,
                        correctAnswer: lesson.topic,
                        options: [lesson.topic, "Grammar", "Vocabulary", "Culture"],
                        explanation: `This lesson focuses specifically on ${lesson.topic.toLowerCase()}.`,
                        grammarPoint: lesson.grammarPoints.points[0]
                    },
                    {
                        type: "FILL_IN_BLANK",
                        question: "Complete the sentence with appropriate vocabulary from this lesson.",
                        correctAnswer: "bonjour",
                        options: [],
                        explanation: "This tests your understanding of the lesson vocabulary.",
                        grammarPoint: lesson.grammarPoints.points[0]
                    }
                ]
            }))
        };
    }

    // Basic fallback for other chapters
    const chapterTopics = [
        "Greetings and Introductions", "Numbers and Age", "Colors and Objects", "Family Members", "Animals",
        "Food and Drinks", "Shopping", "Directions", "Past Tense", "Future Tense",
        "Subjunctive Mood", "Complex Sentences", "French Culture", "Literature", "Advanced Conversation"
    ];

    return {
        title: `Chapter ${chapterNumber}: ${chapterTopics[chapterNumber - 1] || `${level} French`}`,
        topic: chapterTopics[chapterNumber - 1] || topics,
        description: `Learn ${chapterTopics[chapterNumber - 1]?.toLowerCase() || 'French concepts'} in this chapter.`,
        estimatedMinutes: 45,
        learningObjectives: {
            goals: [
                `Master ${chapterTopics[chapterNumber - 1]?.toLowerCase() || 'key concepts'}`,
                "Practice pronunciation and usage",
                "Apply knowledge in conversations"
            ]
        },
        content: {
            introduction: `Welcome to Chapter ${chapterNumber}! In this chapter, you'll learn about ${chapterTopics[chapterNumber - 1]?.toLowerCase() || 'French fundamentals'}.`
        },
        lessons: [
            {
                lessonNumber: 1,
                title: `Introduction to ${chapterTopics[chapterNumber - 1] || 'French'}`,
                topic: chapterTopics[chapterNumber - 1] || "Fundamentals",
                content: {
                    introduction: "Let's start with the basics of this important topic.",
                    explanation: `This comprehensive lesson covers fundamental concepts about ${chapterTopics[chapterNumber - 1]?.toLowerCase() || 'French fundamentals'}. You'll learn key vocabulary, essential grammar rules, and practical phrases that form the foundation of this topic. Understanding these concepts is crucial for building your French language skills and communicating effectively in real-world situations.`,
                    keyPoints: [
                        "Master essential vocabulary and pronunciation",
                        "Understand basic grammar patterns and rules", 
                        "Practice using new concepts in context",
                        "Learn cultural aspects and proper usage"
                    ],
                    commonMistakes: [
                        "Confusing masculine and feminine forms",
                        "Incorrect pronunciation of nasal sounds",
                        "Using informal language in formal situations"
                    ]
                },
                grammarPoints: { points: ["Basic grammar rules", "Sentence structure", "Gender agreement"] },
                vocabulary: { words: ["bonjour - hello", "au revoir - goodbye", "merci - thank you", "s'il vous plaît - please", "oui - yes", "non - no", "comment - how", "pourquoi - why"] },
                examples: {
                    pairs: [
                        { fr: "Bonjour, comment allez-vous?", en: "Hello, how are you?" },
                        { fr: "Au revoir et merci!", en: "Goodbye and thank you!" },
                        { fr: "S'il vous plaît, répétez.", en: "Please, repeat." },
                        { fr: "Oui, c'est correct.", en: "Yes, that's correct." },
                        { fr: "Non, ce n'est pas ça.", en: "No, that's not it." }
                    ]
                },
                exercises: [
                    {
                        type: "MULTIPLE_CHOICE",
                        question: "How do you say 'Hello' in French?",
                        correctAnswer: "Bonjour",
                        options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
                        explanation: "Bonjour is the standard French greeting meaning 'hello' or 'good day'.",
                        grammarPoint: "Basic greetings"
                    },
                    {
                        type: "FILL_IN_BLANK",
                        question: "Complete: _____ allez-vous? (How are you?)",
                        correctAnswer: "Comment",
                        options: [],
                        explanation: "Comment means 'how' and is used to ask questions about manner or condition.",
                        grammarPoint: "Question words"
                    }
                ]
            }
        ]
    };
}

export async function generateBridgeCourse(weaknesses, retryCount = 0) {
    const maxRetries = 2;
    
    try {
        const weakTopicsString = Object.keys(weaknesses).join(', ') || 'basic French concepts';
        console.log(`AI Service: Generating Bridge Course for weaknesses: ${weakTopicsString} (attempt ${retryCount + 1})`);
        
        // Reduce content complexity for retries to avoid truncation
        const isRetry = retryCount > 0;
        const chapterLimit = isRetry ? 1 : 3;
        const minWords = isRetry ? 200 : 400;
        
        const prompt = `You are an expert French tutor creating comprehensive remedial content. A student has shown weakness in: ${weakTopicsString}. Generate a detailed "Bridge Course" with rich educational content to fix these gaps.

The output MUST be a single, valid JSON object with this EXACT structure:
{
  "bridgeCourse": {
    "chapters": [
      {
        "title": "Comprehensive Chapter Title",
        "topic": "Specific Topic",
        "description": "Brief description (max 100 chars)",
        "estimatedMinutes": 45,
        "content": {
          "introduction": "Detailed introduction explaining why this topic is important and what students will learn (2-3 sentences)",
          "explanation": "COMPREHENSIVE explanation covering theory, rules, common mistakes, cultural context, and practical applications (minimum 400 words). Include step-by-step breakdowns, examples, pronunciation guides, and memory techniques.",
          "keyPoints": ["Detailed key concept 1 with explanation", "Detailed key concept 2 with examples", "Detailed key concept 3 with context", "Detailed key concept 4 with applications"],
          "commonMistakes": ["Specific mistake 1 with explanation and correction", "Specific mistake 2 with why it happens", "Specific mistake 3 with prevention tips"],
          "studyTips": ["Practical tip 1 for mastering this concept", "Memory technique 2", "Practice suggestion 3"],
          "culturalNotes": ["Cultural context 1", "Usage note 2", "Social context 3"]
        },
        "exercises": [
          {
            "type": "MULTIPLE_CHOICE",
            "question": "Detailed question with context that tests understanding",
            "correctAnswer": "Correct answer",
            "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
            "explanation": "Comprehensive explanation of why this answer is correct, including grammar rules and usage notes"
          }
        ]
      }
    ]
  }
}

REQUIREMENTS:
- Create ${chapterLimit} chapter${chapterLimit > 1 ? 's' : ''} (focused on most critical weakness)
- Each explanation must be minimum ${minWords} words with rich detail
- Include cultural context, pronunciation guides, and memory techniques
- Provide practical study tips and common mistake prevention
- Each chapter should have exactly ${isRetry ? 3 : 5} well-designed exercises
- Make content educational and comprehensive for remedial learning
- Focus specifically on: ${weakTopicsString}
- IMPORTANT: Keep response concise to avoid truncation`;
        
        const result = await callAIModelAPI(prompt);
        if (!result || !result.bridgeCourse || !result.bridgeCourse.chapters) {
            throw new Error('AI returned invalid bridge course format');
        }
        return result.bridgeCourse;
    } catch (error) {
        console.error(`Error in generateBridgeCourse (attempt ${retryCount + 1}):`, error);
        
        // Retry with simpler prompt if truncation error and retries available
        if (retryCount < maxRetries && (error.message.includes('truncated') || error.message.includes('429'))) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.log(`🔄 Retrying bridge course generation in ${delay}ms (attempt ${retryCount + 2})...`);
            
            // Wait before retrying to handle rate limiting
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateBridgeCourse(weaknesses, retryCount + 1);
        }
        // Return a comprehensive fallback bridge course if AI fails
        console.log('🔄 Using fallback bridge course due to AI service issues');
        const weakTopicsString = Object.keys(weaknesses).join(', ') || 'basic French concepts';
        
        return {
            chapters: [{
                title: `Essential French Review: ${weakTopicsString}`,
                topic: "French Fundamentals",
                description: "Comprehensive review of essential French concepts you need to master",
                estimatedMinutes: 60,
                content: {
                    introduction: `This comprehensive review chapter will help you master the fundamental French concepts that are essential for your language learning journey. We'll focus specifically on: ${weakTopicsString}.`,
                    explanation: `French fundamentals form the backbone of successful language learning. This chapter focuses on the core concepts that many students find challenging, particularly in areas like ${weakTopicsString}. 

GREETINGS AND BASIC EXPRESSIONS:
French greetings are more formal than English. Use "Bonjour" (good day) until evening, then "Bonsoir" (good evening). "Salut" is informal for friends. "Comment allez-vous?" (formal) or "Ça va?" (informal) means "How are you?"

FAMILY VOCABULARY:
Essential family terms include: la famille (family), le père (father), la mère (mother), le fils (son), la fille (daughter), le frère (brother), la sœur (sister), les parents (parents), les grands-parents (grandparents).

NUMBERS AND TIME:
Numbers 1-20: un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt. Time expressions: Quelle heure est-il? (What time is it?), Il est... (It is...).

VERBS AND CONJUGATION:
Regular -ER verbs (parler): je parle, tu parles, il/elle parle, nous parlons, vous parlez, ils/elles parlent. Key irregular verbs: être (to be), avoir (to have), aller (to go), faire (to do/make).

FOOD VOCABULARY:
Basic food terms: le pain (bread), l'eau (water), le lait (milk), la viande (meat), les légumes (vegetables), les fruits (fruits), le fromage (cheese), le vin (wine).

ADJECTIVES AND AGREEMENT:
Adjectives must agree with nouns in gender and number. Masculine: grand (tall), petit (small). Feminine: grande, petite. Plural: grands/grandes, petits/petites.

This foundation will prepare you for more advanced French concepts and help you communicate effectively in everyday situations.`,
                    keyPoints: [
                        "Gender patterns: masculine nouns often end in consonants, feminine often in -e, but learn exceptions",
                        "Regular verb conjugations follow predictable patterns based on infinitive endings (-er, -ir, -re)",
                        "Adjectives usually follow nouns in French, unlike English (une voiture rouge)",
                        "Three ways to form questions: inversion, est-ce que, or rising intonation"
                    ],
                    commonMistakes: [
                        "Assuming all nouns ending in -e are feminine - learn exceptions like 'le problème'",
                        "Forgetting to make adjectives agree with noun gender and number",
                        "Using English word order for adjectives (saying 'rouge voiture' instead of 'voiture rouge')"
                    ],
                    studyTips: [
                        "Learn nouns with their articles (le/la) to memorize gender naturally",
                        "Practice verb conjugations daily with flashcards or apps",
                        "Read French texts aloud to internalize natural sentence rhythm"
                    ],
                    culturalNotes: [
                        "French speakers are generally patient with learners who make gender mistakes",
                        "Formal vs informal speech (vous vs tu) is very important in French culture",
                        "French sentence structure reflects the language's logical, structured approach"
                    ]
                },
                exercises: [
                    {
                        type: "MULTIPLE_CHOICE",
                        question: "Which article goes with 'problème'?",
                        correctAnswer: "le",
                        options: ["le", "la", "les", "des"],
                        explanation: "'Le problème' is masculine despite ending in -e. This is a common exception to the gender pattern that students must memorize."
                    },
                    {
                        type: "FILL_IN_BLANK",
                        question: "Complete the conjugation: Je _____ français. (I speak French)",
                        correctAnswer: "parle",
                        options: [],
                        explanation: "'Parler' is a regular -ER verb. For 'je', drop -er and add -e: je parle."
                    },
                    {
                        type: "MULTIPLE_CHOICE",
                        question: "How do you say 'a red car' in French?",
                        correctAnswer: "une voiture rouge",
                        options: ["une voiture rouge", "une rouge voiture", "un voiture rouge", "une voiture rouges"],
                        explanation: "In French, most adjectives come after the noun. 'Voiture' is feminine, so use 'une' and 'rouge' stays the same."
                    },
                    {
                        type: "FILL_IN_BLANK",
                        question: "Make this formal: Tu parles anglais? → _____ vous parlez anglais?",
                        correctAnswer: "Est-ce que",
                        options: [],
                        explanation: "'Est-ce que' is the easiest way to form formal questions in French. It's more common than inversion in spoken French."
                    },
                    {
                        type: "MULTIPLE_CHOICE",
                        question: "Which verb conjugation is correct for 'nous' with 'finir'?",
                        correctAnswer: "finissons",
                        options: ["finissons", "finissez", "finissent", "finis"],
                        explanation: "For -IR verbs like 'finir', the 'nous' form adds -issons: nous finissons."
                    }
                ]
            }]
        };
    }
}


// ... (keep all existing functions: callAIModelAPI, generatePlacementTest, gradeTestWithAI, etc.)

/**
 * @desc    Calls FrAILearn AI Model to generate a progress test based on the content of specific chapters.
 * @param {Array<object>} completedChapters - An array of chapter objects the user has completed.
 * @returns {Promise<object>} A promise that resolves to the test data structure.
 */
/**
 * @desc    Calls FrAILearn AI Model to extract key vocabulary and grammar from a lesson to create flashcards.
 * @param {object} lesson - The full lesson object from the database.
 * @returns {Promise<Array<object>>} A promise resolving to an array of flashcard data objects.
 */
export async function generateFlashcardsForLesson(lesson) {
    // We can use the JSON content we already stored for the lesson.
    const lessonContent = JSON.stringify({
        title: lesson.title,
        vocabulary: lesson.vocabulary,
        grammarPoints: lesson.grammarPoints,
        examples: lesson.examples,
    });

    const prompt = `You are a French language teaching assistant. Based on the following lesson content, generate a set of flashcards.
The output MUST be a single, valid JSON object with a root key "flashcards". This key should contain an array of flashcard objects.

**Lesson Content:**
${lessonContent}

**Instructions:**
1.  For each important vocabulary word, create one flashcard.
2.  For each key grammar point or example sentence, create one flashcard.
3.  Each flashcard object in the array must have the following keys:
    - "frontText": The English word/phrase or concept (e.g., "To have", "The book").
    - "backText": The corresponding French translation (e.g., "Avoir", "Le livre").
    - "exampleSentence": An optional but highly recommended simple French sentence using the word.

Generate between 5 and 10 flashcards for this lesson.`;

    try {
        console.log(`AI Service: Generating flashcards for lesson: "${lesson.title}"`);
        const result = await callAIModelAPI(prompt);
        if (!result || !result.flashcards || !Array.isArray(result.flashcards)) {
            throw new Error('AI returned invalid flashcard format');
        }
        return result.flashcards; // Return the array of flashcard objects
    } catch (error) {
        console.error(`Error in generateFlashcardsForLesson for lesson "${lesson.title}":`, error);
        // Return a minimal set of flashcards if AI fails
        return [{
            frontText: "Hello",
            backText: "Bonjour",
            exampleSentence: "Bonjour, comment allez-vous?"
        }];
    }
}

export async function generateChapterRange(level, startChapter, endChapter) {
    try {
        console.log(`AI Service: Generating chapters ${startChapter}-${endChapter} for ${level}...`);

        const chapterCount = endChapter - startChapter + 1;
        const topicsByRange = {
            "1-5": "greetings, numbers, basic verbs, family, colors",
            "6-10": "food, shopping, directions, past tense, future tense",
            "11-15": "subjunctive, complex sentences, culture, literature, advanced conversation"
        };

        const rangeKey = `${startChapter}-${endChapter}`;
        const topics = topicsByRange[rangeKey] || "French fundamentals";

        const prompt = `You are a French curriculum designer. Generate chapters ${startChapter}-${endChapter} for a ${level} French course. The output MUST be a single, valid JSON object with a root key "chapters" containing an array of exactly ${chapterCount} chapter objects.

Each chapter must have:
- "title": Clear chapter title
- "topic": Main topic focus  
- "description": Brief description (max 100 chars)
- "estimatedMinutes": Number (30-60)
- "learningObjectives": { "goals": [array of 2-3 learning goals] }
- "content": { "introduction": "Brief intro text" }
- "lessons": Array of exactly 2 lesson objects

Each lesson must have:
- "lessonNumber": 1 or 2
- "title": Lesson title
- "topic": Lesson topic
- "content": { "introduction": "Brief intro", "explanation": "Key concepts" }
- "grammarPoints": { "points": [array of 2-3 grammar points] }
- "vocabulary": { "words": [array of 5-8 key words] }
- "examples": { "pairs": [array of 3-5 {"fr": "French", "en": "English"} pairs] }

Focus on: ${topics}
Keep content concise and practical.`;

        const result = await callAIModelAPI(prompt);
        if (result && result.chapters && Array.isArray(result.chapters)) {
            console.log(`✅ Generated ${result.chapters.length} chapters for range ${startChapter}-${endChapter}`);
            return result.chapters;
        } else {
            throw new Error(`Invalid format for chapters ${startChapter}-${endChapter}`);
        }
    } catch (error) {
        console.error(`Error generating chapters ${startChapter}-${endChapter}:`, error);
        // Generate fallback chapters
        const fallbackChapters = [];
        for (let i = startChapter; i <= endChapter; i++) {
            fallbackChapters.push(createFallbackChapter(i, level, "French fundamentals"));
        }
        return fallbackChapters;
    }
}

export async function generateProgressTest(completedChapters) {
    // 1. Extract the key topics and vocabulary from the completed chapters to guide the AI.
    const topics = completedChapters.map(ch => ch.topic).join(', ');
    const summary = completedChapters.map(ch => `Chapter ${ch.chapterNumber}: ${ch.title} (${ch.description})`).join('\n');

    const prompt = `You are a French language teacher creating a progress test for a student.
The student has just completed a section covering the following chapters:
${summary}

The key topics were: ${topics}.

Your task is to generate a test to assess their mastery of THIS specific content.
The output MUST be a single, valid JSON object with a root key "progressTest", which contains a "questionsData" array of 15 question objects.
Each question object must have: "id", "type" ("MULTIPLE_CHOICE" or "FILL_IN_BLANK"), "topic" (must be one of the topics listed above), "question", "options" (if multiple choice), and "correctAnswer".
Base all questions directly on the provided chapter summaries and topics.`;

    try {
        console.log(`AI Service: Generating progress test for topics: ${topics}`);
        const result = await callAIModelAPI(prompt);
        return result.progressTest;
    } catch (error) {
        console.error("Error in generateProgressTest:", error);
        console.log("🔄 Falling back to template-based test generation...");
        
        // Fallback to template-based test generation
        return generateFallbackProgressTest(completedChapters);
    }
}

/**
 * Fallback function to generate progress tests when AI fails
 */
function generateFallbackProgressTest(completedChapters) {
    const topics = completedChapters.map(ch => ch.topic);
    const chapterNumbers = completedChapters.map(ch => ch.chapterNumber);
    const chapterRange = `${Math.min(...chapterNumbers)}-${Math.max(...chapterNumbers)}`;
    
    // Template questions based on common French learning topics
    const questionTemplates = {
        'Greetings': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'How do you say "Hello" in French?',
                options: ['Bonjour', 'Au revoir', 'Bonsoir', 'Salut'],
                correctAnswer: 'Bonjour'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'Complete: "_____ vous allez?" (How are you?)',
                correctAnswer: 'Comment'
            }
        ],
        'Numbers': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'What is "five" in French?',
                options: ['quatre', 'cinq', 'six', 'sept'],
                correctAnswer: 'cinq'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'Write the number 23 in French:',
                correctAnswer: 'vingt-trois'
            },
            {
                type: 'MULTIPLE_CHOICE',
                question: 'How do you say "I am 25 years old" in French?',
                options: ['J\'ai 25 ans', 'Je suis 25 ans', 'J\'ai 25 années', 'Je fais 25 ans'],
                correctAnswer: 'J\'ai 25 ans'
            }
        ],
        'Family': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'What is "mother" in French?',
                options: ['père', 'mère', 'sœur', 'frère'],
                correctAnswer: 'mère'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'Complete: "Mon _____ s\'appelle Pierre" (My father\'s name is Pierre)',
                correctAnswer: 'père'
            }
        ],
        'Colors': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'What is "red" in French?',
                options: ['bleu', 'vert', 'rouge', 'jaune'],
                correctAnswer: 'rouge'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'The sky is blue: "Le ciel est _____"',
                correctAnswer: 'bleu'
            }
        ],
        'Food': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'What is "bread" in French?',
                options: ['pain', 'lait', 'eau', 'fromage'],
                correctAnswer: 'pain'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'I like apples: "J\'aime les _____"',
                correctAnswer: 'pommes'
            }
        ],
        'Verbs': [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'Conjugate "être" (to be) for "I am":',
                options: ['je suis', 'tu es', 'il est', 'nous sommes'],
                correctAnswer: 'je suis'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'Complete: "Nous _____ français" (We are French)',
                correctAnswer: 'sommes'
            }
        ]
    };
    
    // Generate questions based on completed chapter topics
    const questions = [];
    let questionId = 1;
    
    // Try to match topics with templates
    topics.forEach(topic => {
        const normalizedTopic = topic.toLowerCase();
        let matchedTemplate = null;
        
        // Find matching template
        for (const [templateTopic, templateQuestions] of Object.entries(questionTemplates)) {
            if (normalizedTopic.includes(templateTopic.toLowerCase()) || 
                templateTopic.toLowerCase().includes(normalizedTopic)) {
                matchedTemplate = templateQuestions;
                break;
            }
        }
        
        // Add questions from matched template
        if (matchedTemplate) {
            matchedTemplate.forEach(template => {
                questions.push({
                    id: questionId.toString(),
                    type: template.type,
                    topic: topic,
                    question: template.question,
                    options: template.options || [],
                    correctAnswer: template.correctAnswer
                });
                questionId++;
            });
        }
    });
    
    // If we don't have enough questions, add some general ones
    while (questions.length < 10) {
        const generalQuestions = [
            {
                type: 'MULTIPLE_CHOICE',
                question: 'What does "Merci" mean?',
                options: ['Please', 'Thank you', 'Excuse me', 'You\'re welcome'],
                correctAnswer: 'Thank you'
            },
            {
                type: 'FILL_IN_BLANK',
                question: 'Complete: "Je _____ français" (I speak French)',
                correctAnswer: 'parle'
            },
            {
                type: 'MULTIPLE_CHOICE',
                question: 'How do you say "Good evening" in French?',
                options: ['Bonjour', 'Bonsoir', 'Bonne nuit', 'Salut'],
                correctAnswer: 'Bonsoir'
            }
        ];
        
        const randomQuestion = generalQuestions[questions.length % generalQuestions.length];
        questions.push({
            id: questionId.toString(),
            type: randomQuestion.type,
            topic: 'General French',
            question: randomQuestion.question,
            options: randomQuestion.options || [],
            correctAnswer: randomQuestion.correctAnswer
        });
        questionId++;
    }
    
    console.log(`✅ Generated fallback progress test with ${questions.length} questions for chapters ${chapterRange}`);
    
    return {
        questionsData: questions.slice(0, 15) // Limit to 15 questions
    };
}

// ... (keep all existing functions)

/**
 * @desc    Calls FrAILearn AI Model to generate a targeted remedial chapter based on a specific weak topic.
 * @param {string} topic - The topic the user is struggling with (e.g., "Definite Articles").
 * @param {Array<object>} mistakeExamples - A few examples of the user's actual mistakes for context.
 * @returns {Promise<object>} A promise that resolves to the remedial chapter data.
 */
export async function generateRemedialChapter(topic, mistakeExamples) {
    // Format the mistake examples into a readable string for the prompt
    const examplesString = mistakeExamples.map(m =>
        `- Question: "${m.question}" | User's Answer: "${m.userAnswer}" | Correct Answer: "${m.correctAnswer}"`
    ).join('\n');

    const prompt = `You are an expert French tutor. A student is struggling with the topic: "${topic}".
They have made the following mistakes:
${examplesString}

Your task is to generate an ultra-focused, "micro-remedial" chapter (2 minutes max) to help them master this single concept instantly.
This should be extremely concise and teacher-friendly for quick review.

The output MUST be a single, valid JSON object with a root key "remedialChapter".
The "remedialChapter" object must contain:
- "title": A clear, ultra-concise title, like "2min Fix: ${topic}".
- "description": A very brief summary (max 25 words) of what this micro-lesson covers.
- "content": An object with an "explanation" key. Keep the explanation ultra-concise (max 75 words), crystal clear, and directly address the core mistake pattern. Use bullet points and focus only on the essential rule.
- "exercises": An array of exactly 2 targeted "RemedialExercise" objects (minimal for instant practice).

Each "RemedialExercise" must have:
- "type": "FILL_IN_BLANK" or "MULTIPLE_CHOICE".
- "question": A very short question that tests the core concept directly.
- "options": An array of 4 strings for MULTIPLE_CHOICE, otherwise an empty array.
- "correctAnswer": The correct answer string.
- "explanation": An ultra-brief explanation (max 15 words) of why this is correct.`;

    try {
        console.log(`AI Service: Generating remedial chapter for topic: ${topic}`);
        const result = await callAIModelAPI(prompt);
        return result.remedialChapter;
    } catch (error) {
        console.error(`Error in generateRemedialChapter for topic "${topic}":`, error);
        throw new Error(`Failed to generate remedial chapter from AI.`);
    }
}


// ... (keep all existing functions)

/**
 * @desc    Calls FrAILearn AI Model to generate a final test for a Bridge Course based on its chapters.
 * @param {Array<object>} bridgeChapters - An array of the Bridge Course chapter objects.
 * @returns {Promise<object>} A promise that resolves to the test data structure.
 */
export async function generateBridgeCourseFinalTest(bridgeChapters) {
    const topics = bridgeChapters.map(ch => ch.topic).join(', ');
    const summary = bridgeChapters.map(ch => `- ${ch.title}`).join('\n');

    const prompt = `You are a French language examiner. A student has just completed a personalized "Bridge Course" to fix their specific weaknesses.
The course covered the following chapters:
${summary}

The key topics were: ${topics}.

Your task is to generate a final test to confirm they have mastered these specific concepts.
The output MUST be a single, valid JSON object with a root key "finalTest", containing a "questionsData" array of 10 question objects.
Each question object must have: "id", "type" ("MULTIPLE_CHOICE" or "FILL_IN_BLANK"), "topic" (must be one of the topics listed above), "question", "options" (if multiple choice), and "correctAnswer".
The questions must be directly related to the chapter topics provided.`;

    try {
        console.log(`AI Service: Generating Bridge Course Final Test for topics: ${topics}`);
        const result = await callAIModelAPI(prompt);
        return result.finalTest;
    } catch (error) {
        console.error("Error in generateBridgeCourseFinalTest:", error);
        throw new Error("Failed to generate Bridge Course Final Test from AI.");
    }
}
