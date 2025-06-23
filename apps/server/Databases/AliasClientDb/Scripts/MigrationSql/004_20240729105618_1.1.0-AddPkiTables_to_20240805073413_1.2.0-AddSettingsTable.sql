BEGIN TRANSACTION;
CREATE TABLE "Settings" (
    "Key" TEXT NOT NULL CONSTRAINT "PK_Settings" PRIMARY KEY,
    "Value" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240805073413_1.2.0-AddSettingsTable', '9.0.4');

COMMIT;

