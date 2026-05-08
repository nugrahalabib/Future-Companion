-- CreateTable
CREATE TABLE "SuggestionTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schema" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT NOT NULL DEFAULT ''
);
