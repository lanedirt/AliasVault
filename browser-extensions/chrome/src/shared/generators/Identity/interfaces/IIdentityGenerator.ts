import { Identity } from "../types/Identity";

export interface IIdentityGenerator {
  generateRandomIdentity(): Promise<Identity>;
}
