import { Identity } from "./Identity";

export interface IIdentityGenerator {
  generateRandomIdentity(): Promise<Identity>;
}
