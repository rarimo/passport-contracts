import { ethers } from "ethers";

const RPC_URL = "https://rpc.evm.mainnet.rarimo.com";
const EXPLORER_API_URL = "https://api.evmscan.rarimo.com/api";

export const REGISTRATION_SIMPLE_ADDRESS = "0x2159582f31A59Da783F775E2c95FbA59B58281Ec";
export const REGISTRATION_2_ADDRESS = "0xC0B09085Fa2ad3A8BbF96494B8d5cd10702FE20d";
export const REGISTRATION_ADDRESS = "0xAFACe6eCc6E26e1F1479176622718fb0638049B1";
export const STATE_KEEPER_ADDRESS = "0x7d4E8Da1d10f8Db46C52414175d4003ab0Aef506";

export const PROVIDER = new ethers.JsonRpcProvider(RPC_URL);

export function buildExplorerAPIURL(address: string) {
  return `${EXPLORER_API_URL}?module=account&action=txlist&address=${address}`;
}
