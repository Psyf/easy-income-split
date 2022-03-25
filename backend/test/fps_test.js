const truffleAssert = require("truffle-assertions");
const FlexiblePaymentSplitter = artifacts.require("FlexiblePaymentSplitter");

contract("Basic FPS Tests", async (accounts) => {
  var fps;
  before(async () => {
    fps = await FlexiblePaymentSplitter.new(
      [accounts[1], accounts[2], accounts[3]],
      [50, 50, 50],
      "team1",
      accounts[0],

      { from: accounts[0] }
    );
  });

  it("balance should be 0", async () => {
    const balance = await web3.eth.getBalance(fps.address);
    assert.equal(balance, 0, "balance wasn't 0");
  });

  it("balance should be 30 after someone sends funds", async () => {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: fps.address,
      value: web3.utils.toWei("30", "ether"),
    });
    const balance = await web3.eth.getBalance(fps.address);
    assert.equal(balance, web3.utils.toWei("30", "ether"), "balance wasn't 30");
  });

  it("1st person taking out funds", async () => {
    await fps.release(accounts[1]);
    const balance = await web3.eth.getBalance(fps.address);
    assert.equal(
      balance,
      web3.utils.toWei("20", "ether"),
      "balance wasn't 20 after someone took out their share"
    );
    const pendingPaymentForFirstPerson = await fps.pendingPayment(accounts[1]);
    assert.equal(
      pendingPaymentForFirstPerson,
      0,
      "pendingPayment wasn't 0 even after the person took their money"
    );
  });

  it("Unauthorized trying to blockEthPayments", async () => {
    await truffleAssert.reverts(fps.blockEthPayments({ from: accounts[1] }));
  });

  it("Authorized can blockEthPayments", async () => {
    await fps.blockEthPayments({ from: accounts[0] });
    const isEthPaymentBlocked = await fps.isEthPaymentBlocked();
    assert(isEthPaymentBlocked, true, "EthPaymentsWereNotBlocked");
  });

  it("Blocking Payments works", async () => {
    await truffleAssert.reverts(
      web3.eth.sendTransaction({
        from: accounts[0],
        to: fps.address,
        value: web3.utils.toWei("30", "ether"),
      })
    );
  });

  it("Authorized can unblockEthPayments", async () => {
    await fps.unblockEthPayments({ from: accounts[0] });
    const isEthPaymentBlocked = await fps.isEthPaymentBlocked();
    assert(!isEthPaymentBlocked, true, "EthPaymentsWereNotUnBlocked"); // curious case of you can't use false to test...
  });

  it("Unblocking Payments works", async () => {
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: fps.address,
      value: web3.utils.toWei("30", "ether"),
    });
    const balance = await web3.eth.getBalance(fps.address);
    assert(balance, web3.utils.toWei("50", "ether"));
  });

  it("Deleting Person works", async () => {
    await fps.deletePayee(accounts[1]); // the same person who took out their money
    const pendingPaymentForSecondPerson = await fps.pendingPayment(accounts[2]);
    const pendingPaymentForThirdPerson = await fps.pendingPayment(accounts[3]);
    assert(pendingPaymentForSecondPerson, web3.utils.toWei("25", "ether"));
    assert(pendingPaymentForThirdPerson, web3.utils.toWei("25", "ether"));
  });

  it("ReleaseAll works from any account", async () => {
    await fps.releaseAll();
    const balanceOfSecondPerson = await web3.eth.getBalance(accounts[2]);
    const balanceOfThirdPerson = await web3.eth.getBalance(accounts[3]);
    assert(balanceOfSecondPerson, web3.utils.toWei("25", "ether"));
    assert(balanceOfThirdPerson, web3.utils.toWei("25", "ether"));
  });
});
