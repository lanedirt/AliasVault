import { MailboxEmail } from "./MailboxEmail";

export type MailboxBulkRequest = {
    addresses: string[];
    page: number;
    pageSize: number;
}

export type MailboxBulkResponse = {
    addresses: string[];
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    mails: MailboxEmail[];
}