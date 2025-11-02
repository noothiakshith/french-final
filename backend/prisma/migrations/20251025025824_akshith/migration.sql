-- CreateEnum
CREATE TYPE "Level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('FILL_IN_BLANK', 'MULTIPLE_CHOICE', 'TRANSLATION_EN_TO_FR', 'TRANSLATION_FR_TO_EN', 'SENTENCE_REARRANGE', 'CONJUGATION', 'ARTICLE_SELECTION', 'PRONOUN_SELECTION', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('LESSON_QUIZ', 'CHAPTER_QUIZ', 'BRIDGE_QUIZ', 'REMEDIAL_QUIZ');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('PROGRESS_TEST', 'FINAL_TEST', 'BRIDGE_FINAL', 'REMEDIAL_TEST');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('EXERCISE', 'LESSON_QUIZ', 'CHAPTER_QUIZ', 'PROGRESS_TEST', 'FINAL_TEST', 'BRIDGE_EXERCISE', 'BRIDGE_QUIZ', 'REMEDIAL_EXERCISE');

-- CreateEnum
CREATE TYPE "ErrorCategory" AS ENUM ('GRAMMAR', 'VOCABULARY', 'CONJUGATION', 'GENDER_AGREEMENT', 'ARTICLE_USAGE', 'PRONOUN_USAGE', 'TENSE_SELECTION', 'SENTENCE_STRUCTURE', 'TRANSLATION', 'SPELLING');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MINOR', 'MODERATE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RemedialType" AS ENUM ('MICRO', 'STANDARD', 'COMPREHENSIVE', 'REFRESHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('CURRICULUM', 'CHAPTER', 'LESSON', 'EXERCISE', 'QUIZ', 'TEST', 'REMEDIAL', 'FLASHCARD', 'BRIDGE_COURSE', 'PLACEMENT_TEST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "currentLevel" "Level" NOT NULL DEFAULT 'BEGINNER',
    "hasSkippedTest" BOOLEAN NOT NULL DEFAULT false,
    "placementTestScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_tests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "recommendedLevel" "Level" NOT NULL,
    "requiresBridge" BOOLEAN NOT NULL DEFAULT false,
    "questionsData" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetLevel" "Level" NOT NULL,
    "identifiedGaps" JSONB NOT NULL,
    "totalChapters" INTEGER NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "completedChapters" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "finalTestScore" INTEGER,
    "curriculum" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "bridge_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_chapters" (
    "id" TEXT NOT NULL,
    "bridgeCourseId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "masteryScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "bridge_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_exercises" (
    "id" TEXT NOT NULL,
    "bridgeChapterId" TEXT NOT NULL,
    "exerciseNumber" INTEGER NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "options" JSONB,
    "explanation" TEXT,
    "grammarPoint" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,

    CONSTRAINT "bridge_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bridge_quizzes" (
    "id" TEXT NOT NULL,
    "bridgeChapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,

    CONSTRAINT "bridge_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "learningObjectives" JSONB NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockCondition" TEXT,
    "isStarted" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "masteryScore" DOUBLE PRECISION,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "grammarPoints" JSONB NOT NULL,
    "vocabulary" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseNumber" INTEGER NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "options" JSONB,
    "explanation" TEXT,
    "grammarPoint" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topic" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptedAt" TIMESTAMP(3),

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizType" "QuizType" NOT NULL,
    "chapterNumber" INTEGER,
    "level" "Level",
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "userAnswers" JSONB NOT NULL,
    "weakTopics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "level" "Level" NOT NULL,
    "chapterRange" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "userAnswers" JSONB NOT NULL,
    "topicBreakdown" JSONB NOT NULL,
    "weakAreas" JSONB NOT NULL,
    "strongAreas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mistakes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chapterNumber" INTEGER,
    "lessonNumber" INTEGER,
    "level" "Level" NOT NULL,
    "grammarPoint" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "mistakeType" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "errorCategory" "ErrorCategory" NOT NULL,
    "severity" "Severity" NOT NULL,
    "isAddressed" BOOLEAN NOT NULL DEFAULT false,
    "remedialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remedial_chapters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remedialType" "RemedialType" NOT NULL,
    "priority" "Priority" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "grammarPoint" TEXT NOT NULL,
    "relatedTopics" JSONB NOT NULL,
    "mistakeCount" INTEGER NOT NULL,
    "mistakeIds" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "totalLessons" INTEGER NOT NULL,
    "totalExercises" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 85,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isStarted" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "currentLesson" INTEGER NOT NULL DEFAULT 1,
    "masteryScore" DOUBLE PRECISION,
    "insertedAfter" TEXT,
    "blocksProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "remedial_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remedial_exercises" (
    "id" TEXT NOT NULL,
    "remedialChapterId" TEXT NOT NULL,
    "exerciseNumber" INTEGER NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "question" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "options" JSONB,
    "explanation" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptedAt" TIMESTAMP(3),

    CONSTRAINT "remedial_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "chapterNumber" INTEGER,
    "topic" TEXT NOT NULL,
    "grammarPoint" TEXT,
    "frontText" TEXT NOT NULL,
    "backText" TEXT NOT NULL,
    "exampleSentence" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewDate" TIMESTAMP(3) NOT NULL,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "correctReviews" INTEGER NOT NULL DEFAULT 0,
    "lastWasCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "flashcard_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLevel" "Level" NOT NULL,
    "currentChapter" INTEGER NOT NULL,
    "currentLesson" INTEGER,
    "totalLessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalExercisesCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalQuizzesTaken" INTEGER NOT NULL DEFAULT 0,
    "totalTestsTaken" INTEGER NOT NULL DEFAULT 0,
    "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageQuizScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topicMastery" JSONB NOT NULL,
    "identifiedWeaknesses" JSONB NOT NULL,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_logs" (
    "id" TEXT NOT NULL,
    "generationType" "GenerationType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "generatedContent" JSONB NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "placement_tests_userId_key" ON "placement_tests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bridge_courses_userId_key" ON "bridge_courses"("userId");

-- CreateIndex
CREATE INDEX "bridge_chapters_bridgeCourseId_idx" ON "bridge_chapters"("bridgeCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "bridge_chapters_bridgeCourseId_chapterNumber_key" ON "bridge_chapters"("bridgeCourseId", "chapterNumber");

-- CreateIndex
CREATE INDEX "bridge_exercises_bridgeChapterId_idx" ON "bridge_exercises"("bridgeChapterId");

-- CreateIndex
CREATE INDEX "bridge_quizzes_bridgeChapterId_idx" ON "bridge_quizzes"("bridgeChapterId");

-- CreateIndex
CREATE INDEX "chapters_userId_level_idx" ON "chapters"("userId", "level");

-- CreateIndex
CREATE INDEX "chapters_userId_isUnlocked_idx" ON "chapters"("userId", "isUnlocked");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_userId_level_chapterNumber_key" ON "chapters"("userId", "level", "chapterNumber");

-- CreateIndex
CREATE INDEX "lessons_chapterId_idx" ON "lessons"("chapterId");

-- CreateIndex
CREATE INDEX "lessons_userId_idx" ON "lessons"("userId");

-- CreateIndex
CREATE INDEX "exercises_lessonId_idx" ON "exercises"("lessonId");

-- CreateIndex
CREATE INDEX "exercises_userId_grammarPoint_idx" ON "exercises"("userId", "grammarPoint");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_quizType_idx" ON "quiz_attempts"("userId", "quizType");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_chapterNumber_idx" ON "quiz_attempts"("userId", "chapterNumber");

-- CreateIndex
CREATE INDEX "test_attempts_userId_testType_idx" ON "test_attempts"("userId", "testType");

-- CreateIndex
CREATE INDEX "test_attempts_userId_level_idx" ON "test_attempts"("userId", "level");

-- CreateIndex
CREATE INDEX "mistakes_userId_grammarPoint_idx" ON "mistakes"("userId", "grammarPoint");

-- CreateIndex
CREATE INDEX "mistakes_userId_mistakeType_idx" ON "mistakes"("userId", "mistakeType");

-- CreateIndex
CREATE INDEX "mistakes_userId_isAddressed_idx" ON "mistakes"("userId", "isAddressed");

-- CreateIndex
CREATE INDEX "mistakes_grammarPoint_createdAt_idx" ON "mistakes"("grammarPoint", "createdAt");

-- CreateIndex
CREATE INDEX "remedial_chapters_userId_isCompleted_idx" ON "remedial_chapters"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "remedial_chapters_userId_priority_idx" ON "remedial_chapters"("userId", "priority");

-- CreateIndex
CREATE INDEX "remedial_exercises_remedialChapterId_idx" ON "remedial_exercises"("remedialChapterId");

-- CreateIndex
CREATE INDEX "flashcards_level_topic_idx" ON "flashcards"("level", "topic");

-- CreateIndex
CREATE INDEX "flashcard_progress_userId_nextReviewDate_idx" ON "flashcard_progress"("userId", "nextReviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "flashcard_progress_userId_flashcardId_key" ON "flashcard_progress"("userId", "flashcardId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_key" ON "user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_userId_key" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "ai_generation_logs_generationType_createdAt_idx" ON "ai_generation_logs"("generationType", "createdAt");

-- AddForeignKey
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_courses" ADD CONSTRAINT "bridge_courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_chapters" ADD CONSTRAINT "bridge_chapters_bridgeCourseId_fkey" FOREIGN KEY ("bridgeCourseId") REFERENCES "bridge_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_exercises" ADD CONSTRAINT "bridge_exercises_bridgeChapterId_fkey" FOREIGN KEY ("bridgeChapterId") REFERENCES "bridge_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bridge_quizzes" ADD CONSTRAINT "bridge_quizzes_bridgeChapterId_fkey" FOREIGN KEY ("bridgeChapterId") REFERENCES "bridge_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remedial_chapters" ADD CONSTRAINT "remedial_chapters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remedial_exercises" ADD CONSTRAINT "remedial_exercises_remedialChapterId_fkey" FOREIGN KEY ("remedialChapterId") REFERENCES "remedial_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
