import Wallet from "./Wallet";
import FactoryForm from "./FactoryForm";
import DeployedContracts from "./DeployedContracts";
import { useState, useEffect } from "react";
import { getFactoryContract } from "../utils/factoryContract";
import { Typography } from "@mui/material";

function App() {
  const [factoryContract, setFactoryContract] = useState(null);
  const [walletAddress, setWallet] = useState(null);
  /* TIL:
        Apparently an antipattern for state to go 2 ways in React 
        setWallet is being used as a callback by the Wallet component 
  */

  async function mountFactoryContract() {
    if (walletAddress) {
      var contract = await getFactoryContract();
      setFactoryContract(contract);
    }
  }

  useEffect(async () => {
    await mountFactoryContract();
  }, [walletAddress]);

  return (
    <header>
      <Typography component="span">
        <h1 align="center">IncomeSplitter</h1>
      </Typography>
      <Wallet wallet={walletAddress} setWalletCallback={setWallet} />
      <DeployedContracts
        factoryContract={factoryContract}
        walletAddress={walletAddress}
      />
      <FactoryForm contract={factoryContract} />
    </header>
  );
}
export default App;
