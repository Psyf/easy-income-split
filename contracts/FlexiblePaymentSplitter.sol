// SPDX-License-Identifier: MIT
// Modification of OpenZeppelin Contracts v4.4.1 (finance/PaymentSplitter.sol)
// Main modifications:
// Ability to deletePayee, changeShares and blockEthPayments

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlexiblePaymentSplitter
 * @dev This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
 * that the Ether will be split in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `FlexiblePaymentSplitter` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 *
 * NOTE: This contract assumes that ERC20 tokens will behave similarly to native tokens (Ether). Rebasing tokens, and
 * tokens that apply fees during transfers, are likely to not be supported as expected. If in doubt, we encourage you
 * to run tests before sending real value to this contract.
 */
contract FlexiblePaymentSplitter is Context, Ownable {
    event PayeeAdded(address account, uint256 shares);
    event PayeeDeleted(address account);
    event PaymentReleased(address to, uint256 amount);
    event ERC20PaymentReleased(
        IERC20 indexed token,
        address to,
        uint256 amount
    );
    event PaymentReceived(address from, uint256 amount);

    uint256 private _totalShares;
    uint256 private _totalReleased;
    string _description;

    mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    address[] private _payees;
    bool _ethPaymentsBlocked;
    mapping(IERC20 => uint256) private _erc20TotalReleased;
    mapping(IERC20 => mapping(address => uint256)) private _erc20Released;

    /**
     * @dev Creates an instance of `FlexiblePaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    constructor(
        address[] memory payees,
        uint256[] memory shares_,
        string memory description_,
        address owner
    ) payable {
        require(
            payees.length == shares_.length,
            "FlexiblePaymentSplitter: payees and shares length mismatch"
        );
        require(payees.length > 0, "FlexiblePaymentSplitter: no payees");

        _description = description_;
        _ethPaymentsBlocked = false;
        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }
        _transferOwnership(owner);
    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        require(
            _ethPaymentsBlocked == false,
            "Eth payments have been blocked! Check whether address in use before sending anything (ERC20s included!)"
        );
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /**
     * @dev Getter for the total shares held by payees.
     */
    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    /**
     * @dev Getter for the total amount of Ether already released.
     */
    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    /**
     * @dev Getter for description
     */
    function description() public view returns (string memory) {
        return _description;
    }

    /**
     * @dev Getter for the total amount of `token` already released. `token` should be the address of an IERC20
     * contract.
     */
    function totalReleased(IERC20 token) public view returns (uint256) {
        return _erc20TotalReleased[token];
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function shares(address account) public view returns (uint256) {
        return _shares[account];
    }

    /**
     * @dev Getter for the amount of Ether already released to a payee.
     */
    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    /**
     * @dev Getter for the amount of `token` tokens already released to a payee. `token` should be the address of an
     * IERC20 contract.
     */
    function released(IERC20 token, address account)
        public
        view
        returns (uint256)
    {
        return _erc20Released[token][account];
    }

    /**
     * @dev Getter for the address of the payee number `index`.
     */
    function payee(uint256 index) public view returns (address) {
        return _payees[index];
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     * total shares and their previous withdrawals.
     */
    function release(address payable account) public virtual {
        require(
            _shares[account] > 0,
            "FlexiblePaymentSplitter: account has no shares"
        );

        uint256 totalReceived = address(this).balance + totalReleased();
        uint256 payment = _pendingPayment(
            account,
            totalReceived,
            released(account)
        );

        if (payment > 0) {
            _released[account] += payment;
            _totalReleased += payment;
            Address.sendValue(account, payment);
            emit PaymentReleased(account, payment);
        }
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
     * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
     * contract.
     */
    function release(IERC20 token, address account) public virtual {
        require(
            _shares[account] > 0,
            "FlexiblePaymentSplitter: account has no shares"
        );

        uint256 totalReceived = token.balanceOf(address(this)) +
            totalReleased(token);
        uint256 payment = _pendingPayment(
            account,
            totalReceived,
            released(token, account)
        );

        if (payment > 0) {
            _erc20Released[token][account] += payment;
            _erc20TotalReleased[token] += payment;

            SafeERC20.safeTransfer(token, account, payment);
            emit ERC20PaymentReleased(token, account, payment);
        }
    }

    /**
     * @dev internal logic for computing the pending payment of an `account` given the token historical balances and
     * already released amounts.
     */
    function _pendingPayment(
        address account,
        uint256 totalReceived,
        uint256 alreadyReleased
    ) private view returns (uint256) {
        return
            (totalReceived * _shares[account]) / _totalShares - alreadyReleased;
    }

    /**
     * @dev Add a new payee to the contract.
     * @param account The address of the payee to add.
     * @param shares_ The number of shares owned by the payee.
     */
    function _addPayee(address account, uint256 shares_) private {
        require(
            account != address(0),
            "FlexiblePaymentSplitter: account is the zero address"
        );
        require(shares_ > 0, "FlexiblePaymentSplitter: shares are 0");
        require(
            _shares[account] == 0,
            "FlexiblePaymentSplitter: account already has shares"
        );

        _payees.push(account);
        _shares[account] = shares_;
        _totalShares = _totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }

    /**
     * When you delete a Payee, they won't be able to release any funds anymore, regardless of when the fund was received.
     * If you want to make sure they get paid, release(account) or release(token, account) before you deletePayee(account)
     */
    function deletePayee(address account) public onlyOwner {
        require(
            _shares[account] != 0,
            "FlexiblePaymentSplitter: account does not exist!"
        );

        uint256 target;
        for (uint256 i = 0; i < _payees.length; i++) {
            if (_payees[i] == account) {
                target = i;
                break;
            }
        }
        delete _payees[target];
        uint256 oldShares = _shares[account];
        _shares[account] = 0;
        _totalShares = _totalShares - oldShares;
        emit PayeeDeleted(account);
    }

    /**
     * All existing funds are shared according to new_shares too!
     */
    function changeShares(address account, uint256 new_shares)
        public
        onlyOwner
    {
        deletePayee(account);
        _addPayee(account, new_shares);
    }

    /**
     * The following 2 are convenience functions so that someone can release the funds for everyone!
     */
    function releaseAll() public {
        for (uint256 i = 0; i < _payees.length; i++) {
            release(payable(_payees[i]));
        }
    }

    function releaseAll(IERC20 token) public {
        for (uint256 i = 0; i < _payees.length; i++) {
            release(token, _payees[i]);
        }
    }

    /**
     * Obvious but bears repeating: You can't block ERC20 payments to this contract!
     */
    function blockEthPayments() public onlyOwner {
        _ethPaymentsBlocked = true;
    }

    function unblockEthPayments() public onlyOwner {
        _ethPaymentsBlocked = false;
    }
}
