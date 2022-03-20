import React, { useState, useEffect } from "react";
import "reactjs-popup/dist/index.css";
import CurrentContractModal from "./CurrentContractModal";

// TODO: This seems to be very inefficient
function DeployedContracts(props) {
  const [createdContracts, setContracts] = useState(new Set());
  const [selectedContract, setSelectedContract] = useState();
  const walletAddress = props.walletAddress;
  const factoryContract = props.factoryContract;

  async function getContractsCreatedByWallet() {
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
      var filter = factoryContract.filters.ContractCreated(walletAddress);
      factoryContract.on(filter, (owner, contractAddr, desc, e) => {
        //TIL: for some reason if you don't use the callback form it gets into a race condition and thinks createContracts is empty
        setContracts(
          (createdContracts) => new Set(createdContracts.add(contractAddr))
        );
      });
    }
  }

  function displayContracts() {
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
      li.onclick = function () {
        setSelectedContract(item);
      };
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
    <div>
      <div id="deployed_contracts" className="container">
        <h4>Your Contracts</h4>
        <div id="deployed_contracts_list" className="collection"></div>
      </div>
      <CurrentContractModal currentContract={selectedContract} />
    </div>
  );
}

export default DeployedContracts;
