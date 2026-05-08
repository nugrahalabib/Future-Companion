-- CreateTable
CREATE TABLE "TuyaConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "accessId" TEXT NOT NULL DEFAULT '',
    "accessSecret" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT 'us',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "TuyaDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "productName" TEXT NOT NULL DEFAULT '',
    "online" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "switchCode" TEXT,
    "supportsBrightness" BOOLEAN NOT NULL DEFAULT false,
    "supportsColor" BOOLEAN NOT NULL DEFAULT false,
    "supportsTempK" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
