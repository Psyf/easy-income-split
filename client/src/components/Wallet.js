import { connectWallet, getCurrentWalletConnected } from "../utils/wallet";
import { useEffect } from "react";

function Wallet(props) {
  const walletAddress = props.wallet;
  const setWallet = props.setWalletCallback;
  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        } else {
          setWallet(null);
        }
      });
    }
  }

  // TODO: Let people disconnect their wallet
  const connectWalletHandler = async () => {
    const { address } = await connectWallet();
    setWallet(address);
  };

  useEffect(async () => {
    const { address } = await getCurrentWalletConnected();
    setWallet(address);

    addWalletListener();
  }, []);

  return (
    <div className="btn-wrapper right">
      <button
        id="connect_wallet_button"
        type="button"
        className="waves-effect waves-light btn"
        onClick={connectWalletHandler}
      >
        {walletAddress ? (
          String(walletAddress).substring(0, 8) +
          "..." +
          String(walletAddress).substring(36)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
    </div>
  );
}

export default Wallet;
