/**
 * Sources that helped:
 * integrating web3 with react: https://javascript.plainenglish.io/set-up-web3-in-your-react-app-dec6d6f45b4d
 * create-react-app: https://create-react-app.dev/docs/getting-started/
 */

import "./App.css";

// web3 stuff
import { useWeb3React } from "@web3-react/core";
import { injected } from "./wallet/connector";
import { address, abi } from "./contracts/flexiblePaymentSplitterFactory";
import web3 from "web3";

function App() {
  const { active, account, library, activate, deactivate, connector } =
    useWeb3React();

  async function connect() {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  }

  async function disconnect() {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  }

  return (
    <div className="App">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
      ></link>
      <header className="App-header">
        <h1>IncomeSplitter</h1>
        <div className="btn-wrapper">
          {!active ? (
            <button
              id="connect_wallet_button"
              type="button"
              className="waves-effect waves-light btn"
              onClick={connect}
            >
              Connect Wallet
            </button>
          ) : (
            <button
              id="connect_wallet_button"
              type="button"
              className="waves-effect waves-light btn red"
              onClick={disconnect}
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
