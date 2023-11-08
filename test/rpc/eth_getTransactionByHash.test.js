const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("eth_getTransactionByHash", function () {

  it("getTransactionByHash not exist hash => null", async () => {
    let response = await ethers.provider.send("eth_getTransactionByHash", ["0xb2fea9c4b24775af6990237aa90228e5e092c56bdaee74496992a53c208da1ee"])
    expect(response).to.be.equal(null)
  })

  it("getTransactionByHash after transfer", async () => {
    const to = "0x9dd3c285f8c253fb6327549e46f82e3dedf59e34";
    const data = "0x";
    const signers = await ethers.getSigners();
    const from = signers[0].address;
    const ethValue = "0.00001";
    const value = ethers.utils.parseUnits(ethValue, "ether").toHexString();

    const gasPrice = (await ethers.provider.getFeeData()).gasPrice.toHexString();
    const gas = await ethers.provider.send("eth_estimateGas", [{
      from,
      to,
      data,
      value
    }])
    const txHash = await ethers.provider.send("eth_sendTransaction", [{
      from,
      to,
      "gas": gas.replace("0x0", "0x"),
      "gasPrice": gasPrice.replace("0x0", "0x"),
      "value": value.replace("0x0", "0x"),
      "data": data
    }])

    const transaction = await ethers.provider.getTransaction(txHash);

    if (transaction.blockNumber === null) {
      console.log(`${transaction.hash} is unconfirmed`)
      const count = 5
      let receipt;
      for (let i = 0; i < count; i++) {
        receipt = await ethers.provider.getTransactionReceipt(txHash);
        if (receipt !== null && receipt.confirmations >= 1) {
          console.log(`Transaction confirmed after ${i + 1} attempt(s).`);
          break;
        }
        await sleep(2000);
      }
      expect(receipt.transactionHash).to.be.equal(transaction.hash)
    } else {
      throw new Error(`${transaction.hash} is already confirmed on the blockchain.`);
    }
  })
})

async function sleep(timeOut) {
  await new Promise(r => setTimeout(r, timeOut));
}
