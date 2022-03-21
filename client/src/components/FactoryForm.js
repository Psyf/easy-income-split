import { ethers } from "ethers";
import { Box } from "@mui/system";
import { TextField, Button, Container } from "@mui/material";

function FactoryForm(props) {
  const contract = props.contract;

  function getContractCallInputs(addresses_raw, shares_raw, description_raw) {
    var addresses, shares_num, description;
    addresses = addresses_raw.split(",").map((addr) => addr.trim());
    try {
      addresses.every((addr) => (ethers.utils.getAddress(addr) ? true : false));
    } catch {
      throw "Invalid address detected!";
    }

    var shares = shares_raw.trim().split(",");
    shares_num = shares.map((i) => Number(i));
    if (shares_num.some((i) => isNaN(i))) {
      throw "shares must be integers!";
    }

    description = description_raw.trim();
    if (description.length === 0) {
      throw "Must have a description!";
    }
    if (addresses.length != shares_num.length) {
      throw "Number of addresses and shares don't match!";
    }
    return [addresses, shares_num, description];
  }

  const deployContract = async (event) => {
    event.preventDefault();
    var addresses, shares, description;
    try {
      [addresses, shares, description] = getContractCallInputs(
        event.target.addresses.value,
        event.target.shares.value,
        event.target.description.value
      );
    } catch (err) {
      alert(err);
      return;
    }

    if (contract) {
      contract.deployChild(addresses, shares, description);
    } else {
      alert("Please connect the wallet!");
    }
  };
  return (
    <Container>
      <h2>Create New Contract</h2>
      <Box component="form" noValidate onSubmit={deployContract}>
        <TextField
          type="text"
          id="description"
          placeholder="TeamName"
          //defaultValue="jezer0x"
          variant="standard"
          label="Title"
        />
        <TextField
          type="text"
          id="addresses"
          placeholder="0x1, 0x2, 0x3"
          //defaultValue="0x32927Ad8d0D5d6E4039CC23715FF83edBD04DFd0, 0xD39EaA072A272aBdBa849Bef6582BBFC3819b03d" //remove
          variant="standard"
          label="Addresses"
          margin="normal"
          fullWidth
        />
        <TextField
          type="text"
          id="shares"
          placeholder="25, 25, 50"
          //defaultValue="10, 10" //remove
          variant="standard"
          label="Shares"
          margin="normal"
          fullWidth
        />
        <Button variant="contained" color="primary" type="submit">
          Create
        </Button>
      </Box>
    </Container>
  );
}

export default FactoryForm;
