import { NativeModules } from 'react-native';
import { Credential } from './types/Credential';
import { EncryptionKey } from './types/EncryptionKey';
import { TotpCode } from './types/TotpCode';
import { PasswordSettings } from './types/PasswordSettings';
import { VaultMetadata } from './types/messaging/VaultMetadata';
import NativeVaultManager from '../specs/NativeVaultManager';


type SQLiteBindValue = string | number | null | Uint8Array;

/**
 * Client for interacting with the SQLite database through native code.
 */
class SqliteClient {
  /**
   * Store the encrypted database via the native code implementation.
   */
  async storeEncryptedDatabase(base64EncryptedDb: string, metadata: VaultMetadata): Promise<void> {
    try {
      const metadataJson = JSON.stringify(metadata);
      await NativeVaultManager.storeDatabase(base64EncryptedDb, metadataJson);
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  /**
   * Retrieve the vault metadata from native storage
   * @returns The parsed VaultMetadata object
   * @throws Error if metadata is not found or cannot be parsed
   */
  public async getVaultMetadata(): Promise<VaultMetadata> {
    try {
      const metadataJson = await NativeVaultManager.getVaultMetadata();
      if (!metadataJson) {
        throw new Error('No vault metadata found in native storage');
      }

      try {
        return JSON.parse(metadataJson) as VaultMetadata;
      } catch (parseError) {
        throw new Error('Failed to parse vault metadata from native storage');
      }
    } catch (error) {
      console.error('Error retrieving vault metadata:', error);
      throw error;
    }
  }

  /**
   * Store the encryption key in the native keychain
   */
  public async storeEncryptionKey(base64EncryptionKey: string): Promise<void> {
    try {
      await NativeVaultManager.storeEncryptionKey(base64EncryptionKey);
    } catch (error) {
      console.error('Error storing encryption key:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query
   */
  public async executeQuery<T>(query: string, params: SQLiteBindValue[] = []): Promise<T[]> {
    try {
      const results = await NativeVaultManager.executeQuery(query, params);
      return results as T[];
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   */
  public async executeUpdate(query: string, params: SQLiteBindValue[] = []): Promise<number> {
    try {
      const result = await NativeVaultManager.executeUpdate(query, params);
      return result as number;
    } catch (error) {
      console.error('Error executing update:', error);
      throw error;
    }
  }

  /**
   * Close the database connection and free resources.
   */
  public close(): void {
    // No-op since the native code handles connection lifecycle
  }

  /**
   * Fetch a single credential with its associated service information.
   * @param credentialId - The ID of the credential to fetch.
   * @returns Credential object with service details or null if not found.
   */
  public async getCredentialById(credentialId: string): Promise<Credential | null> {
    const query = `
        SELECT DISTINCT
            c.Id,
            c.Username,
            c.Notes,
            c.ServiceId,
            s.Name as ServiceName,
            s.Url as ServiceUrl,
            s.Logo as Logo,
            a.FirstName,
            a.LastName,
            a.NickName,
            a.BirthDate,
            a.Gender,
            a.Email,
            p.Value as Password
        FROM Credentials c
        LEFT JOIN Services s ON c.ServiceId = s.Id
        LEFT JOIN Aliases a ON c.AliasId = a.Id
        LEFT JOIN Passwords p ON p.CredentialId = c.Id
        WHERE c.IsDeleted = 0
        AND c.Id = ?`;

    const results = await this.executeQuery(query, [credentialId]);

    if (results.length === 0) {
      return null;
    }

    // Convert the first row to a Credential object
    const row = results[0] as any;
    return {
      Id: row.Id,
      Username: row.Username,
      Password: row.Password,
      ServiceName: row.ServiceName,
      ServiceUrl: row.ServiceUrl,
      Logo: row.Logo,
      Notes: row.Notes,
      Alias: {
        FirstName: row.FirstName,
        LastName: row.LastName,
        NickName: row.NickName,
        BirthDate: row.BirthDate,
        Gender: row.Gender,
        Email: row.Email
      }
    };
  }

  /**
   * Fetch all credentials with their associated service information.
   * @returns Array of Credential objects with service details.
   */
  public async getAllCredentials(): Promise<Credential[]> {
    const query = `
            SELECT DISTINCT
                c.Id,
                c.Username,
                c.Notes,
                c.ServiceId,
                s.Name as ServiceName,
                s.Url as ServiceUrl,
                s.Logo as Logo,
                a.FirstName,
                a.LastName,
                a.NickName,
                a.BirthDate,
                a.Gender,
                a.Email,
                p.Value as Password
            FROM Credentials c
            LEFT JOIN Services s ON c.ServiceId = s.Id
            LEFT JOIN Aliases a ON c.AliasId = a.Id
            LEFT JOIN Passwords p ON p.CredentialId = c.Id
            WHERE c.IsDeleted = 0
            ORDER BY c.CreatedAt DESC`;

    const results = await this.executeQuery<any>(query);

    return results.map((row) => ({
      Id: row.Id,
      Username: row.Username,
      Password: row.Password,
      ServiceName: row.ServiceName,
      ServiceUrl: row.ServiceUrl,
      Logo: row.Logo,
      Notes: row.Notes,
      Alias: {
        FirstName: row.FirstName,
        LastName: row.LastName,
        NickName: row.NickName,
        BirthDate: row.BirthDate,
        Gender: row.Gender,
        Email: row.Email
      }
    }));
  }

  /**
   * Fetch all unique email addresses from all credentials.
   * @returns Array of email addresses.
   */
  public async getAllEmailAddresses(): Promise<string[]> {
    const query = `
      SELECT DISTINCT
        a.Email
      FROM Credentials c
      LEFT JOIN Aliases a ON c.AliasId = a.Id
      WHERE a.Email IS NOT NULL AND a.Email != '' AND c.IsDeleted = 0
    `;

    const results = await this.executeQuery(query);

    return results.map((row: any) => row.Email);
  }

  /**
   * Fetch all encryption keys.
   */
  public async getAllEncryptionKeys(): Promise<EncryptionKey[]> {
    return this.executeQuery<EncryptionKey>(`SELECT
                x.PublicKey,
                x.PrivateKey,
                x.IsPrimary
            FROM EncryptionKeys x`);
  }

  /**
   * Get setting from database for a given key.
   * Returns default value (empty string by default) if setting is not found.
   */
  public async getSetting(key: string, defaultValue: string = ''): Promise<string> {
    const results = await this.executeQuery<{ Value: string }>(`SELECT
                s.Value
            FROM Settings s
            WHERE s.Key = ?`, [key]);

    return results.length > 0 ? results[0].Value : defaultValue;
  }

  /**
   * Get the default email domain from the database.
   */
  public async getDefaultEmailDomain(): Promise<string> {
    return this.getSetting('DefaultEmailDomain');
  }

  /**
   * Get the default identity language from the database.
   */
  public async getDefaultIdentityLanguage(): Promise<string> {
    return this.getSetting('DefaultIdentityLanguage', 'en');
  }

  /**
   * Get the password settings from the database.
   */
  public async getPasswordSettings(): Promise<PasswordSettings> {
    const settingsJson = await this.getSetting('PasswordGenerationSettings');

    // Default settings if none found or parsing fails
    const defaultSettings: PasswordSettings = {
      Length: 18,
      UseLowercase: true,
      UseUppercase: true,
      UseNumbers: true,
      UseSpecialChars: true,
      UseNonAmbiguousChars: false
    };

    try {
      if (settingsJson) {
        return { ...defaultSettings, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.warn('Failed to parse password settings:', error);
    }

    return defaultSettings;
  }

  /**
   * Create a new credential with associated entities
   * @param credential The credential object to insert
   * @returns The number of rows modified
   */
  public async createCredential(credential: Credential): Promise<number> {
    try {
      await this.executeUpdate('BEGIN TRANSACTION');

      // 1. Insert Service
      let logoData = null;
      try {
        if (credential.Logo) {
          // Handle object-like array conversion
          if (typeof credential.Logo === 'object' && !ArrayBuffer.isView(credential.Logo)) {
            const values = Object.values(credential.Logo);
            logoData = new Uint8Array(values);
          // Handle existing array types
          } else if (Array.isArray(credential.Logo) || credential.Logo instanceof ArrayBuffer || credential.Logo instanceof Uint8Array) {
            logoData = new Uint8Array(credential.Logo);
          }
        }
      } catch (error) {
        console.warn('Failed to convert logo to Uint8Array:', error);
        logoData = null;
      }

      const serviceQuery = `
                INSERT INTO Services (Id, Name, Url, Logo, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?)`;
      const serviceId = crypto.randomUUID().toUpperCase();
      const currentDateTime = new Date().toISOString()
        .replace('T', ' ')
        .replace('Z', '')
        .substring(0, 23);
      await this.executeUpdate(serviceQuery, [
        serviceId,
        credential.ServiceName,
        credential.ServiceUrl ?? null,
        logoData,
        currentDateTime,
        currentDateTime
      ]);

      // 2. Insert Alias
      const aliasQuery = `
                INSERT INTO Aliases (Id, FirstName, LastName, NickName, BirthDate, Gender, Email, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const aliasId = crypto.randomUUID().toUpperCase();
      await this.executeUpdate(aliasQuery, [
        aliasId,
        credential.Alias.FirstName ?? null,
        credential.Alias.LastName ?? null,
        credential.Alias.NickName ?? null,
        credential.Alias.BirthDate ?? null,
        credential.Alias.Gender ?? null,
        credential.Alias.Email ?? null,
        currentDateTime,
        currentDateTime
      ]);

      // 3. Insert Credential
      const credentialQuery = `
                INSERT INTO Credentials (Id, Username, Notes, ServiceId, AliasId, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const credentialId = crypto.randomUUID().toUpperCase();
      await this.executeUpdate(credentialQuery, [
        credentialId,
        credential.Username ?? null,
        credential.Notes ?? null,
        serviceId,
        aliasId,
        currentDateTime,
        currentDateTime
      ]);

      // 4. Insert Password
      if (credential.Password) {
        const passwordQuery = `
                    INSERT INTO Passwords (Id, Value, CredentialId, CreatedAt, UpdatedAt)
                    VALUES (?, ?, ?, ?, ?)`;
        const passwordId = crypto.randomUUID().toUpperCase();
        await this.executeUpdate(passwordQuery, [
          passwordId,
          credential.Password,
          credentialId,
          currentDateTime,
          currentDateTime
        ]);
      }

      await this.executeUpdate('COMMIT');
      return 1;

    } catch (error) {
      await this.executeUpdate('ROLLBACK');
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  /**
   * Get the current database version from the migrations history.
   * Returns the semantic version (e.g., "1.4.1") from the latest migration.
   * Returns null if no migrations are found.
   */
  public async getDatabaseVersion(): Promise<string | null> {
    try {
      // Query the migrations history table for the latest migration
      const results = await this.executeQuery<{ MigrationId: string }>(`
        SELECT MigrationId
        FROM __EFMigrationsHistory
        ORDER BY MigrationId DESC
        LIMIT 1`);

      if (results.length === 0) {
        return null;
      }

      // Extract version using regex - matches patterns like "20240917191243_1.4.1-RenameAttachmentsPlural"
      const migrationId = results[0].MigrationId;
      const versionRegex = /_(\d+\.\d+\.\d+)-/;
      const versionMatch = versionRegex.exec(migrationId);

      if (versionMatch?.[1]) {
        return versionMatch[1];
      }

      return null;
    } catch (error) {
      console.error('Error getting database version:', error);
      throw error;
    }
  }

  /**
   * Get TOTP codes for a credential
   * @param credentialId - The ID of the credential to get TOTP codes for
   * @returns Array of TotpCode objects
   */
  public async getTotpCodesForCredential(credentialId: string): Promise<TotpCode[]> {
    try {
      /*
       * Check if TotpCodes table exists (for backward compatibility).
       * TODO: whenever the browser extension has a minimum client DB version of 1.5.0+,
       * we can remove this check as the TotpCodes table then is guaranteed to exist.
       */
      if (!await this.tableExists('TotpCodes')) {
        return [];
      }

      const query = `
        SELECT
          Id,
          Name,
          SecretKey,
          CredentialId
        FROM TotpCodes
        WHERE CredentialId = ? AND IsDeleted = 0`;

      return this.executeQuery<TotpCode>(query, [credentialId]);
    } catch (error) {
      console.error('Error getting TOTP codes:', error);
      // Return empty array instead of throwing to be robust
      return [];
    }
  }

  /**
   * Check if a table exists in the database
   * @param tableName - The name of the table to check
   * @returns True if the table exists, false otherwise
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const query = `
        SELECT name FROM sqlite_master
        WHERE type='table' AND name=?`;

      const results = await this.executeQuery(query, [tableName]);
      return results.length > 0;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Get credential by email address
   * @param email - The email address to look up
   * @returns Credential object with service details or null if not found
   */
  public async getCredentialByEmail(email: string): Promise<Credential | null> {
    const query = `
        SELECT DISTINCT
            c.Id,
            c.Username,
            c.Notes,
            c.ServiceId,
            s.Name as ServiceName,
            s.Url as ServiceUrl,
            s.Logo as Logo,
            a.FirstName,
            a.LastName,
            a.NickName,
            a.BirthDate,
            a.Gender,
            a.Email,
            p.Value as Password
        FROM Credentials c
        LEFT JOIN Services s ON c.ServiceId = s.Id
        LEFT JOIN Aliases a ON c.AliasId = a.Id
        LEFT JOIN Passwords p ON p.CredentialId = c.Id
        WHERE c.IsDeleted = 0
        AND LOWER(a.Email) = LOWER(?)
        LIMIT 1`;

    const results = await this.executeQuery(query, [email]);

    if (results.length === 0) {
      return null;
    }

    // Convert the first row to a Credential object
    const row = results[0] as any;
    return {
      Id: row.Id,
      Username: row.Username,
      Password: row.Password,
      ServiceName: row.ServiceName,
      ServiceUrl: row.ServiceUrl,
      Logo: row.Logo,
      Notes: row.Notes,
      Alias: {
        FirstName: row.FirstName,
        LastName: row.LastName,
        NickName: row.NickName,
        BirthDate: row.BirthDate,
        Gender: row.Gender,
        Email: row.Email
      }
    };
  }
}

export default SqliteClient;