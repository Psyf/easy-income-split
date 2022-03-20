import { address, abi } from "../contracts/flexiblePaymentSplitterFactory";
import { ethers } from "ethers";

export async function getFactoryContract() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return new ethers.Contract(address, abi, provider.getSigner());
}
