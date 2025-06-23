BEGIN TRANSACTION;
CREATE TABLE "TotpCodes" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_TotpCodes" PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "SecretKey" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL,
    CONSTRAINT "FK_TotpCodes_Credentials_CredentialId" FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_TotpCodes_CredentialId" ON "TotpCodes" ("CredentialId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250310131554_1.5.0-AddTotpCodes', '9.0.4');

COMMIT;

