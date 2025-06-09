import initSqlJs, { Database } from 'sql.js';
import { sendMessage } from 'webext-bridge/popup';

import type { Credential, EncryptionKey, PasswordSettings, TotpCode } from '@/utils/shared/models/vault';
import { StoreVaultRequest } from './types/messaging/StoreVaultRequest';

/**
 * Placeholder base64 image for credentials without a logo.
 */
const placeholderBase64 = 'UklGRjoEAABXRUJQVlA4IC4EAAAwFwCdASqAAIAAPpFCm0olo6Ihp5IraLASCWUA0eb/0s56RrLtCnYfLPiBshdXWMx8j1Ez65f169iA4xUDBTEV6ylMQeCIj2b7RngGi7gKZ9WjKdSoy9R8JcgOmjCMlDmLG20KhNo/i/Dc/Ah5GAvGfm8kfniV3AkR6fxN6eKwjDc6xrDgSfS48G5uGV6WzQt24YAVlLSK9BMwndzfHnePK1KFchFrL7O3ulB8cGNCeomu4o+l0SrS/JKblJ4WTzj0DAD++lCUEouSfgRKdiV2TiYCD+H+l3tANKSPQFPQuzi7rbvxqGeRmXB9kDwURaoSTTpYjA9REMUi9uA6aV7PWtBNXgUzMLowYMZeos6Xvyhb34GmufswMHA5ZyYpxzjTphOak4ZjNOiz8aScO5ygiTx99SqwX/uL+HSeVOSraHw8IymrMwm+jLxqN8BS8dGcItLlm/ioulqH2j4V8glDgSut+ExkxiD7m8TGPrrjCQNJbRDzpOFsyCyfBZupvp8QjGKW2KGziSZeIWes4aTB9tRmeEBhnUrmTDZQuXcc67Fg82KHrSfaeeOEq6jjuUjQ8wUnzM4Zz3dhrwSyslVz/WvnKqYkr4V/TTXPFF5EjF4rM1bHZ8bK63EfTnK41+n3n4gEFoYP4mXkNH0hntnYcdTqiE7Gn+q0BpRRxnkpBSZlA6Wa70jpW0FGqkw5e591A5/H+OV+60WAo+4Mi+NlsKrvLZ9EiVaPnoEFZlJQx1fA777AJ2MjXJ4KSsrWDWJi1lE8yPs8V6XvcC0chDTYt8456sKXAagCZyY+fzQriFMaddXyKQdG8qBqcdYjAsiIcjzaRFBBoOK9sU+sFY7N6B6+xtrlu3c37rQKkI3O2EoiJOris54EjJ5OFuumA0M6riNUuBf/MEPFBVx1JRcUEs+upEBsCnwYski7FT3TTqHrx7v5AjgFN97xhPTkmVpu6sxRnWBi1fxIRp8eWZeFM6mUcGgVk1WeVb1yhdV9hoMo2TsNEPE0tHo/wvuSJSzbZo7wibeXM9v/rRfKcx7X93rfiXVnyQ9f/5CaAQ4lxedPp/6uzLtOS4FyL0bCNeZ6L5w+AiuyWCTDFIYaUzhwfG+/YTQpWyeZCdQIKzhV+3GeXI2cxoP0ER/DlOKymf1gm+zRU3sqf1lBVQ0y+mK/Awl9bS3uaaQmI0FUyUwHUKP7PKuXnO+LcwDv4OfPT6hph8smc1EtMe5ib/apar/qZ9dyaEaElALJ1KKxnHziuvVl8atk1fINSQh7OtXDyqbPw9o/nGIpTnv5iFmwmWJLis2oyEgPkJqyx0vYI8rjkVEzKc8eQavAJBYSpjMwM193Swt+yJyjvaGYWPnqExxKiNarpB2WSO7soCAZXhS1uEYHryrK47BH6W1dRiruqT0xpLih3MXiwU3VDwAAAA==';

/**
 * Client for interacting with the SQLite database.
 */
export class SqliteClient {
  private db: Database | null = null;
  private isInTransaction: boolean = false;

  /**
   * Initialize the SQLite database from a base64 string
   */
  public async initializeFromBase64(base64String: string): Promise<void> {
    try {
      // Convert base64 to Uint8Array
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Initialize SQL.js with the WASM file from the local file system.
      const SQL = await initSqlJs({
        /**
         * Locates SQL.js files from the local file system.
         * @param file - The name of the file to locate
         * @returns The complete URL path to the file
         */
        locateFile: (file: string) => `src/${file}`
      });

      // Create database from the binary data
      this.db = new SQL.Database(bytes);
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  /**
   * Begin a new transaction
   */
  public beginTransaction(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (this.isInTransaction) {
      throw new Error('Transaction already in progress');
    }

    try {
      this.db.run('BEGIN TRANSACTION');
      this.isInTransaction = true;
    } catch (error) {
      console.error('Error beginning transaction:', error);
      throw error;
    }
  }

  /**
   * Commit the current transaction and persist changes to the vault
   */
  public async commitTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (!this.isInTransaction) {
      throw new Error('No transaction in progress');
    }

    try {
      this.db.run('COMMIT');
      this.isInTransaction = false;

      // Export the current database state and store it in the background worker
      const updatedVaultBlob = this.exportToBase64();

      /**
       * Store encrypted vault in background worker.
       */
      const request: StoreVaultRequest = {
        vaultBlob: updatedVaultBlob,
      };

      await sendMessage('STORE_VAULT', request, 'background');
    } catch (error) {
      console.error('Error committing transaction:', error);
      throw error;
    }
  }

  /**
   * Rollback the current transaction
   */
  public rollbackTransaction(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (!this.isInTransaction) {
      throw new Error('No transaction in progress');
    }

    try {
      this.db.run('ROLLBACK');
      this.isInTransaction = false;
    } catch (error) {
      console.error('Error rolling back transaction:', error);
      throw error;
    }
  }

  /**
   * Export the SQLite database to a base64 string
   * @returns Base64 encoded string of the database
   */
  public exportToBase64(): string {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Export database to Uint8Array
      const binaryArray = this.db.export();

      // Convert Uint8Array to base64 string
      let binaryString = '';
      for (let i = 0; i < binaryArray.length; i++) {
        binaryString += String.fromCharCode(binaryArray[i]);
      }
      return btoa(binaryString);
    } catch (error) {
      console.error('Error exporting SQLite database:', error);
      throw error;
    }
  }

  /**
   * Execute a SELECT query
   */
  public executeQuery<T>(query: string, params: (string | number | null | Uint8Array)[] = []): T[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(query);
      stmt.bind(params);

      const results: T[] = [];
      while (stmt.step()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.push(stmt.getAsObject() as any);
      }
      stmt.free();

      return results;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   */
  public executeUpdate(query: string, params: (string | number | null | Uint8Array)[] = []): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      stmt.step();
      const changes = this.db.getRowsModified();
      stmt.free();
      return changes;
    } catch (error) {
      console.error('Error executing update:', error);
      throw error;
    }
  }

  /**
   * Close the database connection and free resources.
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Fetch a single credential with its associated service information.
   * @param credentialId - The ID of the credential to fetch.
   * @returns Credential object with service details or null if not found.
   */
  public getCredentialById(credentialId: string): Credential | null {
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

    const results = this.executeQuery(query, [credentialId]);

    if (results.length === 0) {
      return null;
    }

    // Convert the first row to a Credential object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  public getAllCredentials(): Credential[] {
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

    const results = this.executeQuery(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((row: any) => ({
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
  public getAllEmailAddresses(): string[] {
    const query = `
      SELECT DISTINCT
        a.Email
      FROM Credentials c
      LEFT JOIN Aliases a ON c.AliasId = a.Id
      WHERE a.Email IS NOT NULL AND a.Email != '' AND c.IsDeleted = 0
    `;

    const results = this.executeQuery(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return results.map((row: any) => row.Email);
  }

  /**
   * Fetch all encryption keys.
   */
  public getAllEncryptionKeys(): EncryptionKey[] {
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
  public getSetting(key: string, defaultValue: string = ''): string {
    const results = this.executeQuery<{ Value: string }>(`SELECT
                s.Value
            FROM Settings s
            WHERE s.Key = ?`, [key]);

    return results.length > 0 ? results[0].Value : defaultValue;
  }

  /**
   * Get the default email domain from the database.
   */
  public getDefaultEmailDomain(): string {
    return this.getSetting('DefaultEmailDomain');
  }

  /**
   * Get the default identity language from the database.
   */
  public getDefaultIdentityLanguage(): string {
    return this.getSetting('DefaultIdentityLanguage', 'en');
  }

  /**
   * Get the password settings from the database.
   */
  public getPasswordSettings(): PasswordSettings {
    const settingsJson = this.getSetting('PasswordGenerationSettings');

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
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.beginTransaction();

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
                INSERT INTO Services (Id, Name, Url, Logo, CreatedAt, UpdatedAt, IsDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const serviceId = crypto.randomUUID().toUpperCase();
      const currentDateTime = new Date().toISOString()
        .replace('T', ' ')
        .replace('Z', '')
        .substring(0, 23);
      this.executeUpdate(serviceQuery, [
        serviceId,
        credential.ServiceName,
        credential.ServiceUrl ?? null,
        logoData,
        currentDateTime,
        currentDateTime,
        0
      ]);

      // 2. Insert Alias
      const aliasQuery = `
                INSERT INTO Aliases (Id, FirstName, LastName, NickName, BirthDate, Gender, Email, CreatedAt, UpdatedAt, IsDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const aliasId = crypto.randomUUID().toUpperCase();
      this.executeUpdate(aliasQuery, [
        aliasId,
        credential.Alias.FirstName ?? null,
        credential.Alias.LastName ?? null,
        credential.Alias.NickName ?? null,
        credential.Alias.BirthDate ?? null,
        credential.Alias.Gender ?? null,
        credential.Alias.Email ?? null,
        currentDateTime,
        currentDateTime,
        0
      ]);

      // 3. Insert Credential
      const credentialQuery = `
                INSERT INTO Credentials (Id, Username, Notes, ServiceId, AliasId, CreatedAt, UpdatedAt, IsDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const credentialId = crypto.randomUUID().toUpperCase();
      this.executeUpdate(credentialQuery, [
        credentialId,
        credential.Username ?? null,
        credential.Notes ?? null,
        serviceId,
        aliasId,
        currentDateTime,
        currentDateTime,
        0
      ]);

      // 4. Insert Password
      if (credential.Password) {
        const passwordQuery = `
                    INSERT INTO Passwords (Id, Value, CredentialId, CreatedAt, UpdatedAt, IsDeleted)
                    VALUES (?, ?, ?, ?, ?, ?)`;
        const passwordId = crypto.randomUUID().toUpperCase();
        this.executeUpdate(passwordQuery, [
          passwordId,
          credential.Password,
          credentialId,
          currentDateTime,
          currentDateTime,
          0
        ]);
      }

      await this.commitTransaction();
      return 1;

    } catch (error) {
      this.rollbackTransaction();
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  /**
   * Get the current database version from the migrations history.
   * Returns the semantic version (e.g., "1.4.1") from the latest migration.
   * Returns null if no migrations are found.
   */
  public getDatabaseVersion(): string | null {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Query the migrations history table for the latest migration
      const results = this.executeQuery<{ MigrationId: string }>(`
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
  public getTotpCodesForCredential(credentialId: string): TotpCode[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      /*
       * Check if TotpCodes table exists (for backward compatibility).
       * TODO: whenever the browser extension has a minimum client DB version of 1.5.0+,
       * we can remove this check as the TotpCodes table then is guaranteed to exist.
       */
      if (!this.tableExists('TotpCodes')) {
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
   * Delete a credential by ID
   * @param credentialId - The ID of the credential to delete
   * @returns The number of rows deleted
   */
  public async deleteCredentialById(credentialId: string): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.beginTransaction();

      const currentDateTime = new Date().toISOString()
        .replace('T', ' ')
        .replace('Z', '')
        .substring(0, 23);

      // Update the credential, alias, and service to be deleted
      const query = `
        UPDATE Credentials
        SET IsDeleted = 1,
            UpdatedAt = ?
        WHERE Id = ?`;

      const aliasQuery = `
        UPDATE Aliases
        SET IsDeleted = 1,
            UpdatedAt = ?
        WHERE Id = (
          SELECT AliasId
          FROM Credentials
          WHERE Id = ?
        )`;

      const serviceQuery = `
        UPDATE Services
        SET IsDeleted = 1,
            UpdatedAt = ?
        WHERE Id = (
          SELECT ServiceId
          FROM Credentials
          WHERE Id = ?
        )`;

      const results = this.executeUpdate(query, [currentDateTime, credentialId]);
      this.executeUpdate(aliasQuery, [currentDateTime, credentialId]);
      this.executeUpdate(serviceQuery, [currentDateTime, credentialId]);

      await this.commitTransaction();
      return results;
    } catch (error) {
      this.rollbackTransaction();
      console.error('Error deleting credential:', error);
      throw error;
    }
  }

  /**
   * Convert binary data to a base64 encoded image source.
   */
  public static imgSrcFromBytes(bytes: Uint8Array<ArrayBufferLike> | number[] | undefined): string {
    // Handle base64 image data
    if (bytes) {
      try {
        const logoBytes = this.toUint8Array(bytes);
        const base64Logo = this.base64Encode(logoBytes);
        // Detect image type from first few bytes
        const mimeType = this.detectMimeType(logoBytes);
        return `data:${mimeType};base64,${base64Logo}`;
      } catch (error) {
        console.error('Error setting logo:', error);
        return `data:image/x-icon;base64,${placeholderBase64}`;
      }
    } else {
      return `data:image/x-icon;base64,${placeholderBase64}`;
    }
  }

  /**
   * Detect MIME type from file signature (magic numbers)
   */
  private static detectMimeType(bytes: Uint8Array): string {
    /**
     * Check if the file is an SVG file.
     */
    const isSvg = () : boolean => {
      const header = new TextDecoder().decode(bytes.slice(0, 5)).toLowerCase();
      return header.includes('<?xml') || header.includes('<svg');
    };

    /**
     * Check if the file is an ICO file.
     */
    const isIco = () : boolean => {
      return bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00;
    };

    /**
     * Check if the file is an PNG file.
     */
    const isPng = () : boolean => {
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    };

    if (isSvg()) {
      return 'image/svg+xml';
    }
    if (isIco()) {
      return 'image/x-icon';
    }
    if (isPng()) {
      return 'image/png';
    }

    return 'image/x-icon';
  }

  /**
   * Convert various binary data formats to Uint8Array
   */
  private static toUint8Array(buffer: Uint8Array | number[] | {[key: number]: number}): Uint8Array {
    if (buffer instanceof Uint8Array) {
      return buffer;
    }

    if (Array.isArray(buffer)) {
      return new Uint8Array(buffer);
    }

    const length = Object.keys(buffer).length;
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = buffer[i];
    }

    return arr;
  }

  /**
   * Base64 encode binary data.
   */
  private static base64Encode(buffer: Uint8Array | number[] | {[key: number]: number}): string | null {
    try {
      const arr = Array.from(this.toUint8Array(buffer));
      return btoa(arr.reduce((data, byte) => data + String.fromCharCode(byte), ''));
    } catch (error) {
      console.error('Error encoding to base64:', error);
      return null;
    }
  }

  /**
   * Check if a table exists in the database
   * @param tableName - The name of the table to check
   * @returns True if the table exists, false otherwise
   */
  private tableExists(tableName: string): boolean {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const query = `
        SELECT name FROM sqlite_master
        WHERE type='table' AND name=?`;

      const results = this.executeQuery(query, [tableName]);
      return results.length > 0;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }
}

export default SqliteClient;