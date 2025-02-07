/**
 * Credential SQLite database type.
 */
export type Credential = {
    Id: string;
    Username: string;
    Password: string;
    Email: string;
    ServiceName: string;
    ServiceUrl?: string;
    Logo?: Uint8Array | number[] | undefined;
    Notes?: string;
    Alias: {
        FirstName: string;
        LastName: string;
        NickName?: string;
        BirthDate: string;
        Gender?: string;
        Email?: string;
    };
}