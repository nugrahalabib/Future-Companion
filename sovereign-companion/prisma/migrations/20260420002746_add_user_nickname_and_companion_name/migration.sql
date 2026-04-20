-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userNickname" TEXT NOT NULL DEFAULT '',
    "companionName" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_CompanionConfig" ("bodyBuild", "createdAt", "dominanceLevel", "emotionalLevel", "faceShape", "features", "finalImagePath", "fullConfig", "gender", "hairStyle", "hobbies", "humorStyle", "id", "innocenceLevel", "role", "skinTone", "updatedAt", "userId") SELECT "bodyBuild", "createdAt", "dominanceLevel", "emotionalLevel", "faceShape", "features", "finalImagePath", "fullConfig", "gender", "hairStyle", "hobbies", "humorStyle", "id", "innocenceLevel", "role", "skinTone", "updatedAt", "userId" FROM "CompanionConfig";
DROP TABLE "CompanionConfig";
ALTER TABLE "new_CompanionConfig" RENAME TO "CompanionConfig";
CREATE UNIQUE INDEX "CompanionConfig_userId_key" ON "CompanionConfig"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
