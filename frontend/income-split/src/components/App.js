import Wallet from "./Wallet";
import FactoryForm from "./FactoryForm";
import DeployedContracts from "./DeployedContracts";
import { useState, useEffect } from "react";
import { getFactoryContract } from "../utils/factoryContract";

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
    <div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
      ></link>
      <header>
        <h1>IncomeSplitter</h1>
        <Wallet wallet={walletAddress} setWalletCallback={setWallet} />
        <DeployedContracts
          factoryContract={factoryContract}
          walletAddress={walletAddress}
        />
        <FactoryForm contract={factoryContract} />
      </header>
    </div>
  );
}
export default App;
