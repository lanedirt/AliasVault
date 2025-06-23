BEGIN TRANSACTION;
CREATE TABLE "ef_temp_Credentials" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Credentials" PRIMARY KEY,
    "AliasId" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Notes" TEXT NULL,
    "ServiceId" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "Username" TEXT NULL,
    CONSTRAINT "FK_Credentials_Aliases_AliasId" FOREIGN KEY ("AliasId") REFERENCES "Aliases" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Credentials_Services_ServiceId" FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE CASCADE
);

INSERT INTO "ef_temp_Credentials" ("Id", "AliasId", "CreatedAt", "Notes", "ServiceId", "UpdatedAt", "Username")
SELECT "Id", "AliasId", "CreatedAt", "Notes", "ServiceId", "UpdatedAt", "Username"
FROM "Credentials";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;
DROP TABLE "Credentials";

ALTER TABLE "ef_temp_Credentials" RENAME TO "Credentials";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;
CREATE INDEX "IX_Credentials_AliasId" ON "Credentials" ("AliasId");

CREATE INDEX "IX_Credentials_ServiceId" ON "Credentials" ("ServiceId");

COMMIT;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240812141727_1.3.1-MakeUsernameOptional', '9.0.4');

