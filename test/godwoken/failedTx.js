const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");
const {getTxReceipt} = require("../utils/rpc");

let contract;

describe('Revertable transaction', function () {
    this.timeout(600000)


    beforeEach(async function () {
        const factory = await ethers.getContractFactory("RevertHandling");
        contract = await factory.deploy();
        await contract.deployed();
    });

    describe('Success', () => {
        it('transferred value and fee', async () => {
            // set transaction params
            const value = 10;
            const msg = 'Hello';

            // set message
            const tx = await contract.setMsg(1, msg, {value});
            const receipt = await tx.wait();

            // check receipt
            expect(receipt.status).to.be.equal(1, 'transaction complete');
            expect(receipt.gasUsed.toNumber()).to.be.greaterThan(0, 'should have used gas');

            // check event
            const event = receipt.events.find((row) => row.event === 'SetMsg');
            expect(event).to.not.be.undefined;

            // check event result
            const {message, amount} = event.args;
            expect(message).to.be.equal(msg, 'message is set');
            expect(amount.toNumber()).to.be.equal(value, 'transferred exact amount of capacity');
        });
    });

    describe('Failure', () => {
        it('revert transferred value', async () => {
            // set transaction params
            const value = 10;
            const msg = 'Hello';

            // set message
            const tx = await contract.setMsg(0, msg, {value: value, gasLimit: 30000});
            const receipt = await getTxReceipt(ethers.provider, tx.hash, 100)

            // check receipt
            expect(receipt.status).to.be.equal(0, 'transaction should be failed');
            expect(receipt.logs.length).to.be.equal(0, 'should be no relevant log');
            expect(receipt.gasUsed.toNumber()).to.be.greaterThan(0, 'should have used gas');

            // check msg
            expect(await contract.getMsg()).to.be.equal('', 'msg should not be set');

            // check nonce
            const accounts = await ethers.getSigners();
            const nonce = await ethers.provider.getTransactionCount(accounts[0].address);
            expect(nonce).to.be.greaterThan(tx.nonce, 'current nonce should be greater than last time');
        });
    });

});
