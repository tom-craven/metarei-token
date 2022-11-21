const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");
const assert = require("assert");
const {
    COST_ONE_TOKEN_FRACTION,
    PRIVATE_SALE_ONE,
    TOKEN_BOUGHT,
    ONE_TOKEN,
    COST_TOTAL, BURN_FR, PASS_PHRASE
} = require("../ContractConstants");

const MyToken = artifacts.require("Metarei");
const MyTokenAuction = artifacts.require("MetareiSale");

contract('TokenSale', (accounts) => {

    const contract_owner = accounts[0];
    const contract_user = accounts[2];
    const contract_admin = accounts[1];
    const configAdmin = {
        from: contract_admin
    };
    const configOwner = {
        from: contract_owner
    };
    const configUser = {
        from: contract_user
    };


    const BuyConfig = {
        value: COST_TOTAL,
        from: contract_user
    };
    let saleInstance;
    let tokenInstance;
    /**
     * @development Test contract deploys successfully.
     */
    it('Should deploy smart contract', async () => {
        saleInstance = await MyTokenAuction.deployed();
        console.log("[DEPLOYED] " + saleInstance.address);
        assert(saleInstance.address !== '', "contract failed to deploy");
        let ownerAddress = await saleInstance.owner();
        console.log("[OWNER] " + ownerAddress);
        assert(ownerAddress === contract_owner, "is deployed to the sale address");
    });

    /**
     * @development Test adding the admin.
     */
    it('The admin can be changed', async () => {
        saleInstance = await MyTokenAuction.deployed();
        tokenInstance = await MyToken.deployed();
        let saleAdmin = await saleInstance.addAdmin(contract_admin);
        assert(saleAdmin.logs[0].event === 'AdminChange', 'should be an AdminChange Event');
        let tokenAdmin = await tokenInstance.addAdmin(contract_admin);
        assert(tokenAdmin.logs[0].event === 'AdminChange', 'should be an AdminChange Event');
    });

    /**
     * @development Test adding the adding the passphrase.
     */
    it('The passphrase can be changed', async () => {
        saleInstance = await MyTokenAuction.deployed();
        const bytes32 = Web3.utils.asciiToHex(PASS_PHRASE);
        let passphrase = web3.eth.abi.encodeParameter('bytes32', Web3.utils.soliditySha3({
            type: 'bytes32',
            value: bytes32
        }));
        await truffleAssert.passes(saleInstance.setCode(passphrase, configAdmin));
    });

    /**
     * @development Test the contract metadata.
     */
    it('initialises the contract with correct metadata', async () => {
        saleInstance = await MyTokenAuction.deployed();
        let price = await saleInstance.tokenPrice();
        console.log("[PRICE] " + price);
        assert.equal(price, COST_ONE_TOKEN_FRACTION, 'The cost should be set')
    });

    /**
     * @development Test making the sale active.
     */
    it('The sale is made active', async () => {
        saleInstance = await MyTokenAuction.deployed();
        await truffleAssert.passes(saleInstance.setActive(true, configAdmin));
        let isActive = await saleInstance.isActive();
        console.log("[SALE_IS_MADE_ACTIVE] " + isActive);
        assert.equal(isActive, true, 'The sale is made active');
    });

    /**
     * @development Test contract sale functions.
     */
    it('Allows the purchase of tokens', async () => {
        saleInstance = await MyTokenAuction.deployed();
        tokenInstance = await MyToken.deployed();

        console.log("[TOKEN ADDRESS] " + saleInstance.address)
        console.log("[SALE ADDRESS]" + tokenInstance.address)
        const minted = await tokenInstance.mint(configAdmin);
        await truffleAssert.passes(tokenInstance.transfer(saleInstance.address, PRIVATE_SALE_ONE, configAdmin));

        await truffleAssert.passes(saleInstance.buyToken(TOKEN_BOUGHT, true, Web3.utils.asciiToHex(PASS_PHRASE), BuyConfig))
        let userBalance = await tokenInstance.balanceOf(contract_user);
        console.log("[BOUGHT] " + userBalance);
        assert(userBalance > 0, "The buyer is now a user");
        let tokensSold = await saleInstance.tokenSold();
        console.log("[TOTAL] " + tokensSold);
        assert(tokensSold > 0, "Increments the number sold");
        let auctionBalance = await tokenInstance.balanceOf(saleInstance.address);
        let expected = PRIVATE_SALE_ONE;
        let privateSaleTax = PRIVATE_SALE_ONE / BURN_FR;
        expected -= privateSaleTax;
        expected -= TOKEN_BOUGHT;
        assert.equal(auctionBalance, expected, "Decrements the balance of sale");
        await truffleAssert.passes(saleInstance.withdrawSale(configAdmin));
        let ownerBalance = await tokenInstance.balanceOf(contract_admin);
        let withdrawTax = auctionBalance;
        withdrawTax -= (auctionBalance / BURN_FR);
        console.log("[ADMIN BAL] " + auctionBalance);
        console.log("[EXPECTED WITHDRAW] " + withdrawTax);
        assert.equal(ownerBalance, withdrawTax, "Withdraws remaining tokens");
        await truffleAssert.fails(saleInstance.buyToken(ONE_TOKEN, true, PASS_PHRASE, BuyConfig));
        let ethBalance = await saleInstance.balance();
        console.log("[ETH BALANCE EXPECTED] " + Web3.utils.fromWei(COST_TOTAL));
        console.log("[ETH BALANCE ACTUAL] " + Web3.utils.fromWei(ethBalance[1]));
        assert.equal(Web3.utils.fromWei(ethBalance[1]), Web3.utils.fromWei(COST_TOTAL), "The eth is collected");
        let balanceWithdrawn = await saleInstance.withdrawBalance(configAdmin);
        console.log("[WITHDRAWN] " + Web3.utils.fromWei(balanceWithdrawn.logs[0].args._amount));
        assert.equal(balanceWithdrawn.logs[0].event, 'Withdrawn', 'should be a Withdrawn Event');
        assert(Web3.utils.fromWei(balanceWithdrawn.logs[0].args._amount) === Web3.utils.fromWei(COST_TOTAL), 'Should send the balance');
    });
})

