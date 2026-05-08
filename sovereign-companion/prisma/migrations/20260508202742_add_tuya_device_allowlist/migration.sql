-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TuyaDevice" (
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
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TuyaDevice" ("capabilities", "category", "id", "lastSyncedAt", "name", "online", "productName", "supportsBrightness", "supportsColor", "supportsTempK", "switchCode", "updatedAt") SELECT "capabilities", "category", "id", "lastSyncedAt", "name", "online", "productName", "supportsBrightness", "supportsColor", "supportsTempK", "switchCode", "updatedAt" FROM "TuyaDevice";
DROP TABLE "TuyaDevice";
ALTER TABLE "new_TuyaDevice" RENAME TO "TuyaDevice";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
