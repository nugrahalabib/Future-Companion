-- CreateTable
CREATE TABLE "WelcomeAudio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'single',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash-preview-tts',
    "voiceName" TEXT,
    "speakers" TEXT,
    "languageCode" TEXT,
    "audioData" BLOB NOT NULL,
    "durationSeconds" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "WelcomeAudio_isActive_idx" ON "WelcomeAudio"("isActive");
