// --- CONFIGURATION ---
const GEMINI_MODEL_NAME = "gemini-2.0-flash";

/**
 * A utility to parse a JSON response from Gemini.
 */
function parseGeminiResponse(rawText, maxLength = 100000) {
    const sanitizedText = rawText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    try {
        // Check for obvious truncation in Gemini's response
        if (sanitizedText.length > maxLength ||
            !sanitizedText.endsWith('}') ||
            (sanitizedText.match(/\{/g) || []).length !== (sanitizedText.match(/\}/g) || []).length) {
            throw new Error('Response appears to be truncated or malformed');
        }
        return JSON.parse(sanitizedText);
    } catch (error) {
        console.error("--- JSON PARSE FAILED ---");
        console.error("Original raw text was:", rawText);
        // If it's a truncation or malformed JSON, throw a clearer error
        if (error.message.includes('Unterminated string') ||
            error.message.includes('truncated')) {
            throw new Error('AI response was truncated or incomplete. Please try again.');
        }
        throw error;
    }
}

async function callGeminiAPI(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent`;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Body:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    return parseGeminiResponse(responseData.candidates[0].content.parts[0].text);
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

Generate exactly 20 questions. Mix MULTIPLE_CHOICE (with exactly 4 options each) and FILL_IN_BLANK types. Cover topics like greetings, numbers, verbs, family, food, time, etc. Distribute difficulty: 8 EASY, 8 MEDIUM, 4 HARD.`;
        const result = await callGeminiAPI(prompt);
        return result.placementTest;
    } catch (error) {
        console.error("Error in generatePlacementTest:", error);
        throw new Error("Failed to generate placement test from AI.");
    }
}

export async function gradeTestWithAI(originalQuestions, userAnswers) {
    try {
        console.log(`AI Service: Sending test to Gemini for grading...`);
        const prompt = `You are an expert French teacher. Grade the following test and provide an analysis. The output MUST be a single, valid JSON object with keys "score" (0-100 number), "correctCount" (number), and "weaknesses" (an object mapping topics to mistake counts). Be slightly lenient with grading.
**Original Test Questions:**
${JSON.stringify(originalQuestions, null, 2)}
**Student's Submitted Answers:**
${JSON.stringify(userAnswers, null, 2)}`;
        return await callGeminiAPI(prompt);
    } catch (error) {
        console.error("Error in gradeTestWithAI:", error);
        throw new Error("Failed to get evaluation from AI.");
    }
}

export async function generateCurriculum(level) {
    try {
        console.log(`AI Service: Generating ${level} curriculum in batches...`);

        // Generate curriculum in 3 batches of 5 chapters each to avoid truncation
        const allChapters = [];
        const sections = [
            { start: 1, end: 5, topics: "greetings, numbers, basic verbs, family, colors" },
            { start: 6, end: 10, topics: "food, shopping, directions, past tense, future tense" },
            { start: 11, end: 15, topics: "subjunctive, complex sentences, culture, literature, advanced conversation" }
        ];

        for (const section of sections) {
            try {
                const prompt = `You are a French curriculum designer. Generate chapters ${section.start}-${section.end} for a ${level} French course. The output MUST be a single, valid JSON object with a root key "chapters" containing an array of exactly 5 chapter objects.

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

Focus on: ${section.topics}
Keep content concise to avoid truncation.`;

                const result = await callGeminiAPI(prompt);
                if (result && result.chapters && Array.isArray(result.chapters)) {
                    allChapters.push(...result.chapters);
                    console.log(`✅ Generated chapters ${section.start}-${section.end}`);
                } else {
                    throw new Error(`Invalid format for chapters ${section.start}-${section.end}`);
                }
            } catch (sectionError) {
                console.error(`Error generating chapters ${section.start}-${section.end}:`, sectionError);
                // Generate fallback chapters for this section
                for (let i = section.start; i <= section.end; i++) {
                    allChapters.push(createFallbackChapter(i, level, section.topics));
                }
            }
        }

        return allChapters;
    } catch (error) {
        console.error(`Error in generateCurriculum for ${level}:`, error);
        // Return complete fallback curriculum
        return Array(15).fill(null).map((_, chapterIndex) =>
            createFallbackChapter(chapterIndex + 1, level, "French fundamentals")
        );
    }
}

function createFallbackChapter(chapterNumber, level, topics) {
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
                    introduction: "Let's start with the basics.",
                    explanation: "This lesson covers fundamental concepts and vocabulary."
                },
                grammarPoints: { points: ["Basic grammar rules", "Sentence structure"] },
                vocabulary: { words: ["bonjour", "au revoir", "merci", "s'il vous plaît", "oui", "non"] },
                examples: {
                    pairs: [
                        { fr: "Bonjour", en: "Hello" },
                        { fr: "Au revoir", en: "Goodbye" },
                        { fr: "Merci", en: "Thank you" }
                    ]
                }
            },
            {
                lessonNumber: 2,
                title: `Advanced ${chapterTopics[chapterNumber - 1] || 'French'}`,
                topic: chapterTopics[chapterNumber - 1] || "Fundamentals",
                content: {
                    introduction: "Building on the basics.",
                    explanation: "This lesson expands your knowledge with more complex concepts."
                },
                grammarPoints: { points: ["Advanced usage", "Common expressions"] },
                vocabulary: { words: ["comment", "allez-vous", "très bien", "et vous", "de rien"] },
                examples: {
                    pairs: [
                        { fr: "Comment allez-vous?", en: "How are you?" },
                        { fr: "Très bien, merci", en: "Very well, thank you" },
                        { fr: "De rien", en: "You're welcome" }
                    ]
                }
            }
        ]
    };
}

export async function generateBridgeCourse(weaknesses) {
    try {
        const weakTopicsString = Object.keys(weaknesses).join(', ') || 'basic French concepts';
        console.log(`AI Service: Generating Bridge Course for weaknesses: ${weakTopicsString}`);
        const prompt = `You are an expert French tutor. A student has shown weakness in the following topics: ${weakTopicsString}. Generate a targeted "Bridge Course" to fix these gaps. The output MUST be a single, valid JSON object with a root key "bridgeCourse". This object must contain a "chapters" array. Create one chapter for each weak topic (maximum 3 chapters to avoid truncation). Each chapter object must contain: "title", "topic", "description", "estimatedMinutes", "content": { "explanation": "..." }, and an "exercises" array of exactly 5 "BridgeExercise" objects. Each exercise must contain: "type" (one of: MULTIPLE_CHOICE, FILL_IN_BLANK, TRUE_FALSE), "question", "options", "correctAnswer", and "explanation".`;
        const result = await callGeminiAPI(prompt);
        if (!result || !result.bridgeCourse || !result.bridgeCourse.chapters) {
            throw new Error('AI returned invalid bridge course format');
        }
        return result.bridgeCourse;
    } catch (error) {
        console.error("Error in generateBridgeCourse:", error);
        // Return a minimal valid bridge course if AI fails
        return {
            chapters: [{
                title: "Core Concepts Review",
                topic: "French Fundamentals",
                description: "Review of essential French concepts",
                estimatedMinutes: 30,
                content: {
                    explanation: "This chapter covers fundamental French concepts you need to master."
                },
                exercises: Array(5).fill(null).map((_, i) => ({
                    type: "MULTIPLE_CHOICE",
                    question: `Practice Question ${i + 1}`,
                    correctAnswer: "Option A",
                    options: ["Option A", "Option B", "Option C"],
                    explanation: "Basic French practice",
                    grammarPoint: "Fundamentals",
                    difficulty: "MEDIUM"
                }))
            }]
        };
    }
}


// ... (keep all existing functions: callGeminiAPI, generatePlacementTest, gradeTestWithAI, etc.)

/**
 * @desc    Calls Gemini to generate a progress test based on the content of specific chapters.
 * @param {Array<object>} completedChapters - An array of chapter objects the user has completed.
 * @returns {Promise<object>} A promise that resolves to the test data structure.
 */
/**
 * @desc    Calls Gemini to extract key vocabulary and grammar from a lesson to create flashcards.
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
        const result = await callGeminiAPI(prompt);
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

        const result = await callGeminiAPI(prompt);
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
        const result = await callGeminiAPI(prompt);
        return result.progressTest;
    } catch (error) {
        console.error("Error in generateProgressTest:", error);
        throw new Error("Failed to generate progress test from AI.");
    }
}

// ... (keep all existing functions)

/**
 * @desc    Calls Gemini to generate a targeted remedial chapter based on a specific weak topic.
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
        const result = await callGeminiAPI(prompt);
        return result.remedialChapter;
    } catch (error) {
        console.error(`Error in generateRemedialChapter for topic "${topic}":`, error);
        throw new Error(`Failed to generate remedial chapter from AI.`);
    }
}


// ... (keep all existing functions)

/**
 * @desc    Calls Gemini to generate a final test for a Bridge Course based on its chapters.
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
        const result = await callGeminiAPI(prompt);
        return result.finalTest;
    } catch (error) {
        console.error("Error in generateBridgeCourseFinalTest:", error);
        throw new Error("Failed to generate Bridge Course Final Test from AI.");
    }
}