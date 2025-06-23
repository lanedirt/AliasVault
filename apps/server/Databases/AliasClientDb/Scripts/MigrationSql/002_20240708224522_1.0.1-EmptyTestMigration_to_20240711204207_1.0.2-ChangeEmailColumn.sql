BEGIN TRANSACTION;
ALTER TABLE "Aliases" RENAME COLUMN "EmailPrefix" TO "Email";

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240711204207_1.0.2-ChangeEmailColumn', '9.0.4');

COMMIT;

