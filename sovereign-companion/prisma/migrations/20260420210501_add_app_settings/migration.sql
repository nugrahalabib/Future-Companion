-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "demoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pausedMessage" TEXT NOT NULL DEFAULT '',
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activeFromHour" INTEGER NOT NULL DEFAULT 9,
    "activeToHour" INTEGER NOT NULL DEFAULT 21,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT ''
);
