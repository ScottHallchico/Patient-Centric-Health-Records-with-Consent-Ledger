import { BrowserProvider, Contract } from "ethers";
import abi from "./contracts/ConsentLedgerAbi.json";
import deployment from "./contracts/deployment.json";

export const DEFAULT_CONTRACT_ADDRESS = deployment.address;
export const LOCAL_CHAIN_ID = deployment.chainId;

export async function connectWallet(contractAddress) {
  if (!globalThis.ethereum) {
    throw new Error("MetaMask or another Ethereum wallet is required.");
  }

  const provider = new BrowserProvider(globalThis.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  const contract = new Contract(contractAddress, abi, signer);
  const readContract = new Contract(contractAddress, abi, provider);
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    account,
    contract,
    readContract,
    chainId: Number(network.chainId)
  };
}
