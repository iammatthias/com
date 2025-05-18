import { PinataSDK } from "pinata";

export const pinata = new PinataSDK({
  pinataJwt: import.meta.env.PINATA_JWT,
  pinataGateway: import.meta.env.GATEWAY_URL,
});
