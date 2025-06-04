import { Identity } from "../types/Identity";

export interface IIdentityGenerator {
  generateRandomIdentity(): Identity;
}
