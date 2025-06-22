/**
 * Complete database schema SQL (latest version)
 */
export const COMPLETE_SCHEMA_SQL = `-- AliasVault Client Database Complete Schema
-- Final schema after all migrations (up to version 1.5.0)
-- This script creates the complete database structure

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Create Aliases table
CREATE TABLE "Aliases" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Gender" VARCHAR(255),
    "FirstName" VARCHAR(255),
    "LastName" VARCHAR(255),
    "NickName" VARCHAR(255),
    "BirthDate" TEXT NOT NULL,
    "Email" TEXT, -- Renamed from EmailPrefix in v1.0.2
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0 -- Added in v1.4.0
    -- Note: Address, phone, hobbies, and bank account columns removed in v1.3.0
);

-- Create Services table
CREATE TABLE "Services" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Name" TEXT,
    "Url" TEXT,
    "Logo" BLOB,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0 -- Added in v1.4.0
);

-- Create Credentials table
CREATE TABLE "Credentials" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "AliasId" TEXT NOT NULL,
    "Notes" TEXT,
    "Username" TEXT, -- Made optional in v1.3.1
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "ServiceId" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0, -- Added in v1.4.0
    FOREIGN KEY ("AliasId") REFERENCES "Aliases" ("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE CASCADE
);

-- Create Attachments table (renamed from Attachment in v1.4.1)
CREATE TABLE "Attachments" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Filename" TEXT NOT NULL,
    "Blob" BLOB NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0, -- Added in v1.4.0
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create Passwords table
CREATE TABLE "Passwords" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Value" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0, -- Added in v1.4.0
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create EncryptionKeys table (added in v1.1.0)
CREATE TABLE "EncryptionKeys" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "PublicKey" TEXT NOT NULL,
    "PrivateKey" TEXT NOT NULL,
    "IsPrimary" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0 -- Added in v1.4.0
);

-- Create Settings table (added in v1.2.0)
CREATE TABLE "Settings" (
    "Key" TEXT NOT NULL PRIMARY KEY,
    "Value" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL DEFAULT 0 -- Added in v1.4.0
);

-- Create TotpCodes table (added in v1.5.0)
CREATE TABLE "TotpCodes" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "SecretKey" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL,
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IX_Attachments_CredentialId" ON "Attachments" ("CredentialId");
CREATE INDEX "IX_Credentials_AliasId" ON "Credentials" ("AliasId");
CREATE INDEX "IX_Credentials_ServiceId" ON "Credentials" ("ServiceId");
CREATE INDEX "IX_Passwords_CredentialId" ON "Passwords" ("CredentialId");
CREATE INDEX "IX_TotpCodes_CredentialId" ON "TotpCodes" ("CredentialId");`;

/**
 * Individual migration SQL scripts
 */
export const MIGRATION_SCRIPTS: Record<number, string> = {
  1: `-- Migration 1.0.0: Initial Migration
-- Create the initial database schema for AliasVault Client

-- Create Aliases table
CREATE TABLE "Aliases" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Gender" VARCHAR(255),
    "FirstName" VARCHAR(255),
    "LastName" VARCHAR(255),
    "NickName" VARCHAR(255),
    "BirthDate" TEXT NOT NULL,
    "AddressStreet" VARCHAR(255),
    "AddressCity" VARCHAR(255),
    "AddressState" VARCHAR(255),
    "AddressZipCode" VARCHAR(255),
    "AddressCountry" VARCHAR(255),
    "Hobbies" TEXT,
    "EmailPrefix" TEXT,
    "PhoneMobile" TEXT,
    "BankAccountIBAN" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

-- Create Services table
CREATE TABLE "Services" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Name" TEXT,
    "Url" TEXT,
    "Logo" BLOB,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

-- Create Credentials table
CREATE TABLE "Credentials" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "AliasId" TEXT NOT NULL,
    "Notes" TEXT,
    "Username" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "ServiceId" TEXT NOT NULL,
    FOREIGN KEY ("AliasId") REFERENCES "Aliases" ("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE CASCADE
);

-- Create Attachment table
CREATE TABLE "Attachment" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Filename" TEXT NOT NULL,
    "Blob" BLOB NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create Passwords table
CREATE TABLE "Passwords" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Value" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IX_Attachment_CredentialId" ON "Attachment" ("CredentialId");
CREATE INDEX "IX_Credentials_AliasId" ON "Credentials" ("AliasId");
CREATE INDEX "IX_Credentials_ServiceId" ON "Credentials" ("ServiceId");
CREATE INDEX "IX_Passwords_CredentialId" ON "Passwords" ("CredentialId");`,

  2: `-- Migration 1.0.2: Change Email Column
-- Rename EmailPrefix to Email in Aliases table

ALTER TABLE "Aliases" RENAME COLUMN "EmailPrefix" TO "Email";`,

  3: `-- Migration 1.1.0: Add PKI Tables
-- Add EncryptionKeys table for PKI support

CREATE TABLE "EncryptionKeys" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "PublicKey" TEXT NOT NULL,
    "PrivateKey" TEXT NOT NULL,
    "IsPrimary" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);`,

  4: `-- Migration 1.2.0: Add Settings Table
-- Add Settings table for user preferences

CREATE TABLE "Settings" (
    "Key" TEXT NOT NULL PRIMARY KEY,
    "Value" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);`,

  5: `-- Migration 1.3.0: Update Identity Structure
-- Remove address, phone, hobbies, and bank account columns from Aliases table

ALTER TABLE "Aliases" DROP COLUMN "AddressStreet";
ALTER TABLE "Aliases" DROP COLUMN "AddressCity";
ALTER TABLE "Aliases" DROP COLUMN "AddressState";
ALTER TABLE "Aliases" DROP COLUMN "AddressZipCode";
ALTER TABLE "Aliases" DROP COLUMN "AddressCountry";
ALTER TABLE "Aliases" DROP COLUMN "Hobbies";
ALTER TABLE "Aliases" DROP COLUMN "PhoneMobile";
ALTER TABLE "Aliases" DROP COLUMN "BankAccountIBAN";`,

  6: `-- Migration 1.3.1: Make Username Optional
-- Make Username column nullable in Credentials table

-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
-- Create temporary table with new structure
CREATE TABLE "Credentials_temp" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "AliasId" TEXT NOT NULL,
    "Notes" TEXT,
    "Username" TEXT, -- Made optional (nullable)
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "ServiceId" TEXT NOT NULL,
    FOREIGN KEY ("AliasId") REFERENCES "Aliases" ("Id") ON DELETE CASCADE,
    FOREIGN KEY ("ServiceId") REFERENCES "Services" ("Id") ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "Credentials_temp"
SELECT "Id", "AliasId", "Notes", "Username", "CreatedAt", "UpdatedAt", "ServiceId"
FROM "Credentials";

-- Drop old table
DROP TABLE "Credentials";

-- Rename temp table to original name
ALTER TABLE "Credentials_temp" RENAME TO "Credentials";

-- Recreate indexes
CREATE INDEX "IX_Credentials_AliasId" ON "Credentials" ("AliasId");
CREATE INDEX "IX_Credentials_ServiceId" ON "Credentials" ("ServiceId");`,

  7: `-- Migration 1.4.0: Add Sync Support
-- Add IsDeleted column to all tables for soft delete support

ALTER TABLE "Aliases" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Services" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Credentials" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Attachment" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Passwords" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EncryptionKeys" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Settings" ADD COLUMN "IsDeleted" INTEGER NOT NULL DEFAULT 0;`,

  8: `-- Migration 1.4.1: Rename Attachments Plural
-- Rename Attachment table to Attachments for consistency

ALTER TABLE "Attachment" RENAME TO "Attachments";

-- Drop old index
DROP INDEX "IX_Attachment_CredentialId";

-- Create new index with correct name
CREATE INDEX "IX_Attachments_CredentialId" ON "Attachments" ("CredentialId");`,

  9: `-- Migration 1.5.0: Add TOTP Codes
-- Add TotpCodes table for 2FA support

CREATE TABLE "TotpCodes" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "SecretKey" TEXT NOT NULL,
    "CredentialId" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL,
    FOREIGN KEY ("CredentialId") REFERENCES "Credentials" ("Id") ON DELETE CASCADE
);

-- Create index
CREATE INDEX "IX_TotpCodes_CredentialId" ON "TotpCodes" ("CredentialId");`
};
