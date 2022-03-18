// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlexiblePaymentSplitter.sol";

contract FlexiblePaymentSplitterFactory {
    event ContractCreated(
        address contractAddr,
        address owner,
        string description
    );
    uint256 numDeployedChildren;
    FlexiblePaymentSplitter[] public deployedChildren;
    mapping(address => address) ownerToChildren;

    constructor() {}

    function deployChild(
        address[] memory payees,
        uint256[] memory shares_,
        string memory description
    ) public {
        FlexiblePaymentSplitter newIncomeSplit = new FlexiblePaymentSplitter(
            payees,
            shares_,
            description,
            msg.sender // otherwise the smart contract will be the owner
        );
        deployedChildren.push(newIncomeSplit);
        numDeployedChildren += 1;
        ownerToChildren[msg.sender] = address(newIncomeSplit);
        emit ContractCreated(address(newIncomeSplit), msg.sender, description);
    }
}
