/*
 * TODO: move query logic to shared dbcontext and reference this type from there
 * so we don't have multiple copies or versions of this type with different fields.
 */
export type Credential = {
    Id: string;
    Username: string;
    ServiceId: string;
    ServiceName: string;
    ServiceUrl: string;
    Logo: Uint8Array;
    Password: string;
}