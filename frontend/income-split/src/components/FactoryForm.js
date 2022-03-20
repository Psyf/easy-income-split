import { ethers } from "ethers";

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
    <div>
      <h4>Create New Contract</h4>
      <form onSubmit={deployContract}>
        <label htmlFor="description">Title</label>
        <input
          type="text"
          id="description"
          name="Title"
          placeholder="TeamName"
          defaultValue="jezer0x" //remove
        />
        <label htmlFor="addresses">Addresses (comma separeted):</label>
        <input
          type="text"
          id="addresses"
          name="addresses"
          placeholder="0x1, 0x2, 0x3"
          defaultValue="0x32927Ad8d0D5d6E4039CC23715FF83edBD04DFd0, 0xD39EaA072A272aBdBa849Bef6582BBFC3819b03d" //remove
        />
        <label htmlFor="shares">Shares (comma separeted):</label>
        <input
          type="text"
          id="shares"
          name="shares"
          placeholder="25, 25, 50"
          defaultValue="10, 10" //remove
        />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default FactoryForm;
