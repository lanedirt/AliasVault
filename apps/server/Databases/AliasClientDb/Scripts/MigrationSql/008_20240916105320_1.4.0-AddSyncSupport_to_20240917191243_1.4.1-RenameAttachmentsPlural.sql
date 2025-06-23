BEGIN TRANSACTION;
ALTER TABLE "Attachment" RENAME TO "Attachments";

CREATE TABLE "ef_temp_Attachments" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Attachments" PRIMARY KEY,
    "Blob" BLOB NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "Filename" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_Attachments_Credentials_CredentialId" FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

INSERT INTO "ef_temp_Attachments" ("Id", "Blob", "CreatedAt", "CredentialId", "Filename", "IsDeleted", "UpdatedAt")
SELECT "Id", "Blob", "CreatedAt", "CredentialId", "Filename", "IsDeleted", "UpdatedAt"
FROM "Attachments";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;
DROP TABLE "Attachments";

ALTER TABLE "ef_temp_Attachments" RENAME TO "Attachments";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;
CREATE INDEX "IX_Attachments_CredentialId" ON "Attachments" ("CredentialId");

COMMIT;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20240917191243_1.4.1-RenameAttachmentsPlural', '9.0.4');

