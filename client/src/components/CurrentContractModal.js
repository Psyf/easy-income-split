import { useState, useEffect } from "react";
import { getSplitterContract } from "../utils/paymentSplitterContract";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/system";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

//TODO: Take them to a separate stylesheet file
const customButton = {
  position: "absolute",
  left: "95%",
  top: "-9%",
  backgroundColor: "lightgray",
  color: "gray",
};

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#1976d2",
  color: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function CurrentContractModal(props) {
  const [currentContractAddress, setCurrentContractAddress] = useState(null);
  const [currentContract, setCurrentContract] = useState(null);

  async function attachToContract() {
    if (currentContractAddress) {
      var contract = await getSplitterContract(currentContractAddress);
      setCurrentContract(contract);
    }
  }

  useEffect(() => {
    setCurrentContractAddress(props.currentContractAddress);
  }, [props]);

  useEffect(async () => {
    await attachToContract();
  }, [currentContractAddress]);

  useEffect(async () => {
    if (currentContract) {
      var owner = await currentContract.owner();
      document.getElementById("owner").textContent = owner;

      var description = await currentContract.description();
      document.getElementById("contract_name").textContent = description;

      var numPayees = await currentContract.numCurrentPayees();

      var list = document.getElementById("payees");
      for (var i = 0; i < numPayees; i++) {
        var payeeAddr = await currentContract.payee(i);
        var payeeShares = await currentContract.shares(payeeAddr);
        var elem = document.createElement("li");
        elem.innerText = payeeAddr + ", " + payeeShares;
        list.appendChild(elem);
      }
    }
  }, [currentContract]);
  return (
    //broken css for some reason
    <Modal open={currentContractAddress != null}>
      <Box style={style}>
        <IconButton
          onClick={() => setCurrentContractAddress(null)}
          style={customButton}
        >
          <CloseIcon />
        </IconButton>
        <div id="contract_info">
          <h2 id="contract_name"></h2>
          <h3>Current Owner</h3>
          <p id="owner"></p>
          <h3>Payees : Shares </h3>
          <ul id="payees"></ul>
        </div>
      </Box>
    </Modal>
  );
}

export default CurrentContractModal;
