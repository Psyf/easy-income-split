import { useState, useEffect } from "react";
import { getSplitterContract } from "../utils/paymentSplitterContract";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/system";
import { IconButton, Button, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DataGrid } from "@mui/x-data-grid";

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
  backgroundColor: "#FFFFFF",
  border: "2px solid #000",
  boxShadow: 24,
  width: "40%",
  p: 4,
};

function CurrentContractModal(props) {
  const [currentContractAddress, setCurrentContractAddress] = useState(null);
  const [currentContract, setCurrentContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [title, setTitle] = useState(null);
  const [owner, setOwner] = useState(null);
  const [payees, setPayees] = useState([]);
  const [shares, setShares] = useState([]);
  const [rows, setRows] = useState([]);

  async function attachToContract() {
    if (currentContractAddress) {
      var contract = await getSplitterContract(currentContractAddress);
      setCurrentContract(contract);
    }
  }

  function checkOwnership() {
    if (
      walletAddress &&
      owner &&
      walletAddress.toLowerCase() != owner.toLowerCase()
    ) {
      alert("You are not the owner of this contract! (anymore?)");
      return false;
    } else {
      return true;
    }
  }

  function checkPayeePresent(address) {
    if (
      payees.map((item) => item.toLowerCase()).includes(address.toLowerCase())
    ) {
      return true;
    } else {
      alert("Address not one of the payees!");
      return false;
    }
  }

  const deletePayee = async (event) => {
    event.preventDefault();
    var address = event.target.address.value;
    if (checkOwnership() && checkPayeePresent(address)) {
      await currentContract.deletePayee(address);
    }
  };

  async function changeShares(event) {
    event.preventDefault();
    var address = event.target.address.value;
    var newShares = event.target.shares.value;
    if (checkOwnership() && address && newShares) {
      await currentContract.changeShares(address, newShares);
    }
  }

  async function addPayee(event) {
    event.preventDefault();
    var address = event.target.address.value;
    var shares_ = event.target.shares.value;
    if (checkOwnership() && address && shares_) {
      await currentContract.addPayee(address, shares_);
    }
  }

  async function release(event) {
    event.preventDefault();
    var address = event.target.address ? event.target.address.value : null;
    if (checkPayeePresent(address)) {
      event.preventDefault();
      var token =
        event.target.token.length > 0 ? event.target.token.value : null;
      if (token != null)
        await currentContract["release(address,address)"](token, address);
      else await currentContract["release(address)"](address);
    }
  }

  async function releaseAll(event) {
    event.preventDefault();
    var token = event.target.token.length > 0 ? event.target.token.value : null;
    if (token != null) {
      await currentContract["releaseAll(address)"](token);
    } else {
      await currentContract["releaseAll()"]();
    }
  }

  async function blockEthPayments(event) {
    event.preventDefault();
    if (checkOwnership()) {
      await currentContract.blockEthPayments();
    }
  }

  async function updateOwner() {
    if (currentContract) {
      var owner_ = await currentContract.owner();
      setOwner(owner_);
    } else {
      setOwner(null);
    }
  }

  async function updateTitle() {
    if (currentContract) {
      var t = await currentContract.description();
      setTitle(t);
    } else {
      setTitle(null);
    }
  }

  async function updatePayees() {
    var payee_arr = [];
    if (currentContract) {
      var n = await currentContract.numCurrentPayees();
      for (var i = 0; i < n; i++) {
        var payee = await currentContract.payee(i);
        payee_arr.push(payee);
      }
      setPayees(payee_arr);
    } else {
      setPayees([]);
    }
  }

  async function updateShares() {
    var share_arr = [];
    for (var i = 0; i < payees.length; i++) {
      var share = await currentContract.shares(payees[i]);
      share_arr.push(share);
    }
    setShares(share_arr);
  }

  async function updateRowsForDisplay() {
    var res = [];
    if (currentContract && payees.length && shares.length) {
      for (var i = 0; i < payees.length; i++) {
        res.push({
          id: i,
          address: payees[i],
          shares: shares[i],
        });
      }
    }
    setRows(res);
  }

  useEffect(() => {
    setCurrentContractAddress(props.currentContractAddress);
    setWalletAddress(props.walletAddress);
  }, [props]);

  useEffect(async () => {
    await attachToContract();
  }, [currentContractAddress]);

  useEffect(async () => {
    await updateTitle();
    await updateOwner();
    await updatePayees();
  }, [currentContract]);

  useEffect(async () => {
    await updateShares();
  }, [payees]);

  useEffect(async () => {
    await updateRowsForDisplay();
  }, [shares]);

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
        <h2 id="contract_name">{title}</h2>
        <h3>Current Owner</h3>
        <p id="owner">{owner}</p>
        <Box sx={{ height: 400, bgcolor: "background.paper" }}>
          <DataGrid
            hideFooter
            rows={rows}
            columns={[
              { field: "address", width: 400 },
              { field: "shares", width: 200 },
            ]}
          />
        </Box>
        <Box component="form" noValidate onSubmit={deletePayee}>
          <TextField
            type="text"
            id="address"
            placeholder="0x..."
            //defaultValue="jezer0x"
            variant="standard"
            label="PayeeToDelete"
          />
          <Button variant="contained" color="warning" type="submit">
            DeletePayee
          </Button>
        </Box>
        <Box component="form" noValidate onSubmit={addPayee}>
          <TextField
            type="text"
            id="address"
            placeholder="0x..."
            //defaultValue="jezer0x"
            variant="standard"
            label="PayeeToAdd"
          />
          <TextField
            type="text"
            id="shares"
            placeholder="10"
            //defaultValue="jezer0x"
            variant="standard"
            label="Shares"
          />
          <Button variant="contained" color="warning" type="submit">
            AddPayee
          </Button>
        </Box>
        <Box component="form" noValidate onSubmit={changeShares}>
          <TextField
            type="text"
            id="address"
            placeholder="0x..."
            //defaultValue="jezer0x"
            variant="standard"
            label="PayeeToChangeSharesFor"
          />
          <TextField
            type="text"
            id="shares"
            placeholder="10"
            //defaultValue="jezer0x"
            variant="standard"
            label="Shares"
          />
          <Button variant="contained" color="warning" type="submit">
            ChangeShares
          </Button>
        </Box>
        <Box component="form" noValidate onSubmit={release}>
          <TextField
            type="text"
            id="address"
            placeholder="0x..."
            variant="standard"
            label="address"
          />
          <TextField
            type="text"
            id="token"
            placeholder="0x..."
            variant="standard"
            label="token"
          />
          <Button variant="contained" color="primary" type="submit">
            Release
          </Button>
        </Box>
        <Box component="form" noValidate onSubmit={releaseAll}>
          <TextField
            type="text"
            id="token"
            placeholder="0x..."
            variant="standard"
            label="token"
          />
          <Button variant="contained" color="primary" type="submit">
            ReleaseAll
          </Button>
        </Box>
        <Button variant="contained" color="error" onClick={blockEthPayments}>
          BlockEthPayments
        </Button>
      </Box>
    </Modal>
  );
}

export default CurrentContractModal;
