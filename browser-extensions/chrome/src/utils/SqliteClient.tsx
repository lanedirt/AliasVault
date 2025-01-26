import initSqlJs, { Database } from 'sql.js';

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

            // Initialize SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
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
}

export default SqliteClient;