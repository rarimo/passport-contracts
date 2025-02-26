import { ethers } from "ethers";

const RPC_URL = "https://rpc.evm.node2.mainnet-beta.rarimo.com";
const EXPLORER_API_URL = "https://evmscan.mainnet-beta.rarimo.com/api";

export const REGISTRATION_SIMPLE_ADDRESS = "0x8B8b14B6bD955eCc96bee1D83a3Eba21B80A0E91";
export const REGISTRATION_2_ADDRESS = "0x1b0F076c8800c457CE734BA85aC8569284DD640A";
export const REGISTRATION_ADDRESS = "0x5B216Aac3d38d22255a66b269D6d3B37027CD8f0";

export const PROVIDER = new ethers.JsonRpcProvider(RPC_URL);

export function buildExplorerAPIURL(address: string) {
  return `${EXPLORER_API_URL}?module=account&action=txlist&address=${address}`;
}
