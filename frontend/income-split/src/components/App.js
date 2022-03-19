/**
 * Sources that helped:
 * integrating web3 with react: https://javascript.plainenglish.io/set-up-web3-in-your-react-app-dec6d6f45b4d
 * create-react-app: https://create-react-app.dev/docs/getting-started/
 */

import { useEffect, useState } from "react";

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);

  // TODO: Let people disconnect their wallet
  function replaceConnectButton(account) {
    var elem = document.getElementById("connect_wallet_button");
    elem.textContent = account;
    elem.className = "waves-effect waves-light btn red";
  }

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!");
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
      replaceConnectButton(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    checkWalletIsConnected();
  }, []);

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"
      ></link>
      <header>
        <h1>IncomeSplitter</h1>
        <div className="btn-wrapper">
          <button
            id="connect_wallet_button"
            type="button"
            className="waves-effect waves-light btn"
            onClick={connectWalletHandler}
          >
            Connect Wallet
          </button>
        </div>
      </header>
    </div>
  );
}
export default App;
