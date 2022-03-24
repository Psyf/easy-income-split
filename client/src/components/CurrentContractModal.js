import { useState, useEffect } from "react";
import { getSplitterContract } from "../utils/paymentSplitterContract";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/system";
import { IconButton, Button, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DataGrid } from "@mui/x-data-grid";
import { ethers } from "ethers";

//TODO: Take them to a separate stylesheet file
const customButton = {
  position: "absolute",
  left: "100%",
  top: "-5%",
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

  const [payeesAndShares, setPayeesAndShares] = useState(new Map());
  const [payeesToPending, setPayeesToPending] = useState(new Map());
  const [displayRows, setdisplayRows] = useState([]);
  const [initRowsFetched, setInitRowsFetched] = useState(false);
  const [token, setToken] = useState(null);

  // Maybe Buggy listeners because they race
  function setListeners() {
    if (currentContract) {
      currentContract.on("PayeeAdded", (addr, share_, e) => {
        var newMap = new Map(payeesAndShares);
        newMap.set(addr, share_);
        setPayeesAndShares(newMap);
      });

      currentContract.on("PayeeDeleted", (addr, e) => {
        var newMap = new Map(payeesAndShares);
        newMap.delete(addr);
        setPayeesAndShares(newMap);
      });

      // TODO: would be nice to handle PaymentReceived, (ERC20)PaymentReleased
    }
  }

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
    if (payeesAndShares.get(address)) {
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
      if (token != null)
        await currentContract["release(address,address)"](token, address);
      else await currentContract["release(address)"](address);
    }
  }

  async function releaseAll(event) {
    event.preventDefault();
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

  async function updatePayeesAndShares() {
    var newMap = new Map();
    if (currentContract) {
      var n = await currentContract.numCurrentPayees();
      for (var i = 0; i < n; i++) {
        var payee = await currentContract.payee(i);
        var share = await currentContract.shares(payee);
        newMap.set(payee, share);
      }
    }

    setPayeesAndShares(newMap);
    setInitRowsFetched(newMap.size > 0);
  }

  async function setupInitialState() {
    await updateTitle();
    await updateOwner();
    await updatePayeesAndShares();
  }

  async function updatedisplayRowsForDisplay() {
    var res = [];
    if (payeesAndShares.size > 0 && payeesToPending.size > 0) {
      for (var [k, v] of payeesAndShares.entries()) {
        res.push({
          id: k,
          address: k,
          shares: v,
          pendingPayment: ethers.utils.formatEther(payeesToPending.get(k)),
        });
      }
    }
    setdisplayRows(res);
  }

  function setSelectedToken(event) {
    if (event.key === "Enter") {
      if (event.target.value.length > 0) {
        if (ethers.utils.getAddress(event.target.value)) {
          setToken(event.target.value);
        } else {
          alert("invalid token address!");
        }
      } else {
        setToken(null);
      }
    }
  }

  async function getPending() {
    var newMap = new Map();
    if (currentContract) {
      for (var [addr, v] of payeesAndShares.entries()) {
        var pending;
        if (token == null) {
          pending = await currentContract["pendingPayment(address)"](addr);
        } else {
          pending = await currentContract["pendingPayment(address,address)"](
            token,
            addr
          );
        }

        newMap.set(addr, pending);
      }
    }
    setPayeesToPending(newMap);
  }

  useEffect(() => {
    setCurrentContractAddress(props.currentContractAddress);
    setWalletAddress(props.walletAddress);
  }, [props]);

  useEffect(async () => {
    await attachToContract();
  }, [currentContractAddress]);

  useEffect(async () => {
    await setupInitialState();
  }, [currentContract]);

  useEffect(async () => {
    await getPending();
  }, [payeesAndShares, token]);

  useEffect(async () => {
    await updatedisplayRowsForDisplay();
  }, [payeesToPending]);

  // Forcing a wait until all the initial rows are set
  useEffect(() => {
    setListeners();
  }, [initRowsFetched, currentContract]);

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
        <h2>{title + " / " + currentContractAddress}</h2>
        <h3>Current Owner</h3>
        <p id="owner">{owner}</p>
        <TextField
          type="text"
          id="token"
          placeholder="ETH"
          variant="standard"
          helperText="Enter token address and press Enter"
          label="token"
          onKeyPress={setSelectedToken}
        />
        <Box sx={{ height: 400, bgcolor: "background.paper" }}>
          <DataGrid
            hideFooter
            rows={displayRows}
            columns={[
              { field: "address", width: 400 },
              { field: "shares", width: 200 },
              { field: "pendingPayment", width: 200 },
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
          <Button variant="contained" color="primary" type="submit">
            Release
          </Button>
        </Box>
        <Box component="form" noValidate onSubmit={releaseAll}>
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
