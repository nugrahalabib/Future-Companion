-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "age" INTEGER NOT NULL,
    "profession" TEXT NOT NULL,
    "relationshipStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'female',
    "faceShape" TEXT,
    "hairStyle" TEXT,
    "bodyBuild" TEXT,
    "skinTone" TEXT NOT NULL DEFAULT 'medium',
    "features" TEXT NOT NULL DEFAULT '{}',
    "role" TEXT NOT NULL DEFAULT 'romantic-partner',
    "dominanceLevel" REAL NOT NULL DEFAULT 50,
    "innocenceLevel" REAL NOT NULL DEFAULT 50,
    "emotionalLevel" REAL NOT NULL DEFAULT 50,
    "humorStyle" REAL NOT NULL DEFAULT 50,
    "hobbies" TEXT NOT NULL DEFAULT '[]',
    "finalImagePath" TEXT,
    "fullConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanionConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transcript_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personaAccuracy" INTEGER NOT NULL,
    "replacementWillingness" INTEGER NOT NULL,
    "mostInfluentialFeature" TEXT NOT NULL,
    "overallExperience" INTEGER NOT NULL,
    "uiEaseOfUse" INTEGER NOT NULL,
    "conceptFeasibility" INTEGER NOT NULL,
    "additionalFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" DATETIME,
    "customizedAt" DATETIME,
    "assembledAt" DATETIME,
    "encounterStartAt" DATETIME,
    "encounterEndAt" DATETIME,
    "checkoutAt" DATETIME,
    "surveyAt" DATETIME,
    "completedAt" DATETIME,
    "encounterDuration" INTEGER,
    "dropped" BOOLEAN NOT NULL DEFAULT false,
    "dropStage" TEXT,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanionConfig_userId_key" ON "CompanionConfig"("userId");

-- CreateIndex
CREATE INDEX "Transcript_userId_idx" ON "Transcript"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResult_userId_key" ON "SurveyResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_key" ON "Session"("userId");
