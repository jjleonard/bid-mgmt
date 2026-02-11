-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "bidName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "opportunityType" TEXT NOT NULL DEFAULT 'single_tender',
    "currentStage" TEXT,
    "nextStageDate" DATETIME,
    "psqReceivedAt" DATETIME,
    "psqClarificationDeadlineAt" DATETIME,
    "psqSubmissionDeadlineAt" DATETIME,
    "psqSubmissionTime" TEXT,
    "ittReceivedAt" DATETIME,
    "ittClarificationDeadlineAt" DATETIME,
    "ittSubmissionDeadlineAt" DATETIME,
    "ittSubmissionTime" TEXT,
    "tcvGbp" INTEGER,
    "initialTermMonths" INTEGER,
    "extensionTermMonths" INTEGER,
    "tcvTermBasis" TEXT,
    "annualValueGbp" INTEGER,
    "folderUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bid" ("bidName", "clientName", "createdAt", "folderUrl", "id", "status", "updatedAt") SELECT "bidName", "clientName", "createdAt", "folderUrl", "id", "status", "updatedAt" FROM "Bid";
DROP TABLE "Bid";
ALTER TABLE "new_Bid" RENAME TO "Bid";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
