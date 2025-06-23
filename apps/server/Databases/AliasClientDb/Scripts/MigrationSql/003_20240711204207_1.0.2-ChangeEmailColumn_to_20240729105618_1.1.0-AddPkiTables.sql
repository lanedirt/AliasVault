BEGIN TRANSACTION;
CREATE TABLE "EncryptionKeys" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_EncryptionKeys" PRIMARY KEY,
    "PublicKey" TEXT NOT NULL,
    "PrivateKey" TEXT NOT NULL,
    "IsPrimary" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240729105618_1.1.0-AddPkiTables', '9.0.4');

COMMIT;

