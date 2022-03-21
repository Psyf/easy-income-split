import React, { useState, useEffect } from "react";
import "reactjs-popup/dist/index.css";
import CurrentContractModal from "./CurrentContractModal";
import { ButtonGroup, Button, Container } from "@mui/material";

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

  function getContractsToDisplay() {
    if (createdContracts) {
      var buttonList = [];
      createdContracts.forEach((item) => {
        var button = (
          <Button
            onClick={() => {
              setSelectedContract(item);
            }}
            key={item}
          >
            {item}
          </Button>
        );
        buttonList.push(button);
      });
      return buttonList;
    }
  }

  // useEffect basically says if the secondParam cahnges, execute the firstParam
  useEffect(async () => {
    await getContractsCreatedByWallet();
    setFactoryContractListener();
  }, [props]);

  return (
    <div>
      <Container id="deployed_contracts">
        <h2>Contracts You Created</h2>
        <ButtonGroup
          variant="contained"
          aria-label="outlined primary button group"
          id="deployed_contracts_list"
        >
          {getContractsToDisplay()}
        </ButtonGroup>
      </Container>
      <CurrentContractModal
        currentContractAddress={selectedContract}
        walletAddress={walletAddress}
      />
    </div>
  );
}

export default DeployedContracts;
