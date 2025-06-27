import { Identity } from "../types/Identity";

export interface IIdentityGenerator {
  generateRandomIdentity(gender?: string | 'random'): Identity;
}
