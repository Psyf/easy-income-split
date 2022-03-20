// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlexiblePaymentSplitter.sol";

contract FlexiblePaymentSplitterFactory {
    event ContractCreated(
        address contractAddr,
        address indexed owner,
        string description
    );
    uint256 public numDeployedChildren;
    FlexiblePaymentSplitter[] public deployedChildren;
    mapping(address => address[]) public creatorToChildren;
    mapping(address => uint256) public creatorToChildrenNum;

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
        creatorToChildren[msg.sender].push(address(newIncomeSplit));
        creatorToChildrenNum[msg.sender]++;
        emit ContractCreated(address(newIncomeSplit), msg.sender, description);
    }
}
