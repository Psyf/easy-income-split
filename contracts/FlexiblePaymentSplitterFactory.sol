// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlexiblePaymentSplitter.sol";

contract FlexiblePaymentSplitterFactory {
    event ContractCreated(
        address contractAddr,
        address owner,
        string description
    );
    FlexiblePaymentSplitter[] deployedChildren;

    constructor() public {}

    function create(
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
        emit ContractCreated(address(newIncomeSplit), msg.sender, description);
    }
}
