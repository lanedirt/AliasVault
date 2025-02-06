import initSqlJs, { Database } from 'sql.js';
import { Credential } from './types/Credential';
import { EncryptionKey } from './types/EncryptionKey';

/**
 * Client for interacting with the SQLite database.
 */
class SqliteClient {
  private db: Database | null = null;

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
      Email: row.Email,
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
      Email: row.Email,
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
   * Returns empty string if setting is not found.
   */
  public getSetting(key: string): string {
    const results = this.executeQuery<{ Value: string }>(`SELECT
                s.Value
            FROM Settings s
            WHERE s.Key = ?`, [key]);

    return results.length > 0 ? results[0].Value : '';
  }

  /**
   * Get the default email domain from the database.
   */
    public getDefaultEmailDomain(): string {
      return this.getSetting('DefaultEmailDomain');
    }

  /**
   * Create a new credential with associated entities
   * @param credential The credential object to insert
   * @returns The number of rows modified
   */
  public createCredential(credential: Credential): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.run('BEGIN TRANSACTION');

      // 1. Insert Service
      let logoData = null;
      try {
        if (credential.Logo) {
          // Handle object-like array conversion
          if (typeof credential.Logo === 'object' && !ArrayBuffer.isView(credential.Logo)) {
            const values = Object.values(credential.Logo);
            logoData = new Uint8Array(values);
          }
          // Handle existing array types
          else if (Array.isArray(credential.Logo) || credential.Logo instanceof ArrayBuffer || credential.Logo instanceof Uint8Array) {
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
      this.executeUpdate(serviceQuery, [
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
      this.executeUpdate(aliasQuery, [
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
      this.executeUpdate(credentialQuery, [
        credentialId,
        credential.Username,
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
        this.executeUpdate(passwordQuery, [
          passwordId,
          credential.Password,
          credentialId,
          currentDateTime,
          currentDateTime
        ]);
      }

      this.db.run('COMMIT');
      return 1;

    } catch (error) {
      this.db.run('ROLLBACK');
      console.error('Error creating credential:', error);
      throw error;
    }
  }
}

export default SqliteClient;