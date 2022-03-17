const FlexiblePaymentSplitterFactory = artifacts.require(
  "FlexiblePaymentSplitterFactory"
);

module.exports = function (deployer) {
  deployer.deploy(FlexiblePaymentSplitterFactory);
};
