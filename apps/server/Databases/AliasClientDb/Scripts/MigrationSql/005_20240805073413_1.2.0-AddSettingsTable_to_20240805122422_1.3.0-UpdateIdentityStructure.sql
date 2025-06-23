BEGIN TRANSACTION;
CREATE TABLE "ef_temp_Aliases" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Aliases" PRIMARY KEY,
    "BirthDate" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Email" TEXT NULL,
    "FirstName" VARCHAR NULL,
    "Gender" VARCHAR NULL,
    "LastName" VARCHAR NULL,
    "NickName" VARCHAR NULL,
    "UpdatedAt" TEXT NOT NULL
);

INSERT INTO "ef_temp_Aliases" ("Id", "BirthDate", "CreatedAt", "Email", "FirstName", "Gender", "LastName", "NickName", "UpdatedAt")
SELECT "Id", "BirthDate", "CreatedAt", "Email", "FirstName", "Gender", "LastName", "NickName", "UpdatedAt"
FROM "Aliases";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;
DROP TABLE "Aliases";

ALTER TABLE "ef_temp_Aliases" RENAME TO "Aliases";

COMMIT;

PRAGMA foreign_keys = 1;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240805122422_1.3.0-UpdateIdentityStructure', '9.0.4');

