import { useState, useEffect } from "react";

// TODO: This seems to be very inefficient, judging by the commented out console.log calls
function DeployedContracts(props) {
  const [createdContracts, setContracts] = useState(new Set());
  const walletAddress = props.walletAddress;
  const factoryContract = props.factoryContract;

  async function getContractsCreatedByWallet() {
    //console.log("getContractsCreatedByWallet", createdContracts);
    if (walletAddress && factoryContract) {
      var numCreatedContracts = await factoryContract.creatorToChildrenNum(
        walletAddress
      );
      var fetchedContracts = new Set();
      for (var i = 0; i < numCreatedContracts; i++) {
        var item = await factoryContract.creatorToChildren(walletAddress, i);
        fetchedContracts.add(item);
      }
      setContracts(fetchedContracts);
    } else {
      setContracts(new Set());
    }
  }

  function setFactoryContractListener() {
    if (factoryContract && walletAddress) {
      //console.log("setFactoryContractListener", createdContracts);
      var filter = factoryContract.filters.ContractCreated(walletAddress);
      factoryContract.on(filter, (owner, contractAddr, desc, e) => {
        console.log("found it", owner, contractAddr, e);
        //TIL: for some reason if you don't use the callback form it gets into a race condition and thinks createContracts is empty
        setContracts(
          (createdContracts) => new Set(createdContracts.add(contractAddr))
        );
      });
    }
  }

  function displayContracts() {
    //console.log("display", createdContracts);
    const oldList = document.getElementById("deployed_contracts_list");
    oldList.remove();
    const listDiv = document.getElementById("deployed_contracts");
    let list = document.createElement("list");
    list.id = "deployed_contracts_list";
    list.className = "collection";
    listDiv.appendChild(list);
    createdContracts.forEach((item) => {
      let li = document.createElement("button");
      li.innerText = item;
      li.className = "waves-effect waves-light btn";
      list.appendChild(li);
    });
  }

  // useEffect basically says if the secondParam cahnges, execute the firstParam
  useEffect(async () => {
    await getContractsCreatedByWallet();
    setFactoryContractListener();
  }, [props]);

  useEffect(() => {
    displayContracts();
  }, [createdContracts]);

  return (
    <div id="deployed_contracts" className="container">
      <h4>Your Contracts</h4>
      <div id="deployed_contracts_list" className="collection"></div>
    </div>
  );
}

export default DeployedContracts;
