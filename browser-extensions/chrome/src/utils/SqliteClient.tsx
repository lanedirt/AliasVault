import initSqlJs, { Database } from 'sql.js';
import { Credential } from '../types/Credential';
import { EncryptionKey } from '../types/EncryptionKey';

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
                results.push(stmt.getAsObject());
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
     * Close the database connection and free resources
     */
    public close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     * Fetch all credentials with their associated service information
     * @returns Array of Credential objects with service details
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
            WHERE c.IsDeleted = 0`;

        const results = this.executeQuery(query);

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
}

export default SqliteClient;